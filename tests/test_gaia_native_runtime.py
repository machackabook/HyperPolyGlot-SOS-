"""Offline contract tests: no simulated cloud nodes, carrier, or model output."""
import os
import sys
import time
import unittest
from pathlib import Path
from hashlib import sha256
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"bridge"))
from gaia_native_runtime import GAIARuntime, _work, comms_status, GAIA_TOOLS

class GAIARuntimeContract(unittest.TestCase):
    def setUp(self):
        self.runtime=GAIARuntime(workers=2)
    def tearDown(self):
        self.runtime.stop()

    def poll(self,job_id):
        for _ in range(200):
            obj=self.runtime.result(job_id)
            if obj["state"] in ("complete","failed"):return obj
            time.sleep(.005)
        self.fail("Bounded local job never completed")

    def test_actual_worker_count_only(self):
        state=self.runtime.status()
        self.assertEqual(state["workers_configured"],2)
        self.assertEqual(state["external_nodes_verified"],0)
        self.assertEqual(state["device_telemetry_verified"],False)
        self.assertEqual(state["jobs_accepted_since_start"],0)

    def test_real_deterministic_sha256(self):
        item=self.runtime.submit("digest",{"text":"abc"})
        result=self.poll(item["job_id"])
        self.assertEqual(result["state"],"complete")
        self.assertEqual(result["result"]["sha256"],sha256(b"abc").hexdigest())
        self.assertEqual(result["result"]["size_bytes"],3)

    def test_symplectic_integrator_measures_actual_energy_drift(self):
        item=self.runtime.submit("symplectic",{"steps":10000})
        output=self.poll(item["job_id"])
        self.assertEqual(output["state"],"complete")
        self.assertLess(output["result"]["maximum_energy_drift"],0.0002)
        self.assertEqual(output["result"]["steps"],10000)

    def test_target_preservation_in_ternary_relation(self):
        r=_work("relations",{"vertices":["a","b","c","d"],
          "relations":[["a","b","c"],["a","b","d"],["a","b","c"],["a","x","d"]]})
        self.assertEqual(r["retained_relations"],3)
        self.assertEqual(len(r["distinct_relations"]),2)
        self.assertEqual({tuple(v["triple"]) for v in r["distinct_relations"]},
                         {("a","b","c"),("a","b","d")})

    def test_denies_arbitrary_tasks(self):
        for kind in ["shell","exec","scan","remote-command"]:
            with self.assertRaises(ValueError):
                self.runtime.submit(kind,{})

    def test_rejects_workload_outside_budget(self):
        with self.assertRaises(ValueError):self.runtime.submit("symplectic",{"steps":1000000})
        with self.assertRaises(ValueError):self.runtime.submit("digest",{"text":"x"*32769})
        with self.assertRaises(ValueError):self.runtime.submit("relations",
            {"vertices":[],"relations":[[]]*513})

    def test_malformed_job_identity_denied(self):
        with self.assertRaises(ValueError):self.runtime.result("../file")
        with self.assertRaises(LookupError):self.runtime.result("a"*32)

    def test_comms_status_does_not_claim_carrier_or_remote_peer(self):
        orig=os.environ.pop("GAIA_RTC_WSS",None)
        try:
            self.assertFalse(comms_status()["wss_configured"])
            self.assertFalse(comms_status()["native_esim"])
            self.assertIsNone(comms_status()["verified_remote_peers"])
        finally:
            if orig is not None:os.environ["GAIA_RTC_WSS"]=orig

    def test_declared_mcp_catalog_matches_real_tools(self):
        names={x["name"] for x in GAIA_TOOLS}
        self.assertEqual(names,{"gaia_runtime_status","gaia_submit_compute",
                                 "gaia_compute_result","gaia_comms_status"})

if __name__=="__main__":
    unittest.main()
