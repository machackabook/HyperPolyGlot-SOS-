# V38 Convergence Forge (review branch)
Adds a UI-integrated local feature panel to the HyperPolyGlot OS, without changing the existing HyperTerminal, shaders, device bridges, secrets, or main branch.

Capabilities: V26/V27 bounded same-origin spider, HTML skeletonization and local file ingestion, V28 deterministic dark-style Molt preview, V37 rule-based intent ranking, short local capped ledger, console debugging, manual stop 33011033.
Browser crawler is deliberately limited to 8 pages, HTML only, same origin, omits credentials, aborts requests after 6 seconds, and will not crawl third-party hosts. Molt does **not** call Gemini and must not be described as AI-generated. Preview is isolated with an empty sandbox.
V36 socket mesh, process healing/clone and V28 cloud Gemini generation are **not enabled**: they require an authenticated, separately audited backend and explicit authorization. The kill command stops V38 browser functions; it is not a process kill switch.
Manual verification: open app and the V38 FORGE button; enter "diagnose and backup"; check ranked intents. Upload a small HTML file and generate a preview. Confirm local ledger entries; enter same-origin path for capped crawl; press 33011033, verify controls disabled; manually resume.
