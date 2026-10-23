# GAIA Causal Core — HyperTerminal integration (22 Oct 2026)

## Runtime contracts
- **Fast path** (no user approval): locally observed command-name events, strict induced ternary graph, sparse count/frequency channels, numerical symplectic oscillator, rendering, read-only local computation.
- **Gated path**: GitHub write/push/commit and privileged SSH/network administration require authenticated backend-scoped permissions; the browser has *no authority* to mint these permissions. Gate rejects, not a faux success.
- **Data origin**: this release observes command **names only** from the actual terminal execution callback. It does not record raw arguments, claim remote network observation, or invent nodes. The rest of the app retains its own existing history features independently.
- **Provenance**: each session event has actual source label `hyperterminal`, a monotonic sequence ID, and an observation timestamp; this is observational origin metadata, **not cryptographic source authentication**.
- **Graph**: count and conditional frequency for each ordered `(a,b)->c` under strict (M_K) membership, deterministic protected-vertex selection, and target index preservation in shape `[2,N,N,N]`. Direct browser core does not train `theta_K`: it implements verified deterministic graph projections only.
- **SQE**: kick-drift-kick symplectic oscillator driven by bounded impulses from actual user commands. Graph layout is display geometry, **not a physical sensor coordinate system**.
- **Memory**: 256-event capped **session-only** ring buffer. No browser persistence, distributed causal consensus, or external Memory Fabric connection is implied.
- **Local revision**: in-session JSON state staging, validation callback, commit and rollback. This is **not** a source-code transaction, power-failure recovery, or a remote GitHub commit.
- **Resource governor**: samples the actual JavaScript/WebGL render duration and selects 60/30/20 FPS. It does not suspend terminal input or graph event capture.

## Terminal controls

```text
core status
core graph
core matrix
core phase
core history
core policy compute
core policy source-write
```

No extra permission prompt appears on the local mathematical path. High-privilege operations need one authenticated **scoped** backend authorization, not approval for every internal arithmetic decision; there is no such backend connected in this browser build.

## Verification
Exact module `src/services/causalCore.mjs`: 12 local V8-isolate checks passed initially, followed by 6 security/regression checks and 7 targeted regression checks; checks include forged-browser-authority rejection, induced-subgraph membership, bounded graph and history, reversibility, and stale local-state revision refusal.

Additional reproducible tests are checked into `tests/causal-core.test.mjs`. Run them in a Node environment:

```bash
node --test tests/causal-core.test.mjs
```

**Execution distinction:** The isolated JavaScript checks were run using the exact module source. The Node test command above is supplied for reproduction; it has **not** been executed by Node in this session.

Observed V8-isolate development timings (repeated artificial command names, single isolate, Date.now millisecond precision; **not** end-user browser latency promises):
- 10,000 event observations: 25 ms total (average 0.0025 ms)
- 2,000 bounded graph recomputations: 1,059 ms total (average 0.5295 ms)
- 100,000 automatic capability classifications: 8 ms total (average 0.00008 ms)

Live Cloudflare Browser Rendering smoke: the app and terminal rendered on GitHub Pages and the direct Cloudflare Worker URL after the terminal/renderer integration, and the Worker referenced the integration commit. This only confirms page/runtime mounting, not end-to-end command interaction or cross-device benchmarks.

## Remaining independent gates
1. Browser interactive `core ...` command execution (UI automation / user verification).
2. Node.js unit test execution and full Vite/TypeScript production build in an environment with npm dependencies.
3. Durable, tamper-evident provenance in a real Memory Fabric store, identity attestations, and cross-device replay.
4. Production-side transactional source updates with staged writes, crash recovery, and auditable approvals.
5. Browser and device load tests with recorded frame-time percentiles and memory peaks.
6. Updating the AI Studio v3 archive to incorporate the upstream changes; the canonical GitHub `main` app currently differs from the user-provided v3 ZIP.

**Rule:** No mock telemetry, fake SSH/network success, or fabricated approvals can count as ADAM production proof.
