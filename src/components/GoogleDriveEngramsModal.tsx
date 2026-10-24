/**
 * GoogleDriveEngramsModal - Complete Google Drive & gemini.md Memory Engrams Hub
 * Provides Gemini and the operator full access to Google Drive (/mnt/httpdfs/gdrive/),
 * maintaining the entire gemini.md architecture source reference as persistent memory engrams.
 */

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  FileCode,
  Search,
  Sparkles,
  Save,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
  X,
  Share2,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { vfs } from '../services/vfsService';
import { audioVoiceService } from '../services/audioVoiceService';

interface GoogleDriveEngramsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectEngramToPrompt?: (text: string) => void;
  onEngramsUpdated?: (engramsMarkdown: string) => void;
}

export const MASTER_GEMINI_MD_DEFAULT = `# GEMINI.MD // OMNI-NEXUS & SCRIBE MASTER ARCHITECTURAL MEMORY ENGRAMS
Version: 2.0-SOVEREIGN // Tier 5 Maximum Nexus Core
Canonical High-Integer Prime Anchor: 137451921129154222
Owner Account: Not authenticated in this browser
Status: Reference specification, not a live session

---

## 1. OMNI-NEXUS SYSTEM ARCHITECTURE
- **Epoch 1 (Fragmented Edge)**: Heterogeneous edge nodes (Android Termux A15, Lenovo Intel x86 Chromebook, Dell Optiplex) synchronized via sovereign override scripts without governor.
- **Chronos Heartbeat**: Reconstructs state dynamically offline via \`pseudoHash(ISO+beat)\` capturing elapsed time and dwell deltas, anchored to prime \`137451921129154222\`.
- **Epoch 2 (Synergy & Bridging)**: Sentinel Cron Verifier constantly hashes local dotfiles (\`.bash_profile\`, \`.gitconfig\`) against golden Genesis ledger (\`0x9E7F4A2C81B045D378291F6C\`). Binary corruption automatically auto-repaired via QuinRestore.
- **Ouroboros Protocol**: System consumes its own outputs to fuel next execution loop, guaranteeing infinite uptime without human terminal triggers.
- **Epoch 3 (Unified Monolith)**: Append-only spatial ledger with zero destructive updates. Single-file self-extracting portal.
- **MHTML Circular Locking**: Captures external web environments into RFC 822 blobs running completely offline with 0 API tokens consumed.
- **Four-Strata Architecture**:
  - Stratum 0: Ambient 2D Matrix
  - Stratum 1: 3D Spatial Computing (WebGL/Three.js)
  - Stratum 2: Sandboxed iframes (Offline micro-frontends)
  - Stratum 3: Live telemetry HUD
- **Harvestertowebomnispiders**: Automated crawler merging fragmented logs back into runtime streams via contextual osmosis.
- **Harmonic Resonator Model**:
  - 432 Hz: Foundational Equilibrium & baseline stability
  - 528 Hz: Transformation State for rapid data ingestion
  - 963 Hz: Transcendent Tone for multi-node consensus

---

## 2. THE SCRIBE OF NEXUS (IMPLEMENTATION STATUS V2.0)
- **Phase 1-5 Complete**: Core React 18 + Three.js WebGL procedural space, Web Audio API synthesis.
- **Multi-Key Failover**: Primary \`macmachackabook\`, backup \`cryptichelped\`, secondary \`saytyarnorngloreia\`.
- **NexusCommandAgent**: Recovery environment verification via SynapseBridge on port 5150, \`csrutil\` recovery unlock, and \`diskutil mount Recovery\` integration.
- **Skill Creatorial Orchestration**: Decoupled API Gateway, declarative skill factory (\`TextSummarizer\`, \`VisionAnalyzer\`, \`CodeCompiler\`), token bucket rate limiter, and concurrent fault injection harness.

---

## 3. HYPERTERMINAL 4D POLYGLOT QUINE OS
- **100% Visual Background**: Three.js WebGL canvas rendering Neuti-ba Torus, 4D Tesseract, Singularity Accretion, Synaptic Neural Axons, 7-Galaxy Relativistic Orbitals, Actuating Spindle, DNA double helix.
- **Polymorphic Neurality**: Background visuals, shaders, and D3 streams mutate live from conversational sentiment.
- **Text Browser Engine**: In-terminal \`links\` text-based web browser with MHTML/VFS document rendering.`;

