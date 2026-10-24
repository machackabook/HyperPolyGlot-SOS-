"""GAIA Native MCP — real MCP Python SDK v2 server over stdio.
Run with: python -m mcp run bridge/gaia_mcp_server.py
Or test in-memory via mcp.Client(mcp) using the SDK.
The server exposes only bounded, host-local computations and verified config.
"""
from __future__ import annotations
from mcp.server import MCPServer
from gaia_native_runtime import GAIARuntime, comms_status
from god_network_gate import GODGate
from golden_army_forge import GoldenArmyForge

mcp=MCPServer("GAIA Native Runtime")
runtime=GAIARuntime(workers=2)
god=GODGate()
forge=GoldenArmyForge(gate=god,runtime=runtime)

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


@mcp.tool()
def god_policy_status()->dict:
    """Read real host-owned network capability policy and device-attestation status."""
    return god.status()

@mcp.tool()
def god_capability_decision(capability:str, destination:str="")->dict:
    """Evaluate a scoped network capability with no per-calculation human prompt."""
    return god.decide(capability,destination or None)

@mcp.tool()
def golden_army_forge_status()->dict:
    """Read actual local Forge workers, policy and run counters."""
    return forge.status()

@mcp.tool()
def golden_army_forge_plan(capability:str, destination:str="")->dict:
    """Plan a local or GOD-controlled network operation; no side effect."""
    return forge.plan(capability,destination or None)

@mcp.tool()
async def golden_army_public_github_read(destination:str)->dict:
    """Fetch bounded public GitHub repo metadata through host GOD authorization."""
    return await forge.public_github_read(destination)

@mcp.resource("gaia://god/status")
def god_policy_snapshot()->dict:
    """Read-only GOD network boundary description, not a device attestation certificate."""
    return god.status()
