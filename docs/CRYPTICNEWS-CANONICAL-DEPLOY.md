# Cryptic News — canonical AI Studio HyperPolyGlot deployment

Source: machackabook/HyperPolyGlot-SOS- on main. Hostname: https://crypticnews.org. Worker name: cryptic-polyglot-public.

The production build must be the real React/Vite application from src/App.tsx, not the prior standalone public shell. Its VisualRenderer3D.tsx includes THREE.TorusKnotGeometry (32, 6.8, 240, 32, 3, 5).

## Cloudflare Workers Builds settings

- Connect the existing Worker cryptic-polyglot-public to GitHub repository machackabook/HyperPolyGlot-SOS-, branch main.
- Root directory: /; Node 22 or newer.
- Build command: npm install && npm run build
- Deploy command: npx --yes wrangler@4 deploy
- Wrangler config in this repository: wrangler.jsonc
- Build artifact: dist/ (configured as Workers Static Assets), Vite base /.
- Do not set GITHUB_PAGES=true for the canonical domain.
- Do not modify api.crypticnews.org or bus.crypticnews.org.

## Current external blocker (2026-10-22)

Cloudflare Git connection returns 8000011 (Pages) and 8000008 (Workers Builds): disconnected GitHub installation. Reauthorize the GitHub integration in Cloudflare Workers & Pages for this repository, then select cryptic-polyglot-public > Settings > Builds > Connect. Vercel project creation also returned forbidden 403; it is not configured as a deployment target.

## API security and truthful status

The Cloudflare Worker handles /api/status and /api/chat. AI is disabled until Worker-side GEMINI_API_KEY, GEMINI_MODEL, TURNSTILE_SECRET_KEY and AI_PUBLIC_ENABLED=true are configured. The React terminal must obtain a fresh Turnstile token before asking the Worker for real AI inference; absent a token, the endpoint rejects requests. Configure Cloudflare rate limiting before enabling public AI. Never embed a provider key in HTML, Vite client variables or Git.

Static deployment does not run server.ts (Express). Its equivalent endpoints must be supplied through a trusted server-side adapter. Tests, production requests and browser rendering must all succeed before calling this PRODUCTION_VERIFIED. Use the ADAM gates: DISCOVER > OBSERVE > NORMALIZE > CLASSIFY > VERIFY > FINGERPRINT > LOOKUP_REMEDY > APPLY_REMEDY > REVERIFY.

The companion GitHub Pages Cryptic homepage redirects to crypticnews.org so it cannot drift to an older renderer. Legacy interfaces remain separately addressable.

## 2026-10-29 correction: build before publication

GitHub Pages previously imported App.tsx from esm.sh against moving main. That endpoint returned HTTP 500 (`Expected "}" but found "className"`); the local Vite build located an unclosed conditional in XYouTubeAICard.tsx. The entry HTML now uses src/main.tsx and Vite emits same-origin JavaScript and CSS. npm's package-lock.json is the CI dependency lock; esbuild now satisfies Vite's peer range. The existing bun.lock is historical and is not used by this npm workflow.

frontend-pages.yml type-checks, runs module tests, builds with the project Pages base, checks browser rendering, and publishes dist using GitHub Pages Actions. Repository Pages source must be GitHub Actions. Never publish unbuilt index.html directly from a branch.

The canonical domain already targets cryptic-polyglot-public on Cloudflare, with www redirected to the apex. Its live Worker differs from the static-assets adapter in this repository: it uses a versioned RELEASES KV manifest, Access-protected APIs, and Secrets Store bindings. Do not deploy this repository's wrangler config over that Worker without reconciling those differences and validating the new release. No DNS migration is needed to use the existing domain.

Cloudflare Worker real-time issues and Universal SSL notification policies were enabled in the domain's account, using its existing billing-notification email destination. Worker issue detection was enabled while preserving logs, bindings, and query-string redaction. These detect Cloudflare-side issues; they do not detect every browser error or guarantee immediate delivery. site-availability.yml adds a five-minute requested schedule and a real browser check for Pages, plus canonical release health checks. Actions scheduling, runner allocation, and the owner's workflow notification settings determine actual delivery; verify those in the next live run.
