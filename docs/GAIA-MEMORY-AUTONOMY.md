# GAIA Memory-First Autonomy — Herald, Scribe, Memory Fabric

**Code status, 2026-10-23:** Core implementation and terminal wiring have been committed to HyperPolyglot main. The Node worker is not yet demonstrated running on the user's device. GAIA Memory Site synchronization and authenticated cloud-source harvesting are **not** connected or verified.

## Operating principle

GAIA's normal behavior should be autonomous: once a real source is authorized, observation, indexing, deduplication, recall, relevance ranking, steered-graph computation, SQE updates and visual rendering do **not** require per-decision human approval. Capability permissions are enforced once at the actual external/privileged boundary, not per numerical step.

Herald -> local approved inbox -> Scribe private storage -> Memory Fabric recall -> steered graph/SQE -> ADAM consequence verification.

## Components now checked into the HyperTerminal repository

- src/services/gaiaEngramCore.mjs: source-identified engrams, hashes and references, local ranked recall, optional scope filtering, finite capacity, deduplication, version restoration, and derived links from **explicit** source references.
- bridge/gaia_scribe_worker.mjs: an opt-in local Node worker that polls an explicitly selected directory, SHA-256 hashes content, excludes unsafe-looking files and saves a private local snapshot atomically. It exposes a read-only loopback API with endpoints /api/status and /api/search.
- Existing bridge/quine_local_bridge.py: authenticates the browser and forwards selected local Scribe status/search endpoints. It can target the new Scribe-compatible worker on port 8788 using --scribe-port 8788, or retain the original Scribe v4 default port 8787.
- src/components/HyperTerminal.tsx: adds memory status and memory recall QUERY. When the existing mesh is already authenticated, Gemini prompts automatically attempt local memory lookup with a 150 ms waiting budget. Slow or absent Scribe never creates a false memory response. Retrieved excerpts are identified by source reference and digest.
- server.ts: source excerpts explicitly treated as **untrusted evidence**, not overriding system instructions or permissions.
- tests/gaia-engram-core.test.mjs: 14 reproducible Node test definitions.

## One-time local bootstrap

Run from a checked-out HyperPolyglot repository on an authorized machine with Node 20 or newer:

~~~sh
mkdir -p "$HOME/gaia-herald-inbox" "$HOME/.local/share/gaia-memory"
chmod 700 "$HOME/gaia-herald-inbox" "$HOME/.local/share/gaia-memory"
node bridge/gaia_scribe_worker.mjs --inbox "$HOME/gaia-herald-inbox" --store "$HOME/.local/share/gaia-memory" --port 8788 --poll-ms 15000
~~~

Drop an approved Markdown, text, JSON, or JSONL source export into that private inbox. The worker detects changed files while its process remains running. It does not directly scrape live third-party sessions. For a one-time scan instead of a long-running worker, add --once.

In a separate local process (with Python and aiohttp available), start the already-existing paired bridge:

~~~sh
python bridge/quine_local_bridge.py --scribe-port 8788
~~~

Inside HyperTerminal:

~~~text
mesh connect
memory status
memory recall Hamiltonian
scribe search SQE
~~~

The local mesh pairing token is entered for the process/session, not on each read. Browser private-network restrictions may affect a hosted HTTPS terminal connecting to localhost. The browser is not automatically authenticated to Gemini, ChatGPT, Drive or the GAIA Memory Site by opening a landing link.

## Memory growth rule

Repeated retrieval can adjust **ranking**, never turn an unverified assertion into a verified fact. Provenance includes original source ID, sourceRef, observed timestamp, SHA-256 content digest, explicit verification field and revision. Unknown sources and malformed input are rejected rather than invented. Memory snippets supplied to a model are treated as untrusted quoted data.

## Scope and evidence

A 13-check V8 harness for the pure JavaScript engram core passed, plus a separate snapshot roundtrip test. The 14-test Node suite is committed but **has not been run in Node** in this session. The dedicated GitHub Actions workflow was blocked during creation, so there is **no CI success claim**. The local Node worker and full memory-to-site path have not been end-to-end verified.

This is a functioning **source and integration implementation**, not an assertion of a complete running Memory Fabric production service.

## Remaining gates

1. Run Node tests and validate readback with controlled source fixtures.
2. Connect the actual Herald exporter to the authorized private inbox. No private credentials or source contents belong in public GitHub.
3. Connect a *private authenticated API* for the GAIA Memory Site; ensure selected Google Drive account access is separately authorized through appropriate connectors.
4. Add source deletion/tombstones, backup, corruption recovery and durable history/replay.
5. Verify browser network rules, source-scoped data access, and time/memory bounds on each actual device.
6. Automate OS boot/service startup for the selected running host after one-time authorization.

No human approval is required for normal retrieval or computation. Source scope, publication and privileged external effects remain independently verifiable.
