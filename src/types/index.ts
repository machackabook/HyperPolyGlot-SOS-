/**
 * HyperTerminal Polyglot Quine OS - Types & Interfaces
 */

export type TopologyType =
  | 'torus'
  | 'tesseract'
  | 'singularity'
  | 'neural'
  | 'galaxy'
  | 'spindle'
  | 'dna'
  | 'dna'
  | 'galaxy_vfs'
  | 'robotics_lab'
  | 'protein_fold'
  | 'earth_nasa';

export type SentimentType =
  | 'analytical'
  | 'energetic'
  | 'alarm'
  | 'tranquil'
  | 'cosmic'
  | 'chaos'
  | 'creative';

export type D3StreamShape = 'force' | 'streamgraph' | 'radar' | 'chord';

export interface D3StreamConfig {
  active: boolean;
  shape: D3StreamShape;
  title: string;
  packetRate: number; // packets/sec
  throughputMbps: number; // MB/s
  nodeCount: number;
  linkTension: number;
  jitterMs: number;
  packetLossPct: number;
  palette: 'cyan' | 'fuchsia' | 'matrix' | 'amber' | 'cyberpunk';
  geminiTelemetrySummary: string;
  showPanel: boolean;
  lastCommand: string;
  intensity: number;
}

export interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: string;
  category: string;
  status: 'success' | 'error' | 'pending';
  durationMs: number;
  cwd: string;
  starred?: boolean;
}

export interface EnvironmentState {
  topology: TopologyType;
  sentiment: SentimentType;
  primaryColor: string;
  secondaryColor: string;
  speed: number;
  gravity: number;
  turbulence: number;
  cameraDistance: number;
  floatingGlyph: string;
  activeSpeechText: string;
  voiceActive: boolean;
  voicePitch: number;
  voiceRate: number;
  voiceName: string;
  voiceProfile: string;
  solfeggio963: boolean;
  wireframe: boolean;
  bloomIntensity: number;
  audioReactiveLevel: number;
  terminalOpacity: number;
  terminalDock: 'bottom' | 'floating' | 'fullscreen';
  highContrast: boolean;
  chromeVoxEnabled: boolean;
  d3Stream: D3StreamConfig;
  ambientSoundscape: boolean;
  ambientVolume: number;
  harmonicResonance: '432' | '528' | '963' | 'all';
  mountedDevices: string[];
}

export interface LinksBrowserPage {
  url: string;
  title: string;
  content: string;
  protocol: 'file' | 'mhtml' | 'https' | 'nexus';
  links: { text: string; target: string; index: number }[];
}

export interface EngramMemory {
  id: string;
  title: string;
  epoch: string;
  tags: string[];
  excerpt: string;
  fullMarkdown: string;
  primeAnchor: string;
  syncedToGdrive: boolean;
  lastUpdated: string;
}

export interface ChronosHeartbeatProof {
  beatIndex: number;
  isoTimestamp: string;
  dwellDeltaMs: number;
  pseudoHash: string;
  canonicalPrime: string;
  stateCoherence: number;
  offlineVerified: boolean;
}

export interface SentinelVerificationResult {
  dotfilesHashed: number;
  goldenLedgerHash: string;
  currentMeshHash: string;
  mismatchesDetected: number;
  quinRestoreStatus: 'healthy' | 'repaired' | 'quarantined';
  repairedBinaries: string[];
}

export interface VfsFileMetadata {
  created: number;
  modified: number;
  permissions: string;
  size: number;
}

export interface VfsNode {
  type: 'file' | 'directory';
  content?: string;
  children?: { [key: string]: VfsNode };
  metadata?: VfsFileMetadata;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system' | 'ai' | 'speech' | 'table' | 'good' | 'warn';
  text: string;
  timestamp: string;
  cwd?: string;
  glyph?: string;
  metadata?: Record<string, any>;
}

export interface TerminalInstance {
  id: string;
  title: string;
  cwd: string;
  mode: 'bash' | 'js' | 'gemini' | 'mcp';
  lines: TerminalLine[];
  history: string[];
  historyIndex: number;
  draft: string;
  active: boolean;
}

export interface AIResponsePayload {
  source: string;
  reply: string;
  speechText: string;
  sentiment: SentimentType;
  topology: TopologyType;
  primaryColor: string;
  secondaryColor: string;
  speed?: number;
  gravity?: number;
  turbulence?: number;
  floatingGlyph?: string;
  d3Stream?: Partial<D3StreamConfig>;
}

export interface CommandContext {
  cwd: string;
  setCwd: (path: string) => void;
  env: Record<string, string>;
  setEnv: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
  addOutput: (text: string, type?: TerminalLine['type'], glyph?: string) => void;
  clearTerminal: () => void;
  speakText: (text: string) => void;
  playTone: (freq?: number, type?: OscillatorType, durationMs?: number) => void;
}

export type DevicePermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface DeviceCapabilityTelemetry {
  permissions: {
    microphone: DevicePermissionStatus;
    clipboardRead: DevicePermissionStatus;
    clipboardWrite: DevicePermissionStatus;
    notifications: DevicePermissionStatus;
    geolocation: DevicePermissionStatus;
    screenWakeLock: DevicePermissionStatus;
  };
  battery: {
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  } | null;
  network: {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  hardware: {
    logicalCores: number;
    touchPoints: number;
    memoryGB?: number;
    deviceMemoryGb?: number;
  };
  wakeLockActive: boolean;
  onDeviceAI: {
    supported: boolean;
    status: string;
    modelAvailable?: boolean;
  };
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    pixelRatio: number;
    colorDepth: number;
    orientation: string;
    fullscreen: boolean;
  };
}

export interface TextFragmentMatch {
  id: string;
  text: string;
  fragmentUrl: string;
  index?: number;
  occurrenceIndex?: number;
  totalOccurrences?: number;
  fullSnippet?: string;
  targetSelector?: string;
  element?: HTMLElement;
  boundingRect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface BrowserExecutionResult {
  id: string;
  code: string;
  result: any;
  resultType: string;
  executionTimeMs: number;
  timestamp: string;
  error?: string;
}

export interface A11yNavigationState {
  focusedElementSelector: string;
  focusedRole: string;
  focusedAriaLabel: string;
  focusedText: string;
  lastAnnouncement: string;
  announcementHistory: string[];
  totalTraversableElements: number;
  currentElementIndex: number;
}

export interface DeviceAssistAction {
  action: 'highlight_fragment' | 'wakelock' | 'notify' | 'screen_reader' | 'vibrate' | 'clipboard' | 'browser_exec' | 'none';
  param?: string;
  description: string;
  status: 'success' | 'failed' | 'unsupported';
}
