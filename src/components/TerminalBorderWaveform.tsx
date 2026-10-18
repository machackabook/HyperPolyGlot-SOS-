import React, { useEffect, useRef, useState } from 'react';
import { audioVoiceService, MicrophoneAudioData } from '../services/audioVoiceService';
import { Mic, Radio, Sparkles } from 'lucide-react';

interface TerminalBorderWaveformProps {
  primaryColor: string;
  secondaryColor: string;
  isMicActive: boolean;
  onToggleMic: () => void;
}

export const TerminalBorderWaveform: React.FC<TerminalBorderWaveformProps> = ({
  primaryColor,
  secondaryColor,
  isMicActive,
  onToggleMic,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    let smoothedVol = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Pre-allocated point helper arrays to prevent garbage collection in 60fps render loop
    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      t += 0.04;

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Query real-time microphone data
      const micData: MicrophoneAudioData | null = isMicActive
        ? audioVoiceService.getMicrophoneAudioData()
        : null;

      const targetVol = micData ? micData.volume : 0;
      smoothedVol += (targetVol - smoothedVol) * 0.25;

      const speakingNow = micData ? micData.isSpeaking : false;
      if (Math.abs(smoothedVol - liveVolume) > 0.02) {
        setLiveVolume(smoothedVol);
        setIsSpeaking(speakingNow);
      }

      const radius = 16; // Corner radius of terminal rounded-2xl
      const borderPadding = 1.5;

      // Base border glow pulse based on microphone voice level
      const pulseFactor = isMicActive ? 1.0 + smoothedVol * 3.5 : 1.0;
      const glowBlur = isMicActive ? 4 + smoothedVol * 24 : 3;

      ctx.save();
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = glowBlur;

      // 1. Draw perimeter border path
      // Divide top, right, bottom, left into segments modulated by real-time audio waveform
      const waveform = micData?.waveformData;
      const waveLen = waveform ? waveform.length : 128;

      // Calculate audio displacement for a given perimeter progress (0.0 to 1.0)
      const getAudioDisplacement = (progress: number, edge: 'top' | 'right' | 'bottom' | 'left') => {
        if (waveform && isMicActive && smoothedVol > 0.03) {
          const sampleIdx = Math.floor((progress * waveLen) % waveLen);
          const rawWave = (waveform[sampleIdx] - 128) / 128; // -1.0 to 1.0
          const multiplier = 3 + smoothedVol * 26;
          return rawWave * multiplier;
        } else if (isMicActive) {
          // Subtle breathing wave when mic is listening but user is quiet
          return Math.sin(progress * Math.PI * 12 + t * 2) * 1.5;
        } else {
          // Idle subtle ambient shimmer
          return Math.sin(progress * Math.PI * 6 + t) * 0.6;
        }
      };

      // Create gradient for border waveform
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(0.5, secondaryColor);
      grad.addColorStop(1, primaryColor);

      ctx.strokeStyle = grad;
      ctx.lineWidth = isMicActive ? Math.max(1.8, 1.8 + smoothedVol * 3.2) : 1.4;

      // TOP EDGE
      ctx.beginPath();
      ctx.moveTo(radius, borderPadding);
      const topSteps = 36;
      for (let i = 1; i <= topSteps; i++) {
        const prog = i / topSteps;
        const x = radius + prog * (w - 2 * radius);
        const disp = getAudioDisplacement(prog, 'top');
        ctx.lineTo(x, borderPadding + disp);
      }

      // TOP-RIGHT CORNER
      ctx.arcTo(w - borderPadding, borderPadding, w - borderPadding, radius, radius);

      // RIGHT EDGE
      const rightSteps = 24;
      for (let i = 1; i <= rightSteps; i++) {
        const prog = i / rightSteps;
        const y = radius + prog * (h - 2 * radius);
        const disp = getAudioDisplacement(prog, 'right');
        ctx.lineTo(w - borderPadding - disp, y);
      }

      // BOTTOM-RIGHT CORNER
      ctx.arcTo(w - borderPadding, h - borderPadding, w - radius, h - borderPadding, radius);

      // BOTTOM EDGE
      const bottomSteps = 36;
      for (let i = 1; i <= bottomSteps; i++) {
        const prog = i / bottomSteps;
        const x = (w - radius) - prog * (w - 2 * radius);
        const disp = getAudioDisplacement(prog, 'bottom');
        ctx.lineTo(x, h - borderPadding - disp);
      }

      // BOTTOM-LEFT CORNER
      ctx.arcTo(borderPadding, h - borderPadding, borderPadding, h - radius, radius);

      // LEFT EDGE
      const leftSteps = 24;
      for (let i = 1; i <= leftSteps; i++) {
        const prog = i / leftSteps;
        const y = (h - radius) - prog * (h - 2 * radius);
        const disp = getAudioDisplacement(prog, 'left');
        ctx.lineTo(borderPadding + disp, y);
      }

      // TOP-LEFT CORNER
      ctx.arcTo(borderPadding, borderPadding, radius, borderPadding, radius);

      ctx.stroke();

      // 2. Corner Plasma Sparks when user is actively speaking
      if (isMicActive && smoothedVol > 0.08) {
        const sparkCount = Math.floor(smoothedVol * 8) + 2;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;

        for (let s = 0; s < sparkCount; s++) {
          const cornerPick = (Math.floor(s + t * 4)) % 4;
          let sx = radius;
          let sy = radius;
          if (cornerPick === 1) { sx = w - radius; sy = radius; }
          else if (cornerPick === 2) { sx = w - radius; sy = h - radius; }
          else if (cornerPick === 3) { sx = radius; sy = h - radius; }

          const jitterX = (Math.random() - 0.5) * (14 + smoothedVol * 20);
          const jitterY = (Math.random() - 0.5) * (14 + smoothedVol * 20);
          ctx.beginPath();
          ctx.arc(sx + jitterX, sy + jitterY, 1.5 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [primaryColor, secondaryColor, isMicActive]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-20"
      style={{
        boxShadow: isMicActive && liveVolume > 0.05
          ? `inset 0 0 ${Math.round(liveVolume * 35)}px ${primaryColor}44, 0 0 ${Math.round(liveVolume * 40)}px ${primaryColor}66`
          : undefined,
        transition: 'box-shadow 0.08s ease-out',
      }}
    >
      {/* 60fps Real-Time Audio Border Waveform Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Audio Activity Sensor Badge on Border */}
      {isMicActive && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold flex items-center gap-1.5 shadow-lg transition-all"
          style={{
            backgroundColor: 'rgba(3, 8, 20, 0.9)',
            borderColor: liveVolume > 0.1 ? primaryColor : `${primaryColor}44`,
            color: liveVolume > 0.1 ? '#ffffff' : primaryColor,
            boxShadow: `0 0 12px ${primaryColor}33`,
          }}
          title="Microphone Audio Input Active - Speak terminal commands (e.g. 'help', 'render tesseract')"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isSpeaking ? '#10b981' : primaryColor,
              boxShadow: isSpeaking ? '0 0 8px #10b981' : undefined,
              animation: isSpeaking ? 'pulse 0.8s infinite' : undefined,
            }}
          />
          <Mic className="w-3 h-3" />
          <span>
            {isSpeaking ? 'VOICE DETECTED' : 'MIC ACTIVE // LISTENING'}
          </span>
          {/* Mini Real-Time Audio Level Bar */}
          <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 ml-1">
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${Math.round(liveVolume * 100)}%`,
                backgroundColor: liveVolume > 0.5 ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
