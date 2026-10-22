import { VfsNode, VfsFileMetadata } from '../types';

const VFS_STORAGE_KEY = 'hyperterminal_polyglot_vfs_v2';

const INITIAL_VFS: VfsNode = {
  type: 'directory',
  metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
  children: {
    root: {
      type: 'directory',
      metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
      children: {
        'welcome.txt': {
          type: 'file',
          content: `========================================================================
⚡ HYPERTERMINAL POLYGLOT QUINE OS // POLYMORPHIC NEURAL CORE
========================================================================
Runtime: 100% Visual WebGL 3D/4D Renderer Substrate
Visualizer Mode: Polymorphic Neurality with Live AI Voice Projection
Current State: Sovereign Root Sandbox   Zero Throttling Governor

Type 'help' to inspect all commands, or try:
  - gemini <prompt>     : Converse with AI, alter background visual, speak response
  - render <topology>   : Switch 3D background (torus, tesseract, singularity, neural, galaxy, spindle, dna)
  - sentiment <mood>    : Modulate color/physics (analytical, energetic, alarm, tranquil, cosmic, chaos)
  - satcom ping         : Rebound satellite telemetry ping across circular relay
  - swarm status        : Inspect 6,000-node virtual agent cluster
  - arbitrage scan      : Scan cross-exchange liquidity spreads
  - git status          : Verify MacBook_Mirror port 8080 WebSocket bridge
  - singularity evolve  : Collapse 9 editions into Supreme Masterwork
  - quine export        : Export self-contained offline running Quine HTML
  - 963 on|off          : Toggle pure 963 Hz solfeggio harmonic oscillator
  - edit <filename>     : Open in-terminal interactive code editor
========================================================================`,
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 1024 },
        },
        'notes.md': {
          type: 'file',
          content: `# HYPERTERMINAL POLYGLOT QUINE // ARCHITECTURAL NOTES

- **100% Visual Background Renderer**: Three.js WebGL procedural space with real-time audio FFT reactivity and mathematical topologies (Neuti-ba Knot, 4D Hypercube with Givens rotation, 9-Edition Singularity, 7-Galaxy Relativistic Orbitals).
- **Polymorphic Neurality**: Visualizer state morphs continuously based on user speech, conversational sentiment, and CLI commands.
- **Single Unobstructed UI**: The HyperTerminal is the sole floating/dockable interface. All features, file explorers, and controls live within the CLI.
- **In-Visual AI Speech**: Spoken AI responses project 3D dynamic holographic text ribbons directly inside the background visual.
- **Self-Replicating Quine**: The system can compile and download its own source code as a standalone zero-dependency HTML quine.`,
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 950 },
        },
        'gemini.md': {
          type: 'file',
          content: `# GEMINI.MD // OMNI-NEXUS & SCRIBE MASTER ARCHITECTURAL MEMORY ENGRAMS
Version: 2.0-SOVEREIGN // Tier 5 Maximum Nexus Core
Canonical High-Integer Prime Anchor: 137451921129154222
Owner Account: machackabook@gmail.com
Status: 100% OPERATIONAL & VERIFIED

## 1. OMNI-NEXUS ARCHITECTURE SUMMARY
- Epoch 1 (Fragmented Edge): Termux A15, Lenovo Chromebook, Dell Optiplex.
- Chronos Heartbeat: pseudoHash(ISO+beat) capturing elapsed time and dwell deltas.
- Epoch 2 (Synergy & Bridging): Sentinel Cron Verifier hashing dotfiles (.bash_profile, .gitconfig) against Genesis ledger (0x9E7F4A2C81B045D378291F6C). QuinRestore auto-restores corrupt binaries.
- Ouroboros Protocol: Recursive output-to-input loop guaranteeing perpetual system uptime.
- Epoch 3 (Unified Monolith): MHTML circular locking (RFC 822) offline execution sandbox (0 tokens consumed).
- Four-Strata Architecture: Stratum 0 Ambient 2D, Stratum 1 3D Spatial, Stratum 2 Sandboxed iframes, Stratum 3 Live telemetry HUD.
- Harvestertowebomnispiders: Automated crawler merging fragmented logs via contextual osmosis.
- Harmonic Resonator Model: 432 Hz Equilibrium, 528 Hz Transformation, 963 Hz Transcendent Consensus.

## 2. THE SCRIBE OF NEXUS (V2.0)
- Multi-key failover manager: macmachackabook, cryptichelps, saytyarnorngloreia.
- NexusCommandAgent: Recovery environment verification via SynapseBridge on port 5150 with recovery volume mounting.
- Skill Creatorial: Decoupled API Gateway, declarative skill factory, token-window rate limiter, concurrent fault injection harness.`,
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 1650 },
        },
        '.bash_profile': {
          type: 'file',
          content: `# Nexus Sovereign Profile\nexport OS="HyperTerminal"\nexport HARMONIC="432"\nexport PRIME="137451921129154222"\n`,
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 120 },
        },
        '.gitconfig': {
          type: 'file',
          content: `[user]\n  name = Sovereign Operator\n  email = machackabook@gmail.com\n[core]\n  primeAnchor = 137451921129154222\n`,
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 140 },
        },
        projects: {
          type: 'directory',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
          children: {
            'fibonacci.js': {
              type: 'file',
              content: `// Computes first 10 Fibonacci numbers in local JS sandbox
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}
console.log("Fibonacci Series (10):", fibonacci(10).join(" -> "));`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 240 },
            },
            'gravity_sim.js': {
              type: 'file',
              content: `// 4D Gravitational Curvature & Frame-Dragging Metric
const G4 = 1.374519;
function computeCurvature(mass, r, dimW) {
  const metric = (mass * G4) / Math.pow(r * r + dimW * dimW, 1.5);
  return { r, dimW, metric: metric.toFixed(6) };
}
console.log("4D Curvature Tensor at radius 5.0:", computeCurvature(100, 5.0, 0.85));`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 320 },
            },
            'neural_weights.json': {
              type: 'file',
              content: JSON.stringify({
                model: 'PolymorphicNeural-v9',
                layers: [
                  { name: 'input_sensor', nodes: 64, activation: 'relu' },
                  { name: 'sentiment_tensor', nodes: 128, activation: 'gelu' },
                  { name: 'topology_projection', nodes: 7, activation: 'softmax' }
                ],
                coherence: 0.9998,
                lastTrained: '2026-10-17'
              }, null, 2),
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 380 },
            },
          },
        },
        scripts: {
          type: 'directory',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
          children: {
            'system-audit.sh': {
              type: 'file',
              content: `echo "=== HYPERTERMINAL SYSTEM DIAGNOSTIC ==="
uptime
df -h
free
satcom status
swarm status
arbitrage scan
echo "=== AUDIT COMPLETE: 100% OPERATIONAL ==="`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 180 },
            },
            'benchmark-vfs.sh': {
              type: 'file',
              content: `echo "Benchmarking Virtual File System throughput..."
echo "1,000 IOPS benchmark executed: 0.24ms mean latency."
echo "Persistence: localStorage synchronized."`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 160 },
            },
            'mcp-mesh-sync.sh': {
              type: 'file',
              content: `echo "Querying 4 active Model Context Protocol servers..."
mcp list
echo "All MCP tools and resources verified online."`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 150 },
            },
          },
        },
      },
    },
    mnt: {
      type: 'directory',
      metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
      children: {
        nexus_drive: {
          type: 'directory',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
          children: {
            'mirror_config.json': {
              type: 'file',
              content: JSON.stringify({
                repo: 'cryptichelped/MacBook_Mirror',
                branch: 'main',
                mirrorPort: 8080,
                status: 'connected',
                mountPoint: '/mnt/nexus_drive',
                syncLatencyMs: 3.2,
                autoSync: true,
              }, null, 2),
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 240 },
            },
            'singularity_masterwork.md': {
              type: 'file',
              content: `# AURORA NEXUS SINGULARITY CORE // MASTERWORK

Unified 9 Sovereign Editions Manifest:
1. Dawn Edition (#ff3366) - First Light Kernel
2. Forge Edition (#ffaa00) - Compilers & Build Tools
3. Synthesizer Edition (#00ff9d) - Procedural Sound & UI
4. Flux Edition (#00f2ff) - Real-time State & Bus
5. Navigator Edition (#3b82f6) - VFS Indexing
6. Weaver Edition (#a855f7) - Model Context Protocol
7. Chronos Edition (#f43f5e) - Macro Time Replay
8. Quantum Edition (#6366f1) - Sovereign Root Sandbox
9. Transcendence Edition (#ffffff) - Singularity 1-Core Masterwork

Operating Mode: WITHOUT GOVERNOR / DIRECT ROOT RUNTIME`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 750 },
            },
            'editions_manifest.json': {
              type: 'file',
              content: JSON.stringify([
                { id: 'e1', name: 'Dawn Edition', color: '#ff3366', status: 'unified', coherence: 1.0 },
                { id: 'e2', name: 'Forge Edition', color: '#ffaa00', status: 'unified', coherence: 1.0 },
                { id: 'e3', name: 'Synthesizer Edition', color: '#00ff9d', status: 'unified', coherence: 1.0 },
                { id: 'e4', name: 'Flux Edition', color: '#00f2ff', status: 'unified', coherence: 1.0 },
                { id: 'e5', name: 'Navigator Edition', color: '#3b82f6', status: 'unified', coherence: 1.0 },
                { id: 'e6', name: 'Weaver Edition', color: '#a855f7', status: 'unified', coherence: 1.0 },
                { id: 'e7', name: 'Chronos Edition', color: '#f43f5e', status: 'unified', coherence: 1.0 },
                { id: 'e8', name: 'Quantum Edition', color: '#6366f1', status: 'unified', coherence: 1.0 },
                { id: 'e9', name: 'Transcendence Edition', color: '#ffffff', status: 'unified', coherence: 1.0 },
              ], null, 2),
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 900 },
            },
          },
        },
      },
    },
    etc: {
      type: 'directory',
      metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
      children: {
        'os-release': {
          type: 'file',
          content: `NAME="HyperTerminal Polyglot Quine OS"
VERSION="2026.1-TRANSCENDENCE"
ID=hyperterminal
PRETTY_NAME="HyperTerminal WebGL/WASM 4D Sovereign OS"`,
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'r--r--r--', size: 140 },
        },
        hosts: {
          type: 'file',
          content: '127.0.0.1\tlocalhost\n127.0.0.1\thyperterminal.mesh\n127.0.0.1\tsatcom.relay',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'r--r--r--', size: 80 },
        },
        'tokens.json': {
          type: 'file',
          content: JSON.stringify({
            canonicalNumeral: '137451921129154222',
            genesisEpoch: '040592',
            rootOctave: '0606',
            authority: 'SOVEREIGN_ROOT'
          }, null, 2),
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-------', size: 180 },
        },
        'macros.json': {
          type: 'file',
          content: JSON.stringify({
            'sunset': 'render torus; sentiment tranquil; color #ff8800 #ff3300; speed 0.4',
            'matrix': 'render neural; sentiment energetic; color #10b981 #059669; speed 1.8',
            'galaxy-flight': 'render galaxy_vfs; speed 2.0; sentiment cosmic'
          }, null, 2),
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 256 },
        },
        'openwrt_release': {
          type: 'file',
          content: `DISTRIB_ID='OpenWrt'
DISTRIB_RELEASE='23.05.3'
DISTRIB_REVISION='r23809-234f1a2'
DISTRIB_TARGET='x86/64'
DISTRIB_ARCH='x86_64'
DISTRIB_DESCRIPTION='OpenWrt 23.05.3 r23809-234f1a2'
DISTRIB_TAINTS=''`,
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'r--r--r--', size: 180 },
        },
        config: {
          type: 'directory',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
          children: {
            firewall: {
              type: 'file',
              content: `config defaults
	option syn_flood '1'
	option input 'REJECT'
	option output 'ACCEPT'
	option forward 'REJECT'
	option drop_invalid '1'

config zone
	option name 'lan'
	list network 'lan'
	option input 'ACCEPT'
	option output 'ACCEPT'
	option forward 'ACCEPT'

config zone
	option name 'wan'
	list network 'wan'
	list network 'wan6'
	option input 'REJECT'
	option output 'ACCEPT'
	option forward 'REJECT'
	option masq '1'
	option mtu_fix '1'

config forwarding
	option src 'lan'
	option dest 'wan'

config rule
	option name 'Allow-DHCP-Renew'
	option src 'wan'
	option proto 'udp'
	option dest_port '68'
	option target 'ACCEPT'

config rule
	option name 'Block-WAN-SSH'
	option src 'wan'
	option proto 'tcp'
	option dest_port '22'
	option target 'DROP'

config rule
	option name 'Block-WAN-LuCI'
	option src 'wan'
	option proto 'tcp'
	option dest_port '80 443'
	option target 'DROP'`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 750 },
            },
            network: {
              type: 'file',
              content: `config interface 'loopback'
	option device 'lo'
	option proto 'static'
	option ipaddr '127.0.0.1'
	option netmask '255.0.0.0'

config device
	option name 'br-lan'
	option type 'bridge'
	list ports 'eth1'
	list ports 'eth2'
	list ports 'eth3'

config interface 'lan'
	option device 'br-lan'
	option proto 'static'
	option ipaddr '192.168.1.1'
	option netmask '255.255.255.0'
	option ip6assign '60'

config interface 'wan'
	option device 'eth0'
	option proto 'dhcp'`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 420 },
            },
            wireless: {
              type: 'file',
              content: `config wifi-device 'radio0'
	option type 'mac80211'
	option path 'pci0000:00/0000:00:1c.0'
	option channel '36'
	option band '5g'
	option htmode 'HE80'
	option country 'US'

config wifi-iface 'default_radio0'
	option device 'radio0'
	option network 'lan'
	option mode 'ap'
	option ssid 'HyperTerminal-SecNet'
	option encryption 'sae'
	option ieee80211w '2'`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 360 },
            },
          },
        },
        ssh: {
          type: 'directory',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
          children: {
            'ssh_config': {
              type: 'file',
              content: `Host gateway 192.168.1.1
	HostName 192.168.1.1
	User root
	Port 22
	IdentityFile ~/.ssh/id_ed25519
	ServerAliveInterval 15
	ServerAliveCountMax 3
	Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com

Host kali 192.168.1.150
	HostName 192.168.1.150
	User kali
	Port 22
	IdentityFile ~/.ssh/id_ed25519`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 320 },
            },
          },
        },
        security: {
          type: 'directory',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
          children: {
            'hardening_guide.md': {
              type: 'file',
              content: `# HyperTerminal & OpenWrt Gateway Defensive Hardening Matrix

## 1. Network Gateway Posture (192.168.1.1)
- **Firewall**: Default DROP policy on WAN; SYN-flood cookies enabled.
- **SSH**: Key-only authentication via Ed25519; Root password login disabled over WAN.
- **Wireless**: WPA3-SAE enforced with PMF (Protected Management Frames) mandatory (\`ieee80211w=2\`).
- **DNS**: DNS-over-HTTPS / DNS-over-TLS enabled to prevent ISP eavesdropping and spoofing.

## 2. Host Kernel Defenses
- \`net.ipv4.tcp_syncookies = 1\` (DDoS SYN-flood mitigation)
- \`net.ipv4.conf.all.rp_filter = 1\` (Reverse path source validation against IP spoofing)
- \`net.ipv4.conf.all.accept_redirects = 0\` (Prevent malicious ICMP redirect route manipulation)
- \`net.ipv4.conf.all.send_redirects = 0\` (Prevent router ICMP leakages)

## 3. Kali Workload Defensive Capabilities
- **Suricata**: Real-time intrusion detection and packet signature anomaly alerts.
- **Wireshark/Tshark**: Low-latency internal capture of ARP anomalies and rogue broadcast storms.
- **Lynis**: Local audit compliance score baseline target >= 85/100.
`,
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 1100 },
            },
          },
        },
      },
    },
    bin: {
      type: 'directory',
      metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
      children: {
        bash: { type: 'file', content: '[POSIX Bourne-Again Shell Engine]', metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 64000 } },
        node: { type: 'file', content: '[JavaScript V8/Hermes Execution Sandbox]', metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 85000 } },
        gemini: { type: 'file', content: '[Google Gemini 3.8 Flash Multimodal Agent]', metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 42000 } },
        mcp: { type: 'file', content: '[Model Context Protocol JSON-RPC Client]', metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 36000 } },
        satcom: { type: 'file', content: '[ATSC 33.3ms Rebounding Relay Engine]', metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 48000 } },
        arbitrage: { type: 'file', content: '[Financial Arbitrage Cross-Exchange Engine]', metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 52000 } },
        quine: { type: 'file', content: '[Ouroboros Self-Replicating HTML Engine]', metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 30000 } },
      },
    },
    var: {
      type: 'directory',
      metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
      children: {
        log: {
          type: 'directory',
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
          children: {
            'voice.log': {
              type: 'file',
              content: '=== HYPERTERMINAL NEURAL VOICE ARCHIVE ===\n',
              metadata: { created: Date.now(), modified: Date.now(), permissions: 'rw-r--r--', size: 42 },
            },
          },
        },
      },
    },
  },
};

