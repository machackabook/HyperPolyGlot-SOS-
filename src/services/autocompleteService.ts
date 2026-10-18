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

  // Quine
  { command: 'quine export', category: 'Quine', description: 'Export self-replicating standalone offline HTML Quine', badge: 'QUINE' },
];

/**
 * Filter and rank command suggestions based on user input.
 * Priority order:
 * 1. Exact prefix match at beginning of command (highest score)
 * 2. Prefix match on word boundary (e.g. typing "sing" matches "singularity evolve")
 * 3. Substring match
 */
export function getCommandSuggestions(
  query: string,
  limit: number = 6,
  additionalFiles: string[] = []
): CommandSuggestion[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const candidates: CommandSuggestion[] = [];
  const seen = new Set<string>();

  // Include dynamic file suggestions from current VFS directory
  const dynamicItems: Omit<CommandSuggestion, 'score'>[] = [];
  additionalFiles.forEach((file) => {
    const isDir = file.endsWith('/');
    if (isDir) {
      dynamicItems.push({
        command: `cd ${file.replace(/\/$/, '')}`,
        category: 'VFS',
        description: `Navigate to directory ${file}`,
        badge: 'DIR',
      });
    } else {
      dynamicItems.push({
        command: `cat ${file}`,
        category: 'VFS',
        description: `View contents of ${file}`,
        badge: 'FILE',
      });
      dynamicItems.push({
        command: `edit ${file}`,
        category: 'VFS',
        description: `Edit ${file} in in-terminal code editor`,
        badge: 'EDIT',
      });
      if (file.endsWith('.js')) {
        dynamicItems.push({
          command: `node ${file}`,
          category: 'System',
          description: `Run ${file} in JavaScript sandbox`,
          badge: 'EXEC',
        });
      }
    }
  });

  const fullPool = [...COMMAND_REGISTRY, ...dynamicItems];

  for (const item of fullPool) {
    const cmdLower = item.command.toLowerCase();
    if (seen.has(cmdLower)) continue;

    let score = 0;

    if (cmdLower === clean) {
      score = 200; // Exact match
    } else if (cmdLower.startsWith(clean)) {
      score = 150 - (cmdLower.length - clean.length); // Exact prefix match
    } else {
      // Check word boundaries
      const words = cmdLower.split(/\s+/);
      const wordMatch = words.some((w) => w.startsWith(clean));
      if (wordMatch) {
        score = 100 - (cmdLower.indexOf(clean));
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
