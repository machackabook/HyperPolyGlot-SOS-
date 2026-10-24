"""GOD -- GAIA Operational Directive, host-authoritative network gate v1.

The gate governs network operations submitted THROUGH the Golden Army Forge.
It is not a device firewall and cannot attest a phone or verify GPS authenticity.

Local work never waits for external policy approval. External network capabilities
use a private operator-owned allowlist; the browser cannot grant permissions.
"""
from __future__ import annotations
from dataclasses import dataclass
from ipaddress import ip_address
import json
import os
from pathlib import Path
import re
from time import monotonic
from urllib.parse import urlsplit

CAPABILITIES = frozenset({
    "github.repo.read", "github.repo.clone", "cloudflare.read",
    "gaia.memory.read", "gaia.memory.sync",
})
FAST_LOCAL = frozenset({
    "local.compute", "local.memory.recall", "local.render",
    "local.sqe", "local.ollama", "local.sensor.summary",
})
# Network capabilities currently executable by Forge, strictly GET and non-secret.
EXECUTABLE = frozenset({"github.repo.read"})
HOSTS = {
    "github.repo.read": frozenset({"api.github.com"}),
    "github.repo.clone": frozenset({"github.com"}),
    "cloudflare.read": frozenset({"api.cloudflare.com"}),
    "gaia.memory.read": frozenset({"gaia-nexus-memory-bridge.machackabook.chatgpt.site"}),
    "gaia.memory.sync": frozenset({"gaia-nexus-memory-bridge.machackabook.chatgpt.site"}),
}
GITHUB_REPO = re.compile(r"^/repos/[A-Za-z0-9_.-]{1,60}/[A-Za-z0-9_.-]{1,120}(?:/(?:readme|contents|git/trees|git/refs)[A-Za-z0-9_./%-]*)?$")
PROJECT = re.compile(r"^[a-z][a-z0-9_-]{1,63}$")


def _parse_target(capability, destination):
    if not isinstance(destination, str) or len(destination) > 512:
        raise ValueError("Bounded HTTPS destination is required")
    url = urlsplit(destination)
    if url.scheme != "https" or not url.hostname or url.username or url.password or url.port not in (None,443) or url.fragment:
        raise ValueError("Only HTTPS destinations without credentials/fragments are allowed")
    host = url.hostname.lower()
    if host not in HOSTS.get(capability, ()):
        raise ValueError("Host not recognized for this capability")
    try:
        ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError("IP-literal destinations not permitted")
    if capability == "github.repo.read" and (not GITHUB_REPO.fullmatch(url.path) or url.query):
        raise ValueError("Only public GitHub repository metadata endpoints are supported")
    return host, url.path


class GODGate:
    """Fail-closed policy loader. Private JSON policy is never read from the repo."""
    def __init__(self, policy_path: str | None = None):
        self.policy_path = policy_path if policy_path is not None else os.getenv("GAIA_GOD_POLICY_FILE", "")
        self._rules = ()
        self._last_error = None
        self._loaded_at = 0.0
        self.refresh()

    def refresh(self):
        path = self.policy_path
        self._rules = ()
        self._loaded_at = monotonic()
        self._last_error = None
        if not path:
            self._last_error = "No private GOD policy configured"
            return
        file = Path(path).expanduser()
        try:
            if file.is_symlink() or not file.is_file() or file.stat().st_size > 65536:
                raise ValueError("Invalid private policy file")
            # On POSIX, a network policy writable by group/others is not authoritative.
            if os.name == "posix" and file.stat().st_mode & 0o022:
                raise ValueError("Policy writable by group/others")
            data = json.loads(file.read_text("utf-8"))
            if not isinstance(data, dict) or data.get("version") != 1:
                raise ValueError("Unrecognized GOD policy format")
            rules = data.get("rules", [])
            if not isinstance(rules, list) or len(rules) > 64:
                raise ValueError("Invalid rule set")
            normalized = []
            for rule in rules:
                if not isinstance(rule, dict) or set(rule) != {"capability","enabled","require_attestation"}:
                    raise ValueError("Invalid rule schema")
                cap = rule["capability"]
                if cap not in CAPABILITIES or type(rule["enabled"]) is not bool or type(rule["require_attestation"]) is not bool:
                    raise ValueError("Invalid capability/flag")
                if cap in [x["capability"] for x in normalized]:
                    raise ValueError("Duplicate capability")
                normalized.append(dict(rule))
            self._rules = tuple(normalized)
        except (OSError,ValueError,UnicodeError) as exc:
            self._last_error = str(exc)[:160]

    def status(self):
        return {"engine":"GOD v1","authority":"trusted-local-host",
            "policy_configured":self._last_error is None,
            "policy_error":self._last_error,
            "network_capabilities_configured":len(self._rules),
            "fast_local_count":len(FAST_LOCAL),
            "attestation_provider":"not-connected",
            "terrasphere_location_is_identity_proof":False,
            "external_calls_through_forge_only":True,
            "global_firewall_integration":False}

    def decide(self, capability, destination=None):
        if not isinstance(capability, str):
            return {"allowed":False,"route":"deny","reason":"Invalid capability"}
        if capability in FAST_LOCAL:
            return {"allowed":True,"route":"local","capability":capability,
                "reason":"Pure local work; no external network permission required"}
        if capability not in CAPABILITIES:
            return {"allowed":False,"route":"deny","capability":capability,"reason":"Unknown capability"}
        try:
            host,_ = _parse_target(capability,destination)
        except (ValueError,TypeError) as exc:
            return {"allowed":False,"route":"network","capability":capability,"reason":str(exc)}
        rule = next((r for r in self._rules if r["capability"] == capability),None)
        if self._last_error is not None or not rule or not rule["enabled"]:
            return {"allowed":False,"route":"network","capability":capability,
                "destination_host":host,"reason":"No enabled trusted-host policy for capability"}
        if rule["require_attestation"]:
            # Neither geolocation nor client-supplied "attested=true" is proof.
            return {"allowed":False,"route":"network","capability":capability,
                "destination_host":host,"reason":"Trusted device attestation verifier not connected"}
        return {"allowed":True,"route":"network","capability":capability,
            "destination_host":host,"reason":"Authorized by private host policy"}

    def runnable(self, capability, destination):
        decision = self.decide(capability,destination)
        if not decision["allowed"]:
            return decision
        if capability not in EXECUTABLE:
            return {**decision,"allowed":False,
                    "reason":"Policy permits planning only; no executor implemented"}
        return decision


def example_policy():
    """Safe documentation fixture. No private policy is created automatically."""
    return {"version":1,"rules":[
        {"capability":"github.repo.read","enabled":True,"require_attestation":False},
        {"capability":"github.repo.clone","enabled":False,"require_attestation":True},
        {"capability":"gaia.memory.sync","enabled":False,"require_attestation":True},
    ]}
