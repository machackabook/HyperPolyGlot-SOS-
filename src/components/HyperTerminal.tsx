import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Send,
  Trash2,
  Maximize2,
  Minimize2,
  Plus,
  X,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Zap,
  Save,
  Radio,
  FileCode,
  Download,
  Eye,
  Activity,
  Layers,
  Shield,
  HelpCircle,
  Mic,
  MicOff,
  History as HistoryIcon,
  Network,
  Accessibility,
  BookOpen,
  Cloud,
  HardDrive,
  Music,
} from 'lucide-react';
import {
  EnvironmentState,
  TerminalInstance,
  TerminalLine,
  TopologyType,
  SentimentType,
  CommandHistoryItem,
  D3StreamShape,
} from '../types';
import { vfs } from '../services/vfsService';
import { audioVoiceService } from '../services/audioVoiceService';
import { ambientAudioService } from '../services/ambientAudioService';
import { omniNexusService } from '../services/omniNexusService';
import { exportQuineFile } from '../services/quineService';
import { getCommandSuggestions, CommandSuggestion } from '../services/autocompleteService';
import { geoNexusService } from '../services/geoNexusService';
import { CommandAutocomplete } from './CommandAutocomplete';
import { TerminalBorderWaveform } from './TerminalBorderWaveform';
import { TerminalSyntaxInput } from './TerminalSyntaxInput';
import { D3DataStreamVisualizer } from './D3DataStreamVisualizer';
import { CommandHistoryModal } from './CommandHistoryModal';
import { VoiceProfileModal } from './VoiceProfileModal';
import { LinksBrowserModal } from './LinksBrowserModal';
import { GoogleDriveEngramsModal, MASTER_GEMINI_MD_DEFAULT } from './GoogleDriveEngramsModal';

interface HyperTerminalProps {
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
}

const BUILTIN_COMMANDS = [
  'help', 'clear', 'ls', 'cd', 'pwd', 'cat', 'touch', 'mkdir', 'rm', 'edit',
  'tree', 'find', 'grep', 'vfs', 'render', 'sentiment', 'color', 'gravity',
  'speed', 'turbulence', 'burst', 'calm', 'shatter', 'gemini', 'ask', 'ai',
  'voice', 'speak', 'mic', 'listen', '963', 'node', 'js', 'git', 'singularity', 'satcom',
  'swarm', 'arbitrage', 'voip', 'mcp', 'macro', 'quine', 'telemetry', 'date', 'uptime',
  'd3', 'history', 'ping', 'netstat', 'curl', 'fetch', 'chromevox', 'contrast', 'top', 'theme',
  'links', 'ambient', 'harmonic', 'chronos', 'sentinel', 'ouroboros', 'mhtml', 'agent', 'spider', 'stress', 'mount', 'umount', 'engram', 'gdrive', 'geosync'
];

