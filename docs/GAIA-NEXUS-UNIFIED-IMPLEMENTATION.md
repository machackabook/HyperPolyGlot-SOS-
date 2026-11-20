# GAIA / NEXUS Unified Implementation Roadmap

**Integration branch:** `feature/gaia-conversational-core-v1`  
**Primary runtime surface:** HyperPolyGlot-SOS-  
**Architecture reference:** Gaia-The-Nexus-Generation  
**Continuity surface:** continuity-engine-ssos  
**Status rule:** implemented means source committed; operational means runtime evidence exists; verified means a reproducible check passed.

## Unified system map

```text
USER / VOICE / WEB UI
        |
        v
HyperPolyGlot React + Three.js surface
        |
        v
Conversation API (/api/chat)
        |
        +--> GAIA persona contract (natural multi-turn dialogue)
        |
        +--> Gemini provider adapter (server-side key pool)
        |
        +--> bounded conversation history
        |
        +--> optional Memory Fabric retrieval (untrusted evidence)
        |
        v
Structured response: natural-language reply + speech + visual metadata
        |
        +--> user-facing conversation
        +--> optional audio rendering
        +--> visual environment state

Continuity Engine: append-only status/ledger and project heartbeat
Gaia architecture: control-plane, factory, provenance, secure delivery
S.O.S. computational engines: separate verified modules, not inferred from names
```

## Stage 0 — Preserve and identify source-of-truth

- Preserve `HyperPolyGlot-SOS-` as the live conversational/UI implementation.
- Preserve `continuity-engine-ssos` as the continuity ledger and status surface.
- Preserve `Gaia-The-Nexus-Generation` as the public AI-factory/control-plane architecture.
- Do not overwrite histories or copy entire sibling repositories into one tree without
  provenance and license review.
- The prior inventory's candidate `Sovereign-Operating-System` was not resolved by
  this branch's repository lookup; ownership/source-of-truth remains an open item.

**Acceptance:** each component has a named owner, canonical repository, branch, and
source revision recorded before code is migrated.

## Stage 1 — Conversational intelligence (implemented in this branch)

- Added `src/services/gaiaPersona.mjs`: a stable personality and conversation contract.
- Replaced terminal-only system framing with natural multi-purpose dialogue.
- Preserved structured visual metadata while making `reply` the primary answer.
- Bounded supplied history to the latest 12 valid turns and 6,000 characters each.
- Kept retrieved Memory Fabric excerpts explicitly untrusted and bounded to 4,000
  characters.
- Removed deterministic pseudo-AI success replies. Missing provider configuration
  now returns `AI_NOT_CONFIGURED`; provider failures return `AI_PROVIDER_ERROR`.
- Configured the chat model using `GEMINI_MODEL`, defaulting to
  `gemini-2.5-flash`.

**Acceptance:** unit tests pass; runtime status identifies provider/model; a real
provider request returns a natural multi-turn answer; missing/failed provider returns
an honest error rather than a fabricated completion.

## Stage 2 — Continuity and Memory Fabric

Existing source candidates:
- `src/services/gaiaEngramCore.mjs`
- `bridge/gaia_scribe_worker.mjs`
- `bridge/gaia_mcp_server.py`
- `bridge/quine_local_bridge.py`
- `continuity-engine-ssos/data/status.json`
- `continuity-engine-ssos/ledger/HOURLY.md`

Next integration:
1. Keep Scribe as a separately authenticated local worker.
2. Add a private authenticated adapter from the chat server to Memory Fabric.
3. Preserve source ID, source reference, observed time, SHA-256, visibility and
   verification status in every retrieval.
4. Add deletion tombstones, durable persistence, backup/replay and corruption tests.
5. Ensure retrieved content never becomes executable instruction.

**Acceptance:** controlled fixture ingestion, restart persistence, deletion/tombstone
behavior, source-scoped recall, cross-device readback, and audit receipt tests pass.

## Stage 3 — Runtime/tool orchestration

- Define explicit capability adapters for local files, GitHub, browser, network
  diagnostics and device bridges.
- Each adapter declares permissions, input schema, timeout, output schema and audit
  record.
- The language model may propose a tool call; the host authorizes and executes it.
- The model must never claim an action occurred before the adapter returns success.
- Add read-only modes and dry-run planning for privileged integrations.

**Acceptance:** tool contract tests, permission-denial tests, timeout tests, and
end-to-end audit verification pass for each adapter independently.

## Stage 4 — Visual, voice and multimodal surfaces

- Retain Three.js renderer as a presentation layer, not an evidence source.
- Keep speech output separate from the full text answer.
- Add explicit user controls for microphone capture and audio playback.
- Keep topology/color/speed metadata schema-validated and clamp numeric ranges.
- Provide an accessible text-first path when audio or WebGL is unavailable.

**Acceptance:** browser tests cover keyboard use, text-only fallback, voice opt-in,
response rendering, and invalid visual metadata.

## Stage 5 — Computational engines

Treat these as independent packages with their own specifications and proofs:
- QC-LDPC (quasi-cyclic construction), decoding and syndrome verification.
- Recursive Reed–Solomon over GF(256), including correction/reverification.
- Hash/Merkle provenance and Ed25519 signature validation.
- Four-lane paired forward/reverse DUALTRACE, if source is recovered.
- Numerical methods, statistics/inference, information theory, distributed systems,
  and control theory.

Do not label any engine complete until its implementation, fixtures, invariants,
benchmarks and failure cases are present and reproducible.

**Acceptance:** known-answer vectors, property tests, adversarial fixtures, benchmark
reports, and independent verification.

## Stage 6 — Dream / World / Magic Browser

The prior evidence inventory did not establish standalone production runtimes for
these names. Do not substitute a visual concept or terminal command for an engine.

For each engine:
1. recover source or mark it as a new implementation;
2. publish a versioned API contract;
3. define state, persistence, resource limits and security boundaries;
4. add a real implementation and executable tests;
5. connect it through the Stage 3 adapter layer.

**Acceptance:** API contract tests and end-to-end user workflows pass on a real runtime.

## Stage 7 — Finance and external transactions

The previously inspected `financeService.ts` was identified as a prototype with
sample transactions and non-authoritative settlement behavior. Keep it quarantined
from production payment, banking, brokerage and accounting flows.

Production work requires:
- server-side provider adapters and verified webhooks;
- idempotency, reconciliation and immutable event records;
- explicit user authorization and least-privilege scopes;
- no client-side declaration that a payment is settled;
- sandbox and production separation.

**Acceptance:** provider-signed webhook verification, idempotency/replay tests,
reconciliation and security review.

## Stage 8 — Deployment and release gates

1. Run persona unit tests, TypeScript lint, production build and existing repository
   tests in CI.
2. Verify the Node API is deployed; static GitHub Pages alone cannot run
   `POST /api/chat`.
3. Configure `GEMINI_API_KEY` and `GEMINI_MODEL` in server-side secrets.
4. Verify `GET /api/runtime-status` and a real `POST /api/chat` request.
5. Confirm Memory Fabric and bridge are separately authenticated.
6. Add health checks, structured logs, rate limits, request-size limits and usage
   budgets before public exposure.

**Release rule:** no production-ready claim without CI evidence, deployment
readback, real provider response, and an end-to-end smoke test.

## Current completion boundary

The conversational identity module, server wiring, bounded history handling, and
honest provider-unavailable behavior are committed to this feature branch. The
unit test and CI workflow are the next verification gates. Provider credentials,
deployment configuration, Memory Fabric durability, and full end-to-end operation
must be verified in the actual runtime before calling the unified system live.
