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
