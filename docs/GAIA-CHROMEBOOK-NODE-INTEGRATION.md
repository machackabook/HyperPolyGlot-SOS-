# GAIA Chromebook node: HyperPolyGlot integration baseline

Canonical UI repository: machackabook/HyperPolyGlot-SOS- (main).

## Preserve the existing experience
- `src/App.tsx` owns the reactive environment state and mounts `VisualRenderer3D`, `YouTubeBackgroundPlayer`, and `HyperTerminal`.
- `src/components/VisualRenderer3D.tsx` builds the Three.js torus-knot geometry and 2D HUD.
- `src/components/HyperTerminal.tsx` manages terminal tabs, controls, and commands including voice and Gemini.
- `src/services/audioVoiceService.ts` and the voice profile modal are the speech surfaces.
- `server.ts` is the existing Express entry point. Keep Gemini requests server-side; never move credentials to a public browser bundle.

This repository, not an older Cryptic terminal implementation, is the integration target. Keep all visuals and controls in place.

## Verified Chromebook node
Host: penguin; architecture: x86_64; Python service on 127.0.0.1:43188.
Local identity was created; authentication to /node succeeded on device.
rclone remote gDrive:GAIA/Chromebook has four provisioned folders.
Systemd node service was reported active and Drive timer ran successfully (exit 0).
These are operator-provided device logs, not CI proof of browser pairing.

## Browser bridge contract
A hosted HyperTerminal page cannot call another user's 127.0.0.1 service from GitHub Actions.
Browser-to-localhost requires an explicit connection flow with origin restrictions, per-device grant, revocation, and private-network/mixed-content handling. Do not paste bearer tokens into frontend source, URL parameters, or GitHub.
Same-origin tabs may use BroadcastChannel for non-sensitive events; cross-origin tabs require an authenticated bridge.
The current Python discovery API has restrictive origin handling and does not execute commands. Do not silently widen CORS.

## Next test gates
1. Confirm the exact browser origin used by HyperPolyGlot.
2. Implement explicit node pairing and revocation in a separate module.
3. Exercise /health, /node and /capabilities through an authorized local browser session.
4. Surface node status as an additive control in HyperTerminal; preserve torus knot, voice, Gemini and reactive state.
5. Validate build, runtime control regression, authorization rejection, offline behavior and Drive receipts.
6. Add bounded execution capabilities only with separately authorized worker contracts.

No claim of production browser pairing until the live browser tests pass.
