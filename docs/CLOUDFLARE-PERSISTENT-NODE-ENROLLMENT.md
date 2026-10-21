# Cloudflare persistent node enrollment — production milestone

## Deployment boundary
The canonical HyperPolyGlot UI is hosted as a static Vite bundle on GitHub Pages. Cloudflare Workers on a dedicated `api.crypticnews.org` route are the proposed authenticated API tier, pending account access, route verification, and deployment. GitHub Pages does not run `server.ts`.

## Identity separation
1. **User login:** Google OpenID Connect authorization-code flow with PKCE, state, nonce and verified ID-token issuer, audience, expiration and signature. Cloudflare creates an application session using a Secure, HttpOnly, SameSite cookie; protect mutations against CSRF and check Origin. Google sign-in does not itself grant Drive or Gemini API access.
2. **Google Drive grant:** Explicit, separate Drive OAuth scope and consent, minimal privileges. Keep refresh credentials encrypted server-side if cloud Drive operations are necessary. Never place credentials in a frontend bundle, public repository, URL, or logs.
3. **Node identity:** Locally generate a device-bound asymmetric signing key (prefer non-exportable hardware-backed keys where supported). The Cloudflare registry stores public key, opaque node ID, owner ID, granted capabilities, expiry, revocation status and last proof. No long-lived shared browser bearer token.
4. **Pairing:** An authenticated user requests a short-lived single-use pairing challenge; a local agent explicitly confirms pairing and signs the challenge with its private key. The backend validates signature, challenge, expiry, account binding, and one-time use before issuing a short-lived scoped node session.
5. **rclone:** A *separate* locally stored rclone OAuth configuration is used only by the node. A short-lived random probe file under a user-authorized GAIA namespace may prove the remote is writable/readable, with content hash checked; do not use rclone access or refresh tokens as node session credentials. A Drive probe does not prove the physical device identity.
6. **Reconnection:** The node key and registration survive terminal refresh; the node signs a fresh nonce to obtain a short-lived session. A browser reload resumes the application session via its cookie, not by persisting tokens in localStorage. Revocation immediately disables subsequent renewals.

## Durable storage and transport
- Use a Cloudflare D1 registry for account-to-node ownership, capability grants, nonce consumption and audit receipts; evaluate Durable Objects for race-free single-use pairing if concurrency requires it.
- Enforce TLS, strict allowed origins, CSRF protection, request limits, input schemas, expiration, rate limits and explicit per-capability authorization. The public API must not provide an arbitrary shell endpoint.
- Keep device credentials local with mode 0600; rclone remote config and Cloudflare secrets are excluded from Git and Drive artifact synchronization.
- Cloudflare Worker secrets store backend Gemini API credentials. User Google OAuth does **not** automatically authorize Gemini API requests. Route Gemini inference through an authenticated, rate-limited server-side API.
- Do not publicly expose the Chromebook localhost API. Browsers cannot bypass CORS, Private Network Access or mixed-content rules; implement an explicitly paired bridge, with independent origin and authentication tests.

## Evidence gates
- **Verified on Chromebook (operator output):** local node identity, authenticated localhost discovery, rclone artifact readback, systemd service active, Drive timer successful.
- **Source-only:** GitHub frontend code and Cloudflare integration design.
- **Blocked:** Cloudflare connector currently errors on whoami/search/execute; no account/zone/Worker changes or cloud pairing have been verified.
- **Next:** Inspect Cloudflare zone/Worker permissions; deploy health-only Worker with no credentials; verify DNS/HTTPS and CORS; implement OIDC session; add one-time pairing; validate revocation and Drive readback; integrate HyperTerminal status control; run ADAM live gates.
