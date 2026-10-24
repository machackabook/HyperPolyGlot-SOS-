"""GAIA native runtime: measurable bounded local computation, not simulated hardware.
No shell, network scan, device access, external code execution, or secrets in jobs.
"""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, Future
from dataclasses import dataclass
from hashlib import sha256
from math import isfinite
from threading import RLock
from time import monotonic, time
from uuid import uuid4
import json
import os
import re

JOB_ID = re.compile(r"^[a-f0-9]{32}$")
MAX_RESULTS = 128
MAX_QUEUED = 32

def _work(kind: str, payload: dict) -> dict:
    if kind == "digest":
        content = payload.get("text")
        if not isinstance(content, str) or len(content.encode("utf-8")) > 32768:
            raise ValueError("Digest text must be at most 32KB")
        return {"sha256": sha256(content.encode("utf-8")).hexdigest(), "size_bytes": len(content.encode("utf-8"))}
    if kind == "symplectic":
        count = payload.get("steps", 100)
        if type(count) is not int or not 1 <= count <= 10000:
            raise ValueError("steps must be 1..10000")
        q, p, dt = 1.0, 0.0, 0.01
        initial_energy = 0.5
        peak_drift = 0.0
        for _ in range(count):
            ph = p-0.5*dt*q
            q += dt*ph
            p = ph-0.5*dt*q
            energy = 0.5*(q*q+p*p)
            peak_drift = max(peak_drift,abs(energy-initial_energy))
        if not isfinite(q) or not isfinite(p):
            raise ArithmeticError("Nonfinite phase result")
        return {"q": q, "p": p, "energy": energy,
                "maximum_energy_drift": peak_drift, "steps": count}
    if kind == "relations":
        triples = payload.get("relations")
        allowed = payload.get("vertices")
        if not isinstance(triples,list) or len(triples)>512 or not isinstance(allowed,list) or len(allowed)>128:
            raise ValueError("Relations/vertex budget exceeded")
        if not all(isinstance(x,str) and 1<=len(x)<=72 for x in allowed):
            raise ValueError("Invalid vertices")
        vertices=set(allowed)
        if len(vertices)!=len(allowed): raise ValueError("Duplicate vertices")
        retained={}
        for edge in triples:
            if not isinstance(edge,list) or len(edge)!=3 or not all(isinstance(x,str) for x in edge):
                raise ValueError("Expected ternary triples")
            if any(v not in vertices for v in edge):continue
            key=tuple(edge)
            retained[key]=retained.get(key,0)+1
        return {"vertices":len(vertices),"total_relations":len(triples),
                "retained_relations":sum(retained.values()),
                "distinct_relations":[{"triple":list(k),"count":n} for k,n in sorted(retained.items())]}
    raise ValueError("Unknown safe job kind")

class GAIARuntime:
    def __init__(self, workers: int=2):
        if type(workers) is not int or not 1 <= workers <= 8:
            raise ValueError("Worker count must be between 1 and 8")
        self.started=monotonic()
        self.workers=workers
        self.pool=ThreadPoolExecutor(max_workers=workers,thread_name_prefix="gaia-compute")
        self.lock=RLock()
        self.jobs:dict[str,tuple[Future,float,str]]={}
        self.accepted=0
        self.rejected=0

    def status(self)->dict:
        with self.lock:
            running=sum(f.running() for f,_,_ in self.jobs.values())
            queued=sum(not f.done() and not f.running() for f,_,_ in self.jobs.values())
            finished=sum(f.done() for f,_,_ in self.jobs.values())
            return {"source":"local-python-executor","kind":"bounded-thread-workers",
                    "workers_configured":self.workers,"jobs_running":running,
                    "jobs_queued":queued,"jobs_finished_retained":finished,
                    "jobs_accepted_since_start":self.accepted,
                    "jobs_rejected_since_start":self.rejected,
                    "capacity":MAX_QUEUED,"uptime_seconds":round(monotonic()-self.started,3),
                    "observed_at_epoch":round(time(),3),
                    "external_nodes_verified":0,
                    "device_telemetry_verified":False}

    def submit(self,kind:str,payload:dict|None=None)->dict:
        if not isinstance(kind,str) or kind not in ("digest","symplectic","relations"):
            raise ValueError("Allowed jobs: digest, symplectic, relations")
        if payload is None:payload={}
        if not isinstance(payload,dict):
            raise ValueError("Job payload must be an object")
        # Validate inputs before queuing. Jobs are tiny and bounded; calculation is deterministic.
        if kind=="digest":
            s=payload.get("text")
            if not isinstance(s,str) or len(s.encode("utf-8"))>32768:raise ValueError("Digest budget exceeded")
        elif kind=="symplectic":
            k=payload.get("steps",100)
            if type(k) is not int or not 1<=k<=10000:raise ValueError("Step budget exceeded")
        else:
            triples=payload.get("relations"); vertices=payload.get("vertices")
            if not isinstance(triples,list) or len(triples)>512 or not isinstance(vertices,list) or len(vertices)>128:
                raise ValueError("Relation budget exceeded")
        with self.lock:
            outstanding=sum(not f.done() for f,_,_ in self.jobs.values())
            if outstanding>=MAX_QUEUED:
                self.rejected+=1
                raise RuntimeError("Worker capacity reached")
            # Retain recent results only and never drop running jobs.
            for jobid,(future,_,_) in list(self.jobs.items()):
                if len(self.jobs)<MAX_RESULTS:break
                if future.done():del self.jobs[jobid]
            if len(self.jobs)>=MAX_RESULTS:
                self.rejected+=1
                raise RuntimeError("Result capacity reached")
            jobid=uuid4().hex
            future=self.pool.submit(_work,kind,payload.copy())
            self.jobs[jobid]=(future,monotonic(),kind)
            self.accepted+=1
            return {"job_id":jobid,"kind":kind,"state":"submitted","source":"local-python-executor"}

    def result(self,job_id:str)->dict:
        if not isinstance(job_id,str) or not JOB_ID.fullmatch(job_id):
            raise ValueError("Invalid job ID")
        with self.lock:
            entry=self.jobs.get(job_id)
        if entry is None:raise LookupError("Unknown or expired job")
        future,started,kind=entry
        base={"job_id":job_id,"kind":kind,"elapsed_ms":round((monotonic()-started)*1000,2)}
        if not future.done():return {**base,"state":"running" if future.running() else "queued"}
        try:return {**base,"state":"complete","result":future.result()}
        except Exception as exc:return {**base,"state":"failed","error":type(exc).__name__}

    def stop(self):
        self.pool.shutdown(wait=True,cancel_futures=True)

GAIA_TOOLS=[
    {"name":"gaia_runtime_status","description":"Read measured local worker status, not a fictional 6K hardware swarm"},
    {"name":"gaia_submit_compute","description":"Submit a bounded digest, symplectic, or ternary graph computation"},
    {"name":"gaia_compute_result","description":"Read measured status and result of a submitted computation"},
    {"name":"gaia_comms_status","description":"Read explicitly configured signaling and call capabilities, no fake carrier"},
]
def comms_status()->dict:
    return {"source":"host-configuration","webrtc_transport":"browser-webrtc-stun",
            "wss_configured":bool(os.environ.get("GAIA_RTC_WSS")),
            "signaling_endpoint": "configured" if os.environ.get("GAIA_RTC_WSS") else "unconfigured",
            "host_has_call_media":False,"verified_remote_peers":None,
            "native_cellular_carrier":False,"native_esim":False}
