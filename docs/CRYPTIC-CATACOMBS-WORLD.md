# Cryptic News — Catacombs / CrossVoid / Ethernet v2

Source: HyperPolyGlot-SOS- main, October 24, 2026.
Status: GitHub source integrated, production release and two-device multiplayer unverified.

## Public interface

Cryptic News is the intended front door; GitHub Pages is a source-controlled public terminal and Google AI Studio is an independent development workspace. Opening one does not share credentials with another.

Stages: Surface / Crypt → Crystalline → CrossVoid → Ethernet.

The crystalline gate provides a draggable, translucent flip card. Optional spoken phrase "open catacombs" moves only the public stage; speech never authenticates an identity or unlocks operator modules. Users can navigate without a microphone.

The new lazy-loaded Ethernet World uses Three.js, a bounded atmospheric tunnel/starfield, pointer navigation and actual source-linked GAIA Mesh v4 node relationships. Node counts describe repository-source nodes, not real compute hosts. FPS is measured from the rendering loop; multiplayer peers remain disconnected until a real service is established.

Visual reference: user-uploaded Sovereign OS – Matrix Integration Engine v26.4. Its 6,000 stars and 128 swarm meshes are rendering geometry, not verified hardware.

## Verified Cloudflare host inventory

Cloudflare zone crypticnews.org is active. The live Custom Domain for both root and www is cryptic-polyglot-public, separate from zone routes at /nexus/* and /api/forge*. The DNS placeholder AAAA does not prove the cause of an HTTP 502.

The public Worker configuration read did not list ASSETS or EVENT_DB bindings. The checked-in cloudflare-public-worker now routes /api/crossvoid/* and /api/portal/event to the CrossVoid Worker module, and explicitly responds with STATIC_ASSETS_NOT_CONFIGURED if the actual Vite static asset binding is unavailable. This source commit has NOT replaced the live production Worker.

## Visitor accountability

Cloudflare's standard first-party request observability can count overall visits independently. Browser journey events are separately opt-in, limited to event, stage, and source, with no speech, microphone recordings, GPS, raw keystrokes, identities, or API credentials. The D1 EVENT_DB binding is required for an actual receipt.

The owner-only aggregate route /api/crossvoid/operator/events/summary?days=7 requires a verified Cloudflare Access JWT matching the explicitly configured owner email. Unconfigured owner access fails closed.

## GOD / Golden Army Forge boundary

Public rooms may navigate shared worlds and inspect public source-linked nodes. A public visual cue, voice phrase, or invite link does not confer operator rights. Private terminal/device control stays with host-authoritative GOD scoped capabilities and a real server-authenticated operator role. Privileged access should require passkey/WebAuthn step-up.

## Unfinished proof gates

1. Diagnose actual production HTTP failures, verify Worker assets and deployment version.
2. Publish a tested Vite asset bundle on the already mapped Cryptic Custom Domain, preserving current domains and secrets.
3. Configure first-party D1 events and verify genuine readback of consented events and owner-only summaries.
4. Verify Cloudflare Access + owner identity + passkey before creating private control endpoints.
5. Deploy authenticated bounded multiplayer signaling and prove a two-device join. STUN alone is insufficient.
6. Execute worker contracts, TypeScript build, browser interaction verification and GitHub Pages deployment checks. Do not mark a pipeline production verified until the checks pass.

No site visitors or private resources were added to a public deployment as part of this document.
