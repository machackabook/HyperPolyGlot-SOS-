# HyperTerminal Polyglot Quine OS — localhost mesh adapter

The adapter belongs to the existing Polyglot Quine OS and does not create a separate OS UI, remote shell, 6,000 operating-system threads, or simulated device telemetry.

## Start on a single device

Install Python and aiohttp in Termux, Windows PowerShell, or ChromeOS Crostini. From the cloned Quine OS repository run:

    python -m pip install aiohttp
    python bridge/quine_local_bridge.py

On Windows use py instead of python if needed. This starts a foreground read-only localhost service on 127.0.0.1:8791 and prints a per-process secret. In the *same device's* existing HyperTerminal run: mesh connect. Enter the secret at the separate prompt; do not paste it into terminal history. Then run mesh status and mesh ping. mesh disconnect detaches the connection. Ctrl+C stops the Python process.

Browser private-network or mixed-content rules may block a public HTTPS Quine instance from contacting localhost; device-specific browser acceptance has not been verified. Do not bind the bridge to 0.0.0.0, expose port 8791 to a router, disable security features, or treat LAN services as already authenticated.

## Optional local Nexus Scribe v4

Keep NEXUS_SCRIBE_v4.0.0_DRIVE_PAGES.zip and its private archive off the public repository. Separately start its actual private Scribe server with python3 scribe.py serve --port 8787. After Quine mesh pairing, use scribe status or scribe search <terms>. The bridge forwards only the selected read-only API requests to 127.0.0.1:8787; no fabricated cited results or AI summaries.

## Security and evidence

Pairing is required over HTTP Bearer or WebSocket subprotocol. Secret remains in browser session memory. Approved origins and Host header are verified. Native command execution, SSH, device control, machine scans and WAN listeners are absent. Output comes from real process introspection, measured WebSocket pings, and a real local Scribe archive when connected.

Visual Computer, Gemini-95, Epic Creator, Grimmoire and Dream Engine are reference material until their actual executable services and permissions have been verified. Existing separate application code and sensitive Scribe knowledge corpus were not transplanted into the public Quine.

Full-device tests on Termux, Windows, Crostini and any future TLS/Tailscale mesh are additional ADAM proof gates. Existing Quine HTML export still uses CDNs and cannot be called a complete offline React bundle.