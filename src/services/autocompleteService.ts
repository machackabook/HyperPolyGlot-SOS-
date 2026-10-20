/**
 * Autocomplete Service for HyperTerminal Polyglot Quine OS
 * Computes intelligent command suggestions, dynamic expansions, and VFS file completions
 * based on the current EnvironmentState (topology, sentiment, RGB-LED, ambient audio, mic)
 * and mounted device paths (/mnt/nexus_drive, /mnt/recovery, etc.).
 */

import { EnvironmentState } from '../types';

export interface CommandSuggestion {
  command: string;
  category: 'System' | 'VFS' | '3D Visuals' | 'AI & Voice' | 'Satcom' | 'Swarm' | 'Fintech' | 'Quine' | 'Custom' | 'D3 Stream' | 'Network' | 'Mount' | 'Environment' | 'Audio';
  description: string;
  badge: string;
  badgeColor?: string;
  score: number;
  isEnvironmentAdaptive?: boolean;
  isMountedPath?: boolean;
  statusHint?: string;
}

export interface AutocompleteContext {
  envState?: EnvironmentState;
  mountedDevices?: string[];
  vfsFiles?: string[];
  cwd?: string;
  isMicListening?: boolean;
}

export const TOPOLOGY_LABELS: Record<string, string> = {
  torus: 'Neuti-ba Kerr Torus Knot with plasma wireframe',
  tesseract: '4D Hypercube wireframe via Givens rotations',
  singularity: 'Gravitational Singularity Core & Accretion Disc',
  neural: 'Polymorphic Neural synaptic axon network',
  galaxy: '7-Galaxy relativistic orbital frame-dragging',
  spindle: 'Actuating quantum spindle turning with 33.3ms pulse',
  dna: 'Algorithmic double-helix rotating strands',
  galaxy_vfs: 'Filesystem Galaxy with interactive node traversal (WASD)',
  earth_nasa: 'Photorealistic 3D Earth space-to-surface descent (Google Maps)',
};

export const SENTIMENT_LABELS: Record<string, string> = {
  analytical: 'Cyan & Violet balanced crystal physics (432Hz)',
  energetic: 'Golden Amber & Magenta high-energy flare (528Hz)',
  alarm: 'Crimson Red warning horizon with high turbulence',
  tranquil: 'Emerald Green harmonic wave stasis',
  cosmic: 'Deep Purple relativistic frame dragging (963Hz)',
  chaos: 'Chromatic RGB jitter and particle dispersion',
  creative: 'Warm Purple & Magenta aesthetic physics with long particle trails',
};

