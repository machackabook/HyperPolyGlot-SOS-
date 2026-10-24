# NEXUS System Pages v1: sixteen individually addressable pages

Source-integrated: React Vite application and HyperTerminal branch main. Each named system has a separate hash-route view, not a separately hosted server. Navigation preserves the mounted HyperTerminal and 3D canvas.

Route pattern for GitHub Pages: https://machackabook.github.io/HyperPolyGlot-SOS/#/system/SLUG

| Page | Source graph node |
| --- | --- |
| terminal | nexus.core |
| god | nexus.god |
| forge | nexus.forge |
| singularity | nexus.sqe |
| terrasphere | nexus.terrasphere |
| memory | nexus.memory |
| scribe | nexus.scribe |
| canvas | nexus.canvas |
| resonance | nexus.wave |
| calibration | nexus.calibration |
| mcp | nexus.mcp |
| ollama | nexus.localai |
| sensor | nexus.sensor |
| neutronality | nexus.neutronality |
| voip | nexus.voip |
| invite | nexus.invite |

The source reference graph contains sixteen declared nodes and twenty-two semantic tethers. Declared sources do NOT establish authenticated running devices.

## Usage

Open the SYSTEM PAGES button, follow a direct route above, or issue these HyperTerminal commands:

    pages list
    page god
    page forge
    page memory
    page terrasphere
    page voip

Each page displays the matching public source graph reference and its tethers. It exposes an allowlisted terminal status command, never a general arbitrary command. Live source readbacks are requested from the authenticated locally paired Quine bridge. Location and microphone activation remain separate, explicit user actions.

## Session ownership versus signed-in site identity

Existing local Quine pairing authenticates one local-host bridge; it is NOT a verified website identity provider. No verified Google, GitHub, or ChatGPT subject is currently available to the React application. Therefore account-level authenticated sync across users and devices is not yet complete.

Current scope: active browser tab, currently active HyperTerminal instance and locally authenticated bridge session. Transient page events are purged when local host pairing/session or terminal instance changes. Public links carry only page slugs, not pairing credentials or private Memory Fabric data.

For complete signed-in cross-device sync, integrate an OIDC/Cloudflare Access login and verify issuer, audience, signature, expiry and subject in the server; namespace private memory and instance state by this verified subject; check ownership server-side for every data read and write; add revocation and a durable encrypted account-to-device membership registry. Browser-entered email, account name or user ID is never authorization evidence.

## Files

- src/services/nexusSystemRouter.mjs: routes, per-instance transient scope and safe command allowlist.
- src/components/NexusSystemPages.tsx: dedicated system views and source readback.
- src/services/gaiaMeshSyncV4.mjs: source-backed node graph.
- src/components/HyperTerminal.tsx: bidirectional system page navigation and command events.
- src/App.tsx: page mounting without remounting terminal or background.
- tests/nexus-system-pages.test.mjs: 10 defined executable tests.
- .github/workflows/nexus-system-pages.yml: Node 22 test runner.

Isolated in-process JavaScript logic checks: 54/54 passed. The GitHub Actions workflow reported failure without accessible executable step logs at the time of inspection, so its real CI gate must remain BLOCKED. Hosted-page deployment and verified identity-provider integration are also separate pending checks.
