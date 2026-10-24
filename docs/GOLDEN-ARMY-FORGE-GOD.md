# Golden Army Forge / Singularity — GOD Network Gate v1

**Source integration:** HyperTerminal Polyglot Quine OS main branch.

GOD (GAIA Operational Directive) is a host-side capability policy for network requests routed THROUGH Golden Army Forge. This is not a global firewall, router image or hardware attestation implementation.

**Automatic fast path:** Local calculation, SQE graph steering, memory recall, rendering and local Ollama require no per-decision human approvals.

**Network path:** One operator-owned private policy file controls allowed outbound Forge capabilities. The browser can request a decision but cannot self-grant host permissions. Unknown capabilities and unauthenticated external destinations are blocked; an allowed decision is not itself evidence of execution.

**Device/TerraSphere:** Browser GPS may provide context but cannot certify physical identity, location integrity or device hardware. A policy requiring device attestation is denied until an independent trusted verifier is connected. No raw GPS coordinate is saved or transmitted by GOD.

## Main components

- bridge/god_network_gate.py: private host allowlist, strict HTTPS/host/path rules, fast local path, deny-by-default attestation.
- bridge/golden_army_forge.py: bounded host-local worker submission, policy planning, constrained public GitHub API metadata GET.
- bridge/quine_local_bridge.py: paired-only GOD and Forge status, plan, execution endpoints.
- bridge/gaia_mcp_server.py: GOD and Forge tools in the real Python MCP SDK v2 server.
- src/services/quineMeshService.mjs: authenticated bridge methods.
- src/components/HyperTerminal.tsx: GOD and Forge command grammar.
- src/services/gaiaMeshSyncV4.mjs: declared/tethered graph nodes for GOD, Forge, TerraSphere, SQE and Memory Fabric (declarations do not imply live connections).

## One-time host setup

Keep private policy outside the GitHub repository and outside all public web roots. On POSIX, use private owner-only directory/file permissions.

Example JSON file at ~/.config/gaia/god-policy.json:

~~~json
{
  "version": 1,
  "rules": [
    {"capability":"github.repo.read","enabled":true,"require_attestation":false},
    {"capability":"github.repo.clone","enabled":false,"require_attestation":true},
    {"capability":"gaia.memory.sync","enabled":false,"require_attestation":true}
  ]
}
~~~

Configure environment variable GAIA_GOD_POLICY_FILE to the absolute path of that file in the authorized Quine bridge process. Do not store provider keys, device secrets, or this private policy in the public repository. On Windows use a private user ACL rather than POSIX chmod.

This initial policy enables **public read-only GitHub repository metadata only**, not cloning, secret retrieval, upload, mutation, or arbitrary outbound network activity. A missing policy denies external Forge requests; local inference and mathematics still function.

## Terminal commands

~~~text
mesh connect
god status
god check local.compute
god check github.repo.read https://api.github.com/repos/machackabook/HyperPolyGlot-SOS-
forge status
forge plan github.repo.read https://api.github.com/repos/machackabook/HyperPolyGlot-SOS-
forge compute 1000
forge result <job_id>
forge github machackabook/HyperPolyGlot-SOS-
~~~

Only the final Forge GitHub command performs a real public GitHub API GET, and only after GOD authorizes it. Plans, mesh nodes, and capability statuses are not proof of remote operations.

## Scope and gates

- Host enforcement applies only to new Forge network routes, not every preexisting app/service network connection.
- Device attestation, GPS integrity, trust-chain integration, cloud policy distribution, encrypted memory replication, and OS/router-level egress controls remain open engineering gates.
- Existing local workloads do not incur an external policy round trip.
- Verification: python -m unittest discover -s tests -p test_god_forge.py -v
- No real device/network verification or production deployment is claimed until tests and live readback succeed.
