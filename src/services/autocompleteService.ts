/**
 * Autocomplete Service for HyperTerminal Polyglot Quine OS
 * Computes intelligent command suggestions, subcommand expansions, and VFS file completions.
 */

export interface CommandSuggestion {
  command: string;
  category: 'System' | 'VFS' | '3D Visuals' | 'AI & Voice' | 'Satcom' | 'Swarm' | 'Fintech' | 'Quine' | 'Custom' | 'D3 Stream' | 'Network';
  description: string;
  badge: string;
  badgeColor?: string;
  score: number;
}

export const COMMAND_REGISTRY: Omit<CommandSuggestion, 'score'>[] = [
  // System & Terminal
  { command: 'help', category: 'System', description: 'Display complete command matrix and usage guide', badge: 'SYS' },
  { command: 'clear', category: 'System', description: 'Clear terminal scroll viewport history', badge: 'SYS' },
  { command: 'uptime', category: 'System', description: 'Show system uptime and operational load metrics', badge: 'SYS' },
  { command: 'whoami', category: 'System', description: 'Print active sovereign operator identity and privileges', badge: 'SYS' },
  { command: 'date', category: 'System', description: 'Display current UTC and sidereal timestamp', badge: 'SYS' },
  { command: 'telemetry', category: 'System', description: 'Display live 3D visualizer & OS hardware state JSON', badge: 'SYS' },
  { command: 'dock bottom', category: 'System', description: 'Pin terminal workstation to bottom dock', badge: 'LAYOUT' },
  { command: 'dock float', category: 'System', description: 'Switch terminal into floating draggable window', badge: 'LAYOUT' },
  { command: 'dock fullscreen', category: 'System', description: 'Expand terminal across full display viewport', badge: 'LAYOUT' },
  { command: 'opacity 0.85', category: 'System', description: 'Set terminal glass translucency opacity (0.1 - 1.0)', badge: 'STYLE' },
  { command: 'canvas', category: 'System', description: 'Toggle pure canvas mode (unobstructed 100% visual renderer)', badge: 'VIEW' },

  // VFS & Files
  { command: 'ls -la', category: 'VFS', description: 'List files and directories with detailed permissions & sizes', badge: 'VFS' },
  { command: 'ls', category: 'VFS', description: 'List files and folders in current working directory', badge: 'VFS' },
  { command: 'pwd', category: 'VFS', description: 'Print current working directory path', badge: 'VFS' },
  { command: 'cd /root', category: 'VFS', description: 'Navigate to root user directory', badge: 'VFS' },
  { command: 'cd projects', category: 'VFS', description: 'Navigate to projects directory', badge: 'VFS' },
  { command: 'cd scripts', category: 'VFS', description: 'Navigate to automated scripts directory', badge: 'VFS' },
  { command: 'cd /mnt/nexus_drive', category: 'VFS', description: 'Navigate to cloud-mounted Nexus drive', badge: 'VFS' },
  { command: 'cat welcome.txt', category: 'VFS', description: 'Display system welcome manifesto and quick guides', badge: 'VFS' },
  { command: 'cat notes.md', category: 'VFS', description: 'Inspect architectural notes and system specs', badge: 'VFS' },
  { command: 'edit welcome.txt', category: 'VFS', description: 'Open interactive in-terminal code and text editor', badge: 'EDIT' },
  { command: 'tree', category: 'VFS', description: 'Render hierarchical visual directory tree', badge: 'VFS' },
  { command: 'find projects', category: 'VFS', description: 'Search virtual filesystem nodes matching query', badge: 'VFS' },
  { command: 'grep quantum', category: 'VFS', description: 'Search text patterns across stored files', badge: 'VFS' },
  { command: 'vfs export', category: 'VFS', description: 'Export complete Virtual File System as downloadable JSON', badge: 'VFS' },
  { command: 'vfs reset', category: 'VFS', description: 'Reset virtual filesystem to sovereign defaults', badge: 'VFS' },

  // 3D Visualizer & Polymorphic Neurality
  { command: 'render torus', category: '3D Visuals', description: 'Project Neuti-ba Kerr Torus Knot with plasma wireframe', badge: '3D' },
  { command: 'render tesseract', category: '3D Visuals', description: 'Project 4D Hypercube wireframe via Givens rotations', badge: '4D' },
  { command: 'render singularity', category: '3D Visuals', description: 'Project Gravitational Singularity Core & Accretion Disc', badge: 'CORE' },
  { command: 'render neural', category: '3D Visuals', description: 'Project Polymorphic Neural synaptic axon network', badge: 'NEURAL' },
  { command: 'render galaxy', category: '3D Visuals', description: 'Project 7-Galaxy relativistic orbital frame-dragging', badge: 'SPACE' },
  { command: 'render spindle', category: '3D Visuals', description: 'Project Actuating quantum spindle turning with 33.3ms pulse', badge: 'PULSE' },
  { command: 'render dna', category: '3D Visuals', description: 'Project Algorithmic double-helix rotating strands', badge: 'BIO' },
  { command: 'sentiment analytical', category: '3D Visuals', description: 'Set sentiment to Cyan & Violet balanced crystal physics', badge: 'MOOD' },
  { command: 'sentiment energetic', category: '3D Visuals', description: 'Set sentiment to Golden Amber & Magenta high-energy flare', badge: 'MOOD' },
  { command: 'sentiment alarm', category: '3D Visuals', description: 'Set sentiment to Crimson Red warning horizon with high turbulence', badge: 'MOOD' },
  { command: 'sentiment tranquil', category: '3D Visuals', description: 'Set sentiment to Emerald Green harmonic wave advection', badge: 'MOOD' },
  { command: 'sentiment cosmic', category: '3D Visuals', description: 'Set sentiment to Deep Purple relativistic frame dragging', badge: 'MOOD' },
  { command: 'sentiment chaos', category: '3D Visuals', description: 'Set sentiment to Chromatic RGB jitter and particle dispersion', badge: 'MOOD' },
  { command: 'color #00f2ff #a855f7', category: '3D Visuals', description: 'Set custom primary and secondary glowing hex colors', badge: 'COLOR' },
  { command: 'gravity 1.5', category: '3D Visuals', description: 'Adjust 4D gravitational tensor curvature (0.1 - 4.0)', badge: 'PHYS' },
  { command: 'speed 1.2', category: '3D Visuals', description: 'Adjust 3D rotation and wave advection speed multiplier', badge: 'PHYS' },
  { command: 'turbulence 0.8', category: '3D Visuals', description: 'Adjust particle noise dispersion and wave distortion', badge: 'PHYS' },
  { command: 'burst', category: '3D Visuals', description: 'Trigger energetic particle supernova wave shockwave', badge: 'FX' },
  { command: 'calm', category: '3D Visuals', description: 'Stabilize background visual into low-frequency harmonic stasis', badge: 'FX' },
  { command: 'shatter', category: '3D Visuals', description: 'Inject catastrophic high-frequency resonance distortion', badge: 'FX' },

  // AI & Voice
  { command: 'mic on', category: 'AI & Voice', description: 'Enable microphone audio input for real-time border waveform & voice commands', badge: 'MIC' },
  { command: 'mic off', category: 'AI & Voice', description: 'Disable microphone audio input and speech recognition', badge: 'MIC' },
  { command: 'listen', category: 'AI & Voice', description: 'Toggle microphone voice listening and border waveform', badge: 'MIC' },
  { command: 'gemini explain quantum coherence', category: 'AI & Voice', description: 'Ask AI, alter 3D background visual, and project speech', badge: 'AI' },
  { command: 'gemini create neural shader', category: 'AI & Voice', description: 'Generate procedural shader code with AI', badge: 'AI' },
  { command: 'ai analyze sentiment', category: 'AI & Voice', description: 'Trigger AI conversation with in-visual voice synthesis', badge: 'AI' },
  { command: 'voice on', category: 'AI & Voice', description: 'Enable spoken AI voice responses projected into 3D visual', badge: 'VOICE' },
  { command: 'voice off', category: 'AI & Voice', description: 'Mute spoken AI voice audio responses', badge: 'VOICE' },
  { command: 'voice tune 1.0 1.05', category: 'AI & Voice', description: 'Configure vocal pitch and rate characteristics', badge: 'VOICE' },
  { command: 'speak Polymorphic neurality online', category: 'AI & Voice', description: 'Vocalize custom speech phrase with floating 3D text', badge: 'VOICE' },
  { command: '963 on', category: 'AI & Voice', description: 'Engage pure 963 Hz solfeggio harmonic sine wave oscillator', badge: 'AUDIO' },
  { command: '963 off', category: 'AI & Voice', description: 'Stop 963 Hz solfeggio audio oscillator', badge: 'AUDIO' },

  // Execution & Code
  { command: 'node projects/fibonacci.js', category: 'System', description: 'Execute JavaScript file in sandboxed environment', badge: 'NODE' },
  { command: 'js Math.sqrt(1374519) * 2', category: 'System', description: 'Evaluate inline JavaScript expression in sandbox', badge: 'JS' },

  // Satcom & Swarm
  { command: 'satcom ping', category: 'Satcom', description: 'Rebound satellite ping through 4-hop circular relay (33.3ms)', badge: 'SATCOM' },
  { command: 'satcom status', category: 'Satcom', description: 'Check ATSC 3.0 carrier frequency (533.25 MHz) and health', badge: 'SATCOM' },
  { command: 'swarm status', category: 'Swarm', description: 'Inspect 6,000-node virtual agent swarm cluster load', badge: 'SWARM' },
  { command: 'swarm reoptimize', category: 'Swarm', description: 'Rebalance 6k agent processes and security allocations', badge: 'SWARM' },

  // Git & Singularity
  { command: 'git status', category: 'System', description: 'Verify MacBook_Mirror port 8080 WebSocket mirror branch', badge: 'GIT' },
  { command: 'git log', category: 'System', description: 'Display masterwork unified commit history', badge: 'GIT' },
  { command: 'singularity evolve', category: 'Quine', description: 'Collapse all 9 sovereign editions into Supreme Masterwork', badge: '1-CORE' },
  { command: 'singularity status', category: 'Quine', description: 'Inspect 9 editions coherence status (99.98% locked)', badge: 'CORE' },

  // Arbitrage & VoIP
  { command: 'arbitrage scan', category: 'Fintech', description: 'Scan cross-exchange liquidity spreads (BTC, ETH, SOL)', badge: 'ARB' },
  { command: 'voip status', category: 'System', description: 'Check virtual mobile VoIP & eSIM chassis telemetry', badge: 'VOIP' },

  // MCP & Macros
  { command: 'mcp list', category: 'System', description: 'List active in-process Model Context Protocol servers', badge: 'MCP' },
  { command: 'macro list', category: 'System', description: 'Display all recorded automated VFS shell scripts', badge: 'MACRO' },
  { command: 'macro record deploy_flow', category: 'System', description: 'Record sequence of terminal commands to VFS script', badge: 'REC' },

  // D3 Live Data Streams & Telemetry
  { command: 'd3 stream', category: 'D3 Stream', description: 'Toggle real-time D3.js background network data stream', badge: 'D3' },
  { command: 'd3 shape force', category: 'D3 Stream', description: 'Render D3 Force-Directed dynamic node mesh topology', badge: 'D3' },
  { command: 'd3 shape streamgraph', category: 'D3 Stream', description: 'Render D3 Dynamic multi-layer flowing bandwidth streamgraph', badge: 'D3' },
  { command: 'd3 shape radar', category: 'D3 Stream', description: 'Render D3 Orbital radial telemetry sweep matrix', badge: 'D3' },
  { command: 'd3 shape chord', category: 'D3 Stream', description: 'Render D3 Satellite constellation chord transfer ring', badge: 'D3' },
  { command: 'd3 panel', category: 'D3 Stream', description: 'Toggle floating D3 telemetry HUD control panel', badge: 'HUD' },
  { command: 'ping satcom.orb.net', category: 'Network', description: 'Send ICMP network stream packets and render D3 telemetry', badge: 'NET' },
  { command: 'netstat -a', category: 'Network', description: 'Inspect active sockets and visualize live network mesh in D3', badge: 'NET' },
  { command: 'curl https://api.matrix.os/stream', category: 'Network', description: 'Stream remote payload and trigger D3 packet burst', badge: 'NET' },

  // Command History & Reverse Search
  { command: 'history', category: 'System', description: 'Open interactive command history modal overlay (Ctrl+R)', badge: 'HIST' },
  { command: 'history --export', category: 'System', description: 'Export command history log to shell script file in VFS', badge: 'HIST' },

  // Voice Personas & Accessibility
  { command: 'voice profile sovereign', category: 'AI & Voice', description: 'Switch to Sovereign Core (432 Hz, authoritative)', badge: 'VOICE' },
  { command: 'voice profile quantum', category: 'AI & Voice', description: 'Switch to Quantum Echo (528 Hz, harmonic shimmer)', badge: 'VOICE' },
  { command: 'voice profile cyber', category: 'AI & Voice', description: 'Switch to Cyber Pulse (963 Hz, robotic vocoder)', badge: 'VOICE' },
  { command: 'voice profile tranquil', category: 'AI & Voice', description: 'Switch to Tranquil Aura (639 Hz, soft meditative stasis)', badge: 'VOICE' },
  { command: 'contrast on', category: 'System', description: 'Enable high-contrast accessibility visual theme', badge: 'A11Y' },
  { command: 'chromevox on', category: 'System', description: 'Activate ChromeVox screen-reader ARIA live protocols', badge: 'A11Y' },

  // Omni-Nexus & Plug-n-Play OS Kernel
  { command: 'links file:///root/gemini.md', category: 'System', description: 'Launch interactive links text-based browser for gemini.md engrams', badge: 'LINKS' },
  { command: 'links mhtml:///quantum_vault.mhtml', category: 'System', description: 'Browse MHTML circular locked offline sandbox in text browser', badge: 'LINKS' },
  { command: 'links file:///root/welcome.txt', category: 'System', description: 'View welcome manifesto in links browser', badge: 'LINKS' },
  { command: 'ambient on', category: 'AI & Voice', description: 'Enable dynamic Web Audio ambient soundscape synthesis tuned to sentiment', badge: 'AUDIO' },
  { command: 'ambient off', category: 'AI & Voice', description: 'Mute dynamic ambient soundscape generator', badge: 'AUDIO' },
  { command: 'ambient volume 0.5', category: 'AI & Voice', description: 'Adjust dynamic ambient soundscape volume (0.0 - 1.0)', badge: 'AUDIO' },
  { command: 'harmonic 432', category: 'AI & Voice', description: 'Set Harmonic Resonator to 432 Hz (Foundational Equilibrium)', badge: 'RESON' },
  { command: 'harmonic 528', category: 'AI & Voice', description: 'Set Harmonic Resonator to 528 Hz (Transformation / Ingestion State)', badge: 'RESON' },
  { command: 'harmonic 963', category: 'AI & Voice', description: 'Set Harmonic Resonator to 963 Hz (Transcendent Consensus)', badge: 'RESON' },
  { command: 'harmonic all', category: 'AI & Voice', description: 'Harmonize all 3 Solfeggio resonant frequencies simultaneously', badge: 'RESON' },
  { command: 'chronos beat', category: 'System', description: 'Compute Chronos heartbeat pseudoHash(ISO+beat) with prime 137451921129154222', badge: 'CHRONOS' },
  { command: 'chronos verify', category: 'System', description: 'Mathematically verify state continuity and dwell deltas offline', badge: 'CHRONOS' },
  { command: 'sentinel status', category: 'System', description: 'Check Sentinel dotfiles hash against Golden Genesis Ledger', badge: 'SENTINEL' },
  { command: 'sentinel verify', category: 'System', description: 'Run Sentinel Cron Verifier and test QuinRestore auto-healing', badge: 'SENTINEL' },
  { command: 'sentinel restore', category: 'System', description: 'Execute QuinRestore to overwrite binary corruption from Genesis ledger', badge: 'SENTINEL' },
  { command: 'ouroboros status', category: 'System', description: 'Inspect infinite self-feeding execution loop and fuel hash', badge: 'OURO' },
  { command: 'ouroboros run', category: 'System', description: 'Cycle Ouroboros output-to-input loop for zero-human perpetual uptime', badge: 'OURO' },
  { command: 'mhtml list', category: 'System', description: 'List offline MHTML circular locked documents (0 tokens consumed)', badge: 'MHTML' },
  { command: 'mhtml capture https://nexus.internal/app', category: 'System', description: 'Capture web applet into RFC 822 MHTML offline circular lock', badge: 'MHTML' },
  { command: 'agent verify', category: 'System', description: 'Verify NexusCommandAgent and SynapseBridge on port 5150', badge: 'AGENT' },
  { command: 'agent mdm', category: 'System', description: 'Audit MDM enrollment and recovery volume integration', badge: 'AGENT' },
  { command: 'spider harvest', category: 'System', description: 'Trigger Harvestertowebomnispiders contextual log merging', badge: 'SPIDER' },
  { command: 'stress 50', category: 'System', description: 'Run Skill Creatorial concurrent fault injection harness (50 iterations)', badge: 'STRESS' },
  { command: 'mount /dev/recovery /mnt/recovery', category: 'System', description: 'Mount recovery volume into operating system hierarchy', badge: 'MOUNT' },
  { command: 'mount', category: 'System', description: 'List all mounted plug-n-play operating system volumes', badge: 'MOUNT' },
  { command: 'engram open', category: 'AI & Voice', description: 'Open Google Drive & gemini.md memory engrams manager', badge: 'ENGRAM' },
  { command: 'engram sync', category: 'AI & Voice', description: 'Synchronize gemini.md architectural memory to Google Drive', badge: 'ENGRAM' },
  { command: 'gdrive status', category: 'System', description: 'Inspect Google Drive HTTPDFS /mnt/httpdfs/gdrive/ mount state', badge: 'GDRIVE' },

  // Quine
  { command: 'quine export', category: 'Quine', description: 'Export self-replicating standalone offline HTML Quine', badge: 'QUINE' },
];

