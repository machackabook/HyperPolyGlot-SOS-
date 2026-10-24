"""No-network contract tests for the native gh mount registry.

Run from the repository root:
    python -m unittest -v tests/test_gaia_gh_mounts.py
"""
import asyncio
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from bridge.gaia_gh_mounts import (
    validate_mount, validate_repo, validate_site_url, link_website,
    clone_repo, list_mounts,
)

class ValidateMounts(unittest.TestCase):
    def test_no_shell_injection_or_directory_traversal(self):
        for name in ("../root", "a/b", "-flag", "UPPERCASE", ""):
            with self.assertRaises(ValueError):
                validate_mount(name)
        for repo in ("../evil", "owner/../../bad", "--exec/payload", "owner/-flag", "owner/repo;whoami"):
            with self.assertRaises(ValueError):
                validate_repo(repo)

    def test_valid_repository_format(self):
        self.assertEqual(validate_repo("machackabook/HyperPolyGlot-SOS-"),
                         "machackabook/HyperPolyGlot-SOS-")

    def test_external_site_is_a_link_only(self):
        self.assertEqual(validate_site_url("https://gaia-nexus-memory-bridge.machackabook.chatgpt.site"),
                         "https://gaia-nexus-memory-bridge.machackabook.chatgpt.site")
        for url in ("http://github.com", "https://user:pass@example.org", "https://127.0.0.1/"):
            with self.assertRaises(ValueError):
                validate_site_url(url)

class MountOperations(unittest.IsolatedAsyncioTestCase):
    async def test_link_is_metadata_not_fake_clone(self):
        with tempfile.TemporaryDirectory() as td:
            reply = await link_website("gaia-memory", "https://gaia-nexus-memory-bridge.machackabook.chatgpt.site", td)
            self.assertEqual(reply["kind"], "external-link-only")
            mounts = await list_mounts(td)
            self.assertEqual(mounts[0]["repositories"], [])
            record = json.loads((Path(td)/"gaia-memory"/".mount.json").read_text())
            self.assertEqual(record["mount"], "gaia-memory")

    async def test_true_clone_requires_native_gh_and_real_checkout(self):
        with tempfile.TemporaryDirectory() as td:
            async def fake_exec(*argv, **kwargs):
                self.assertEqual(argv[:4], ("gh", "repo", "clone", "machackabook/HyperPolyGlot-SOS-"))
                folder = Path(argv[4])
                folder.mkdir()
                (folder / ".git").mkdir()
                class Proc:
                    returncode=0
                    async def communicate(self):
                        return (b"", b"")
                return Proc()
            with patch("bridge.gaia_gh_mounts.asyncio.create_subprocess_exec", side_effect=fake_exec):
                result = await clone_repo("hyperterminal", "machackabook/HyperPolyGlot-SOS-", td)
            self.assertEqual(result["status"], "cloned")
            mounts = await list_mounts(td)
            self.assertEqual(mounts[0]["repositories"][0]["status"], "cloned")
            again = await clone_repo("hyperterminal", "machackabook/HyperPolyGlot-SOS-", td)
            self.assertEqual(again["status"], "already-cloned")
