# GAIA / NEXUS Resonance Lab

## Live browser console

The HyperPolyglot app mounts src/components/ResonanceConsole.tsx over the original HyperTerminal and Three.js renderer. Its wave calculations are in src/services/resonanceEngine.mjs.

The conservative face-flux 2D leapfrog computes u_tt = g div(h grad u), with reflecting edges, bounded numerical damping and explicit CFL rejection. RGBA bitwise trace agents follow the exact four-harmonic parametric equations supplied by the user. These are computed visuals, **not** claimed physical quantum sensor measurements.

The microphone FFT uses getUserMedia only after explicit browser permission. Without a microphone input the panel reports that the sensor is disconnected.

## Input-file calibration

The executable tools/omni_automation_matrix.py consumes JSON with a samples array. Each item holds raw and target records, each with spatial (3 numbers), spectrum (matching nonempty arrays), patches (9 arrays of 9 finite values), and fork (number). The user must supply captured readings and reference targets. The program cannot independently establish their hardware provenance.

Run:

    python tools/omni_automation_matrix.py --input capture.json --report calibration.json

To hand off to the React interface, install Playwright and Chromium, then use:

    python -m pip install playwright
    python -m playwright install chromium
    python tools/omni_automation_matrix.py --input capture.json --browser-url http://localhost:3000 --screenshot receipt.png

A nonlocal browser target requires explicit --allow-origin with its exact scheme, hostname and port. The script checks the actual window.__GAIA_RESONANCE__.ingest receiver, and returns success only when the app gives an affirmative receipt. Browser state is ephemeral; a local UI acknowledgement **does not establish server persistence**. The screenshot is an optional auditable record after that receipt.

## Tests

    node --test tests/resonance.test.mjs
    python -m unittest discover -s tests -p test_omni_matrix.py

Mathematical invariants and calibration input validation are verified with executable unit tests. No SSH, AI inference, quantum hardware, or external telemetry acquisition is claimed by these tests.