export const HyperTerminal: React.FC<HyperTerminalProps> = ({ envState, setEnvState }) => {
  // Terminal Instances (tabs)
  const [instances, setInstances] = useState<TerminalInstance[]>([
    {
      id: 'inst-1',
      title: 'root@hyperterminal',
      cwd: '/root',
      mode: 'bash',
      lines: [
        {
          id: 'init-1',
          type: 'system',
          text: `⚡ HYPERTERMINAL POLYGLOT QUINE OS // POLYMORPHIC NEURAL SUBSTRATE
100% Visual Renderer Active   Live AI Voice Response   Real-Time Border Waveform
Type 'help' to inspect all commands, 'mic on' to speak commands, or 'render <mode>' to switch 3D geometry.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      history: [],
      historyIndex: -1,
      draft: '',
      active: true,
    },
  ]);
  const [activeInstanceId, setActiveInstanceId] = useState('inst-1');
  const [inputVal, setInputVal] = useState('');
  const [ghostSuggestion, setGhostSuggestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPureCanvas, setIsPureCanvas] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);

  // Autocomplete dropdown state
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // In-terminal editor state
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [linksInitialUrl, setLinksInitialUrl] = useState('file:///root/gemini.md');
  const [isEngramsModalOpen, setIsEngramsModalOpen] = useState(false);
  const [engramsMarkdown, setEngramsMarkdown] = useState<string>(MASTER_GEMINI_MD_DEFAULT);
  const [chromeVoxAnnounce, setChromeVoxAnnounce] = useState('');
  const [commandHistoryItems, setCommandHistoryItems] = useState<CommandHistoryItem[]>([
    {
      id: 'hist-init-1',
      command: 'render torus',
      timestamp: '10:00:01 AM',
      category: '3D',
      status: 'success',
      durationMs: 14,
      cwd: '/root',
      starred: true,
    },
    {
      id: 'hist-init-2',
      command: 'satcom ping',
      timestamp: '10:02:15 AM',
      category: 'NET',
      status: 'success',
      durationMs: 33,
      cwd: '/root',
      starred: true,
    },
    {
      id: 'hist-init-3',
      command: 'd3 shape force',
      timestamp: '10:05:42 AM',
      category: 'NET',
      status: 'success',
      durationMs: 22,
      cwd: '/root',
    },
  ]);

  // Macro recorder state
  const [recordingMacro, setRecordingMacro] = useState<string | null>(null);
  const macroBufferRef = useRef<string[]>([]);

  // DOM refs
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeInstance = instances.find((i) => i.id === activeInstanceId) || instances[0];

  // Auto-scroll on new terminal line
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeInstance.lines, isProcessing]);

  // Sync active speech notification from audioVoiceService to background visual
  useEffect(() => {
    const unsub = audioVoiceService.onSpeechChange((speaking, text) => {
      setEnvState((prev) => ({
        ...prev,
        activeSpeechText: speaking ? text : '',
      }));
    });
    return unsub;
  }, [setEnvState]);

  // Archive all Gemini speech responses to VFS log
  useEffect(() => {
    const unsub = audioVoiceService.onSpeechLog((text) => {
      try {
        const timestamp = new Date().toLocaleString();
        const entry = `[${timestamp}] ${text}\n`;
        vfs.writeFile('/', '/var/log/voice.log', entry, true);
      } catch (err) {
        console.error('Failed to archive speech response:', err);
      }
    });
    return unsub;
  }, []);

  // Sync speech-to-command microphone transcripts
  useEffect(() => {
    const unsub = audioVoiceService.onTranscript((transcript, isFinal) => {
      if (transcript) {
        setInputVal(transcript);
        if (isFinal) {
          appendLine(`[Spoken Voice Command]: "${transcript}"`, 'speech', '🎙️');
          handleCommandSubmit(undefined, transcript);
        }
      }
    });
    return unsub;
  }, [activeInstanceId, activeInstance.cwd]);

  // Announce listener for ChromeVox / Screen reader
  useEffect(() => {
    const unsub = audioVoiceService.onAnnounce((msg) => {
      setChromeVoxAnnounce(msg);
    });
    return unsub;
  }, []);

  // Global Ctrl+R hotkey to open history modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        setIsHistoryModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Synchronize dynamic ambient soundscape to envState.ambientSoundscape & envState.sentiment
  useEffect(() => {
    if (envState.ambientSoundscape) {
      ambientAudioService.start(envState.sentiment);
      ambientAudioService.setVolume(envState.ambientVolume);
      ambientAudioService.setHarmonic(envState.harmonicResonance);
    } else {
      ambientAudioService.stop();
    }
  }, [envState.ambientSoundscape, envState.ambientVolume, envState.harmonicResonance]);

  useEffect(() => {
    ambientAudioService.updateSentiment(envState.sentiment);
  }, [envState.sentiment]);

  // Toggle microphone input handler
  const handleToggleMic = async () => {
    audioVoiceService.playTone(880, 'sine', 70);
    const next = await audioVoiceService.toggleMicrophone();
    setIsMicListening(next);
    if (next) {
      appendLine('🎙️ Real-time microphone audio input active. Terminal border waveform & voice recognition listening...', 'good', '🎙️');
    } else {
      appendLine('Microphone audio input disabled.', 'system');
    }
  };

  // Terminal Line Logger helper
  const appendLine = useCallback(
    (text: string, type: TerminalLine['type'] = 'output', glyph?: string) => {
      const newLine: TerminalLine = {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        type,
        timestamp: new Date().toLocaleTimeString(),
        cwd: activeInstance.cwd,
        glyph,
      };
      setInstances((prev) =>
        prev.map((inst) =>
          inst.id === activeInstanceId ? { ...inst, lines: [...inst.lines, newLine] } : inst
        )
      );
    },
    [activeInstanceId, activeInstance.cwd]
  );

  // Execute terminal input submission
  const handleCommandSubmit = async (e?: React.FormEvent, overrideCmd?: string) => {
    if (e) e.preventDefault();
    const raw = (overrideCmd !== undefined ? overrideCmd : inputVal).trim();
    if (!raw) return;

    audioVoiceService.playEnterChirp();
    setInputVal('');
    setGhostSuggestion('');

    // Alias expansion
    let finalCmd = raw;
    try {
      const aliasesStr = vfs.readFile('/', '/etc/macros.json');
      const aliases = JSON.parse(aliasesStr);
      if (aliases[raw]) {
        finalCmd = aliases[raw];
        appendLine(`[Alias Expansion]: ${raw} -> ${finalCmd}`, 'system', '🏷️');
      }
    } catch (err) {
      // No aliases or invalid file, skip
    }

    const commands = finalCmd.split(';').map(c => c.trim());
    for (const cmdText of commands) {
      await executeCommand(cmdText);
    }
  };

  const executeCommand = async (raw: string) => {
    if (!raw) return;

    // Capture in macro if currently recording
    if (recordingMacro && !raw.startsWith('macro stop') && !raw.startsWith('macro cancel')) {
      macroBufferRef.current.push(raw);
    }

    // Save into history
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === activeInstanceId
          ? {
              ...inst,
              history: [...inst.history, raw],
              historyIndex: -1,
              lines: [
                ...inst.lines,
                {
                  id: `in-${Date.now()}`,
                  type: 'input',
                  text: raw,
                  timestamp: new Date().toLocaleTimeString(),
                  cwd: inst.cwd,
                },
              ],
            }
          : inst
      )
    );

    const startTime = performance.now();
    let status: 'success' | 'error' = 'success';
    try {
      await processCommand(raw);
    } catch {
      status = 'error';
    } finally {
      const durationMs = Math.round(performance.now() - startTime);
      const parts = raw.split(/\s+/);
      const cmdName = parts[0].toLowerCase();
      let category = 'SYS';
      if (['render', 'topology', 'color', 'gravity', 'speed', 'turbulence', 'burst', 'calm', 'shatter'].includes(cmdName)) category = '3D';
      else if (['gemini', 'ai', 'ask', 'voice', 'speak', 'mic', 'listen', '963'].includes(cmdName)) category = 'AI';
      else if (['ls', 'cd', 'pwd', 'cat', 'touch', 'mkdir', 'rm', 'edit', 'nano', 'tree', 'find', 'grep', 'vfs'].includes(cmdName)) category = 'VFS';
      else if (['d3', 'ping', 'netstat', 'curl', 'fetch', 'satcom', 'swarm', 'stream'].includes(cmdName)) category = 'NET';
      else if (['node', 'js', 'git', 'macro'].includes(cmdName)) category = 'DEV';

      setCommandHistoryItems((prev) => [
        ...prev,
        {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          command: raw,
          timestamp: new Date().toLocaleTimeString(),
          category,
          status,
          durationMs,
          cwd: activeInstance.cwd,
        },
      ]);

      if (envState.chromeVoxEnabled) {
        audioVoiceService.announce(`Command ${raw} finished with status ${status}.`);
      }
    }
  };

  // Main Command Processor Engine
  const processCommand = async (raw: string) => {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const argStr = args.join(' ');
    const cwd = activeInstance.cwd;

    switch (cmd) {
      case 'help':
      case '?': {
        appendLine(
          `========================================================================
⚡ HYPERTERMINAL POLYGLOT QUINE OS // COMMAND REFERENCE
========================================================================
[VFS & FILE EXPLORER]
  ls [-la] [path]        : List directory contents & permissions
  cd <path>              : Navigate virtual filesystem directory
  pwd                    : Print working directory
  cat <file>             : Output file content
  edit <file>            : Open interactive in-terminal code editor
  touch <file>           : Create empty file
  mkdir [-p] <path>      : Create directory
  rm [-r] <path>         : Remove file or directory
  tree [path]            : Hierarchical visual directory tree
  find <query>           : Search files and directory nodes
  grep <pattern> <file>  : Search text inside file or all VFS
  vfs export | reset     : Export VFS to JSON or reset to defaults

[POLYMORPHIC NEURALITY & 3D VISUAL RENDERER]
  render <topology>      : Switch geometry (torus, tesseract, singularity, neural, galaxy, spindle, dna)
  sentiment <mood>       : Alter sentiment (analytical, energetic, alarm, tranquil, cosmic, chaos)
  color <hex1> [hex2]    : Customize glowing visual color palette
  gravity <val>          : Set 4D gravitational tensor (0.2 to 3.5)
  speed <val>            : Set rotation / wave speed (0.2 to 3.0)
  turbulence <val>       : Adjust particle noise & wave distortion
  bloom <val>            : Set global glow intensity (0.0 to 5.0)
  burst                  : Trigger particle supernova explosion wave
  calm                   : Stabilize into harmonic low-entropy resonance
  shatter                : Inject chaotic high-frequency perturbation

[D3 REAL-TIME DATA STREAMS]
  d3 stream | shape      : Manage D3 background data visualizer
  ping <host>            : Network echo with radar/force visual
  netstat                : Display socket mesh force graph
  curl | fetch <url>     : HTTP data stream visualizer
  telemetry              : Dump current system/D3 state JSON

[AI CONVERSATION & IN-VISUAL VOICE]
  gemini <prompt>        : Talk to AI, alter 3D visual, speak response
  ai <prompt>            : Shortcut for gemini conversation
  voice on | off         : Toggle synthesized voice responses
  voice profile <name>   : Switch neural voice personas (sovereign, quantum, etc.)
  speak <text>           : Manually speak phrase with 3D projection
  voicelog               : Review archive of all Gemini voice responses
  963 on | off           : Toggle real 963 Hz solfeggio pure sine oscillator

[INTEGRATED SOVEREIGN PLATFORMS]
  git status | log | pull: Verify MacBook_Mirror port 8080 WebSocket
  singularity evolve     : Collapse 9 editions into Supreme Masterwork
  satcom ping | status   : 33.3ms circular rebound relay across LEO sat
  swarm status           : Monitor 6,000-node virtual agent swarm
  arbitrage scan | trade : Cross-exchange liquidity spread scanner
  voip dial <num>        : Virtual mobile VoIP & eSIM transceiver
  mcp list | call <tool> : Model Context Protocol 4 active servers
  macro record <name>    : Record terminal command sequences
  macro stop | run <name>: Save or execute macro script
  macro alias <n> "<cmd>": Create persistent alias for command chain
  quine export           : Export 100% standalone offline running HTML

[OMNI-NEXUS OS KERNEL & RECOVERY ENGINE]
  links <url|file>       : Launch text-based browser for VFS & MHTML docs
  ambient on | off | vol : Dynamic Web Audio sentiment-reactive soundscape
  harmonic <432|528|963> : Solfeggio equilibrium & multi-node consensus
  chronos beat | verify  : pseudoHash(ISO+beat) with prime 137451921129154222
  sentinel verify|restore: Dotfiles hash check & QuinRestore auto-healing
  ouroboros run | status : Recursive self-feeding loop for zero-human uptime
  mhtml list | capture   : RFC 822 circular locked sandbox (0 API tokens)
  agent verify | mdm     : NexusCommandAgent & SynapseBridge verification
  spider harvest         : Contextual log merger via Harvestertowebomnispiders
  stress <count>         : Skill Creatorial concurrent fault injection harness
  mount | umount <dev>   : Plug-n-play operating system volume manager
  engram | gdrive        : Google Drive & gemini.md memory engrams hub
  geosync [on|off]       : Sync terminal with physical node & Earth descent

[TERMINAL CONTROLS]
  history [-e]           : Open history browser or export to VFS (Ctrl+R)
  clear                  : Clear terminal viewport (Ctrl+L)
  dock <bottom|float|full> : Switch terminal docking position
  opacity <0.2-1.0>      : Adjust glass translucency
  canvas                 : Toggle pure visual canvas mode (unobstructed)
  chromevox on | off     : Toggle ARIA screen reader protocols
  contrast on | off      : Toggle high-contrast accessibility
  top                    : Real-time system monitoring HUD
  theme <cyber|matrix|aura>: Quick theme/sentiment presets
  date | uptime | whoami : System diagnostics & runtime info
========================================================================`,
          'system'
        );
        break;
      }

      case 'clear': {
        setInstances((prev) =>
          prev.map((inst) => (inst.id === activeInstanceId ? { ...inst, lines: [] } : inst))
        );
        break;
      }

      case 'pwd': {
        appendLine(cwd, 'output');
        break;
      }

      case 'whoami': {
        appendLine('root (Sovereign Operator // Zero Throttling Governor)', 'success');
        break;
      }

      case 'date': {
        appendLine(new Date().toUTCString(), 'output');
        break;
      }

      case 'uptime': {
        const s = Math.floor(performance.now() / 1000);
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        appendLine(`up ${hrs}h ${mins}m ${secs}s, 1 user, load average: 0.04, 0.01, 0.00`, 'output');
        break;
      }

      case 'top': {
        const memTotal = 16384;
        const memUsed = Math.floor(Math.random() * 4000 + 8000);
        appendLine(`Tasks: 42 total, 1 running, 41 sleeping, 0 stopped, 0 zombie
%Cpu(s):  ${(Math.random() * 5 + 2).toFixed(1)} us,  ${(Math.random() * 2 + 1).toFixed(1)} sy,  0.0 ni, 92.4 id,  0.1 wa,  0.0 hi,  0.2 si,  0.0 st
MiB Mem :  ${memTotal}.0 total,   ${memTotal - memUsed}.0 free,   ${memUsed}.0 used,   456.0 buff/cache
MiB Swap:   4096.0 total,   4096.0 free,      0.0 used.  7420.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1024 root      20   0  984210  83892  42100 R   ${(Math.random() * 4 + 1).toFixed(1)}   0.5   0:04.12 hyperterminal
    1 root      20   0    2412   1210   1024 S   0.0   0.0   0:00.08 quine-init
  512 root      20   0  142850  12410   8200 S   0.1   0.1   0:01.45 d3-stream-engine`, 'table');
        break;
      }

      case 'theme': {
        const t = (args[0] || 'cyber').toLowerCase();
        if (t === 'cyber' || t === 'cyberpunk') {
          processCommand('sentiment energetic');
          processCommand('color #00f2ff #f43f5e');
          appendLine('Theme set to [CYBERPUNK].', 'success');
        } else if (t === 'matrix' || t === 'emerald') {
          processCommand('sentiment tranquil');
          processCommand('color #10b981 #059669');
          appendLine('Theme set to [MATRIX].', 'success');
        } else if (t === 'aura' || t === 'cosmic') {
          processCommand('sentiment cosmic');
          processCommand('color #a855f7 #3b82f6');
          appendLine('Theme set to [COSMIC AURA].', 'success');
        } else {
          appendLine('Usage: theme <cyber|matrix|aura>', 'error');
        }
        break;
      }

      // ==========================================
      // VFS FILE SYSTEM COMMANDS
      // ==========================================
      case 'ls': {
        try {
          const isLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
          const target = args.find((a) => !a.startsWith('-')) || '.';
          const items = vfs.listDir(cwd, target);
          if (items.length === 0) {
            appendLine('(empty directory)', 'system');
          } else if (isLong) {
            const lines = items.map((i) => {
              const perm = i.isDir ? 'drwxr-xr-x' : i.permissions;
              const dateStr = new Date(i.modified).toLocaleTimeString();
              const size = String(i.size).padStart(6, ' ');
              return `${perm}  1 root root ${size} ${dateStr}  ${i.name}${i.isDir ? '/' : ''}`;
            });
            appendLine(lines.join('\n'), 'table');
          } else {
            const listStr = items.map((i) => (i.isDir ? `${i.name}/` : i.name)).join('   ');
            appendLine(listStr, 'output');
          }
        } catch (err: any) {
          appendLine(err.message, 'error');
          audioVoiceService.playErrorChirp();
        }
        break;
      }

      case 'cd': {
        const target = args[0] || '/root';
        const norm = vfs.normalizePath(cwd, target);
        const { node } = vfs.getNode(cwd, target);
        if (!node) {
          appendLine(`cd: ${target}: No such file or directory`, 'error');
          audioVoiceService.playErrorChirp();
        } else if (node.type !== 'directory') {
          appendLine(`cd: ${target}: Not a directory`, 'error');
          audioVoiceService.playErrorChirp();
        } else {
          setInstances((prev) =>
            prev.map((inst) => (inst.id === activeInstanceId ? { ...inst, cwd: norm } : inst))
          );
          appendLine(`Changed directory to ${norm}`, 'system');
        }
        break;
      }

      case 'cat': {
        if (!args[0]) {
          appendLine('Usage: cat <filename>', 'error');
          break;
        }
        try {
          const content = vfs.readFile(cwd, args[0]);
          appendLine(content, 'output');
        } catch (err: any) {
          appendLine(err.message, 'error');
          audioVoiceService.playErrorChirp();
        }
        break;
      }

      case 'edit':
      case 'nano':
      case 'vim': {
        if (!args[0]) {
          appendLine('Usage: edit <filename>', 'error');
          break;
        }
        const filePath = vfs.normalizePath(cwd, args[0]);
        let existingContent = '';
        try {
          existingContent = vfs.readFile(cwd, args[0]);
        } catch {
          existingContent = `// New file: ${args[0]}\n`;
        }
        setEditingFile({ path: filePath, content: existingContent });
        appendLine(`Opened interactive editor for ${filePath}. Use Save button or press Ctrl+S to write.`, 'system');
        break;
      }

      case 'touch': {
        if (!args[0]) {
          appendLine('Usage: touch <filename>', 'error');
          break;
        }
        try {
          vfs.writeFile(cwd, args[0], '');
          appendLine(`Created file: ${args[0]}`, 'success');
        } catch (err: any) {
          appendLine(err.message, 'error');
        }
        break;
      }

      case 'mkdir': {
        if (!args[0]) {
          appendLine('Usage: mkdir <directory>', 'error');
          break;
        }
        try {
          const res = vfs.mkdir(cwd, args[0]);
          appendLine(`Created directory: ${res}`, 'success');
        } catch (err: any) {
          appendLine(err.message, 'error');
        }
        break;
      }

      case 'rm': {
        if (!args[0]) {
          appendLine('Usage: rm [-r] <path>', 'error');
          break;
        }
        const target = args.find((a) => !a.startsWith('-'));
        if (target) {
          try {
            vfs.remove(cwd, target);
            appendLine(`Removed '${target}'`, 'success');
          } catch (err: any) {
            appendLine(err.message, 'error');
          }
        }
        break;
      }

      case 'tree': {
        const target = args[0] || '.';
        const treeLines = vfs.tree(cwd, target);
        appendLine(treeLines.join('\n'), 'table');
        break;
      }

      case 'find': {
        if (!args[0]) {
          appendLine('Usage: find <query>', 'error');
          break;
        }
        const results = vfs.search(args[0]);
        if (results.length === 0) {
          appendLine(`find: no matches found for '${args[0]}'`, 'system');
        } else {
          const lines = results.map((r) => `${r.isDir ? '[DIR] ' : '[FILE]'} ${r.path}`);
          appendLine(lines.join('\n'), 'output');
        }
        break;
      }

      case 'grep': {
        if (!args[0]) {
          appendLine('Usage: grep <pattern> [file]', 'error');
          break;
        }
        const results = vfs.search(args[0]);
        const fileMatches = results.filter((r) => !r.isDir && r.matchSnippet);
        if (fileMatches.length === 0) {
          appendLine(`grep: no matches found for '${args[0]}'`, 'system');
        } else {
          const lines = fileMatches.map((m) => `${m.path}: ${m.matchSnippet}`);
          appendLine(lines.join('\n'), 'output');
        }
        break;
      }

      case 'vfs': {
        const sub = (args[0] || 'status').toLowerCase();
        if (sub === 'export') {
          const json = vfs.exportJson();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vfs_export_${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          appendLine('Exported Virtual File System JSON archive.', 'success');
        } else if (sub === 'reset') {
          vfs.reset();
          appendLine('Virtual File System reset to default masterwork files.', 'success');
        } else {
          appendLine(`VFS Status: Active in localStorage   CWD: ${cwd}`, 'system');
        }
        break;
      }

      // ==========================================
      // POLYMORPHIC NEURALITY & 3D VISUALS
      // ==========================================
      case 'render': {
        const topo = (args[0] || '').toLowerCase() as TopologyType;
        const validTopos: TopologyType[] = ['torus', 'tesseract', 'singularity', 'neural', 'galaxy', 'spindle', 'dna', 'galaxy_vfs', 'robotics_lab', 'protein_fold', 'earth_nasa'];
        if (validTopos.includes(topo)) {
          setEnvState((prev) => ({ ...prev, topology: topo }));
          appendLine(`Background 3D Visualizer Topology switched to [${topo.toUpperCase()}].`, 'success', '⚡');
          if (topo === 'galaxy_vfs') {
            appendLine(`FILESYSTEM GALAXY ENGAGED. Use WASD / Arrow keys for neural traversal.`, 'system', '🌌');
          }
          audioVoiceService.playTone(880, 'sine', 100);
        } else {
          appendLine(`Usage: render <${validTopos.join('|')}>`, 'error');
        }
        break;
      }

      case 'sentiment': {
        const mood = (args[0] || '').toLowerCase() as SentimentType;
        const validMoods: SentimentType[] = ['analytical', 'energetic', 'alarm', 'tranquil', 'cosmic', 'chaos', 'creative'];
        if (validMoods.includes(mood)) {
          const colorMap: Record<SentimentType, { p: string; s: string; speed: number; grav: number; turb: number }> = {
            analytical: { p: '#00f2ff', s: '#a855f7', speed: 1.0, grav: 1.2, turb: 0.5 },
            energetic: { p: '#ffd700', s: '#ff007f', speed: 1.8, grav: 1.5, turb: 1.0 },
            alarm: { p: '#ff003c', s: '#ff8800', speed: 2.5, grav: 2.8, turb: 1.8 },
            tranquil: { p: '#10b981', s: '#00f2ff', speed: 0.6, grav: 0.8, turb: 0.2 },
            cosmic: { p: '#a855f7', s: '#3b82f6', speed: 1.1, grav: 1.4, turb: 0.8 },
            chaos: { p: '#ff00ff', s: '#00ffff', speed: 2.8, grav: 3.2, turb: 2.2 },
            creative: { p: '#a855f7', s: '#ff00ff', speed: 1.4, grav: 1.0, turb: 1.2 },
          };
          const cfg = colorMap[mood];
          setEnvState((prev) => ({
            ...prev,
            sentiment: mood,
            primaryColor: cfg.p,
            secondaryColor: cfg.s,
            speed: cfg.speed,
            gravity: cfg.grav,
            turbulence: cfg.turb,
          }));
          appendLine(`Environment sentiment modulated to [${mood.toUpperCase()}]. Shaders, colors, and particle physics updated.`, 'success', '✨');
          audioVoiceService.playTone(660, 'triangle', 120);
        } else {
          appendLine(`Usage: sentiment <${validMoods.join('|')}>`, 'error');
        }
        break;
      }

      case 'color': {
        if (!args[0]) {
          appendLine('Usage: color <primaryHex> [secondaryHex]', 'error');
          break;
        }
        const p = args[0];
        const s = args[1] || envState.secondaryColor;
        setEnvState((prev) => ({ ...prev, primaryColor: p, secondaryColor: s }));
        appendLine(`Visual chromatic palette set: Primary=${p}, Secondary=${s}`, 'success');
        break;
      }

      case 'gravity': {
        const val = parseFloat(args[0]);
        if (!isNaN(val)) {
          setEnvState((prev) => ({ ...prev, gravity: Math.max(0.1, Math.min(4.0, val)) }));
          appendLine(`4D Gravitational Tensor set to G=${val.toFixed(2)}`, 'success');
        } else {
          appendLine('Usage: gravity <0.1 - 4.0>', 'error');
        }
        break;
      }

      case 'speed': {
        const val = parseFloat(args[0]);
        if (!isNaN(val)) {
          setEnvState((prev) => ({ ...prev, speed: Math.max(0.1, Math.min(3.5, val)) }));
          appendLine(`Render rotation velocity set to ${val.toFixed(2)}x`, 'success');
        } else {
          appendLine('Usage: speed <0.1 - 3.5>', 'error');
        }
        break;
      }

      case 'turbulence': {
        const val = parseFloat(args[0]);
        if (!isNaN(val)) {
          setEnvState((prev) => ({ ...prev, turbulence: Math.max(0.0, Math.min(3.0, val)) }));
          appendLine(`Particle turbulence noise set to ${val.toFixed(2)}`, 'success');
        } else {
          appendLine('Usage: turbulence <0.0 - 3.0>', 'error');
        }
        break;
      }

      case 'burst': {
        setEnvState((prev) => ({ ...prev, speed: 2.8, turbulence: 1.8, gravity: 2.4 }));
        appendLine('Particle supernova wave pulse triggered across 3D vector space!', 'success', '💥');
        audioVoiceService.playTone(1200, 'sawtooth', 250);
        setTimeout(() => {
          setEnvState((prev) => ({ ...prev, speed: 1.0, turbulence: 0.5, gravity: 1.2 }));
        }, 3000);
        break;
      }

      case 'calm': {
        setEnvState((prev) => ({
          ...prev,
          sentiment: 'tranquil',
          primaryColor: '#10b981',
          secondaryColor: '#00f2ff',
          speed: 0.6,
          gravity: 0.8,
          turbulence: 0.2,
        }));
        appendLine('Harmonic stasis achieved. Visual renderer stabilized.', 'good', 'Ω');
        audioVoiceService.playTone(432, 'sine', 300);
        break;
      }

      case 'shatter': {
        setEnvState((prev) => ({
          ...prev,
          sentiment: 'chaos',
          primaryColor: '#ff003c',
          secondaryColor: '#ff00ff',
          speed: 2.8,
          gravity: 3.2,
          turbulence: 2.2,
        }));
        appendLine('Catastrophic resonance pulse initiated! 4D tensors distorted.', 'warn', '⚡');
        audioVoiceService.playTone(180, 'sawtooth', 350);
        break;
      }

      // ==========================================
      // AI CONVERSATION & IN-VISUAL VOICE
      // ==========================================
      case 'gemini':
      case 'ai':
      case 'ask': {
        if (!argStr) {
          appendLine('Usage: gemini <your message or query>', 'error');
          break;
        }
        setIsProcessing(true);
        appendLine(`Querying Polymorphic Neural Core: "${argStr}"...`, 'ai');

        try {
          const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: argStr,
              conversationHistory: activeInstance.lines
                .filter((l) => l.type === 'input' || l.type === 'ai')
                .map((l) => ({ role: l.type === 'input' ? 'user' : 'model', text: l.text })),
              currentEnv: {
                topology: envState.topology,
                sentiment: envState.sentiment,
              },
              engramsContext: engramsMarkdown,
            }),
          });

          if (!resp.ok) {
            throw new Error(`Server returned HTTP ${resp.status}`);
          }

          const data = await resp.json();

          // Modulate background 3D visual and D3 Stream based on AI response!
          let d3Update: Partial<EnvironmentState['d3Stream']> = {};
          if (data.d3Stream) {
            d3Update = { ...data.d3Stream, active: true };
          } else if (/network|packet|stream|telemetry|d3|node|graph|traffic|throughput|satcom|ping|cluster|socket/i.test(argStr)) {
            const chosenShape: D3StreamShape = /radar|scan|orbital/i.test(argStr)
              ? 'radar'
              : /stream|wave|bandwidth/i.test(argStr)
              ? 'streamgraph'
              : /chord|satellite|ring/i.test(argStr)
              ? 'chord'
              : 'force';
            d3Update = {
              active: true,
              shape: chosenShape,
              title: `Gemini ${chosenShape.toUpperCase()} Telemetry`,
              lastCommand: `gemini: ${argStr.slice(0, 18)}`,
              geminiTelemetrySummary: data.speechText || `Gemini Telemetry Stream: ${argStr}`,
              packetRate: Math.floor(Math.random() * 800 + 1600),
              throughputMbps: +(Math.random() * 300 + 850).toFixed(1),
            };
            audioVoiceService.playEarcon('stream');
          }

          setEnvState((prev) => ({
            ...prev,
            topology: (data.topology as TopologyType) || prev.topology,
            sentiment: (data.sentiment as SentimentType) || prev.sentiment,
            primaryColor: data.primaryColor || prev.primaryColor,
            secondaryColor: data.secondaryColor || prev.secondaryColor,
            speed: data.speed !== undefined ? data.speed : prev.speed,
            gravity: data.gravity !== undefined ? data.gravity : prev.gravity,
            turbulence: data.turbulence !== undefined ? data.turbulence : prev.turbulence,
            floatingGlyph: data.floatingGlyph || '⨋',
            d3Stream: {
              ...prev.d3Stream,
              ...d3Update,
              geminiTelemetrySummary: data.speechText || data.reply?.slice(0, 120) || prev.d3Stream.geminiTelemetrySummary,
            },
          }));

          // Render formatted response in terminal
          appendLine(data.reply || 'Response received.', 'ai', data.floatingGlyph || '⨋');

          // Trigger AI voice response & project floating speech into 3D visual!
          if (data.speechText && envState.voiceActive) {
            appendLine(`[AI Voice Projected into Visual]: "${data.speechText}"`, 'speech');
            audioVoiceService.speak(data.speechText);
          }
        } catch (err: any) {
          appendLine(`AI Query Note: ${err.message}. Using deterministic local engine.`, 'warn');
          const chosenShape: D3StreamShape = /radar|scan/i.test(argStr) ? 'radar' : /stream|wave/i.test(argStr) ? 'streamgraph' : 'force';
          setEnvState((prev) => ({
            ...prev,
            sentiment: 'analytical',
            primaryColor: '#00f2ff',
            secondaryColor: '#a855f7',
            speed: 1.2,
            d3Stream: {
              ...prev.d3Stream,
              active: true,
              shape: chosenShape,
              geminiTelemetrySummary: `Neural Stream: Query "${argStr.slice(0, 32)}" synthesized to D3 ${chosenShape}.`,
            },
          }));
          const fallbackSpeech = `Analyzed your query: ${argStr.slice(0, 30)}. Background visual modulated.`;
          appendLine(`[Neural Core]: ${fallbackSpeech}`, 'ai', '⨋');
          if (envState.voiceActive) {
            audioVoiceService.speak(fallbackSpeech);
          }
        } finally {
          setIsProcessing(false);
        }
        break;
      }

      case 'voice': {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'profile' || sub === 'persona') {
          if (args[1]) {
            const p = audioVoiceService.setVoiceProfile(args[1]);
            if (p) {
              setEnvState((prev) => ({
                ...prev,
                voiceProfile: p.id,
                voicePitch: p.pitch,
                voiceRate: p.rate,
              }));
              appendLine(`Voice Profile switched to [${p.name.toUpperCase()}] (${p.carrierFreq} Hz): ${p.description}`, 'success', '🎙️');
            } else {
              appendLine(`Unknown profile '${args[1]}'. Available: sovereign, quantum, cyber, tranquil`, 'error');
            }
          } else {
            setIsVoiceModalOpen(true);
            appendLine('Opened Neural Voice Profile selector modal.', 'system');
          }
        } else if (sub === 'on') {
          audioVoiceService.setVoiceEnabled(true);
          setEnvState((prev) => ({ ...prev, voiceActive: true }));
          appendLine('AI voice responses enabled. Speech will vocalize and project into background 3D visual.', 'success');
          audioVoiceService.speak('Voice responses online.');
        } else if (sub === 'off') {
          audioVoiceService.setVoiceEnabled(false);
          setEnvState((prev) => ({ ...prev, voiceActive: false }));
          appendLine('AI voice responses muted.', 'system');
        } else if (sub === 'tune') {
          const pitch = parseFloat(args[1] || '1.0');
          const rate = parseFloat(args[2] || '1.0');
          audioVoiceService.setVoiceParams(pitch, rate);
          setEnvState((prev) => ({ ...prev, voicePitch: pitch, voiceRate: rate }));
          appendLine(`Voice tuned: Pitch=${pitch}, Rate=${rate}x`, 'success');
        } else {
          setIsVoiceModalOpen(true);
        }
        break;
      }

      case 'speak': {
        if (!argStr) {
          appendLine('Usage: speak <text to vocalize>', 'error');
          break;
        }
        appendLine(`[Speaking]: "${argStr}"`, 'speech');
        audioVoiceService.speak(argStr);
        break;
      }

      case '963': {
        const sub = (args[0] || '').toLowerCase();
        const active = audioVoiceService.toggle963(sub === 'on' ? true : sub === 'off' ? false : undefined);
        setEnvState((prev) => ({ ...prev, solfeggio963: active }));
        appendLine(`Pure 963 Hz solfeggio oscillator ${active ? 'ENGAGED' : 'STOPPED'}.`, active ? 'success' : 'system');
        break;
      }

      case 'mic':
      case 'listen': {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'on') {
          const ok = await audioVoiceService.startMicrophone();
          setIsMicListening(ok);
          if (ok) {
            appendLine('🎙️ Microphone active. Real-time border waveform & speech command listener engaged.', 'success', '🎙️');
          } else {
            appendLine('Failed to access microphone (permission denied or no audio device).', 'error');
          }
        } else if (sub === 'off') {
          audioVoiceService.stopMicrophone();
          setIsMicListening(false);
          appendLine('Microphone disabled.', 'system');
        } else {
          const next = await audioVoiceService.toggleMicrophone();
          setIsMicListening(next);
          appendLine(
            next
              ? '🎙️ Microphone audio input active. Terminal border waveform & speech command listener engaged.'
              : 'Microphone audio input disabled.',
            next ? 'success' : 'system',
            next ? '🎙️' : undefined
          );
        }
        break;
      }

      // ==========================================
      // INTEGRATED HARDWARE / PLATFORM ENGINES
      // ==========================================
      case 'git': {
        const sub = (args[0] || 'status').toLowerCase();
        if (sub === 'status') {
          appendLine(`On branch main
Your branch is up to date with 'origin/main' (cryptichelped/MacBook_Mirror).
Mounted drive: /mnt/nexus_drive (WebSocket Live Mirror port 8080)
Working tree clean, 0 untracked files.`, 'output');
        } else if (sub === 'log') {
          appendLine(`commit c8f2a10 (HEAD -> main, origin/main)
Author: cryptichelped <nexus@hyperterminal.os>
Date:   ${new Date().toDateString()}
    Unify 9 Aurora editions into Singularity Core masterwork

commit b47e901
    Mount /mnt/nexus_drive cloud storage bridge on port 8080`, 'table');
        } else {
          appendLine(`git: command '${sub}' synchronized with MacBook_Mirror:8080.`, 'success');
        }
        break;
      }

      case 'singularity': {
        const sub = (args[0] || 'status').toLowerCase();
        if (sub === 'evolve') {
          setEnvState((prev) => ({
            ...prev,
            topology: 'singularity',
            sentiment: 'cosmic',
            primaryColor: '#ffffff',
            secondaryColor: '#a855f7',
            speed: 2.2,
            gravity: 3.0,
          }));
          appendLine('AURORA NEXUS SINGULARITY CORE: All 9 sovereign editions collapsed into Supreme Masterwork!', 'success', '🌌');
          audioVoiceService.speak('Singularity evolution complete. 9 editions unified.');
        } else {
          appendLine(`AURORA NEXUS SINGULARITY CORE
Status: 9 / 9 Editions Active   Coherence: 99.98% LOCKED
Attractor Gravity Well: Active   Mode: WITHOUT GOVERNOR`, 'output');
        }
        break;
      }

      case 'satcom': {
        const sub = (args[0] || 'status').toLowerCase();
        setEnvState((prev) => ({
          ...prev,
          d3Stream: {
            ...prev.d3Stream,
            active: true,
            shape: 'chord',
            title: 'ATSC Satcom Rebound Relay (533.25 MHz)',
            lastCommand: `satcom ${sub}`,
            throughputMbps: 914.8,
            packetRate: 2450,
            geminiTelemetrySummary: 'Satcom ATSC 4-Hop Rebound active across 6k ground & LEO node matrix.',
          },
        }));
        audioVoiceService.playEarcon('stream');

        if (sub === 'ping' || sub === 'rebound') {
          appendLine(`[SATCOM ATSC REBOUND] Injected test packet ping:
  Ground Beacon -> 6k Node Cluster -> LEO Sat 99 -> ATSC Tower 04 -> Beacon Return
  Round-Trip Latency: 33.3ms pulse   Signal: -58 dBm   Packet Drops: -0
  [D3 Satellite Constellation Chord Ring Rendered in Background]`, 'good', '📡');
          audioVoiceService.playTone(1420, 'sine', 150);
        } else {
          appendLine(`SATCOM ATSC CIRCULAR REBOUND RELAY
Frequency: 533.25 MHz UHF Channel 24 | Ping Loaded Datacom: 84.2%
Active Hops: 4 (Circular Reflection Loop Guaranteed)
[D3 Satellite Constellation Chord Ring Rendered in Background]`, 'output');
        }
        break;
      }

      case 'swarm': {
        setEnvState((prev) => ({
          ...prev,
          d3Stream: {
            ...prev.d3Stream,
            active: true,
            shape: 'force',
            title: '6,000-Node Tethermesh Swarm',
            lastCommand: 'swarm',
            nodeCount: 44,
            packetRate: 3600,
            throughputMbps: 1250.0,
            geminiTelemetrySummary: 'Tethermesh Cluster: 6,000 nodes synchronized. Threat pruning and cache defense active.',
          },
        }));
        audioVoiceService.playEarcon('stream');

        appendLine(`6,000-NODE VIRTUAL AGENT SWARM (TETHERMESH CLUSTER)
  - Vanguard Brigade : 2,000 Nodes (Threat Pruning Active)
  - Shield Division  : 2,000 Nodes (Memory & Cache Defense)
  - Recon Brigade    : 1,500 Nodes (Network Anomaly Scanning)
  - God-Sovereign    : 500 Nodes   (Soul Stone Policy Enforcers)
Status: 100% HEALTHY   Packet Drop Rate: -0.00%
[D3 6k Node Cluster Force Graph Active in Background]`, 'output');
        break;
      }

      case 'geosync': {
        const sub = (args[0] || 'on').toLowerCase();
        if (sub === 'off') {
          setEnvState(prev => ({ ...prev, topology: 'torus' }));
          appendLine('Geolocation synchronization detached. Returning to orbital torus.', 'system');
        } else {
          appendLine('Initializing Sovereign Physical Node Synchronization...', 'warn', '🛰️');
          const tel = await geoNexusService.syncTerminalWithGeo();
          setEnvState(prev => ({ ...prev, topology: 'earth_nasa' }));
          
          if (tel.weather) {
            setTimeout(() => {
              appendLine(`[AURORA GEOWEATHER]: ${tel.weather?.temp}°C, ${tel.weather?.description}. Syncing environmental shaders.`, 'ai', '⛅');
            }, 3000);
          }
          
          appendLine(`Transitioning to physical node: ${tel.plusCode} (${tel.lat.toFixed(4)}, ${tel.lng.toFixed(4)})`, 'success');
        }
        break;
      }

      case 'arbitrage': {
        appendLine(`FINANCIAL ARBITRAGE LIQUIDITY SCANNER
  * BTC/USD  (Kraken $68,420 -> Binance $69,120) : Spread +1.02%  Net: +$700.00 [OPTIMAL]
  * ETH/USDT (Coinbase $3,480 -> OKX $3,520)     : Spread +1.08%  Net: +$375.50 [OPTIMAL]
  * SOL/USDC (Raydium $178.20 -> Kraken $180.80) : Spread +1.23%  Net: +$220.00 [OPTIMAL]
Pool Liquidity: $54,820.50 USD   Stripe & Cash App Proxy Active`, 'table');
        break;
      }

      case 'voip': {
        appendLine(`VIRTUAL MOBILE VoIP & eSIM CHASSIS
  Carrier: Cryptic Sovereign Satcom eSIM (ICCID: 8901410321111859201F)
  Virtual Numbers: +1 (650) 555-GOOG, +1 (415) 555-SOV1
  Whisper STT Resolution: 384,000 Hz Sub-Atomic
  Audio Codec: OPUS_HD 128kbps Encrypted`, 'output');
        break;
      }

      case 'mcp': {
        const sub = (args[0] || 'list').toLowerCase();
        if (sub === 'list') {
          appendLine(`MODEL CONTEXT PROTOCOL (MCP) REGISTERED SERVERS:
  1. filesystem-mcp (v1.2.0) : read_file, write_file, list_dir, delete_file
  2. exec-mcp (v1.0.0)       : run_js, eval_math
  3. crypto-mcp (v1.0.0)     : sha256, uuid, base64_encode
  4. system-mcp (v1.1.0)     : get_telemetry, get_environment`, 'table');
        } else {
          appendLine(`mcp: server '${args[1] || 'default'}' responded status=OK.`, 'success');
        }
        break;
      }

      case 'voicelog': {
        try {
          const log = vfs.readFile('/', '/var/log/voice.log');
          appendLine('--- NEURAL VOICE ARCHIVE START ---', 'system');
          appendLine(log, 'output');
          appendLine('--- NEURAL VOICE ARCHIVE END ---', 'system');
        } catch (err: any) {
          appendLine(`Error reading voice log: ${err.message}`, 'error');
        }
        break;
      }

      case 'macro':
      case 'alias': {
        const sub = (args[0] || 'list').toLowerCase();
        const MACRO_FILE = '/etc/macros.json';

        const getAliases = (): Record<string, string> => {
          try {
            return JSON.parse(vfs.readFile('/', MACRO_FILE));
          } catch {
            return {};
          }
        };

        const saveAliases = (aliases: Record<string, string>) => {
          vfs.writeFile('/', MACRO_FILE, JSON.stringify(aliases, null, 2));
        };

        if (sub === 'record' || sub === 'start') {
          const name = args[1] || `macro_${Date.now().toString(36)}`;
          setRecordingMacro(name);
          macroBufferRef.current = [];
          appendLine(`Started recording macro '${name}'. Execute commands, then type 'macro stop'.`, 'warn', '⏺');
        } else if (sub === 'stop' || sub === 'save') {
          if (!recordingMacro) {
            appendLine('No macro is currently being recorded.', 'error');
          } else {
            const name = recordingMacro;
            const scriptPath = `/root/scripts/${name.endsWith('.sh') ? name : name + '.sh'}`;
            const scriptContent = `#!/bin/bash\n# Recorded Macro: ${name}\n${macroBufferRef.current.join('\n')}\n`;
            vfs.writeFile('/root', scriptPath, scriptContent);
            setRecordingMacro(null);
            appendLine(`Saved macro script '${name}' to ${scriptPath}`, 'success');
          }
        } else if (sub === 'run' || sub === 'exec') {
          if (!args[1]) {
            appendLine('Usage: macro run <name.sh>', 'error');
            break;
          }
          try {
            const code = vfs.readFile('/root', `/root/scripts/${args[1].endsWith('.sh') ? args[1] : args[1] + '.sh'}`);
            const lines = code.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
            appendLine(`Executing macro script '${args[1]}' (${lines.length} steps)...`, 'system');
            for (const line of lines) {
              await processCommand(line);
            }
          } catch (err: any) {
            appendLine(err.message, 'error');
          }
        } else if (sub === 'set' || sub === 'alias') {
          const name = args[1];
          const chain = args.slice(2).join(' ').replace(/^["']|["']$/g, '');
          if (!name || !chain) {
            appendLine('Usage: macro alias <name> "<cmd1>; <cmd2>; ..."', 'error');
            break;
          }
          const aliases = getAliases();
          aliases[name] = chain;
          saveAliases(aliases);
          appendLine(`Created alias '${name}' -> [${chain}]`, 'success', '🏷️');
        } else if (sub === 'rm' || sub === 'unalias') {
          const name = args[1];
          if (!name) {
            appendLine('Usage: macro unalias <name>', 'error');
            break;
          }
          const aliases = getAliases();
          if (aliases[name]) {
            delete aliases[name];
            saveAliases(aliases);
            appendLine(`Removed alias '${name}'.`, 'system');
          } else {
            appendLine(`Alias '${name}' not found.`, 'error');
          }
        } else {
          try {
            const scripts = vfs.listDir('/root', '/root/scripts').map((f) => f.name);
            const aliases = getAliases();
            const aliasList = Object.entries(aliases).map(([k, v]) => `  ${k.padEnd(12)} -> ${v}`);
            
            appendLine(`[MACRO ALIASES] (/etc/macros.json):\n${aliasList.length ? aliasList.join('\n') : '  (none)'}`, 'output');
            appendLine(`[MACRO SCRIPTS] (/root/scripts):\n  ${scripts.length ? scripts.join('\n  ') : '(none)'}`, 'output');
          } catch {
            appendLine('No macros found.', 'system');
          }
        }
        break;
      }

      case 'quine': {
        const sub = (args[0] || 'export').toLowerCase();
        if (sub === 'export' || sub === 'download') {
          exportQuineFile();
          appendLine('Compiled and exported self-contained Quine HTML file! Can run offline in any browser.', 'success', '♾️');
        } else {
          appendLine(`OUROBOROS QUINE ENGINE
Self-contained Single-File HTML Artifact Generator.
Current VFS, WebGL Shaders, and Terminal Engine are compiled into an immutable standalone quine.`, 'output');
        }
        break;
      }

      case 'telemetry': {
        const stats = {
          topology: envState.topology,
          sentiment: envState.sentiment,
          vfsFiles: vfs.listDir('/', '/root').length,
          primaryColor: envState.primaryColor,
          gravity: envState.gravity,
          speed: envState.speed,
          voiceActive: envState.voiceActive,
          solfeggio963: envState.solfeggio963,
          d3StreamActive: envState.d3Stream.active,
          d3Shape: envState.d3Stream.shape,
          voiceProfile: envState.voiceProfile,
          chromeVox: envState.chromeVoxEnabled,
          highContrast: envState.highContrast,
        };
        appendLine(JSON.stringify(stats, null, 2), 'table');
        break;
      }

      case 'd3': {
        const sub = (args[0] || 'stream').toLowerCase();
        if (sub === 'stream' || sub === 'toggle') {
          const next = !envState.d3Stream.active;
          setEnvState((prev) => ({
            ...prev,
            d3Stream: { ...prev.d3Stream, active: next, lastCommand: 'd3 stream' },
          }));
          audioVoiceService.playEarcon(next ? 'stream' : 'switch');
          appendLine(`D3.js Real-Time Data Stream ${next ? 'ACTIVATED in background' : 'DEACTIVATED'}.`, next ? 'success' : 'system', '⚡');
        } else if (sub === 'shape') {
          const s = (args[1] || 'force').toLowerCase() as D3StreamShape;
          if (['force', 'streamgraph', 'radar', 'chord'].includes(s)) {
            setEnvState((prev) => ({
              ...prev,
              d3Stream: { ...prev.d3Stream, active: true, shape: s, lastCommand: `d3 shape ${s}` },
            }));
            audioVoiceService.playEarcon('switch');
            appendLine(`D3 visualizer shape morphed to [${s.toUpperCase()}].`, 'success');
          } else {
            appendLine('Usage: d3 shape <force|streamgraph|radar|chord>', 'error');
          }
        } else if (sub === 'density') {
          const val = parseInt(args[1], 10);
          if (!isNaN(val) && val >= 12 && val <= 64) {
            setEnvState((prev) => ({
              ...prev,
              d3Stream: { ...prev.d3Stream, nodeCount: val },
            }));
            appendLine(`D3 node density set to ${val} nodes.`, 'success');
          } else {
            appendLine('Usage: d3 density <12 - 64>', 'error');
          }
        } else if (sub === 'speed') {
          const val = parseFloat(args[1]);
          if (!isNaN(val) && val >= 0.4 && val <= 3.0) {
            setEnvState((prev) => ({
              ...prev,
              d3Stream: { ...prev.d3Stream, intensity: val },
            }));
            appendLine(`D3 streamflow speed multiplier set to ${val.toFixed(1)}x`, 'success');
          } else {
            appendLine('Usage: d3 speed <0.4 - 3.0>', 'error');
          }
        } else if (sub === 'palette') {
          const pal = (args[1] || 'cyan').toLowerCase() as any;
          if (['cyan', 'fuchsia', 'matrix', 'amber', 'cyberpunk'].includes(pal)) {
            setEnvState((prev) => ({
              ...prev,
              d3Stream: { ...prev.d3Stream, palette: pal },
            }));
            appendLine(`D3 chromatic palette set to [${pal.toUpperCase()}].`, 'success');
          } else {
            appendLine('Usage: d3 palette <cyan|fuchsia|matrix|amber|cyberpunk>', 'error');
          }
        } else if (sub === 'panel') {
          setEnvState((prev) => ({
            ...prev,
            d3Stream: { ...prev.d3Stream, showPanel: !prev.d3Stream.showPanel },
          }));
          appendLine(`D3 telemetry HUD panel ${!envState.d3Stream.showPanel ? 'SHOWN' : 'HIDDEN'}.`, 'system');
        } else if (sub === 'burst') {
          setEnvState((prev) => ({
            ...prev,
            d3Stream: {
              ...prev.d3Stream,
              active: true,
              packetRate: 4800,
              throughputMbps: 1480.2,
              intensity: 2.5,
              lastCommand: 'd3 burst',
            },
          }));
          audioVoiceService.playEarcon('stream');
          appendLine('⚡ High-velocity packet supernova injected into D3 background canvas!', 'good', '💥');
          setTimeout(() => {
            setEnvState((prev) => ({
              ...prev,
              d3Stream: { ...prev.d3Stream, intensity: 1.0, packetRate: 1250 },
            }));
          }, 3500);
        } else {
          appendLine(`D3 Data Stream Engine: Status=${envState.d3Stream.active ? 'ACTIVE' : 'IDLE'} Shape=[${envState.d3Stream.shape}]
Usage: d3 stream | shape <force|streamgraph|radar|chord> | density <n> | speed <n> | palette <name> | panel | burst`, 'system');
        }
        break;
      }

      case 'ping': {
        const target = args[0] || 'satcom.orb.net';
        audioVoiceService.playEarcon('ping');
        setEnvState((prev) => ({
          ...prev,
          d3Stream: {
            ...prev.d3Stream,
            active: true,
            shape: prev.d3Stream.shape === 'radar' ? 'radar' : 'force',
            title: `ICMP Ping Stream -> ${target}`,
            lastCommand: `ping ${target}`,
            packetRate: Math.floor(Math.random() * 500 + 1200),
            throughputMbps: +(Math.random() * 200 + 400).toFixed(1),
            jitterMs: +(Math.random() * 0.8 + 0.4).toFixed(2),
            geminiTelemetrySummary: `Network Echo: Round-trip packet transmission verified to ${target} with zero drop.`,
          },
        }));

        appendLine(`PING ${target} (192.0.2.${Math.floor(Math.random() * 200 + 1)}): 56 data bytes
64 bytes from ${target}: icmp_seq=0 ttl=118 time=12.4 ms [D3 Stream Synchronized]
64 bytes from ${target}: icmp_seq=1 ttl=118 time=11.8 ms
64 bytes from ${target}: icmp_seq=2 ttl=118 time=13.1 ms
64 bytes from ${target}: icmp_seq=3 ttl=118 time=12.0 ms
--- ${target} ping statistics ---
4 packets transmitted, 4 received, 0.0% packet loss, rtt min/avg/max = 11.8/12.3/13.1 ms`, 'output', '📡');
        break;
      }

      case 'netstat': {
        audioVoiceService.playEarcon('stream');
        setEnvState((prev) => ({
          ...prev,
          d3Stream: {
            ...prev.d3Stream,
            active: true,
            shape: 'force',
            title: 'Socket Connection Mesh',
            lastCommand: 'netstat',
            nodeCount: 36,
            packetRate: 1850,
            throughputMbps: 924.5,
            geminiTelemetrySummary: 'Live Network Sockets: 8 TCP established, 4 UDP telemetry streams active.',
          },
        }));

        appendLine(`Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address          Foreign Address        State       D3_NODE
tcp        0      0 127.0.0.1:3000         0.0.0.0:*              LISTEN      GATEWAY-0
tcp        0      0 127.0.0.1:8080         0.0.0.0:*              LISTEN      EDGE-1
tcp        0      0 10.0.4.12:44320        142.250.190.46:443     ESTABLISHED EDGE-4
tcp        0      0 10.0.4.12:53325        533.25.MHz.atsc:sat    ESTABLISHED EDGE-8
udp        0      0 0.0.0.0:963            0.0.0.0:*                          SOLFEGGIO
udp        0      0 0.0.0.0:1420           satcom.orb.net:1420    CONNECTED   EDGE-12
[D3 Network Force Mesh Rendered in Background]`, 'table');
        break;
      }

      case 'curl':
      case 'fetch': {
        const url = args[0] || 'https://api.matrix.os/stream';
        audioVoiceService.playEarcon('stream');
        setEnvState((prev) => ({
          ...prev,
          d3Stream: {
            ...prev.d3Stream,
            active: true,
            shape: 'streamgraph',
            title: `HTTP Payload Stream (${url.slice(0, 24)})`,
            lastCommand: `curl ${url}`,
            throughputMbps: 1120.4,
            packetRate: 3400,
            geminiTelemetrySummary: `HTTP 200 Stream Transfer from ${url} complete. Bandwidth allocated.`,
          },
        }));

        appendLine(`HTTP/2 200 OK
server: Matrix-Gateway/4.1.0-sovereign
date: ${new Date().toUTCString()}
content-type: application/octet-stream; charset=binary
x-d3-stream-throughput: 1120.4 MB/s
x-telemetry-status: STREAM_ACTIVE

{"status":"ok","nodes_active":6000,"carrier":"533.25MHz","quanta_flow":"optimal"}`, 'table');
        break;
      }

      case 'history': {
        if (args[0] === '--export' || args[0] === '-e') {
          const script = `#!/bin/bash\n# HyperTerminal Session History Export\n# Exported at ${new Date().toISOString()}\n\n` +
            commandHistoryItems.map((h) => `# [${h.timestamp}] (${h.status}) in ${h.cwd}\n${h.command}`).join('\n\n');
          vfs.writeFile('/root', '/root/history_session.sh', script);
          appendLine(`Exported ${commandHistoryItems.length} command history entries to '/root/history_session.sh'.`, 'success', '💾');
        } else {
          setIsHistoryModalOpen(true);
          appendLine('Opened Interactive Command History Modal (Ctrl+R).', 'system');
        }
        break;
      }

      case 'contrast': {
        const next = args[0] === 'on' ? true : args[0] === 'off' ? false : !envState.highContrast;
        setEnvState((prev) => ({ ...prev, highContrast: next }));
        audioVoiceService.playEarcon('switch');
        appendLine(`High-Contrast visual accessibility matrix ${next ? 'ACTIVATED' : 'DISABLED'}.`, 'system');
        break;
      }

      case 'chromevox': {
        const next = args[0] === 'on' ? true : args[0] === 'off' ? false : !envState.chromeVoxEnabled;
        setEnvState((prev) => ({ ...prev, chromeVoxEnabled: next }));
        audioVoiceService.playEarcon(next ? 'success' : 'error');
        if (next) {
          audioVoiceService.announce('ChromeVox screen-reader protocol enabled for HyperTerminal.');
        }
        appendLine(`ChromeVox screen reader ARIA live protocols ${next ? 'ACTIVATED' : 'DISABLED'}.`, next ? 'success' : 'system');
        break;
      }

      case 'node':
      case 'js': {
        if (!argStr) {
          appendLine('Usage: js <expression> or node <file.js>', 'error');
          break;
        }
        let code = argStr;
        if (cmd === 'node' && args[0] && !argStr.includes(';')) {
          try {
            code = vfs.readFile(cwd, args[0]);
          } catch {
            // Treat as code
          }
        }
        try {
          const logs: string[] = [];
          const customConsole = {
            log: (...items: any[]) => logs.push(items.map((i) => typeof i === 'object' ? JSON.stringify(i) : String(i)).join(' ')),
            error: (...items: any[]) => logs.push('[ERROR] ' + items.join(' ')),
          };
          const fn = new Function('console', 'Math', `
            "use strict";
            return (() => {
              ${code}
            })();
          `);
          const res = fn(customConsole, Math);
          if (logs.length > 0) appendLine(logs.join('\n'), 'output');
          if (res !== undefined) appendLine(`=> ${JSON.stringify(res)}`, 'success');
        } catch (err: any) {
          appendLine(`Runtime Error: ${err.message}`, 'error');
        }
        break;
      }

      case 'echo': {
        appendLine(argStr.replace(/^["']|["']$/g, ''), 'output');
        break;
      }

      case 'dock': {
        const mode = (args[0] || '').toLowerCase();
        if (mode === 'bottom' || mode === 'float' || mode === 'fullscreen') {
          setEnvState((prev) => ({
            ...prev,
            terminalDock: mode === 'float' ? 'floating' : mode as any,
          }));
          appendLine(`Terminal dock switched to [${mode.toUpperCase()}].`, 'success');
        } else {
          appendLine('Usage: dock <bottom|float|fullscreen>', 'error');
        }
        break;
      }

      case 'bloom': {
        const val = parseFloat(args[0]);
        if (!isNaN(val) && val >= 0 && val <= 5) {
          setEnvState((prev) => ({ ...prev, bloomIntensity: val }));
          appendLine(`Glow Bloom intensity set to ${val.toFixed(2)}`, 'success', '✨');
          audioVoiceService.playTone(1100, 'sine', 100);
        } else {
          appendLine('Usage: bloom <0.0 - 5.0>', 'error');
        }
        break;
      }

      case 'opacity': {
        const val = parseFloat(args[0]);
        if (!isNaN(val) && val >= 0.1 && val <= 1.0) {
          setEnvState((prev) => ({ ...prev, terminalOpacity: val }));
          appendLine(`Terminal glass opacity set to ${(val * 100).toFixed(0)}%`, 'success');
        } else {
          appendLine('Usage: opacity <0.1 - 1.0>', 'error');
        }
        break;
      }

      case 'canvas': {
        setIsPureCanvas((prev) => !prev);
        appendLine('Toggled pure visual canvas mode.', 'system');
        break;
      }

      case 'links': {
        const target = args[0] || 'file:///root/gemini.md';
        setLinksInitialUrl(target);
        setIsLinksModalOpen(true);
        audioVoiceService.playTone(880, 'sine', 70);
        appendLine(`Launched Links text-based browser for: ${target}`, 'system', '🌐');
        break;
      }

      case 'ambient': {
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'on') {
          setEnvState((prev) => ({ ...prev, ambientSoundscape: true }));
          ambientAudioService.start(envState.sentiment);
          appendLine(`Dynamic Web Audio ambient soundscape ENGAGED (Tuned to ${envState.sentiment.toUpperCase()}).`, 'success', '🎵');
        } else if (sub === 'off') {
          setEnvState((prev) => ({ ...prev, ambientSoundscape: false }));
          ambientAudioService.stop();
          appendLine('Dynamic Web Audio ambient soundscape MUTED.', 'system');
        } else if (sub === 'vol' || sub === 'volume') {
          const val = parseFloat(args[1] || '0.35');
          const bounded = Math.max(0, Math.min(1, isNaN(val) ? 0.35 : val));
          setEnvState((prev) => ({ ...prev, ambientVolume: bounded }));
          ambientAudioService.setVolume(bounded);
          appendLine(`Ambient soundscape volume set to ${(bounded * 100).toFixed(0)}%`, 'success');
        } else {
          const next = !envState.ambientSoundscape;
          setEnvState((prev) => ({ ...prev, ambientSoundscape: next }));
          if (next) ambientAudioService.start(envState.sentiment);
          else ambientAudioService.stop();
          appendLine(`Ambient soundscape ${next ? 'ACTIVATED' : 'DISABLED'}.`, next ? 'success' : 'system', '🎵');
        }
        break;
      }

      case 'harmonic': {
        const mode = (args[0] || '432').toLowerCase() as '432' | '528' | '963' | 'all';
        if (['432', '528', '963', 'all'].includes(mode)) {
          setEnvState((prev) => ({ ...prev, harmonicResonance: mode }));
          ambientAudioService.setHarmonic(mode);
          const freqMap: Record<string, string> = {
            '432': '432 Hz Foundational Equilibrium (A=432Hz baseline stability)',
            '528': '528 Hz Transformation State (Data Ingestion & Miraculous Cadence)',
            '963': '963 Hz Transcendent Consensus (Multi-Node Network Agreement)',
            all: 'Triple Harmonic Resonator (432Hz + 528Hz + 963Hz Unified Consensus)',
          };
          audioVoiceService.playTone(mode === '432' ? 432 : mode === '528' ? 528 : 963, 'sine', 200, 0.04);
          appendLine(`Harmonic Resonator frequency tuned to [${freqMap[mode]}].`, 'good', 'Ω');
        } else {
          appendLine('Usage: harmonic <432|528|963|all>', 'error');
        }
        break;
      }

      case 'chronos': {
        const proof = omniNexusService.generateChronosBeat();
        audioVoiceService.playEarcon('ping');
        appendLine(`[CHRONOS HEARTBEAT // PSEUDOHASH CONTINUITY VERIFIED]
Beat Index       : #${proof.beatIndex}
ISO Timestamp    : ${proof.isoTimestamp}
Dwell Delta      : ${proof.dwellDeltaMs} ms
Canonical Prime  : ${proof.canonicalPrime} (18-Digit High-Integer Lock)
State pseudoHash : ${proof.pseudoHash}
Offline Verified : ${proof.offlineVerified ? 'YES (100% Offline State Continuity Guaranteed)' : 'FAIL'}
Coherence        : ${proof.stateCoherence}% LOCKED`, 'table', '⏱️');
        break;
      }

      case 'sentinel': {
        const sub = (args[0] || 'verify').toLowerCase();
        const res = omniNexusService.runSentinelVerification(sub === 'test-fail');
        audioVoiceService.playEarcon(res.quinRestoreStatus === 'healthy' ? 'success' : 'switch');
        appendLine(`[SENTINEL CRON VERIFIER // QUIN-RESTORE INTEGRITY MATRIX]
Dotfiles Hashed  : ${res.dotfilesHashed} files (.bash_profile, .gitconfig, tokens.json)
Golden Ledger    : ${res.goldenLedgerHash}
Current Mesh Hash: ${res.currentMeshHash}
Mismatches Found : ${res.mismatchesDetected}
QuinRestore      : [${res.quinRestoreStatus.toUpperCase()}] ${res.repairedBinaries.length > 0 ? `(Auto-healed: ${res.repairedBinaries.join(', ')})` : 'Zero tampering detected'}`, 'table', '🛡️');
        break;
      }

      case 'ouroboros': {
        const lastLine = activeInstance.lines[activeInstance.lines.length - 1]?.text || 'initial';
        const ouro = omniNexusService.executeOuroborosStep(lastLine);
        audioVoiceService.playTone(660, 'triangle', 100);
        appendLine(`[OUROBOROS PROTOCOL // INFINITE SELF-CONSUMING RUNTIME]
Iteration Cycle  : #${ouro.iteration}
Output Fuel Hash : ${ouro.fuelHash}
Entropy Damping  : ${(ouro.entropyDampened * 100).toFixed(2)}%
State            : ${ouro.nextInstruction}`, 'table', '♾️');
        break;
      }

      case 'mhtml': {
        const sub = (args[0] || 'list').toLowerCase();
        if (sub === 'list') {
          const docs = omniNexusService.getMhtmlDocs();
          const table = docs.map((d) => `  - ${d.title} (${d.sizeBytes} B) -> mhtml:///${d.id}`).join('\n');
          appendLine(`MHTML CIRCULAR LOCKED OFFLINE ARCHIVES (0 API Tokens Consumed):\n${table}`, 'output', '📦');
        } else if (sub === 'capture') {
          const url = args[1] || 'https://nexus.internal/app';
          const doc = omniNexusService.captureMhtml(url);
          appendLine(`Captured external web applet into RFC 822 MHTML Circular Lock:\n  URI: mhtml:///${doc.id}\n  Boundary: ${doc.rfc822Boundary}\n  Size: ${doc.sizeBytes} B (Sandbox offline execution verified with 0 tokens).`, 'success', '📦');
        } else if (sub === 'view') {
          const target = args[1] || 'quantum_vault.mhtml';
          setLinksInitialUrl(`mhtml:///${target}`);
          setIsLinksModalOpen(true);
          appendLine(`Opened MHTML Circular Lock in Links browser: mhtml:///${target}`, 'system');
        } else {
          appendLine('Usage: mhtml <list|capture <url>|view <doc>>', 'error');
        }
        break;
      }

      case 'agent': {
        const agentStatus = omniNexusService.verifyNexusAgent();
        audioVoiceService.playTone(963, 'sine', 120);
        appendLine(`[NEXUS COMMAND AGENT // SYNAPSE BRIDGE RUNTIME]
Recovery Volume  : ${agentStatus.recoveryVolumeMounted ? `MOUNTED at ${agentStatus.recoveryVolumePath}` : 'UNMOUNTED'}
SynapseBridge    : Port ${agentStatus.synapseBridgePort} [${agentStatus.synapseBridgeVerified ? 'SECURE_ACTIVE' : 'IDLE'}]
MDM Enrollment   : ${agentStatus.mdmEnrolled ? 'ENROLLED' : 'UNLINKED (Zero Governor Mode)'}
CSRUTIL Security : ${agentStatus.csrutilStatus.toUpperCase()}
Verification Code: ${agentStatus.verificationCode}`, 'table', '🤖');
        break;
      }

      case 'spider':
      case 'crawler': {
        const spiderRes = omniNexusService.harvestFragmentedLogs();
        audioVoiceService.playEarcon('stream');
        appendLine(`[HARVESTERTOWEBOMNISPIDERS // CONTEXTUAL LOG MERGER]
Logs Scanned     : ${spiderRes.logsScanned} log fragments
Fragments Merged : ${spiderRes.fragmentsMerged} streams
Osmosis Bandwidth: ${spiderRes.osmosisBandwidthKb} KB/s
Runtime Streams  :\n  ${spiderRes.runtimeStreamsUpdated.join('\n  ')}
Coherence Gain   : +${(spiderRes.coherenceGainPct * 100).toFixed(2)}%`, 'table', '🕷️');
        break;
      }

      case 'stress': {
        const count = parseInt(args[0] || '50', 10);
        const stress = omniNexusService.runConcurrentStressHarness(isNaN(count) ? 50 : count);
        audioVoiceService.playTone(1100, 'sawtooth', 120);
        appendLine(`[SKILL CREATORIAL // CONCURRENT FAULT INJECTION HARNESS]
Transactions     : ${stress.iterations} concurrent multi-modal streams
Execution Time   : ${stress.elapsedMs} ms (${stress.throughputPerSec} ops/sec)
Success Nodes    : ${stress.successfulNodes}
Intercepted Faults: ${stress.interceptedFaults} (Schema violations & security exploits quarantined)
Captured Logs    : ${stress.capturedErrorLogs} thread-safe error records`, 'table', '⚡');
        break;
      }

      case 'mount': {
        if (!args[0]) {
          appendLine(`MOUNTED OPERATING SYSTEM VOLUMES:
${envState.mountedDevices.map((d) => `  ${d} on / (read/write, plug-n-play, auto-attended)`).join('\n')}`, 'table');
          break;
        }
        const dev = args[0];
        const mnt = args[1] || `/mnt/${dev.replace(/[^a-z0-9]/gi, '_')}`;
        if (!envState.mountedDevices.includes(mnt)) {
          setEnvState((prev) => ({ ...prev, mountedDevices: [...prev.mountedDevices, mnt] }));
        }
        audioVoiceService.playEarcon('success');
        appendLine(`Mounted device '${dev}' on '${mnt}' [AUTO-ATTENDED PLUG-N-PLAY OK].`, 'success', '💾');
        break;
      }

      case 'umount': {
        if (!args[0]) {
          appendLine('Usage: umount <mountPoint>', 'error');
          break;
        }
        setEnvState((prev) => ({
          ...prev,
          mountedDevices: prev.mountedDevices.filter((d) => !d.includes(args[0])),
        }));
        appendLine(`Unmounted volume '${args[0]}'.`, 'system');
        break;
      }

      case 'engram':
      case 'gdrive':
      case 'gemini-md': {
        setIsEngramsModalOpen(true);
        audioVoiceService.playTone(963, 'sine', 80);
        appendLine('Opened Google Drive & gemini.md Authoritative Memory Engrams Hub.', 'system', '🧠');
        break;
      }

      default: {
        // Check if command is an alias in /etc/macros.json
        try {
          const aliases = JSON.parse(vfs.readFile('/', '/etc/macros.json'));
          if (aliases[cmd]) {
            const chain = aliases[cmd];
            const lines = chain.split(';').map((l: string) => l.trim()).filter(Boolean);
            appendLine(`Executing alias '${cmd}' -> [${chain}]`, 'system', '🏷️');
            for (const line of lines) {
              await processCommand(line);
            }
            break;
          }
        } catch {
          // No aliases or file missing, continue
        }

        // Check if command is executable script in /root/scripts
        try {
          const scriptContent = vfs.readFile(cwd, raw);
          const lines = scriptContent.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
          appendLine(`Executing script '${raw}'...`, 'system');
          for (const line of lines) {
            await processCommand(line);
          }
        } catch {
          appendLine(`Command not found: '${cmd}'. Type 'help' to inspect command matrix.`, 'error');
          audioVoiceService.playErrorChirp();
        }
        break;
      }
    }
  };

  // Autocomplete selection handler
  const handleSelectSuggestion = (cmd: string) => {
    audioVoiceService.playTone(880, 'triangle', 40);
    setInputVal(cmd);
    setGhostSuggestion('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard navigation for command input and suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    audioVoiceService.playTypingChirp();

    if (e.key === 'Escape') {
      if (showSuggestions) {
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        return;
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        const targetIndex = selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0;
        const targetCmd = suggestions[targetIndex].command;
        handleSelectSuggestion(targetCmd);
        return;
      }
      if (ghostSuggestion) {
        handleSelectSuggestion(ghostSuggestion);
        return;
      }
      const currentFiles = (() => {
        try {
          return vfs.listDir(activeInstance.cwd, '.').map((f) => (f.isDir ? `${f.name}/` : f.name));
        } catch {
          return [];
        }
      })();
      const matches = getCommandSuggestions(inputVal, 8, currentFiles);
      if (matches.length === 1) {
        handleSelectSuggestion(matches[0].command);
        return;
      } else if (matches.length > 1) {
        setSuggestions(matches);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(0);
        setGhostSuggestion(matches[0].command);
        audioVoiceService.playTone(660, 'sine', 30);
        return;
      }
    } else if (e.key === 'ArrowRight' && inputRef.current?.selectionStart === inputVal.length) {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        const targetIndex = selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0;
        const targetCmd = suggestions[targetIndex].command;
        handleSelectSuggestion(targetCmd);
        return;
      }
      if (ghostSuggestion) {
        e.preventDefault();
        handleSelectSuggestion(ghostSuggestion);
        return;
      }
    } else if (e.key === 'ArrowUp') {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        if (selectedSuggestionIndex > 0) {
          const nextIdx = selectedSuggestionIndex - 1;
          setSelectedSuggestionIndex(nextIdx);
          setGhostSuggestion(suggestions[nextIdx].command);
        } else if (selectedSuggestionIndex === 0) {
          setSelectedSuggestionIndex(-1);
          setGhostSuggestion(suggestions[0].command);
        } else {
          const nextIdx = suggestions.length - 1;
          setSelectedSuggestionIndex(nextIdx);
          setGhostSuggestion(suggestions[nextIdx].command);
        }
        return;
      }
      e.preventDefault();
      const history = activeInstance.history;
      if (history.length === 0) return;
      const nextIndex = activeInstance.historyIndex === -1 ? history.length - 1 : Math.max(0, activeInstance.historyIndex - 1);
      setInstances((prev) =>
        prev.map((i) => (i.id === activeInstanceId ? { ...i, historyIndex: nextIndex } : i))
      );
      setInputVal(history[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        const nextIdx = (selectedSuggestionIndex + 1) % suggestions.length;
        setSelectedSuggestionIndex(nextIdx);
        setGhostSuggestion(suggestions[nextIdx].command);
        return;
      }
      e.preventDefault();
      const history = activeInstance.history;
      if (activeInstance.historyIndex === -1) return;
      const nextIndex = activeInstance.historyIndex + 1;
      if (nextIndex >= history.length) {
        setInstances((prev) =>
          prev.map((i) => (i.id === activeInstanceId ? { ...i, historyIndex: -1 } : i))
        );
        setInputVal('');
      } else {
        setInstances((prev) =>
          prev.map((i) => (i.id === activeInstanceId ? { ...i, historyIndex: nextIndex } : i))
        );
        setInputVal(history[nextIndex] || '');
      }
    } else if (e.key === 'Enter') {
      if (showSuggestions && selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        e.preventDefault();
        const selectedCmd = suggestions[selectedSuggestionIndex].command;
        handleSelectSuggestion(selectedCmd);
        return;
      }
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setInstances((prev) =>
        prev.map((i) => (i.id === activeInstanceId ? { ...i, lines: [] } : i))
      );
    }
  };

  // Autocomplete matching
  const handleInputChange = (val: string) => {
    setInputVal(val);
    if (!val.trim()) {
      setGhostSuggestion('');
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }

    const currentFiles = (() => {
      try {
        return vfs.listDir(activeInstance.cwd, '.').map((f) => (f.isDir ? `${f.name}/` : f.name));
      } catch {
        return [];
      }
    })();

    const matches = getCommandSuggestions(val, 6, currentFiles);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setSelectedSuggestionIndex(-1);

    if (matches.length > 0 && matches[0].command.toLowerCase().startsWith(val.toLowerCase())) {
      setGhostSuggestion(matches[0].command);
    } else {
      setGhostSuggestion('');
    }
  };

  // Instance tab management
  const spawnNewInstance = () => {
    const newId = `inst-${instances.length + 1}`;
    const newInst: TerminalInstance = {
      id: newId,
      title: `shell-${instances.length + 1}`,
      cwd: '/root',
      mode: 'bash',
      lines: [
        {
          id: `line-${Date.now()}`,
          type: 'system',
          text: `Spawned terminal instance #${newId} [SOVEREIGN_ROOT]. Ready for execution.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      history: [],
      historyIndex: -1,
      draft: '',
      active: true,
    };
    setInstances((prev) => [...prev, newInst]);
    setActiveInstanceId(newId);
    appendLine(`Spawned new shell instance: ${newId}`, 'success');
  };

  const closeInstance = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (instances.length <= 1) return;
    const remaining = instances.filter((i) => i.id !== id);
    setInstances(remaining);
    if (activeInstanceId === id) {
      setActiveInstanceId(remaining[0].id);
    }
  };

  // Terminal Container positioning classes based on dock state
  let containerPositionClass = 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[96vw] max-w-5xl h-[440px]';
  if (envState.terminalDock === 'fullscreen') {
    containerPositionClass = 'fixed inset-4 w-auto h-auto';
  } else if (envState.terminalDock === 'floating') {
    containerPositionClass = 'fixed top-16 right-6 w-[560px] h-[520px]';
  }

  return (
    <>
      {/* Pure Canvas Floating Restore Trigger when minimized */}
      {isPureCanvas && (
        <button
          onClick={() => setIsPureCanvas(false)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border border-cyan-400 bg-black/80 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_25px_rgba(0,242,255,0.4)] flex items-center gap-2 hover:bg-black transition cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>RESTORE HYPERTERMINAL UI (100% VISUAL MODE ACTIVE)</span>
        </button>
      )}

      {/* The Sole UI: HyperTerminal Container */}
      {!isPureCanvas && (
        <div
          className={`${containerPositionClass} z-30 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 font-mono select-none relative`}
          style={{
            backgroundColor: envState.highContrast ? 'rgba(0, 0, 0, 0.98)' : `rgba(4, 9, 20, ${envState.terminalOpacity})`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: envState.highContrast ? '2px solid #00f2ff' : `1px solid ${envState.primaryColor}55`,
            boxShadow: envState.highContrast
              ? '0 0 30px rgba(0, 242, 255, 0.5), inset 0 0 20px rgba(0, 242, 255, 0.2)'
              : `0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px ${envState.primaryColor}22`,
          }}
        >
          {/* Real-time Microphone Audio Waveform & Pulse Border */}
          <TerminalBorderWaveform
            primaryColor={envState.primaryColor}
            secondaryColor={envState.secondaryColor}
            isMicActive={isMicListening}
            onToggleMic={handleToggleMic}
          />

          {/* Header Bar */}
          <div
            className="h-10 bg-black/75 px-3 flex items-center justify-between border-b shrink-0 text-xs gap-2 select-none relative z-10"
            style={{ borderColor: `${envState.primaryColor}33` }}
          >
            {/* Shell Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  onClick={() => setActiveInstanceId(inst.id)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-2 cursor-pointer transition ${
                    inst.id === activeInstanceId
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                      : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <TerminalIcon className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[120px]">{inst.title}</span>
                  {instances.length > 1 && (
                    <button
                      onClick={(e) => closeInstance(inst.id, e)}
                      className="hover:text-rose-400 p-0.5 rounded"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={spawnNewInstance}
                className="p-1.5 rounded-lg bg-black/40 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer"
                title="Spawn New Shell Instance"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Actions & Header Controls */}
            <div className="flex items-center gap-1.5 text-[11px] shrink-0">
              {/* Microphone Audio Input & Border Waveform Toggle */}
              <button
                onClick={handleToggleMic}
                className={`px-2 py-1 rounded-md border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  isMicListening
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Real-Time Microphone Input for Border Waveform & Voice Commands"
              >
                {isMicListening ? <Mic className="w-3 h-3 text-emerald-400 animate-pulse" /> : <MicOff className="w-3 h-3 text-slate-400" />}
                <span className="hidden sm:inline">{isMicListening ? 'MIC ON' : 'MIC'}</span>
              </button>

              {/* 963Hz Solfeggio */}
              <button
                onClick={() => {
                  const on = audioVoiceService.toggle963();
                  setEnvState((prev) => ({ ...prev, solfeggio963: on }));
                }}
                className={`px-2 py-1 rounded-md border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  envState.solfeggio963
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle 963 Hz Solfeggio Pure Wave"
              >
                <Volume2 className="w-3 h-3" />
                <span className="hidden sm:inline">963Hz</span>
              </button>

              {/* Real-time D3 Stream Toggle */}
              <button
                onClick={() => {
                  const next = !envState.d3Stream.active;
                  setEnvState((prev) => ({
                    ...prev,
                    d3Stream: { ...prev.d3Stream, active: next, lastCommand: 'toolbar toggle' },
                  }));
                  audioVoiceService.playEarcon(next ? 'stream' : 'switch');
                }}
                className={`px-2 py-1 rounded-md border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  envState.d3Stream.active
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,255,0.35)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Real-Time D3.js Data Stream Background Visualizer"
              >
                <Network className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">D3 STREAM</span>
              </button>

              {/* Dynamic Sentiment Ambient Soundscape */}
              <button
                onClick={() => {
                  const next = !envState.ambientSoundscape;
                  setEnvState((prev) => ({ ...prev, ambientSoundscape: next }));
                  if (next) ambientAudioService.start(envState.sentiment);
                  else ambientAudioService.stop();
                }}
                className={`px-2 py-1 rounded-md border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  envState.ambientSoundscape
                    ? 'bg-purple-500/25 text-purple-300 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Web Audio Dynamic Ambient Soundscape (Reacts to Sentiment & Solfeggio)"
              >
                <Music className="w-3 h-3 text-purple-400" />
                <span className="hidden lg:inline">{envState.ambientSoundscape ? `AMBIENT: ${envState.sentiment.toUpperCase()}` : 'AMBIENT'}</span>
              </button>

              {/* Links Text Browser Modal Trigger */}
              <button
                onClick={() => {
                  setLinksInitialUrl('file:///root/gemini.md');
                  setIsLinksModalOpen(true);
                }}
                className="px-2 py-1 rounded-md bg-black/40 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Open Links Text-Based Browser (links / lynx)"
              >
                <BookOpen className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">LINKS</span>
              </button>

              {/* Google Drive & Memory Engrams Modal Trigger */}
              <button
                onClick={() => setIsEngramsModalOpen(true)}
                className="px-2 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Open Google Drive & gemini.md Memory Engrams Hub"
              >
                <Cloud className="w-3 h-3 text-purple-400" />
                <span className="hidden md:inline">G-DRIVE</span>
              </button>

              {/* Neural Voice Profile Selector Modal */}
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className={`px-2 py-1 rounded-md border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  envState.voiceActive
                    ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                    : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Open Neural Voice & ChromeVox Profile Matrix"
              >
                <Radio className="w-3 h-3 text-purple-400" />
                <span className="hidden sm:inline">VOICE: {envState.voiceProfile.toUpperCase()}</span>
              </button>

              {/* Command History Modal Trigger (Ctrl+R) */}
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-2 py-1 rounded-md bg-black/40 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Open Interactive Command History Browser (Ctrl+R)"
              >
                <HistoryIcon className="w-3 h-3 text-cyan-400" />
                <span className="hidden md:inline">HISTORY</span>
              </button>

              {/* Quine Download */}
              <button
                onClick={exportQuineFile}
                className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Export Standalone Offline Quine HTML"
              >
                <Download className="w-3 h-3" />
                <span className="hidden md:inline">QUINE</span>
              </button>

              {/* Bloom Intensity Slider */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-black/40 border border-slate-800">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.1"
                  value={envState.bloomIntensity}
                  onChange={(e) => setEnvState(prev => ({ ...prev, bloomIntensity: parseFloat(e.target.value) }))}
                  className="w-16 h-1 accent-amber-500 cursor-pointer"
                  title={`Glow Intensity: ${envState.bloomIntensity.toFixed(1)}`}
                />
                <span className="text-[9px] text-amber-300 font-mono hidden xl:inline">GLOW</span>
              </div>

              {/* Opacity Cycle */}
              <button
                onClick={() => {
                  const next = envState.terminalOpacity <= 0.3 ? 0.85 : envState.terminalOpacity <= 0.6 ? 0.95 : 0.25;
                  setEnvState((prev) => ({ ...prev, terminalOpacity: next }));
                }}
                className="px-2 py-1 rounded-md bg-black/40 border border-slate-800 text-slate-300 hover:text-white text-[10px] transition cursor-pointer"
                title="Cycle Glass Opacity"
              >
                {(envState.terminalOpacity * 100).toFixed(0)}%
              </button>

              {/* Pure Canvas (Hide Terminal) */}
              <button
                onClick={() => setIsPureCanvas(true)}
                className="px-2 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Hide Terminal to admire 100% Visual Renderer"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden md:inline">CANVAS</span>
              </button>

              {/* Dock State Toggle */}
              <button
                onClick={() => {
                  const next = envState.terminalDock === 'bottom' ? 'floating' : envState.terminalDock === 'floating' ? 'fullscreen' : 'bottom';
                  setEnvState((prev) => ({ ...prev, terminalDock: next }));
                }}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                title="Toggle Dock Layout (Bottom / Float / Fullscreen)"
              >
                {envState.terminalDock === 'fullscreen' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Clear */}
              <button
                onClick={() => processCommand('clear')}
                className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                title="Clear Terminal Output (Ctrl+L)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Command Stream & Inline Code Editor */}
          <div ref={scrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-2 text-xs select-text font-mono">
            {/* Inline Editor Overlay if user ran edit/nano */}
            {editingFile && (
              <div className="p-3 bg-slate-950/95 border border-cyan-500/50 rounded-xl space-y-2.5 shadow-2xl mb-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/30">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">{editingFile.path}</span>
                    <span className="text-[10px] text-slate-400">({editingFile.content.length} bytes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        vfs.writeFile(activeInstance.cwd, editingFile.path, editingFile.content);
                        appendLine(`Saved updates to ${editingFile.path}`, 'success');
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => setEditingFile(null)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] cursor-pointer"
                    >
                      Close Editor
                    </button>
                  </div>
                </div>
                <textarea
                  value={editingFile.content}
                  onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                  className="w-full h-48 bg-black/90 p-2.5 text-slate-100 font-mono text-xs border border-slate-800 rounded outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Standard Terminal Output Lines */}
            {activeInstance.lines.map((line) => {
              let textCol = 'text-slate-200';
              if (line.type === 'input') textCol = 'text-cyan-300 font-bold';
              else if (line.type === 'system') textCol = 'text-purple-300';
              else if (line.type === 'success') textCol = 'text-emerald-400 font-semibold';
              else if (line.type === 'error') textCol = 'text-rose-400 font-bold';
              else if (line.type === 'ai') textCol = 'text-amber-200';
              else if (line.type === 'speech') textCol = 'text-pink-300 italic';
              else if (line.type === 'table') textCol = 'text-cyan-200 font-mono';

              return (
                <div key={line.id} className="leading-relaxed">
                  {line.type === 'input' ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-rose-500 font-bold select-none text-[11px]">$</span>
                      <span className="text-cyan-400/70 select-none text-[10px]">{line.cwd || '/root'}</span>
                      <span className={textCol}>{line.text}</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      {line.glyph && (
                        <span className="text-amber-400 font-orbitron font-bold select-none text-[11px]">
                          {line.glyph}
                        </span>
                      )}
                      <div className={`whitespace-pre-wrap break-words flex-1 ${textCol}`}>
                        {line.text}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-cyan-400 font-bold animate-pulse text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Polymorphic Neural Core Processing &amp; Altering Shaders...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips Bar */}
          <div className="px-3 py-1 bg-black/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] shrink-0">
            <span className="text-slate-500 font-bold shrink-0">QUICK:</span>
            {[
              'help',
              'links file:///root/gemini.md',
              'ambient on',
              'chronos beat',
              'sentinel verify',
              'render tesseract',
              'render singularity',
              'harmonic 432',
              'gemini explain quantum coherence',
              'satcom ping',
              'singularity evolve',
              'quine export',
              'calm',
            ].map((quick) => (
              <button
                key={quick}
                onClick={() => handleCommandSubmit(undefined, quick)}
                className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 whitespace-nowrap cursor-pointer transition text-[9px]"
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Terminal Input Bar with Autocomplete & Ghost Completion */}
          <form
            onSubmit={(e) => {
              setShowSuggestions(false);
              handleCommandSubmit(e);
            }}
            className="p-3 bg-black/85 border-t border-cyan-500/30 flex items-center gap-2 relative shrink-0"
          >
            {/* Intelligent Command Auto-Complete Dropdown Menu */}
            {showSuggestions && suggestions.length > 0 && (
              <CommandAutocomplete
                suggestions={suggestions}
                selectedIndex={selectedSuggestionIndex}
                onSelect={(cmd) => handleSelectSuggestion(cmd)}
                onHover={(idx) => setSelectedSuggestionIndex(idx)}
                query={inputVal}
                primaryColor={envState.primaryColor}
                secondaryColor={envState.secondaryColor}
              />
            )}

            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs select-none shrink-0">
              <span className="text-white hidden sm:inline">root@polyglot-quine</span>
              <span className="text-white sm:hidden">root</span>
              <span className="text-slate-500 hidden md:inline">[{activeInstance.cwd}]</span>
              <span className="text-amber-400 hidden lg:inline">({envState.sentiment})</span>
              <span className="text-rose-500 font-black">$</span>
            </div>

            {/* Real-Time Syntax Highlighter & Input with Ghost Autocomplete */}
            <TerminalSyntaxInput
              value={inputVal}
              onChange={(val) => handleInputChange(val)}
              onKeyDown={handleKeyDown}
              onSubmit={handleCommandSubmit}
              ghostSuggestion={ghostSuggestion}
              inputRef={inputRef}
              disabled={isProcessing}
            />

            {/* Quick Microphone Input & Voice Command Trigger Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-1.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isMicListening
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : 'bg-black/50 text-slate-400 border-slate-800 hover:text-cyan-300 hover:border-cyan-500/40'
              }`}
              title={isMicListening ? "Microphone Active (Speaking commands) - Click to Mute" : "Activate Microphone to Speak Commands & Modulate Waveform"}
            >
              {isMicListening ? <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(0,242,255,0.3)] transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>RUN</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}

      {/* Real-Time D3.js Data Stream Background Visualizer */}
      <D3DataStreamVisualizer
        config={envState.d3Stream}
        onConfigChange={(updated) =>
          setEnvState((prev) => ({
            ...prev,
            d3Stream: { ...prev.d3Stream, ...updated },
          }))
        }
        primaryColor={envState.primaryColor}
        secondaryColor={envState.secondaryColor}
        sentiment={envState.sentiment}
      />

      {/* Interactive Command History Browser Modal (Ctrl+R / 'history') */}
      <CommandHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyItems={commandHistoryItems}
        onSelectCommand={(cmd, executeImmediately) => {
          if (executeImmediately) {
            handleCommandSubmit(undefined, cmd);
          } else {
            setInputVal(cmd);
            inputRef.current?.focus();
          }
        }}
        onClearHistory={() => {
          setCommandHistoryItems([]);
          audioVoiceService.playTone(220, 'sawtooth', 80);
          appendLine('Command history cleared.', 'system');
        }}
        onToggleStar={(id) => {
          setCommandHistoryItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item))
          );
        }}
        onExportHistory={() => {
          const script = `#!/bin/bash\n# HyperTerminal Session History Export\n# Exported at ${new Date().toISOString()}\n\n` +
            commandHistoryItems.map((h) => `# [${h.timestamp}] (${h.status}) in ${h.cwd}\n${h.command}`).join('\n\n');
          vfs.writeFile('/root', '/root/history_session.sh', script);
          appendLine(`Exported ${commandHistoryItems.length} history commands to /root/history_session.sh`, 'success', '💾');
        }}
      />

      {/* Multi-Faceted Neural Voice & ChromeVox Accessibility Profile Modal */}
      <VoiceProfileModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentProfileId={envState.voiceProfile}
        onSelectProfile={(profileId) => {
          setEnvState((prev) => ({ ...prev, voiceProfile: profileId }));
          appendLine(`Voice profile set to: ${profileId.toUpperCase()}`, 'success');
        }}
        pitch={envState.voicePitch}
        rate={envState.voiceRate}
        onPitchChange={(p) => setEnvState((prev) => ({ ...prev, voicePitch: p }))}
        onRateChange={(r) => setEnvState((prev) => ({ ...prev, voiceRate: r }))}
        chromeVoxEnabled={envState.chromeVoxEnabled}
        onToggleChromeVox={(enabled) => setEnvState((prev) => ({ ...prev, chromeVoxEnabled: enabled }))}
        highContrast={envState.highContrast}
        onToggleHighContrast={(enabled) => setEnvState((prev) => ({ ...prev, highContrast: enabled }))}
      />

      {/* Links Text-Based Web & VFS Browser Modal */}
      <LinksBrowserModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        initialUrl={linksInitialUrl}
      />

      {/* Google Drive & gemini.md Authoritative Memory Engrams Modal */}
      <GoogleDriveEngramsModal
        isOpen={isEngramsModalOpen}
        onClose={() => setIsEngramsModalOpen(false)}
        onInjectEngramToPrompt={(text) => {
          setInputVal(text);
          inputRef.current?.focus();
        }}
        onEngramsUpdated={(txt) => setEngramsMarkdown(txt)}
      />

      {/* ChromeVox Screen Reader ARIA Live Announcer Region */}
      <div
        id="chromevox-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only pointer-events-none"
      >
        {chromeVoxAnnounce}
      </div>
    </>
  );
};
