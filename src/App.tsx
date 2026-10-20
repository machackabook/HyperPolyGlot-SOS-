import React, { useState } from 'react';
import { VisualRenderer3D } from './components/VisualRenderer3D';
import { HyperTerminal } from './components/HyperTerminal';
import { EnvironmentState } from './types';

export function App() {
  // Global Environment State governing the 100% Background Visual Renderer & Terminal
  const [envState, setEnvState] = useState<EnvironmentState>({
    topology: 'torus',
    sentiment: 'analytical',
    primaryColor: '#00f2ff',
    secondaryColor: '#a855f7',
    speed: 1.0,
    gravity: 1.2,
    turbulence: 0.5,
    cameraDistance: 140,
    floatingGlyph: '⨋',
    activeSpeechText: 'Polymorphic Neural Core Online. Waiting for operator directive.',
    voiceActive: true,
    voicePitch: 1.0,
    voiceRate: 1.05,
    voiceName: '',
    voiceProfile: 'sovereign',
    solfeggio963: false,
    wireframe: true,
    bloomIntensity: 1.2,
    audioReactiveLevel: 1.0,
    terminalOpacity: 0.85,
    terminalDock: 'bottom',
    highContrast: false,
    chromeVoxEnabled: false,
    ambientSoundscape: false,
    ambientVolume: 0.35,
    harmonicResonance: '432',
    mountedDevices: ['/mnt/nexus_drive', '/mnt/recovery', '/mnt/httpdfs'],
    d3Stream: {
      active: false,
      shape: 'force',
      title: 'Orbital Mesh Telemetry Stream',
      packetRate: 1250,
      throughputMbps: 742.6,
      nodeCount: 32,
      linkTension: 0.7,
      jitterMs: 1.2,
      packetLossPct: 0.01,
      palette: 'cyan',
      geminiTelemetrySummary: 'Gemini Duplex Telemetry: Ready for network routing & background movie synthesis.',
      showPanel: true,
      lastCommand: 'idle',
      intensity: 1.0,
    },
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02050b] select-none font-mono">
      {/* 100% Visual Background Renderer (Polymorphic Neurality) */}
      <VisualRenderer3D envState={envState} />

      {/* The Sole UI: Sovereign HyperTerminal */}
      <HyperTerminal envState={envState} setEnvState={setEnvState} />
    </div>
  );
}

export default App;