export const COLOR_PROFILE_LABELS: Record<string, string> = {
  ACEScg: 'Academy Color Encoding System AP1 Primaries',
  'DCI-P3': 'SMPTE DCI-P3 Theatrical Cinema Standard',
  'Rec.2020': 'ITU-R BT.2020 Laser Ultra HD HDR Gamut',
  'QD-OLED': 'Quantum Dot Direct RGB Micro-Spectral Emission',
  'Arri-Filmic': 'ARRI LogC4 Wide Gamut 4 Filmic Roll-off',
  'Cyber-Neon': 'Cyber-Neon Tokyo Lux High-Contrast Laser',
  'Aurora-HSL': 'Aurora Borealis Geomagnetic Plasma Ionization',
  Bioluminescence: 'Bathypelagic Abyssal Photophore Emission',
};

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
  { command: 'render galaxy_vfs', category: '3D Visuals', description: 'Project Filesystem Galaxy with interactive node traversal (WASD/Arrows)', badge: 'GALAXY' },
  { command: 'render earth_nasa', category: '3D Visuals', description: 'Project Photorealistic 3D Earth with space-to-surface descent animation', badge: 'MAPS' },
  { command: 'sentiment analytical', category: '3D Visuals', description: 'Set sentiment to Cyan & Violet balanced crystal physics', badge: 'MOOD' },
  { command: 'sentiment energetic', category: '3D Visuals', description: 'Set sentiment to Golden Amber & Magenta high-energy flare', badge: 'MOOD' },
  { command: 'sentiment alarm', category: '3D Visuals', description: 'Set sentiment to Crimson Red warning horizon with high turbulence', badge: 'MOOD' },
  { command: 'sentiment tranquil', category: '3D Visuals', description: 'Set sentiment to Emerald Green harmonic wave advection', badge: 'MOOD' },
  { command: 'sentiment cosmic', category: '3D Visuals', description: 'Set sentiment to Deep Purple relativistic frame dragging', badge: 'MOOD' },
  { command: 'sentiment chaos', category: '3D Visuals', description: 'Set sentiment to Chromatic RGB jitter and particle dispersion', badge: 'MOOD' },
  { command: 'sentiment creative', category: '3D Visuals', description: 'Set sentiment to Warm Purple & Magenta aesthetic physics with long particle trails', badge: 'MOOD' },
  { command: 'color #00f2ff #a855f7', category: '3D Visuals', description: 'Set custom primary and secondary glowing hex colors', badge: 'COLOR' },
  { command: 'gravity 1.5', category: '3D Visuals', description: 'Adjust 4D gravitational tensor curvature (0.1 - 4.0)', badge: 'PHYS' },
  { command: 'speed 1.2', category: '3D Visuals', description: 'Adjust 3D rotation and wave advection speed multiplier', badge: 'PHYS' },
  { command: 'turbulence 0.8', category: '3D Visuals', description: 'Adjust particle noise dispersion and wave distortion', badge: 'PHYS' },
  { command: 'bloom 1.5', category: '3D Visuals', description: 'Adjust global glow bloom intensity and light scaling', badge: 'PHYS' },
  { command: 'burst', category: '3D Visuals', description: 'Trigger energetic particle supernova wave shockwave', badge: 'FX' },
  { command: 'calm', category: '3D Visuals', description: 'Stabilize background visual into low-frequency harmonic stasis', badge: 'FX' },
  { command: 'shatter', category: '3D Visuals', description: 'Inject catastrophic high-frequency resonance distortion', badge: 'FX' },

  // RGB-LED HSL Engine & Profiles
  { command: 'rgbled on', category: '3D Visuals', description: 'Enable dynamic RGB-LED HSL% Hue Gradient Engine', badge: 'RGB-LED' },
  { command: 'rgbled off', category: '3D Visuals', description: 'Disable RGB-LED engine (revert to static environment colors)', badge: 'RGB-LED' },
  { command: 'rgbled status', category: '3D Visuals', description: 'Display live RGB-LED telemetry, HSL%, active profile and gamut anchors', badge: 'RGB-LED' },
  { command: 'rgbled hue 50%', category: '3D Visuals', description: 'Set HSL hue percentage (0% - 100% or 0° - 360°)', badge: 'RGB-LED' },
  { command: 'rgbled mode cycle', category: '3D Visuals', description: 'Set modulation mode to smooth continuous 360° color wheel cycle', badge: 'RGB-LED' },
  { command: 'rgbled mode pulse', category: '3D Visuals', description: 'Set modulation mode to breathing sinusoidal HSL hue oscillation', badge: 'RGB-LED' },
  { command: 'rgbled mode audio', category: '3D Visuals', description: 'Set modulation mode to audio-reactive chromatic flare', badge: 'RGB-LED' },
  { command: 'rgbled menu', category: '3D Visuals', description: 'Open high-end color profile matrix GUI', badge: 'RGB-LED' },
  { command: 'profile ACEScg', category: '3D Visuals', description: 'Switch to Academy Color Encoding System AP1 Wide Gamut standard', badge: 'COLOR' },
  { command: 'profile DCI-P3', category: '3D Visuals', description: 'Switch to SMPTE DCI-P3 Theatrical Cinema wide color gamut', badge: 'COLOR' },
  { command: 'profile Rec.2020', category: '3D Visuals', description: 'Switch to ITU-R BT.2020 Ultra HD HDR pure laser gamut', badge: 'COLOR' },
  { command: 'profile QD-OLED', category: '3D Visuals', description: 'Switch to Quantum Dot Direct RGB micro-spectral emission profile', badge: 'COLOR' },
  { command: 'profile Arri-Filmic', category: '3D Visuals', description: 'Switch to ARRI LogC4 Wide Gamut 4 Filmic Roll-off standard', badge: 'COLOR' },
  { command: 'profile Cyber-Neon', category: '3D Visuals', description: 'Switch to Cyber-Neon Tokyo Lux hyper-saturated laser spectrum', badge: 'COLOR' },
  { command: 'profile Aurora-HSL', category: '3D Visuals', description: 'Switch to Aurora Borealis geomagnetic plasma atmospheric shimmer', badge: 'COLOR' },
  { command: 'profile Bioluminescence', category: '3D Visuals', description: 'Switch to Bathypelagic abyssal photophore emission gamut', badge: 'COLOR' },

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
  { command: 'voicelog', category: 'AI & Voice', description: 'Review persistent archive of all Gemini-generated voice responses', badge: 'LOG' },
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
  { command: 'macro run nexus_boot', category: 'System', description: 'Execute recorded command macro script', badge: 'MACRO' },
  { command: 'macro alias zen "calm; 963 on"', category: 'System', description: 'Create persistent alias for command chain', badge: 'ALIAS' },
  { command: 'macro list', category: 'System', description: 'List all recorded scripts and active aliases', badge: 'SYS' },
  { command: 'voip status', category: 'System', description: 'Check virtual mobile VoIP & eSIM chassis telemetry', badge: 'VOIP' },

  // MCP & Macros
  { command: 'mcp list', category: 'System', description: 'List active in-process Model Context Protocol servers', badge: 'MCP' },
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

  { command: 'geosync on', category: 'System', description: 'Synchronize terminal with physical geolocation & trigger Earth descent', badge: 'GEO' },
  { command: 'geosync off', category: 'System', description: 'Detach geolocation sync and return to orbital space void', badge: 'GEO' },

  // Quine
  { command: 'quine export', category: 'Quine', description: 'Export self-replicating standalone offline HTML Quine', badge: 'QUINE' },

  // YouTube Neural Music & Dynamic Playlists (Google Auth Linked)
  { command: 'youtube play synthwave', category: 'Audio', description: 'Stream Synthwave retro beats & transition to background video', badge: 'YOUTUBE' },
  { command: 'youtube play lofi', category: 'Audio', description: 'Stream Lofi Girl beats to study & relax in background canvas', badge: 'YOUTUBE' },
  { command: 'youtube play cyberpunk', category: 'Audio', description: 'Stream Blade Runner 2049 night city ambient synthwave', badge: 'YOUTUBE' },
  { command: 'youtube play space', category: 'Audio', description: 'Stream deep cosmos orbital ambient soundscapes', badge: 'YOUTUBE' },
  { command: 'youtube play solfeggio', category: 'Audio', description: 'Stream 432Hz & 963Hz miracle harmonic resonance frequencies', badge: 'YOUTUBE' },
  { command: 'youtube play classical', category: 'Audio', description: 'Stream acoustic classical piano & strings suite', badge: 'YOUTUBE' },
  { command: 'youtube playlist synthwave', category: 'Audio', description: 'Select dynamic Synthwave video playlist for background visualizer', badge: 'PLAYLIST' },
  { command: 'youtube playlist lofi', category: 'Audio', description: 'Select dynamic Lofi video playlist for background visualizer', badge: 'PLAYLIST' },
  { command: 'youtube playlist space', category: 'Audio', description: 'Select dynamic Deep Space video playlist for background visualizer', badge: 'PLAYLIST' },
  { command: 'youtube playlist solfeggio', category: 'Audio', description: 'Select dynamic 432Hz/963Hz Solfeggio video playlist', badge: 'PLAYLIST' },
  { command: 'youtube playlist classical', category: 'Audio', description: 'Select dynamic Classical Masterworks video playlist', badge: 'PLAYLIST' },
  { command: 'youtube playlists', category: 'Audio', description: 'List all dynamic curated & custom YouTube video playlists', badge: 'PLAYLIST' },
  { command: 'youtube modal', category: 'Audio', description: 'Open YouTube Music Hub (Dynamic stream selection & playlist creator)', badge: 'YOUTUBE' },
  { command: 'youtube bg', category: 'Audio', description: 'Transition video player to 100% full background rendering canvas', badge: 'BG-VID' },
  { command: 'youtube pip', category: 'Audio', description: 'Transition video player to floating picture-in-picture window', badge: 'PIP' },
  { command: 'youtube blend', category: 'Audio', description: 'Toggle 3D visualizer canvas blending over background video', badge: 'BLEND' },
  { command: 'youtube auth', category: 'Audio', description: 'Inspect Google Auth profile and system customization preferences', badge: 'GOOGLE' },
  { command: 'youtube login', category: 'Audio', description: 'Sign in natively with Google Account for system customizations', badge: 'GOOGLE' },
  { command: 'music play synthwave', category: 'Audio', description: 'Stream synthwave music in background video mode', badge: 'MUSIC' },
  { command: 'music modal', category: 'Audio', description: 'Open YouTube music and playlist control center', badge: 'MUSIC' },
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
    { param: 'galaxy_vfs', desc: 'Interactive filesystem galaxy', badge: 'VFS', cat: '3D Visuals' },
    { param: 'earth_nasa', desc: 'Photorealistic 3D Earth (Google Maps)', badge: 'MAPS', cat: '3D Visuals' },
  ],
  sentiment: [
    { param: 'analytical', desc: 'Cyan & Violet crystal harmonic physics (432Hz)', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'energetic', desc: 'Golden Amber & Magenta high-energy flare (528Hz)', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'alarm', desc: 'Crimson Red warning horizon with high turbulence', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'tranquil', desc: 'Emerald Green harmonic wave stasis', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'cosmic', desc: 'Deep Purple relativistic frame dragging (963Hz)', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'chaos', desc: 'Chromatic RGB jitter and particle dispersion', badge: 'MOOD', cat: '3D Visuals' },
    { param: 'creative', desc: 'Warm Purple & Magenta aesthetic physics', badge: 'MOOD', cat: '3D Visuals' },
  ],
  voice: [
    { param: 'profile sovereign', desc: 'Sovereign Core (432 Hz, authoritative)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'profile quantum', desc: 'Quantum Echo (528 Hz, harmonic shimmer)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'profile cyber', desc: 'Cyber Pulse (963 Hz, robotic vocoder)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'profile tranquil', desc: 'Tranquil Aura (639 Hz, meditative stasis)', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'test', desc: 'Test real-time AI voice response & visual waveform pulse in 3D void', badge: 'TEST', cat: 'AI & Voice' },
    { param: 'speak "Hello sovereign operator"', desc: 'Vocalize text with real-time waveform oscillation', badge: 'SPEAK', cat: 'AI & Voice' },
    { param: 'on', desc: 'Enable spoken AI voice responses', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'off', desc: 'Mute spoken AI voice audio responses', badge: 'VOICE', cat: 'AI & Voice' },
    { param: 'stop', desc: 'Interrupt and stop active AI speech output', badge: 'MUTE', cat: 'AI & Voice' },
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
  dock: [
    { param: 'center', desc: 'Center terminal workstation with expanded visibility', badge: 'CENTER', cat: 'System' },
    { param: 'bottom', desc: 'Pin terminal to bottom viewport dock', badge: 'LAYOUT', cat: 'System' },
    { param: 'float', desc: 'Switch terminal into floating draggable window', badge: 'LAYOUT', cat: 'System' },
    { param: 'fullscreen', desc: 'Expand terminal across full screen', badge: 'LAYOUT', cat: 'System' },
    { param: 'clear', desc: 'Toggle ultra-transparent clear glass mode', badge: 'GLASS', cat: 'System' },
  ],
  youtube: [
    { param: 'play synthwave', desc: 'Stream live synthwave chill retro beats', badge: 'PLAY', cat: 'Audio' },
    { param: 'play lofi', desc: 'Stream Lofi Girl chill beats', badge: 'PLAY', cat: 'Audio' },
    { param: 'play cyberpunk', desc: 'Stream Blade Runner 2049 night city ambient', badge: 'PLAY', cat: 'Audio' },
    { param: 'play space', desc: 'Stream deep cosmos orbital ambient', badge: 'PLAY', cat: 'Audio' },
    { param: 'play solfeggio', desc: 'Stream 432Hz & 963Hz miracle frequencies', badge: 'PLAY', cat: 'Audio' },
    { param: 'play classical', desc: 'Stream Bach & Chopin classical focus', badge: 'PLAY', cat: 'Audio' },
    { param: 'playlist synthwave', desc: 'Stream dynamic Synthwave video playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlist lofi', desc: 'Stream dynamic Lo-Fi video playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlist space', desc: 'Stream dynamic Deep Space video playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlist solfeggio', desc: 'Stream dynamic Solfeggio frequency playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlist classical', desc: 'Stream dynamic Classical Masterworks playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlists', desc: 'List all dynamic curated and custom playlists', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'bg', desc: 'Transition video to 100% full background canvas', badge: 'BG-VID', cat: 'Audio' },
    { param: 'pip', desc: 'Transition video to floating picture-in-picture', badge: 'PIP', cat: 'Audio' },
    { param: 'blend', desc: 'Toggle 3D visualizer canvas blending over video', badge: 'BLEND', cat: 'Audio' },
    { param: 'pause', desc: 'Pause current YouTube video/audio stream', badge: 'PAUSE', cat: 'Audio' },
    { param: 'resume', desc: 'Resume current YouTube stream', badge: 'RESUME', cat: 'Audio' },
    { param: 'next', desc: 'Skip to next track in active playlist', badge: 'NEXT', cat: 'Audio' },
    { param: 'prev', desc: 'Return to previous track in active playlist', badge: 'PREV', cat: 'Audio' },
    { param: 'modal', desc: 'Open YouTube Music & Playlist Hub overlay', badge: 'HUB', cat: 'Audio' },
    { param: 'auth', desc: 'Inspect Google Auth profile and system customizations', badge: 'GOOGLE', cat: 'Audio' },
    { param: 'login', desc: 'Sign in with Google Account natively', badge: 'GOOGLE', cat: 'Audio' },
    { param: 'opacity 0.85', desc: 'Set background video opacity (0.1 - 1.0)', badge: 'OPACITY', cat: 'Audio' },
    { param: 'volume 75', desc: 'Set YouTube audio volume level (0 - 100)', badge: 'VOL', cat: 'Audio' },
  ],
  yt: [
    { param: 'play synthwave', desc: 'Stream live synthwave chill retro beats', badge: 'PLAY', cat: 'Audio' },
    { param: 'play lofi', desc: 'Stream Lofi Girl chill beats', badge: 'PLAY', cat: 'Audio' },
    { param: 'playlist synthwave', desc: 'Stream dynamic Synthwave video playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlist lofi', desc: 'Stream dynamic Lo-Fi video playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'bg', desc: 'Transition video to full background canvas', badge: 'BG-VID', cat: 'Audio' },
    { param: 'pip', desc: 'Transition video to floating PiP', badge: 'PIP', cat: 'Audio' },
    { param: 'modal', desc: 'Open YouTube Music Hub', badge: 'HUB', cat: 'Audio' },
    { param: 'auth', desc: 'View Google Auth status & customizations', badge: 'GOOGLE', cat: 'Audio' },
  ],
  music: [
    { param: 'play synthwave', desc: 'Stream live synthwave chill retro beats', badge: 'PLAY', cat: 'Audio' },
    { param: 'play lofi', desc: 'Stream Lofi Girl chill beats', badge: 'PLAY', cat: 'Audio' },
    { param: 'play space', desc: 'Stream deep cosmos orbital ambient', badge: 'PLAY', cat: 'Audio' },
    { param: 'playlist synthwave', desc: 'Stream dynamic Synthwave playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlist lofi', desc: 'Stream dynamic Lo-Fi playlist', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'playlists', desc: 'List all dynamic video playlists', badge: 'PLAYLIST', cat: 'Audio' },
    { param: 'modal', desc: 'Open YouTube Music Hub', badge: 'HUB', cat: 'Audio' },
    { param: 'bg', desc: 'Transition video to full background canvas', badge: 'BG-VID', cat: 'Audio' },
    { param: 'pip', desc: 'Transition video to floating PiP', badge: 'PIP', cat: 'Audio' },
    { param: 'auth', desc: 'View Google Auth status & customizations', badge: 'GOOGLE', cat: 'Audio' },
  ],
  rgbled: [
    { param: 'on', desc: 'Enable dynamic RGB-LED HSL% Hue Gradient Engine', badge: 'RGB-LED', cat: '3D Visuals' },
    { param: 'off', desc: 'Disable RGB-LED engine (revert to static colors)', badge: 'RGB-LED', cat: '3D Visuals' },
    { param: 'status', desc: 'Display live telemetry, HSL%, and color profile', badge: 'RGB-LED', cat: '3D Visuals' },
    { param: 'hue 50%', desc: 'Set HSL hue percentage (0-100% or 0-360 deg)', badge: 'RGB-LED', cat: '3D Visuals' },
    { param: 'profile ACEScg', desc: 'Switch to ACEScg AP1 wide gamut profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'profile DCI-P3', desc: 'Switch to DCI-P3 theatrical cinema profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'profile Rec.2020', desc: 'Switch to Rec.2020 laser HDR profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'profile QD-OLED', desc: 'Switch to Quantum Dot direct emission profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'profile Arri-Filmic', desc: 'Switch to ARRI LogC4 filmic roll-off profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'profile Cyber-Neon', desc: 'Switch to Cyber-Neon Tokyo Lux profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'profile Aurora-HSL', desc: 'Switch to Aurora Borealis plasma profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'profile Bioluminescence', desc: 'Switch to Bioluminescent abyssal profile', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'mode cycle', desc: 'Smooth continuous 360° color wheel wave', badge: 'MODE', cat: '3D Visuals' },
    { param: 'mode pulse', desc: 'Breathing sinusoidal HSL hue oscillation', badge: 'MODE', cat: '3D Visuals' },
    { param: 'mode audio', desc: 'Real-time audio & microphone reactive flare', badge: 'MODE', cat: '3D Visuals' },
    { param: 'speed 1.5', desc: 'Set RGB-LED wave velocity multiplier', badge: 'PHYS', cat: '3D Visuals' },
    { param: 'menu', desc: 'Open High-End Color Profile Matrix GUI', badge: 'GUI', cat: '3D Visuals' },
  ],
  profile: [
    { param: 'ACEScg', desc: 'Academy Color Encoding System AP1 Primaries', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'DCI-P3', desc: 'SMPTE DCI-P3 Theatrical Cinema Standard', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'Rec.2020', desc: 'ITU-R BT.2020 Laser Ultra HD HDR Gamut', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'QD-OLED', desc: 'Quantum Dot Direct RGB Micro-Spectral Emission', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'Arri-Filmic', desc: 'ARRI LogC4 Wide Gamut 4 Filmic Roll-off', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'Cyber-Neon', desc: 'Cyber-Neon Tokyo Lux High-Contrast Laser', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'Aurora-HSL', desc: 'Aurora Borealis Geomagnetic Plasma Ionization', badge: 'COLOR', cat: '3D Visuals' },
    { param: 'Bioluminescence', desc: 'Bathypelagic Abyssal Photophore Emission', badge: 'COLOR', cat: '3D Visuals' },
  ],
};

/**
 * Build dynamic, state-aware suggestions generated on-the-fly from the current
 * EnvironmentState and mounted device paths.
 */
function buildStateAdaptiveSuggestions(context?: AutocompleteContext): CommandSuggestion[] {
  const list: CommandSuggestion[] = [];
  const env = context?.envState;
  const mounts = context?.mountedDevices || env?.mountedDevices || ['/mnt/nexus_drive', '/mnt/recovery', '/mnt/httpdfs'];

  // 1. Suggestions for all Mounted Device Paths
  mounts.forEach((mnt) => {
    const clean = mnt.replace(/\/$/, '');
    list.push({
      command: `cd ${clean}`,
      category: 'Mount',
      description: `Navigate to mounted volume ${clean} (plug-n-play)`,
      badge: 'MOUNT',
      badgeColor: '#10b981',
      score: 240,
      isMountedPath: true,
      statusHint: 'Mounted Volume',
    });
    list.push({
      command: `ls ${clean}`,
      category: 'Mount',
      description: `Inspect files inside mounted volume ${clean}`,
      badge: 'MOUNT',
      badgeColor: '#10b981',
      score: 220,
      isMountedPath: true,
      statusHint: 'Mounted Volume',
    });
    list.push({
      command: `umount ${clean}`,
      category: 'Mount',
      description: `Safely unmount volume ${clean}`,
      badge: 'UMOUNT',
      badgeColor: '#f43f5e',
      score: 200,
      isMountedPath: true,
      statusHint: 'Active Mount',
    });
  });

  // Potential plug-n-play device targets to mount
  const knownDevices = [
    { dev: '/dev/recovery', mnt: '/mnt/recovery', label: 'Disaster Recovery partition' },
    { dev: '/dev/httpdfs', mnt: '/mnt/httpdfs', label: 'HTTP distributed file system' },
    { dev: '/dev/nexus_drive', mnt: '/mnt/nexus_drive', label: 'Aurora Nexus Git mirror drive' },
    { dev: '/dev/quantum_vault', mnt: '/mnt/quantum_vault', label: 'Offline MHTML circular safe' },
    { dev: '/dev/satcom', mnt: '/mnt/satlink', label: 'ATSC 3.0 satellite carrier link' },
  ];
  knownDevices.forEach(({ dev, mnt, label }) => {
    const isMounted = mounts.some((m) => m === mnt || m.includes(mnt));
    if (!isMounted) {
      list.push({
        command: `mount ${dev} ${mnt}`,
        category: 'Mount',
        description: `Mount ${label} onto ${mnt}`,
        badge: 'PLUG',
        badgeColor: '#06b6d4',
        score: 215,
        statusHint: 'Available Device',
      });
    }
  });

  if (!env) {
    return list;
  }

  // 2. 3D Topology Suggestions adapted to current topology
  const currentTop = env.topology;
  Object.entries(TOPOLOGY_LABELS).forEach(([topKey, label]) => {
    const isActive = topKey === currentTop;
    list.push({
      command: `render ${topKey}`,
      category: '3D Visuals',
      description: isActive ? `${label} [Current Active 3D Topology]` : `Switch 3D background to ${label}`,
      badge: isActive ? 'ACTIVE' : '3D',
      badgeColor: isActive ? '#10b981' : '#06b6d4',
      score: isActive ? 180 : 225,
      isEnvironmentAdaptive: true,
      statusHint: isActive ? 'Current Topology' : undefined,
    });
  });

  // 3. Sentiment Suggestions adapted to current sentiment
  const currentSent = env.sentiment;
  Object.entries(SENTIMENT_LABELS).forEach(([sentKey, label]) => {
    const isActive = sentKey === currentSent;
    list.push({
      command: `sentiment ${sentKey}`,
      category: '3D Visuals',
      description: isActive ? `${label} [Current Active Sentiment]` : `Shift environment physics & mood to ${label}`,
      badge: isActive ? 'ACTIVE' : 'MOOD',
      badgeColor: isActive ? '#10b981' : '#f59e0b',
      score: isActive ? 175 : 215,
      isEnvironmentAdaptive: true,
      statusHint: isActive ? 'Active Mood' : undefined,
    });
  });

  // 4. Dynamic RGB-LED HSL Engine & High-End Color Profiles
  const rgbEnabled = env.rgbLed?.enabled ?? false;
  const currentProfile = env.rgbLed?.profile || 'ACEScg';
  if (!rgbEnabled) {
    list.push({
      command: 'rgbled on',
      category: '3D Visuals',
      description: 'Engage dynamic RGB-LED HSL% Hue Gradient Engine & wide-gamut lighting',
      badge: 'RGB-LED',
      badgeColor: '#ec4899',
      score: 260,
      isEnvironmentAdaptive: true,
      statusHint: 'LED Engine Muted',
    });
  } else {
    list.push({
      command: 'rgbled off',
      category: '3D Visuals',
      description: 'Disable RGB-LED engine (revert to static environment colors)',
      badge: 'RGB-LED',
      badgeColor: '#94a3b8',
      score: 200,
      isEnvironmentAdaptive: true,
      statusHint: `Active: ${currentProfile}`,
    });
    list.push({
      command: 'rgbled menu',
      category: '3D Visuals',
      description: 'Open High-End Color Profile Matrix GUI (ACEScg, DCI-P3, QD-OLED)',
      badge: 'GUI',
      badgeColor: '#ec4899',
      score: 245,
      isEnvironmentAdaptive: true,
      statusHint: 'Color Matrix',
    });
    list.push({
      command: 'rgbled status',
      category: '3D Visuals',
      description: 'Inspect live RGB-LED telemetry, HSL hue percentage, and AP1 primaries',
      badge: 'RGB-LED',
      badgeColor: '#ec4899',
      score: 220,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'rgbled mode cycle',
      category: '3D Visuals',
      description: 'Switch RGB-LED to continuous 360° color wheel wave cycle',
      badge: 'RGB-LED',
      badgeColor: '#ec4899',
      score: 225,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'rgbled mode audio',
      category: '3D Visuals',
      description: 'Switch RGB-LED to microphone & audio reactive chromatic flare',
      badge: 'RGB-LED',
      badgeColor: '#ec4899',
      score: 220,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'rgbled hue 50%',
      category: '3D Visuals',
      description: 'Set RGB-LED HSL hue percentage (0% - 100% or 0° - 360°)',
      badge: 'RGB-LED',
      badgeColor: '#ec4899',
      score: 215,
      isEnvironmentAdaptive: true,
    });

    Object.entries(COLOR_PROFILE_LABELS).forEach(([profKey, desc]) => {
      const isProfActive = profKey === currentProfile;
      list.push({
        command: `profile ${profKey}`,
        category: '3D Visuals',
        description: isProfActive ? `${desc} [Current Active Profile]` : `Switch wide-gamut profile to ${desc}`,
        badge: isProfActive ? 'ACTIVE' : 'COLOR',
        badgeColor: isProfActive ? '#10b981' : '#ec4899',
        score: isProfActive ? 180 : 230,
        isEnvironmentAdaptive: true,
        statusHint: isProfActive ? 'Active Profile' : undefined,
      });
    });
  }

  // 5. Audio, Ambient & Microphone States
  if (context?.isMicListening) {
    list.push({
      command: 'mic off',
      category: 'AI & Voice',
      description: 'Disable microphone audio input and speech recognition',
      badge: 'MIC',
      badgeColor: '#10b981',
      score: 240,
      isEnvironmentAdaptive: true,
      statusHint: 'Mic Active',
    });
  } else {
    list.push({
      command: 'mic on',
      category: 'AI & Voice',
      description: 'Enable microphone to speak commands & modulate border waveform',
      badge: 'MIC',
      badgeColor: '#06b6d4',
      score: 240,
      isEnvironmentAdaptive: true,
      statusHint: 'Mic Muted',
    });
    list.push({
      command: 'listen',
      category: 'AI & Voice',
      description: 'Toggle microphone voice listening and border waveform',
      badge: 'VOICE',
      badgeColor: '#06b6d4',
      score: 220,
      isEnvironmentAdaptive: true,
    });
  }

  if (env.voiceActive) {
    list.push({
      command: 'voice off',
      category: 'AI & Voice',
      description: 'Mute spoken AI voice audio responses',
      badge: 'VOICE',
      badgeColor: '#94a3b8',
      score: 200,
      isEnvironmentAdaptive: true,
      statusHint: 'Voice ON',
    });
  } else {
    list.push({
      command: 'voice on',
      category: 'AI & Voice',
      description: 'Enable spoken AI voice responses projected into 3D visual',
      badge: 'VOICE',
      badgeColor: '#8b5cf6',
      score: 230,
      isEnvironmentAdaptive: true,
      statusHint: 'Voice Muted',
    });
  }

  if (!env.ambientSoundscape) {
    list.push({
      command: 'ambient on',
      category: 'AI & Voice',
      description: 'Enable dynamic Web Audio ambient soundscape synthesis tuned to sentiment',
      badge: 'AUDIO',
      badgeColor: '#8b5cf6',
      score: 235,
      isEnvironmentAdaptive: true,
      statusHint: 'Ambient OFF',
    });
  } else {
    list.push({
      command: 'ambient off',
      category: 'AI & Voice',
      description: 'Mute dynamic ambient soundscape generator',
      badge: 'AUDIO',
      badgeColor: '#94a3b8',
      score: 200,
      isEnvironmentAdaptive: true,
      statusHint: 'Ambient ON',
    });
    list.push({
      command: 'ambient volume 0.5',
      category: 'AI & Voice',
      description: 'Adjust ambient soundscape volume (0.0 - 1.0)',
      badge: 'AUDIO',
      badgeColor: '#8b5cf6',
      score: 210,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'harmonic 432',
      category: 'AI & Voice',
      description: 'Set Harmonic Resonator to 432 Hz (Foundational Equilibrium)',
      badge: 'RESON',
      badgeColor: '#8b5cf6',
      score: 215,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'harmonic 528',
      category: 'AI & Voice',
      description: 'Set Harmonic Resonator to 528 Hz (Transformation / Ingestion State)',
      badge: 'RESON',
      badgeColor: '#8b5cf6',
      score: 215,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'harmonic 963',
      category: 'AI & Voice',
      description: 'Set Harmonic Resonator to 963 Hz (Transcendent Consensus)',
      badge: 'RESON',
      badgeColor: '#8b5cf6',
      score: 220,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'harmonic all',
      category: 'AI & Voice',
      description: 'Harmonize all 3 Solfeggio resonant frequencies simultaneously',
      badge: 'RESON',
      badgeColor: '#8b5cf6',
      score: 225,
      isEnvironmentAdaptive: true,
    });
  }

  if (env.solfeggio963) {
    list.push({
      command: '963 off',
      category: 'AI & Voice',
      description: 'Stop 963 Hz solfeggio oscillator',
      badge: 'AUDIO',
      badgeColor: '#94a3b8',
      score: 210,
      isEnvironmentAdaptive: true,
      statusHint: '963Hz Active',
    });
  } else {
    list.push({
      command: '963 on',
      category: 'AI & Voice',
      description: 'Engage pure 963 Hz solfeggio harmonic sine wave oscillator',
      badge: 'AUDIO',
      badgeColor: '#8b5cf6',
      score: 210,
      isEnvironmentAdaptive: true,
      statusHint: '963Hz Muted',
    });
  }

  // 6. D3 Data Stream state
  if (!env.d3Stream?.active) {
    list.push({
      command: 'd3 stream',
      category: 'D3 Stream',
      description: 'Toggle real-time D3.js background network data stream',
      badge: 'D3',
      badgeColor: '#06b6d4',
      score: 225,
      isEnvironmentAdaptive: true,
      statusHint: 'D3 Stream Off',
    });
  } else {
    list.push({
      command: 'd3 shape force',
      category: 'D3 Stream',
      description: 'Render D3 Force-Directed dynamic node mesh topology',
      badge: 'D3',
      badgeColor: '#06b6d4',
      score: 220,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'd3 shape streamgraph',
      category: 'D3 Stream',
      description: 'Render D3 Dynamic multi-layer flowing bandwidth streamgraph',
      badge: 'D3',
      badgeColor: '#06b6d4',
      score: 220,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'd3 shape radar',
      category: 'D3 Stream',
      description: 'Render D3 Orbital radial telemetry sweep matrix',
      badge: 'D3',
      badgeColor: '#06b6d4',
      score: 220,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'd3 shape chord',
      category: 'D3 Stream',
      description: 'Render D3 Satellite constellation chord transfer ring',
      badge: 'D3',
      badgeColor: '#06b6d4',
      score: 220,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'd3 panel',
      category: 'D3 Stream',
      description: 'Toggle floating D3 telemetry HUD control panel',
      badge: 'HUD',
      badgeColor: '#06b6d4',
      score: 210,
      isEnvironmentAdaptive: true,
    });
  }

  // 6.5 YouTube Neural Music & Background Video Transition
  if (!env.youtube?.active) {
    list.push({
      command: 'youtube play synthwave',
      category: 'Audio',
      description: 'Stream live Synthwave retro chill beats & transition to background video',
      badge: 'YOUTUBE',
      badgeColor: '#ef4444',
      score: 235,
      isEnvironmentAdaptive: true,
      statusHint: 'YouTube Idle',
    });
    list.push({
      command: 'youtube play lofi',
      category: 'Audio',
      description: 'Stream Lofi Girl beats to study & relax in background canvas',
      badge: 'YOUTUBE',
      badgeColor: '#ef4444',
      score: 230,
      isEnvironmentAdaptive: true,
    });
    list.push({
      command: 'youtube modal',
      category: 'Audio',
      description: 'Open YouTube Neural Music Hub to dynamically select stream',
      badge: 'YOUTUBE',
      badgeColor: '#ef4444',
      score: 228,
      isEnvironmentAdaptive: true,
    });
  } else {
    list.push({
      command: env.youtube.isPlaying ? 'youtube pause' : 'youtube resume',
      category: 'Audio',
      description: env.youtube.isPlaying ? 'Pause YouTube music video playback' : 'Resume YouTube music video playback',
      badge: 'YOUTUBE',
      badgeColor: '#ef4444',
      score: 230,
      isEnvironmentAdaptive: true,
      statusHint: env.youtube.isPlaying ? 'Playing' : 'Paused',
    });
    list.push({
      command: 'youtube bg',
      category: 'Audio',
      description: 'Toggle YouTube video 100% full background rendering transition',
      badge: 'YOUTUBE',
      badgeColor: '#ef4444',
      score: 228,
      isEnvironmentAdaptive: true,
      statusHint: env.youtube.displayMode.toUpperCase(),
    });
    list.push({
      command: 'youtube blend',
      category: 'Audio',
      description: 'Toggle 3D visualizer canvas blending directly over background video',
      badge: 'YOUTUBE',
      badgeColor: '#ef4444',
      score: 225,
      isEnvironmentAdaptive: true,
      statusHint: env.youtube.blendWith3D ? 'Blend ON' : 'Blend OFF',
    });
    list.push({
      command: 'youtube next',
      category: 'Audio',
      description: 'Skip to next curated stream in YouTube playlist',
      badge: 'YOUTUBE',
      badgeColor: '#ef4444',
      score: 220,
      isEnvironmentAdaptive: true,
    });
  }
  list.push({
    command: 'youtube play cyberpunk',
    category: 'Audio',
    description: 'Stream Blade Runner 2049 night city ambient synthwave',
    badge: 'YOUTUBE',
    badgeColor: '#ef4444',
    score: 215,
    isEnvironmentAdaptive: true,
  });
  list.push({
    command: 'youtube play interstellar',
    category: 'Audio',
    description: 'Stream Hans Zimmer Interstellar epic pipe organ suite',
    badge: 'YOUTUBE',
    badgeColor: '#ef4444',
    score: 215,
    isEnvironmentAdaptive: true,
  });

  // 7. Terminal Dock Layout, Clear Mode & Canvas Minimize
  if (env.terminalDock !== 'center') {
    list.push({
      command: 'dock center',
      category: 'System',
      description: 'Center terminal workstation with expanded visibility of all options',
      badge: 'CENTER',
      badgeColor: '#00f2ff',
      score: 215,
      isEnvironmentAdaptive: true,
    });
  }
  if (env.terminalDock !== 'bottom') {
    list.push({
      command: 'dock bottom',
      category: 'System',
      description: 'Pin terminal workstation to bottom dock',
      badge: 'BOTTOM',
      badgeColor: '#38bdf8',
      score: 200,
      isEnvironmentAdaptive: true,
    });
  }
  if (env.terminalDock !== 'floating') {
    list.push({
      command: 'dock float',
      category: 'System',
      description: 'Switch terminal into floating compact window',
      badge: 'FLOAT',
      badgeColor: '#38bdf8',
      score: 200,
      isEnvironmentAdaptive: true,
    });
  }
  if (env.terminalDock !== 'fullscreen') {
    list.push({
      command: 'dock fullscreen',
      category: 'System',
      description: 'Expand terminal across full display viewport',
      badge: 'FULLSCREEN',
      badgeColor: '#38bdf8',
      score: 200,
      isEnvironmentAdaptive: true,
    });
  }

  // Pure Canvas Mode (Minimize terminal)
  list.push({
    command: 'canvas',
    category: 'System',
    description: 'Minimize terminal to pure canvas to view 100% background visualizer',
    badge: 'CANVAS',
    badgeColor: '#00f2ff',
    score: 210,
    isEnvironmentAdaptive: true,
  });

  // Clear / Ghost Transparency Mode
  list.push({
    command: env.terminalOpacity <= 0.15 ? 'opacity 0.85' : 'ghost',
    category: 'System',
    description: env.terminalOpacity <= 0.15 ? 'Restore solid glass background to terminal' : 'Make terminal glass ultra-clear / transparent to view background',
    badge: 'CLEAR',
    badgeColor: '#f59e0b',
    score: 208,
    isEnvironmentAdaptive: true,
  });

  // 8. Geospatial sync & Earth descent
  list.push({
    command: 'geosync on',
    category: 'System',
    description: 'Synchronize terminal with physical GPS coordinates & trigger Earth descent',
    badge: 'GEO',
    badgeColor: '#10b981',
    score: 230,
    isEnvironmentAdaptive: true,
  });

  return list;
}

/**
 * Filter and rank command suggestions based on user input, environment state, and mounted device paths.
 */
export function getCommandSuggestions(
  query: string,
  limit: number = 6,
  contextOrFiles: AutocompleteContext | string[] = []
): CommandSuggestion[] {
  // Normalize context
  const context: AutocompleteContext = Array.isArray(contextOrFiles)
    ? { vfsFiles: contextOrFiles }
    : contextOrFiles || {};

  const vfsFiles = context.vfsFiles || [];
  const stateAdaptiveList = buildStateAdaptiveSuggestions(context);

  const seen = new Set<string>();
  const candidates: CommandSuggestion[] = [];

  // When query is empty, return contextual suggestions if an active environment/mount context was provided
  if (!query || !query.trim()) {
    if (!context.envState && !context.mountedDevices) {
      return [];
    }
    // Pick the most immediately useful commands for the current environment & mounts
    for (const item of stateAdaptiveList) {
      if (!seen.has(item.command.toLowerCase())) {
        seen.add(item.command.toLowerCase());
        candidates.push(item);
      }
    }
    // Also add essential system fallbacks
    for (const item of COMMAND_REGISTRY) {
      if (['help', 'clear', 'telemetry', 'canvas'].includes(item.command)) {
        if (!seen.has(item.command.toLowerCase())) {
          seen.add(item.command.toLowerCase());
          candidates.push({ ...item, score: 180 });
        }
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, limit);
  }

  const clean = query.trim().toLowerCase();
  const tokens = query.trim().split(/\s+/);
  const primaryCmd = tokens[0]?.toLowerCase() || '';
  const hasTrailingSpace = query.endsWith(' ');
  const paramFilter = tokens.length > 1 ? tokens.slice(1).join(' ').toLowerCase() : '';

  // 1. Check State-Adaptive suggestions first (mounted device paths, current active topology, etc.)
  for (const item of stateAdaptiveList) {
    const cmdLower = item.command.toLowerCase();
    let score = 0;

    if (cmdLower === clean) {
      score = item.score + 50;
    } else if (cmdLower.startsWith(clean)) {
      score = item.score + 25 - (cmdLower.length - clean.length);
    } else if (cmdLower.includes(clean)) {
      score = item.score - cmdLower.indexOf(clean);
    } else {
      // Sub-token match
      const words = cmdLower.split(/\s+/);
      if (words.some((w) => w.startsWith(clean))) {
        score = item.score + 10;
      }
    }

    if (score > 0 && !seen.has(cmdLower)) {
      seen.add(cmdLower);
      candidates.push({
        ...item,
        score,
      });
    }
  }

  // 2. Context Parameter Expansions (render, sentiment, profile, rgbled, etc.)
  if (CONTEXT_PARAM_EXPANSIONS[primaryCmd]) {
    const expansions = CONTEXT_PARAM_EXPANSIONS[primaryCmd];
    for (const exp of expansions) {
      const fullCmd = `${primaryCmd} ${exp.param}`;
      const fullLower = fullCmd.toLowerCase();
      if (
        hasTrailingSpace ||
        exp.param.toLowerCase().startsWith(paramFilter) ||
        fullLower.startsWith(clean) ||
        fullLower.includes(clean)
      ) {
        if (!seen.has(fullLower)) {
          seen.add(fullLower);
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

  // 3. Dynamic File and Directory completions (cat, edit, cd, ls, etc.)
  const fileCmds = ['cat', 'edit', 'nano', 'vim', 'rm', 'cd', 'ls', 'node', 'tree'];
  if (fileCmds.includes(primaryCmd)) {
    vfsFiles.forEach((file) => {
      const isDir = file.endsWith('/');
      const cleanFile = file.replace(/\/$/, '');
      const fullCmd = `${primaryCmd} ${cleanFile}`;
      const fullLower = fullCmd.toLowerCase();
      if (hasTrailingSpace || cleanFile.toLowerCase().startsWith(paramFilter) || fullLower.includes(clean)) {
        if (!seen.has(fullLower)) {
          seen.add(fullLower);
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

  // 4. Command Registry Matches
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

  // Sort descending by score, then ascending by length
  candidates.sort((a, b) => b.score - a.score || a.command.length - b.command.length);

  return candidates.slice(0, limit);
}
