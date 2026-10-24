"""GOD/Forge contracts: actual decisions, bounded local compute, no external test requests."""
from __future__ import annotations
import asyncio
from pathlib import Path
import json
import os
import sys
import tempfile
import time
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"bridge"))
from god_network_gate import GODGate, example_policy
from golden_army_forge import GoldenArmyForge
from gaia_native_runtime import GAIARuntime

PUBLIC="https://api.github.com/repos/machackabook/HyperPolyGlot-SOS-"

class GODForgeContract(unittest.TestCase):
    def setUp(self):
        self.home=tempfile.TemporaryDirectory()
        self.path=Path(self.home.name)/"god-private.json"
        self.runtime=GAIARuntime(workers=2)
    def tearDown(self):
        self.runtime.stop()
        self.home.cleanup()
    def policy(self,rows):
        self.path.write_text(json.dumps({"version":1,"rules":rows}),encoding="utf8")
        if os.name=="posix":os.chmod(self.path,0o600)
        return GODGate(str(self.path))
    def test_defaults_local_fast_and_denies_external(self):
        god=GODGate("")
        self.assertTrue(god.decide("local.compute")["allowed"])
        self.assertTrue(god.decide("local.memory.recall")["allowed"])
        self.assertFalse(god.decide("github.repo.read",PUBLIC)["allowed"])
        self.assertFalse(god.status()["policy_configured"])
    def test_host_policy_allows_scoped_github_only(self):
        god=self.policy([{"capability":"github.repo.read","enabled":True,"require_attestation":False}])
        self.assertTrue(god.decide("github.repo.read",PUBLIC)["allowed"])
        self.assertFalse(god.decide("github.repo.read","https://evil.example/repos/a/b")["allowed"])
        self.assertFalse(god.decide("github.repo.read","http://api.github.com/repos/a/b")["allowed"])
        self.assertFalse(god.decide("github.repo.read","https://api.github.com/repos/a/b?token=secret")["allowed"])
        self.assertFalse(god.decide("github.repo.read","https://api.github.com/repos/a/b/../../")["allowed"])
    def test_location_not_identity_or_attestation(self):
        god=self.policy([{"capability":"github.repo.read","enabled":True,"require_attestation":True}])
        decision=god.decide("github.repo.read",PUBLIC)
        self.assertFalse(decision["allowed"])
        self.assertIn("attestation",decision["reason"])
        self.assertFalse(god.status()["terrasphere_location_is_identity_proof"])
    def test_private_policy_not_source_of_browser_authority(self):
        god=GODGate("")
        self.assertFalse(god.decide("github.repo.read",PUBLIC)["allowed"])
        self.assertFalse(god.decide("network-admin","https://api.github.com/repos/a/b")["allowed"])
    @unittest.skipUnless(os.name=="posix","POSIX filesystem permission contract")
    def test_group_writable_policy_rejected(self):
        self.path.write_text(json.dumps(example_policy()),encoding="utf8")
        os.chmod(self.path,0o666)
        god=GODGate(str(self.path))
        self.assertFalse(god.status()["policy_configured"])
        self.assertFalse(god.decide("github.repo.read",PUBLIC)["allowed"])
    def test_malformed_duplicate_rule_policy_fails_closed(self):
        rule={"capability":"github.repo.read","enabled":True,"require_attestation":False}
        god=self.policy([rule,rule])
        self.assertFalse(god.status()["policy_configured"])
        self.assertFalse(god.decide("github.repo.read",PUBLIC)["allowed"])
    def test_forge_submits_actual_local_job_with_no_network(self):
        forge=GoldenArmyForge(gate=GODGate(""),runtime=self.runtime)
        result=forge.compute("symplectic",{"steps":100})
        self.assertEqual(result["source"],"local-python-executor")
        for _ in range(100):
            observed=self.runtime.result(result["job_id"])
            if observed["state"]!="running" and observed["state"]!="queued":break
            time.sleep(0.005)
        self.assertEqual(observed["state"],"complete")
        self.assertEqual(observed["result"]["steps"],100)
        self.assertEqual(forge.status()["forge_network_executions"],0)
    def test_forge_network_plan_reports_but_does_not_execute(self):
        forge=GoldenArmyForge(gate=GODGate(""),runtime=self.runtime)
        result=forge.plan("github.repo.read",PUBLIC)
        self.assertFalse(result["decision"]["allowed"])
        self.assertFalse(result["executable_network_operation"])
        self.assertEqual(forge.status()["forge_network_executions"],0)
    def test_forge_denial_is_verified_without_a_network_call(self):
        forge=GoldenArmyForge(gate=GODGate(""),runtime=self.runtime)
        result=asyncio.run(forge.public_github_read(PUBLIC))
        self.assertFalse(result["allowed"])
        self.assertEqual(forge.status()["forge_denied_network_requests"],1)
    def test_configured_but_not_implemented_network_action_stays_blocked(self):
        god=self.policy([{"capability":"gaia.memory.sync","enabled":True,"require_attestation":False}])
        self.assertTrue(god.decide("gaia.memory.sync",
            "https://gaia-nexus-memory-bridge.machackabook.chatgpt.site/")["allowed"])
        self.assertFalse(god.runnable("gaia.memory.sync",
            "https://gaia-nexus-memory-bridge.machackabook.chatgpt.site/")["allowed"])

if __name__=="__main__":unittest.main()
