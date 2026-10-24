"""Ouroboros v2.6 file mutation tests; never execute proposed shell scripts."""
import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from nexus_ouroboros_guard import evolve,digest,syntax_check

class OuroborosGuardContract(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name).resolve()
        self.current=self.root/"stable.sh"
        self.candidate=self.root/"candidate.sh"
        self.current.write_text("#!/usr/bin/env bash\nprintf 'before\\n'\n")
        self.candidate.write_text("#!/usr/bin/env bash\nprintf 'after\\n'\n")
    def tearDown(self):
        self.tmp.cleanup()
    def test_validation_never_changes_baseline_by_default(self):
        original=self.current.read_bytes()
        result=evolve(self.root,self.current,self.candidate)
        self.assertTrue(result["valid"])
        self.assertFalse(result["applied"])
        self.assertEqual(self.current.read_bytes(),original)
    def test_explicit_apply_stores_hashed_baseline_then_promotes(self):
        original=self.current.read_bytes()
        result=evolve(self.root,self.current,self.candidate,apply=True)
        self.assertTrue(result["applied"])
        self.assertEqual(self.current.read_bytes(),self.candidate.read_bytes())
        backup=self.root/result["snapshot"]
        self.assertEqual(backup.read_bytes(),original)
        self.assertEqual(result["baseline_sha256"],digest(original))
    def test_invalid_shell_is_rejected_without_mutation(self):
        self.candidate.write_text("#!/usr/bin/env bash\nif then\n")
        original=self.current.read_bytes()
        result=evolve(self.root,self.current,self.candidate,apply=True)
        self.assertFalse(result["valid"])
        self.assertFalse(result["applied"])
        self.assertEqual(self.current.read_bytes(),original)
    def test_no_symlink_target_or_outside_workspace(self):
        alias=self.root/"link.sh"
        alias.symlink_to(self.current)
        with self.assertRaises(ValueError):
            evolve(self.root,alias,self.candidate,apply=True)
        with tempfile.TemporaryDirectory() as outside:
            candidate=Path(outside)/"test.sh"
            candidate.write_text("true\n")
            with self.assertRaises(ValueError):
                evolve(self.root,self.current,candidate,apply=True)
    def test_syntax_only_not_claimed_as_behavioral_pass(self):
        valid,elapsed,err=syntax_check(b"exit 1\n")
        self.assertTrue(valid)
        self.assertGreaterEqual(elapsed,0)
        self.assertEqual(err,"")

if __name__=="__main__":
    unittest.main()
