"""Golden Army Forge / Singularity network planner.

Runs bounded local jobs without network permissions, and allows one narrowly
scoped public GitHub repository metadata GET only after GOD policy evaluation.
No credentials, arbitrary URL execution, scanning, flashing, or device control.
"""
from __future__ import annotations
from aiohttp import ClientSession, ClientTimeout, ClientError
from gaia_native_runtime import GAIARuntime
from god_network_gate import GODGate
import asyncio
import json
import time

class GoldenArmyForge:
    def __init__(self, gate: GODGate | None = None, runtime: GAIARuntime | None = None):
        self.god = gate if gate is not None else GODGate()
        self.runtime = runtime if runtime is not None else GAIARuntime(workers=2)
        self.started = time.monotonic()
        self.planned = 0
        self.network_executions = 0
        self.network_denials = 0

    def status(self):
        return {"engine":"Golden Army Forge / Singularity v1",
            "mode":"local-autonomous-with-GOD-network-boundary",
            "network_policy_loaded": self.god.status()["policy_configured"],
            "github_read_authorized":bool(self.god.decide(
                "github.repo.read","https://api.github.com/repos/machackabook/HyperPolyGlot-SOS-")["allowed"]),
            "forge_network_executions":self.network_executions,
            "forge_denied_network_requests":self.network_denials,
            "plans_evaluated":self.planned,
            "uptime_seconds":round(time.monotonic()-self.started,3),
            "god":self.god.status(),"runtime":self.runtime.status(),
            "scope":"existing project local bridge; not a globally enforced device firewall"}

    def plan(self, capability, destination=None):
        self.planned += 1
        d=self.god.decide(capability,destination)
        runnable=self.god.runnable(capability,destination)
        return {"forge":"golden-army-forge","stage":"policy-plan",
            "capability":capability,"decision":d,
            "executable_network_operation":bool(runnable["allowed"] and d["route"]=="network"),
            "next":"local-execution" if d["allowed"] and d["route"]=="local" else
              ("network-executor" if runnable["allowed"] else "not-executable")}

    def compute(self, kind, payload):
        if kind not in ("symplectic","relations","digest"):
            raise ValueError("Unrecognized safe compute job")
        # This operation never invokes remote network, so no GOD round trip.
        return self.runtime.submit(kind,payload)

    async def public_github_read(self, destination: str):
        gate=self.god.runnable("github.repo.read",destination)
        if not gate["allowed"]:
            self.network_denials += 1
            return {"allowed":False,"source":"GOD", "reason":gate["reason"]}
        try:
            async with ClientSession(timeout=ClientTimeout(total=8),trust_env=False,
                                     headers={"Accept":"application/vnd.github+json",
                                              "User-Agent":"GAIA-GoldenArmyForge/1"}) as client:
                async with client.get(destination,allow_redirects=False) as response:
                    if response.status!=200:
                        return {"allowed":True,"executed":True,"success":False,
                                "http_status":response.status,"source":"public-github-api"}
                    if int(response.headers.get("Content-Length","0") or "0")>131072:
                        raise ValueError("Remote response too large")
                    data=await response.content.read(131073)
                    if len(data)>131072:
                        raise ValueError("Remote response exceeded byte budget")
            doc=json.loads(data)
            if not isinstance(doc,dict):
                raise ValueError("Unexpected GitHub metadata response")
            # Do not return large arbitrary bodies, potential injected instructions, or tokens.
            safe={key:doc.get(key) for key in ("name","full_name","private","default_branch",
                                                "archived","fork","size") if key in doc}
            self.network_executions+=1
            return {"allowed":True,"executed":True,"success":True,
                    "source":"public-github-api","destination_host":"api.github.com",
                    "metadata":safe}
        except (ClientError,asyncio.TimeoutError,ValueError,TypeError,UnicodeError):
            return {"allowed":True,"executed":True,"success":False,
                    "source":"public-github-api","reason":"Remote metadata unavailable"}

    def stop(self):
        self.runtime.stop()
