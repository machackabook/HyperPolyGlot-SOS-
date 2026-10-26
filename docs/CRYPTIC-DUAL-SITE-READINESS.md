# CrypticNews + HyperTerminal dual-site readiness

Verified on **2026-10-26** through connected GitHub and Cloudflare management interfaces.

## Deployment identities

- Public static app: `https://machackabook.github.io/HyperPolyGlot-SOS-/` on GitHub Pages. Deployment run associated with SHA `5e734e2454e0` reported **success**. Later revisions need fresh verification.
- Canonical Cryptic News front door: `https://crypticnews.org/`, mapped to Cloudflare Worker `cryptic-polyglot-public` in the explicitly authorized Cloudflare account.
- The canonical Worker source is `src/cloudflare-public-worker.mjs`. Its intended assets are actual Vite `dist/` output, not a substitute HTML shell.
- AI Studio is development/test workspace, not the authorization domain.

## Source fixes committed

1. `src/services/crypticPortalTelemetry.mjs` now accepts `crystalline`, matching the gate UI and Cloudflare event contract; previously opt-in flips were locally rejected.
2. `src/components/CrystallineCrossvoidGate.tsx` reports the correct site origin (`crypticnews` vs `github-pages`), gives no fake event receipt, and queries the public Cryptic route with a **4.5-second** timeout.
3. `tests/crossvoid-gateway.test.mjs` checks both origins, unknown-field rejection, opt-in-only posting and actual asset-binding behavior using **explicit mocks** as contract tests, not production proof.
4. `.github/workflows/crossvoid-gateway.yml` includes telemetry and public Worker files in triggers/parse validation.

## Confirmed external blockers

Cloudflare live Worker configuration on October 26 reports:

- `ASSETS`: **not bound**.
- `EVENT_DB`: **not bound**.
- Other existing bindings and secrets were left untouched.
- Worker request observability is enabled; that is not proof of app-specific journey events or persistent consented event storage.
- The Worker settings/deployment are not assumed to match the latest repository source.
- GitHub CrossVoid Security Contracts run `40283982931` concluded **failure**; the attempt to retrieve job logs returned a missing blob, so the failure's cause is unverified.
- The legacy `cascade-enhance` workflow continues to fail; Pages success does not prove the complete release.

## Safe production path (not yet executed)

1. In an isolated checkout: `npm ci && npm run lint && npm run build` and `node --test tests/crossvoid-gateway.test.mjs`. Preserve and publish logs with each commit.
2. Review the Worker static-assets bundling from `wrangler.jsonc`: `assets.directory="./dist"`, `assets.binding="ASSETS"`. Connect authorized GitHub deployment or deploy the tested `dist/` and Worker **as a single release**, preserving all current secrets, custom domains, and preexisting routes.
3. Create a private D1 database, execute the checked-in `cloudflare/crossvoid-migration.sql`, bind it only as `EVENT_DB`, and read back a consenting journey event. Do not enable identity or GPS capture.
4. Configure Cloudflare Access and passkey verification before any private operator control; spoken navigation and invitation links remain public-only.
5. Check `GET /api/status` and `GET /api/crossvoid/status` on the actual production hostname; verify a real HTML Vite app served at `/`, first-party consent flow, verified backend receipts, and a restricted operator endpoint returning 401 without credentials.
6. For multiplayer, deploy the separate WSS signaling service and verify a **two-device, explicit-consent** WebRTC call, including failed STUN and TURN fallback conditions.
7. Promote via evidence-first ADAM gates only after tests and external readback pass.

**Go/no-go:** source integration has advanced, but live Cryptic News and two-device session behavior remain **unverified**. Never claim full parity or operator authorization based solely on GitHub commits or a visual card.