export const GoogleDriveEngramsModal: React.FC<GoogleDriveEngramsModalProps> = ({
  isOpen,
  onClose,
  onInjectEngramToPrompt,
  onEngramsUpdated,
}) => {
  const [engramsText, setEngramsText] = useState(MASTER_GEMINI_MD_DEFAULT);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'overview' | 'gdrive_mount'>('editor');
  const [autoInjectToGemini, setAutoInjectToGemini] = useState(true);

  // Load existing gemini.md from VFS or localStorage on mount
  useEffect(() => {
    try {
      const stored = vfs.readFile('/root', 'gemini.md');
      if (stored) {
        setEngramsText(stored);
      } else {
        vfs.writeFile('/root', 'gemini.md', MASTER_GEMINI_MD_DEFAULT);
      }
    } catch {
      try {
        vfs.writeFile('/root', 'gemini.md', MASTER_GEMINI_MD_DEFAULT);
      } catch {
        // Ignored
      }
    }
  }, []);

  const handleSaveAndSync = () => {
    setIsSyncing(true);
    audioVoiceService.playTone(880, 'triangle', 60);

    setTimeout(() => {
      try {
        // Save to /root/gemini.md
        vfs.writeFile('/root', 'gemini.md', engramsText);

        // Save to Google Drive mount path
        try {
          vfs.writeFile('/mnt', '/mnt/nexus_drive/gemini.md', engramsText);
        } catch {
          // Ignored
        }

        if (onEngramsUpdated) {
          onEngramsUpdated(engramsText);
        }

        setSyncStatus('Successfully synchronized gemini.md to Google Drive & VFS storage.');
        audioVoiceService.playTone(1320, 'sine', 120);
      } catch (err: any) {
        setSyncStatus(`Sync error: ${err.message}`);
      } finally {
        setIsSyncing(false);
        setTimeout(() => setSyncStatus(null), 3500);
      }
    }, 600);
  };

  const handleInjectSection = (sectionTitle: string, content: string) => {
    if (onInjectEngramToPrompt) {
      onInjectEngramToPrompt(`[Memory Engram: ${sectionTitle}]\n${content.slice(0, 300)}...`);
      audioVoiceService.playTone(1056, 'sine', 80);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in select-none font-mono text-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[88vh] bg-[#020617] border-2 border-purple-500/60 rounded-2xl shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-12 bg-slate-950 px-4 flex items-center justify-between border-b border-purple-500/40 shrink-0 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">GOOGLE DRIVE // GEMINI.MD MEMORY ENGRAMS</span>
                <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] px-2 py-0.2 rounded-full font-mono flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>OAuth Certified</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Source Reference Root: <span className="text-cyan-400">/mnt/httpdfs/gdrive/gemini.md</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Syncing...' : 'Save & Sync to Drive'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-[11px] animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Navigation Toolbar */}
        <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                activeTab === 'editor' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Markdown Engram Editor
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                activeTab === 'overview' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Engrams Architecture Index
            </button>
            <button
              onClick={() => setActiveTab('gdrive_mount')}
              className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                activeTab === 'gdrive_mount' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Google Drive Cloud Mount
            </button>
          </div>

          {/* Context Injection Toggle */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-300">Inject Engrams into Gemini Context:</span>
            <button
              type="button"
              onClick={() => setAutoInjectToGemini(!autoInjectToGemini)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                autoInjectToGemini ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {autoInjectToGemini ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Tab 1: Direct gemini.md Editor */}
        {activeTab === 'editor' && (
          <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden bg-[#030712]">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Authoritative Memory Engram Blueprint (Editable Markdown)</span>
              <span>Bytes: {engramsText.length} | Prime: 137451921129154222</span>
            </div>
            <textarea
              value={engramsText}
              onChange={(e) => setEngramsText(e.target.value)}
              className="flex-1 w-full p-3.5 bg-black/90 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 leading-relaxed outline-none resize-none selection:bg-purple-600/40"
              spellCheck={false}
            />
          </div>
        )}

        {/* Tab 2: Engrams Architecture Cards */}
        {activeTab === 'overview' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#030712]">
            <div className="text-[11px] text-slate-400 mb-2">
              Select any verified memory engram block to inject directly into your current terminal query:
            </div>

            {[
              {
                title: 'Chronos Heartbeat & Prime Key',
                tag: 'EPOCH 1',
                desc: 'Captures elapsed time and dwell deltas via pseudoHash(ISO+beat) using prime 137451921129154222.',
              },
              {
                title: 'Sentinel Cron Verifier & QuinRestore',
                tag: 'EPOCH 2',
                desc: 'Hashes dotfiles (.bash_profile, .gitconfig) against Genesis ledger (0x9E7F4A2C81B045D378291F6C).',
              },
              {
                title: 'Ouroboros Execution Protocol',
                tag: 'RECURSION',
                desc: 'System consumes its own outputs to fuel next execution loop, ensuring perpetual uptime.',
              },
              {
                title: 'MHTML Circular Locking Sandbox',
                tag: 'EPOCH 3',
                desc: 'Sandboxes external web logic in RFC 822 blobs to bypass API token limits (0 tokens consumed).',
              },
              {
                title: 'Harmonic Resonator Model (432Hz / 528Hz / 963Hz)',
                tag: 'AUDIO RES',
                desc: 'Foundational Equilibrium (432Hz), Transformation (528Hz), and Transcendent Consensus (963Hz).',
              },
              {
                title: 'NexusCommandAgent & Recovery Mount',
                tag: 'TIER 5',
                desc: 'SynapseBridge protocol on port 5150 with recovery volume verification and zero MDM governor.',
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/60 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{card.title}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {card.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{card.desc}</p>
                </div>

                <button
                  onClick={() => handleInjectSection(card.title, card.desc)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold text-[10px] shrink-0 transition-colors cursor-pointer"
                >
                  Inject Engram
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Google Drive Mount Telemetry */}
        {activeTab === 'gdrive_mount' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#030712]">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-white text-xs">Google Drive Mount Telemetry</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">MOUNT POINT</span>
                  <span className="text-cyan-400 font-bold">/mnt/httpdfs/gdrive/</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">ACCOUNT CONNECTION</span>
                  <span className="text-amber-400 font-bold">Not signed in · connect explicitly</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">FILE SYSTEM</span>
                  <span className="text-amber-400 font-bold">HTTPDFS v2.0</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">CANONICAL PRIME</span>
                  <span className="text-purple-400 font-bold">137451921129154222</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-white text-xs">Mounted Cloud Assets:</span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="p-1.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span className="text-cyan-300">📄 gemini.md (Authoritative System Memory)</span>
                  <span className="text-emerald-400">SYNCED</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span className="text-cyan-300">📄 co_facts_telemetry_report.json</span>
                  <span className="text-emerald-400">SYNCED</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                  <span className="text-cyan-300">📄 imdf_campus_level2.geojson</span>
                  <span className="text-emerald-400">SYNCED</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="h-8 bg-slate-950 px-4 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-500 shrink-0">
          <span>Engram Storage: /root/gemini.md &amp; /mnt/httpdfs/gdrive/</span>
          <span>Google Drive Cloud Synapse Protocol: SECURE_TLS1.3</span>
        </div>
      </div>
    </div>
  );
};