export const CONTEXT_PARAM_EXPANSIONS: Record<
  string,
  { param: string; desc: string; badge: string; cat: CommandSuggestion['category'] }[]
> = {
  render: [
    { param: 'torus', desc: 'Neuti-ba Kerr Torus Knot with plasma wireframe', badge: '3D', cat: '3D Visuals' },
    { param: 'tesseract', desc: '4D Hypercube wireframe via Givens rotations', badge: '4D', cat: '3D Visuals' },
    { param: 'singularity', desc: 'Gravitational Singularity Core & Accretion Disc', badge: 'CORE', cat: '3D Visuals' },
    { param: 'neural', desc: 'Polymorphic Neural synaptic axon network', badge: 'NEURAL', cat: '3D Visuals' },
    { param: 'galaxy', desc: '7-Galaxy relativistic orbital frame-dragging', badge: 'SPACE', cat: '3D Visuals' },
    { param: 'spindle', desc: 'Actuating quantum spindle with 33.3ms pulse', badge: 'PULSE', cat: '3D Visuals' },
    { param: 'dna', desc: 'Algorithmic double-helix rotating strands', badge: 'BIO', cat: '3D Visuals' },
  ],
  sentiment: [
    { param: 'analytical', desc: 'Cyan & Violet crystal harmonic physics (432Hz)', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'energetic', desc: 'Golden Amber & Magenta high-energy flare (528Hz)', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'alarm', desc: 'Crimson Red warning horizon with high turbulence', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'tranquil', desc: 'Emerald Green harmonic wave stasis', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'cosmic', desc: 'Deep Purple relativistic frame dragging (963Hz)', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'chaos', desc: 'Chromatic RGB jitter and particle dispersion', badge: 'MOOD', cat: '3D Visuals' },
  ],
  voice: [
    { param: 'profile sovereign', desc: 'Sovereign Core (432 Hz, authoritative)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'profile quantum', desc: 'Quantum Echo (528 Hz, harmonic shimmer)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'profile cyber', desc: 'Cyber Pulse (963 Hz, robotic vocoder)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'profile tranquil', desc: 'Tranquil Aura (639 Hz, meditative stasis)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'on', desc: 'Enable spoken AI voice responses', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'off', desc: 'Mute spoken AI voice audio responses', badge: 'VOICE', cat: 'AI & Voice' },
  ],
  ambient: [
    { param: 'on', desc: 'Enable dynamic Web Audio ambient soundscape', badge: 'AUDIO', cat: 'AI & Voice' },
    { param: 'off', desc: 'Mute dynamic ambient soundscape generator', badge: 'AUDIO', cat: 'AI & Voice' },
    { param: 'volume 0.5', desc: 'Set ambient soundscape volume to 50%', badge: 'AUDIO', cat: 'AI & Voice' },
    { param: 'volume 0.8', desc: 'Set ambient soundscape volume to 80%', badge: 'AUDIO', cat: 'AI & Voice' },
  ],
  harmonic: [
    { param: '432', desc: 'Foundational Equilibrium (432 Hz)', badge: 'RESON', cat: 'AI & Voice' },
    { param: '528', desc: 'Transformation State for data ingestion (528 Hz)', badge: 'RESON', cat: 'AI & Voice' },
    { param: '963', desc: 'Transcendent Tone for multi-node consensus (963 Hz)', badge: 'RESON', cat: 'AI & Voice' },
    { param: 'all', desc: 'Triple harmonic consensus resonance', badge: 'RESON', cat: 'AI & Voice' },
  ],
  links: [
    { param: 'file:///root/gemini.md', desc: 'Browse gemini.md architectural engrams in text browser', badge: 'LINKS', cat: 'System' },
    { param: 'mhtml:///quantum_vault.mhtml', desc: 'Browse MHTML circular locked offline sandbox', badge: 'LINKS', cat: 'System' },
    { param: 'file:///root/welcome.txt', desc: 'View system welcome manifesto in text browser', badge: 'LINKS', cat: 'System' },
    { param: 'file:///root/notes.md', desc: 'View architectural specs in text browser', badge: 'LINKS', cat: 'System' },
  ],
  d3: [
    { param: 'shape force', desc: 'Force-directed dynamic node mesh topology', badge: 'D3', cat: 'D3 Stream' },
    { param: 'shape streamgraph', desc: 'Flowing bandwidth streamgraph', badge: 'D3', cat: 'D3 Stream' },
    { param: 'shape radar', desc: 'Orbital radial telemetry sweep matrix', badge: 'D3', cat: 'D3 Stream' },
    { param: 'shape chord', desc: 'Satellite constellation chord transfer ring', badge: 'D3', cat: 'D3 Stream' },
    { param: 'stream', desc: 'Toggle real-time D3 background stream', badge: 'D3', cat: 'D3 Stream' },
    { param: 'panel', desc: 'Toggle D3 telemetry HUD control panel', badge: 'D3', cat: 'D3 Stream' },
    { param: 'burst', desc: 'Trigger high-velocity packet supernova', badge: 'D3', cat: 'D3 Stream' },
  ],
  chronos: [
    { param: 'beat', desc: 'Generate Chronos heartbeat proof with prime anchor', badge: 'CHRONOS', cat: 'System' },
    { param: 'verify', desc: 'Verify state continuity and dwell deltas offline', badge: 'CHRONOS', cat: 'System' },
    { param: 'pseudohash', desc: 'Compute pseudoHash(ISO+beat) verification', badge: 'CHRONOS', cat: 'System' },
  ],
  sentinel: [
    { param: 'status', desc: 'Check dotfiles hash against Genesis ledger', badge: 'SENTINEL', cat: 'System' },
    { param: 'verify', desc: 'Run Sentinel Cron Verifier and test QuinRestore', badge: 'SENTINEL', cat: 'System' },
    { param: 'restore', desc: 'Auto-restore binary mismatches via QuinRestore', badge: 'SENTINEL', cat: 'System' },
  ],
  ouroboros: [
    { param: 'status', desc: 'Inspect infinite self-feeding execution loop', badge: 'OURO', cat: 'System' },
    { param: 'run', desc: 'Cycle Ouroboros output-to-input loop for zero-human uptime', badge: 'OURO', cat: 'System' },
  ],
  mhtml: [
    { param: 'list', desc: 'List captured offline MHTML circular locked docs', badge: 'MHTML', cat: 'System' },
    { param: 'capture https://nexus.internal/app', desc: 'Capture web applet into RFC 822 sandbox', badge: 'MHTML', cat: 'System' },
    { param: 'view quantum_vault.mhtml', desc: 'Render MHTML circular locked doc in text browser', badge: 'MHTML', cat: 'System' },
  ],
  agent: [
    { param: 'verify', desc: 'Verify NexusCommandAgent & SynapseBridge on port 5150', badge: 'AGENT', cat: 'System' },
    { param: 'mdm', desc: 'Inspect MDM enrollment status (Unlinked / Zero Governor)', badge: 'AGENT', cat: 'System' },
    { param: 'install', desc: 'Simulate recovery volume agent installation', badge: 'AGENT', cat: 'System' },
  ],
  mount: [
    { param: '/dev/recovery /mnt/recovery', desc: 'Mount recovery environment volume', badge: 'MOUNT', cat: 'System' },
    { param: '/dev/httpdfs /mnt/httpdfs', desc: 'Mount native HTTPDFS file system', badge: 'MOUNT', cat: 'System' },
    { param: '/dev/nexus_drive /mnt/nexus_drive', desc: 'Mount cloud-mirrored Nexus drive', badge: 'MOUNT', cat: 'System' },
  ],
  engram: [
    { param: 'open', desc: 'Open Google Drive & gemini.md memory engrams hub', badge: 'ENGRAM', cat: 'AI & Voice' },
    { param: 'sync', desc: 'Synchronize memory engrams to Google Drive', badge: 'ENGRAM', cat: 'AI & Voice' },
  ],
  theme: [
    { param: 'cyber', desc: 'Apply Cyberpunk Neon aesthetic', badge: 'THEME', cat: '3D Visuals' },
    { param: 'matrix', desc: 'Apply Emerald Green Matrix aesthetic', badge: 'THEME', cat: '3D Visuals' },
    { param: 'aura', desc: 'Apply Cosmic Violet Aura aesthetic', badge: 'THEME', cat: '3D Visuals' },
  ],
  dock: [
    { param: 'bottom', desc: 'Pin terminal to bottom viewport dock', badge: 'LAYOUT', cat: 'System' },
    { param: 'float', desc: 'Switch terminal into floating draggable window', badge: 'LAYOUT', cat: 'System' },
    { param: 'fullscreen', desc: 'Expand terminal across full screen', badge: 'LAYOUT', cat: 'System' },
  ],
};

