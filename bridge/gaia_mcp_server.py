"""GAIA Native MCP — real MCP Python SDK v2 server over stdio.
Run with: python -m mcp run bridge/gaia_mcp_server.py
Or test in-memory via mcp.Client(mcp) using the SDK.
The server exposes only bounded, host-local computations and verified config.
"""
from __future__ import annotations
from mcp.server import MCPServer
from gaia_native_runtime import GAIARuntime, comms_status

mcp=MCPServer("GAIA Native Runtime")
runtime=GAIARuntime(workers=2)

@mcp.tool()
def gaia_runtime_status()->dict:
    """Get actual host-local worker queue, completed job counts and uptime."""
    return runtime.status()

@mcp.tool()
def gaia_submit_compute(kind:str, text:str="", steps:int=100)->dict:
    """Submit a bounded local digest or symplectic calculation; no device access."""
    if kind=="digest":
        return runtime.submit("digest",{"text":text})
    if kind=="symplectic":
        return runtime.submit("symplectic",{"steps":steps})
    raise ValueError("MCP submit supports digest and symplectic (strict, bounded)")

@mcp.tool()
def gaia_compute_result(job_id:str)->dict:
    """Read real result or running/failed state of a submitted computation."""
    return runtime.result(job_id)

@mcp.tool()
def gaia_comms_status()->dict:
    """Report configured WSS/STUN transport without claiming an active remote call."""
    return comms_status()

@mcp.resource("gaia://runtime/status")
def runtime_snapshot()->dict:
    """Current host worker state as a read-only MCP resource."""
    return runtime.status()

@mcp.prompt()
def gaia_hamiltonian_review(goal:str)->str:
    """Explain how to review evidence from a bounded GAIA Hamiltonian computation."""
    return ("Analyze this goal using actual measured GAIA runtime results: "+goal+
            ". Do not infer 6,000 active nodes or a call from mere configuration.")

# The MCP CLI owns stdio framing/initialization; avoid printing to stdout.
