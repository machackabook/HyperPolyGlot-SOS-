# Production Integration Contract — Cloudflare, WebMCP, Drive, Codex
Version: 2026.10.18-2 | Status: SPECIFICATION ONLY — NO LIVE BACKEND VERIFIED

## Release isolation
The promoted frontend lives in machackabook/HyperPolyGlot-SOS-; Cryptic is the separately maintained everyday application. Never overwrite Cryptic, reconfigure its Pages deployment, or move credentials into Git.

## Cloudflare edge gateway
A separate, authenticated Cloudflare Worker should broker POST /api/chat using scoped secrets. Do not repurpose the existing azazels-hypertermux Worker without inspecting and approving its actual application. Gate with authenticated identity, provider allowlist, per-identity rate limiting, validated schema, bounded requests, explicit origin allowlisting, safe timeout, limited error details and structured logs without prompt or secret leakage. Cloudflare connections and deployed behavior remain unverified.

## WebMCP
No callable WebMCP integration is available in this ChatGPT session. Browser tools may only expose narrow schemas and permitted operations with explicit origin and user consent. No arbitrary eval, shell access, hidden tool calls, or token forwarding. Verify actual browser registration and permission prompts before any claimed PASS.

## Google Drive
Use private, access-controlled release evidence and reference folders only after identifying the exact destination. Version records with SHA-256 and GitHub commit references. Never synchronize secrets or publish Drive files automatically. A connected Drive search found no unequivocal HyperPolyGlot release manifest.

## Excluded: Cerebrium
Cerebrium is out of scope by explicit user decision. Do not provision its endpoints, configure secrets, deploy compute or route traffic through it. Revisit only by new explicit request.

## Legacy Codex Cloud
The user reports a Codex Cloud integration linked to machackabook/HyperPolyGlot-SOS-. GitHub access was verified, but no dedicated Codex Cloud tool is exposed in this ChatGPT session. The existing integration may execute project tests, fetch backend dependencies and report results if independently confirmed through Codex. Neither compute availability nor credentials are implied by that report.

## Release acceptance gates
1. Verify the GitHub Actions run and diagnostic logs. Failure is blocking (run 39188233411 failed and its deploy job skipped; error cause not yet verified).
2. Confirm reproducible dependency manifest/lockfile policy and TypeScript/Vite CI pass.
3. Confirm Pages static deployment, correct /HyperPolyGlot-SOS-/ asset base and browser route behavior.
4. Confirm authenticated Gemini backend returns live provider provenance and maps errors correctly; fake local heuristics may never be labeled as live responses.
5. Test CORS, authentication failure, rate limiting, redacted logs and secret scanning.
6. Prove WebMCP permissions and Drive private receipt handling only if actually used.
7. Smoke test mobile/desktop, microphone opt-in, error paths, consent, and accessibility.
8. Preserve independent Cryptic regression baseline. Promote only with auditable receipts and manual approval.

Required progression: DISCOVER → OBSERVE → NORMALIZE → CLASSIFY → VERIFY → FINGERPRINT → LOOKUP_REMEDY → APPLY_REMEDY → REVERIFY.
Promotion: ORCHBENCH → LIVE_EXECUTION → ADAM_PROOF_GATES → PRODUCTION_VERIFIED → ARCHBENCHSHOP.
