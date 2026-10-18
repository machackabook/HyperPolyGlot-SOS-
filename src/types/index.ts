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
  | 'dna';

export type SentimentType =
  | 'analytical'
  | 'energetic'
  | 'alarm'
  | 'tranquil'
  | 'cosmic'
  | 'chaos';

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
  solfeggio963: boolean;
  wireframe: boolean;
  bloomIntensity: number;
  audioReactiveLevel: number;
  terminalOpacity: number;
  terminalDock: 'bottom' | 'floating' | 'fullscreen';
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