class VfsService {
  private root: VfsNode;

  constructor() {
    this.root = this.load();
  }

  private load(): VfsNode {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(VFS_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('VFS parse failed, loading initial state', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_VFS));
  }

  public save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(this.root));
      }
    } catch (e) {
      console.error('Failed to save VFS to localStorage', e);
    }
  }

  public reset(): void {
    this.root = JSON.parse(JSON.stringify(INITIAL_VFS));
    this.save();
  }

  public normalizePath(cwd: string, targetPath: string = ''): string {
    const trimmed = (targetPath || '').trim();
    let parts: string[];
    if (trimmed.startsWith('/')) {
      parts = trimmed.split('/').filter(Boolean);
    } else {
      parts = (cwd + '/' + trimmed).split('/').filter(Boolean);
    }
    const resolved: string[] = [];
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        resolved.pop();
      } else {
        resolved.push(p);
      }
    }
    return '/' + resolved.join('/');
  }

  public getNode(cwd: string, targetPath: string): { node: VfsNode | null; absPath: string; parent: VfsNode | null; key: string } {
    const absPath = this.normalizePath(cwd, targetPath);
    if (absPath === '/' || absPath === '') {
      return { node: this.root, absPath: '/', parent: null, key: '' };
    }
    const parts = absPath.split('/').filter(Boolean);
    let curr: VfsNode = this.root;
    let parent: VfsNode | null = null;
    let lastKey = '';
    for (const part of parts) {
      if (curr.type !== 'directory' || !curr.children) {
        return { node: null, absPath, parent: null, key: '' };
      }
      parent = curr;
      lastKey = part;
      curr = curr.children[part];
      if (!curr) {
        return { node: null, absPath, parent, key: lastKey };
      }
    }
    return { node: curr, absPath, parent, key: lastKey };
  }

  public readFile(cwd: string, targetPath: string): string {
    const { node, absPath } = this.getNode(cwd, targetPath);
    if (!node) {
      throw new Error(`cat: ${targetPath}: No such file or directory`);
    }
    if (node.type === 'directory') {
      throw new Error(`cat: ${targetPath}: Is a directory`);
    }
    return node.content || '';
  }

  public writeFile(cwd: string, targetPath: string, content: string, append = false): string {
    const absPath = this.normalizePath(cwd, targetPath);
    const parts = absPath.split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('Cannot write directly to root directory');

    const fileName = parts.pop()!;
    const dirPath = '/' + parts.join('/');
    this.mkdir(cwd, dirPath);

    const { node: dirNode } = this.getNode(cwd, dirPath);
    if (!dirNode || dirNode.type !== 'directory' || !dirNode.children) {
      throw new Error(`write: cannot write to ${absPath}`);
    }

    const existing = dirNode.children[fileName];
    const prevContent = (existing && existing.type === 'file') ? existing.content || '' : '';
    const finalContent = append ? prevContent + content : content;

    dirNode.children[fileName] = {
      type: 'file',
      content: finalContent,
      metadata: {
        created: existing?.metadata?.created || Date.now(),
        modified: Date.now(),
        permissions: existing?.metadata?.permissions || 'rw-r--r--',
        size: finalContent.length,
      },
    };

    this.save();
    return absPath;
  }

  public mkdir(cwd: string, targetPath: string): string {
    const absPath = this.normalizePath(cwd, targetPath);
    if (absPath === '/' || absPath === '') return '/';

    const parts = absPath.split('/').filter(Boolean);
    let curr: VfsNode = this.root;
    for (const part of parts) {
      if (!curr.children) curr.children = {};
      if (!curr.children[part]) {
        curr.children[part] = {
          type: 'directory',
          children: {},
          metadata: { created: Date.now(), modified: Date.now(), permissions: 'rwxr-xr-x', size: 4096 },
        };
      }
      curr = curr.children[part];
      if (curr.type !== 'directory') {
        throw new Error(`mkdir: cannot create directory '${absPath}': File exists`);
      }
    }
    this.save();
    return absPath;
  }

  public remove(cwd: string, targetPath: string): boolean {
    const absPath = this.normalizePath(cwd, targetPath);
    if (absPath === '/' || absPath === '/root' || absPath === '/etc' || absPath === '/bin') {
      throw new Error(`rm: cannot remove protected system directory '${absPath}'`);
    }
    const { parent, key } = this.getNode(cwd, targetPath);
    if (parent && parent.children && parent.children[key]) {
      delete parent.children[key];
      this.save();
      return true;
    }
    throw new Error(`rm: cannot remove '${targetPath}': No such file or directory`);
  }

  public listDir(cwd: string, targetPath = '.'): { name: string; isDir: boolean; size: number; permissions: string; modified: number }[] {
    const { node, absPath } = this.getNode(cwd, targetPath);
    if (!node) {
      throw new Error(`ls: cannot access '${targetPath}': No such file or directory`);
    }
    if (node.type === 'file') {
      return [{
        name: absPath.split('/').pop() || '',
        isDir: false,
        size: node.content?.length || 0,
        permissions: node.metadata?.permissions || 'rw-r--r--',
        modified: node.metadata?.modified || Date.now(),
      }];
    }
    const results: { name: string; isDir: boolean; size: number; permissions: string; modified: number }[] = [];
    if (node.children) {
      for (const [name, child] of Object.entries(node.children)) {
        results.push({
          name,
          isDir: child.type === 'directory',
          size: child.type === 'directory' ? 4096 : (child.content?.length || 0),
          permissions: child.metadata?.permissions || (child.type === 'directory' ? 'rwxr-xr-x' : 'rw-r--r--'),
          modified: child.metadata?.modified || Date.now(),
        });
      }
    }
    // Sort directories first, then alphabetical
    return results.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  public tree(cwd: string, targetPath = '.'): string[] {
    const { node, absPath } = this.getNode(cwd, targetPath);
    if (!node || node.type !== 'directory') return [`[Not a directory: ${targetPath}]`];
    const lines: string[] = [absPath];

    const recurse = (currNode: VfsNode, prefix: string) => {
      if (!currNode.children) return;
      const entries = Object.entries(currNode.children);
      entries.forEach(([name, child], idx) => {
        const isLast = idx === entries.length - 1;
        const pointer = isLast ? '└── ' : '├── ';
        lines.push(`${prefix}${pointer}${name}${child.type === 'directory' ? '/' : ''}`);
        if (child.type === 'directory') {
          recurse(child, prefix + (isLast ? '    ' : '│   '));
        }
      });
    };
    recurse(node, '');
    return lines;
  }

  public search(query: string): { path: string; name: string; isDir: boolean; matchSnippet?: string }[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: { path: string; name: string; isDir: boolean; matchSnippet?: string }[] = [];

    const recurse = (currNode: VfsNode, currentPath: string) => {
      if (!currNode.children) return;
      for (const [name, child] of Object.entries(currNode.children)) {
        const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
        if (name.toLowerCase().includes(q) || fullPath.toLowerCase().includes(q)) {
          results.push({ path: fullPath, name, isDir: child.type === 'directory' });
        }
        if (child.type === 'file' && child.content && child.content.toLowerCase().includes(q)) {
          const lines = child.content.split('\n');
          const matchingLine = lines.find((l) => l.toLowerCase().includes(q));
          results.push({
            path: fullPath,
            name,
            isDir: false,
            matchSnippet: matchingLine?.trim().slice(0, 60),
          });
        }
        if (child.type === 'directory') {
          recurse(child, fullPath);
        }
      }
    };
    recurse(this.root, '/');
    return results;
  }

  public exportJson(): string {
    return JSON.stringify(this.root, null, 2);
  }
}

export const vfs = new VfsService();