/**
 * Filter and rank command suggestions based on user input and context state.
 * Priority order:
 * 1. Context parameter expansion (e.g. typing "render " lists all valid topologies)
 * 2. Exact prefix match at beginning of command (highest score)
 * 3. Prefix match on word boundary
 * 4. Substring match
 */
export function getCommandSuggestions(
  query: string,
  limit: number = 6,
  additionalFiles: string[] = []
): CommandSuggestion[] {
  if (!query) return [];

  const rawLower = query.toLowerCase();
  const tokens = query.trim().split(/\s+/);
  const primaryCmd = tokens[0]?.toLowerCase() || '';
  const hasTrailingSpace = query.endsWith(' ');
  const paramFilter = tokens.length > 1 ? tokens.slice(1).join(' ').toLowerCase() : '';

  const candidates: CommandSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Check Context Parameter Expansions (e.g., render <topology>, sentiment <mood>)
  if (CONTEXT_PARAM_EXPANSIONS[primaryCmd]) {
    const expansions = CONTEXT_PARAM_EXPANSIONS[primaryCmd];
    for (const exp of expansions) {
      const fullCmd = `${primaryCmd} ${exp.param}`;
      if (hasTrailingSpace || exp.param.toLowerCase().startsWith(paramFilter) || fullCmd.toLowerCase().startsWith(rawLower.trim())) {
        if (!seen.has(fullCmd.toLowerCase())) {
          seen.add(fullCmd.toLowerCase());
          candidates.push({
            command: fullCmd,
            category: exp.cat,
            description: exp.desc,
            badge: exp.badge,
            score: exp.param.toLowerCase().startsWith(paramFilter) ? 220 : 180,
          });
        }
      }
    }
  }

  // 2. Dynamic File completions for commands taking file paths (cat, edit, rm, cd, node)
  const fileCmds = ['cat', 'edit', 'nano', 'vim', 'rm', 'cd', 'node'];
  if (fileCmds.includes(primaryCmd)) {
    additionalFiles.forEach((file) => {
      const isDir = file.endsWith('/');
      const cleanFile = file.replace(/\/$/, '');
      const fullCmd = `${primaryCmd} ${cleanFile}`;
      if (hasTrailingSpace || cleanFile.toLowerCase().startsWith(paramFilter)) {
        if (!seen.has(fullCmd.toLowerCase())) {
          seen.add(fullCmd.toLowerCase());
          candidates.push({
            command: fullCmd,
            category: 'VFS',
            description: isDir ? `Target directory ${file}` : `Target file ${file}`,
            badge: isDir ? 'DIR' : 'FILE',
            score: cleanFile.toLowerCase().startsWith(paramFilter) ? 240 : 190,
          });
        }
      }
    });
  }

  // 3. Fallback to Command Registry
  const clean = query.trim().toLowerCase();
  for (const item of COMMAND_REGISTRY) {
    const cmdLower = item.command.toLowerCase();
    if (seen.has(cmdLower)) continue;

    let score = 0;
    if (cmdLower === clean) {
      score = 200;
    } else if (cmdLower.startsWith(clean)) {
      score = 150 - (cmdLower.length - clean.length);
    } else {
      const words = cmdLower.split(/\s+/);
      const wordMatch = words.some((w) => w.startsWith(clean));
      if (wordMatch) {
        score = 100 - cmdLower.indexOf(clean);
      } else if (cmdLower.includes(clean)) {
        score = 60 - cmdLower.indexOf(clean);
      }
    }

    if (score > 0) {
      seen.add(cmdLower);
      candidates.push({
        ...item,
        score,
      });
    }
  }

  // Sort descending by score, then ascending by command length
  candidates.sort((a, b) => b.score - a.score || a.command.length - b.command.length);

  return candidates.slice(0, limit);
}

