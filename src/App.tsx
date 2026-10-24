import React, { useState, useEffect } from 'react';
import { VisualRenderer3D } from './components/VisualRenderer3D';
import { HyperTerminal } from './components/HyperTerminal';
import { ResonanceConsole } from './components/ResonanceConsole';
import { GaiaCognitionPanel } from './components/GaiaCognitionPanel';
import { startNexusSync } from './services/nexusEvolutionSync.mjs';
import { YouTubeBackgroundPlayer } from './components/YouTubeBackgroundPlayer';
import { XYouTubeAICard } from './components/XYouTubeAICard';
import { GaiaConnectionCenter } from './components/GaiaConnectionCenter';
import { CrystallineCrossvoidGate } from './components/CrystallineCrossvoidGate';
import { NexusSystemPages } from './components/NexusSystemPages';
import { EnvironmentState } from './types';
import { DEFAULT_RGB_LED_CONFIG } from './services/colorProfileService';
import { DEFAULT_YOUTUBE_STATE } from './services/youtubeService';

export function App() {
  // Global Environment State governing the 100% Background Visual Renderer & Terminal
  const [envState, setEnvState] = useState<EnvironmentState>({
    topology: 'torus',
    sentiment: 'creative',
    primaryColor: '#c084fc',
    secondaryColor: '#00f2ff',
    speed: 1.05,
    gravity: 1.2,
    turbulence: 0.5,
    cameraDistance: 140,
    floatingGlyph: '✨',
    activeSpeechText: 'HyperPolyglot visual and terminal interface ready. Live AI depends on an authenticated provider.',
    voiceActive: true,
    voicePitch: 1.15,
    voiceRate: 1.02,
    voiceName: '',
    voiceProfile: 'gemini_female',
    solfeggio963: false,
    wireframe: true,
    bloomIntensity: 1.2,
    audioReactiveLevel: 1.0,
    terminalOpacity: 0.85,
    terminalDock: 'center',
    highContrast: false,
    chromeVoxEnabled: false,
    ambientSoundscape: false,
    ambientVolume: 0.35,
    harmonicResonance: '432',
    mountedDevices: [],
    rgbLed: DEFAULT_RGB_LED_CONFIG,
    youtube: DEFAULT_YOUTUBE_STATE,
    d3Stream: {
      active: false,
      shape: 'force',
      title: 'Orbital Mesh Telemetry Stream',
      packetRate: 0,
      throughputMbps: 0,
      nodeCount: 0,
      linkTension: 0.7,
      jitterMs: 0,
      packetLossPct: 0,
      palette: 'cyan',
      geminiTelemetrySummary: 'No verified network telemetry source is connected.',
      showPanel: false,
      lastCommand: 'idle',
      intensity: 1.0,
    },
  });

  // One sync listener, atomic Mesh v4 metadata reconciliation, no full-canvas remount.
  useEffect(() => startNexusSync(window), []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02050b] select-none font-mono">
      {/* Public builds have no inherited Google/GitHub identity. This is a display
          of application scope, not a claim about third-party browser cookies. */}
      <div role="status" className="pointer-events-none fixed left-3 top-3 z-40 max-w-[260px] rounded-lg border border-slate-700/70 bg-slate-950/75 px-2 py-1 text-[10px] text-slate-300 backdrop-blur-md">
        PUBLIC TERMINAL · GUEST BY DEFAULT
      </div>
      {/* Dynamic YouTube Background Video Player & Content Transition Layer */}
      <YouTubeBackgroundPlayer envState={envState} setEnvState={setEnvState} />
      {/* Optional X/Grok chat card: authenticated local provider and genuine YouTube embed. */}
      <XYouTubeAICard envState={envState} />
      {/* Continuous *measured* account/service status; one-shot authorized toasts. */}
      <GaiaConnectionCenter />

      {/* 100% Visual Background Renderer (Polymorphic Neurality) */}
      <VisualRenderer3D envState={envState} />

      {/* The Sole UI: Sovereign HyperTerminal */}
      <HyperTerminal envState={envState} setEnvState={setEnvState} />

      {/* Explicit opt-in mathematical field console; original HyperTerminal stays intact. */}
      <ResonanceConsole />
      <GaiaCognitionPanel />
      {/* Private/live data requires each device to pair with its local bridge. */}
      <NexusSystemPages />
      {/* Public CrossVoid visual entry. All authentication remains at Cryptic News. */}
      <CrystallineCrossvoidGate />
    </div>
  );
}

export default App;
