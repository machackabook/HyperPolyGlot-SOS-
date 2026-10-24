"""Offline contract tests for local X/YouTube card. No provider requests made."""
import os
from pathlib import Path
import tempfile
import unittest
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "bridge"))
from xai_card_store import XaiCardStore, ProviderUnavailable


class XCardTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.dbpath = str(Path(self.temp.name) / "private" / "card.sqlite3")
        self.store = XaiCardStore(self.dbpath)

    def tearDown(self):
        self.temp.cleanup()

    def test_empty_has_no_fabricated_history(self):
        ident = "00000000-0000-4000-8000-000000000001"
        self.assertEqual(self.store.history(ident), [])

    def test_persists_exact_timestamps_roles_and_replays(self):
        reply = self.store.chat(
            "Tell me what can be inferred from the video reference",
            "jfKfPfyJRdk",
            sampler=lambda prompt, video_id, transcript: "TEST FIXTURE ONLY"
        )
        self.assertEqual(reply["provider"], "test-fixture")
        self.assertEqual(reply["historyCount"], 2)
        self.assertTrue(reply["saved"])
        rows = self.store.history(reply["sessionId"])
        self.assertEqual([row["role"] for row in rows], ["user", "assistant"])
        self.assertTrue(all("timestamp" in row for row in rows))
        self.assertEqual(rows[1]["content"], "TEST FIXTURE ONLY")

    def test_reopen_sqlite_preserves_previous_records(self):
        result = self.store.chat("first", "jfKfPfyJRdk",
                                 sampler=lambda p, v, h: "fixture")
        reopened = XaiCardStore(self.dbpath)
        self.assertEqual(len(reopened.history(result["sessionId"])), 2)

    def test_real_sdk_not_claimed_without_environment_key(self):
        old = os.environ.pop("XAI_API_KEY", None)
        try:
            with self.assertRaises(ProviderUnavailable):
                self.store.chat("question", "jfKfPfyJRdk")
        finally:
            if old is not None:
                os.environ["XAI_API_KEY"] = old

    def test_invalid_video_id_rejected(self):
        with self.assertRaises(ValueError):
            self.store.chat("message", "https://example.org/video",
                            sampler=lambda p, v, h: "fixture")

    def test_rejects_invalid_session_uuid(self):
        with self.assertRaises(ValueError):
            self.store.history("a'*")
        with self.assertRaises(ValueError):
            self.store.chat("message", "jfKfPfyJRdk",
                            session_id="../bad",
                            sampler=lambda p, v, h: "fixture")

    def test_failed_provider_call_does_not_commit_dialogue(self):
        sid = "00000000-0000-4000-8000-000000000002"
        def fail(*args):
            raise ProviderUnavailable("fixture failure")
        with self.assertRaises(ProviderUnavailable):
            self.store.chat("message", "jfKfPfyJRdk", sid, sampler=fail)
        self.assertEqual(self.store.history(sid), [])

    def test_second_turn_receives_prior_context(self):
        first = self.store.chat("hello", "jfKfPfyJRdk",
                                sampler=lambda p, v, h: "first reply")
        context = []
        self.store.chat("followup", "jfKfPfyJRdk", first["sessionId"],
                        sampler=lambda p, v, h: (context.append(h), "second reply")[1])
        self.assertIn("first reply", context[0])
        self.assertEqual(len(self.store.history(first["sessionId"])), 4)

    def test_immutable_host_owned_source_key(self):
        state = self.store.status()
        self.assertEqual(state["provider"], "xai-sdk")
        self.assertFalse(state["video_analysis"])
        self.assertNotIn("api_key", state)
        self.assertNotIn("secret", state)


if __name__ == "__main__":
    unittest.main()
