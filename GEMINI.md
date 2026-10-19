# HyperPolyGlot Production Gate — Gemini Reference
## Release separation
- `machackabook/HyperPolyGlot-SOS-` is the advanced promoted GitHub Pages frontend; main remains the release target.
- `machackabook/Cryptic` is the independent everyday HyperTerminal; never deploy or overwrite it from this repository.
- Google AI Studio/Gemini functionality is integrated through an authenticated backend, never a public frontend key.
## Source-backed capabilities
- React/TypeScript HyperTerminal in `src/components/HyperTerminal.tsx`: tabs, command completion, history, in-terminal editor, VFS, voice and audio integration, rendering commands and UI controls.
- `src/services/quineService.ts`: HTML export; currently imports remote Three.js/Tailwind/fonts, so **not verified offline**, despite its existing displayed label.
- `src/services/vfsService.ts`: browser VFS and local persisted state; preloaded demo data contains fictional success claims. These are not live network or filesystem attestations.
- `server.ts`: Express POST /api/chat using @google/genai when GEMINI_API_KEY is configured, with heuristic fallback. AI-generated claims must not be presented as verified telemetry.
- Companion source artifacts supplied by the Architect: Raven Desk v2 (graph/editor/ledger), AXS Network Telemetry v2.1 (user-authorized WebSocket and measured-state ingest), Rosenbridge Infinite Canvas (experimental iframe canvas). Keep experimental code isolated until reviewed and tested.
## Pages contract
GitHub Pages serves static `dist/` only and cannot run `server.ts`. Build with `--base=/HyperPolyGlot-SOS-/`. No automatic remote connection; no browser-side secrets. Configure Actions as Pages build source before merging. An API gateway origin must be separately provisioned, authenticated, CORS-restricted and tested before enabling live Gemini functionality.
## Proof gates
DISCOVER → OBSERVE → NORMALIZE → CLASSIFY → VERIFY → FINGERPRINT → LOOKUP_REMEDY → APPLY_REMEDY → REVERIFY.
ORCHBENCH → LIVE_EXECUTION → ADAM_PROOF_GATES → PRODUCTION_VERIFIED → ARCHBENCHSHOP.
Before promotion verify npm ci, TypeScript typecheck, Vite output and asset URLs, microphone permission handling, live /api/chat against an authorized backend, error/fallback labels, secret scan, browser CSP/CORS, Pages URL smoke test, and Cryptic regression isolation.
## Known defects to resolve
1. No validated externally hosted Gemini backend for the GitHub Pages origin.
2. Quine export incorrectly announces 100% OFFLINE while loading CDN resources and does not export the full React application.
3. Some example VFS messages claim live network success without operational evidence.
4. Selected Gemini model identifier in server.ts needs availability verification against configured Google account.
5. Never interpret a workflow commit as a verified live deployment; inspect actual Actions and Pages results.
## Gemini instructions
Use this file as a factual reference, retain distinct editions, issue minimal reviewed diffs, avoid autonomous destructive actions, and record runtime receipts. AI-generated text and artwork are never proof of live infrastructure state.
