import React, { useEffect, useRef, useState } from 'react';
import { audioVoiceService, MicrophoneAudioData, VoiceAudioData } from '../services/audioVoiceService';
import { Mic, Volume2, Sparkles, Square, Radio, Activity } from 'lucide-react';

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
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceDataState, setVoiceDataState] = useState<VoiceAudioData | null>(null);

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

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.04;

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Query real-time AI Voice output audio stream & user microphone stream
      const voiceData = audioVoiceService.getVoiceAudioData();
      const micData: MicrophoneAudioData | null = isMicActive
        ? audioVoiceService.getMicrophoneAudioData()
        : null;

      const isAiSpeaking = voiceData ? voiceData.isSpeaking : false;
      const isMicSpeaking = micData ? micData.isSpeaking : false;

      // Active audio source selection: prioritize AI voice output when speaking
      const activeWaveform = isAiSpeaking
        ? voiceData?.waveformData
        : isMicActive
        ? micData?.waveformData
        : null;

      const targetVol = isAiSpeaking
        ? (voiceData ? voiceData.volume : 0)
        : (micData ? micData.volume : 0);

      smoothedVol += (targetVol - smoothedVol) * 0.28;

      const speakingNow = isAiSpeaking || isMicSpeaking;
      if (Math.abs(smoothedVol - liveVolume) > 0.015) {
        setLiveVolume(smoothedVol);
      }
      if (speakingNow !== isSpeaking) {
        setIsSpeaking(speakingNow);
      }
      if (voiceData !== voiceDataState) {
        setVoiceDataState(voiceData);
      }

      // -------------------------------------------------------------
      // 1. Draw Real-time Oscilloscope & Frequency Spectrum in HUD Canvas
      // -------------------------------------------------------------
      const hudCanvas = hudCanvasRef.current;
      if (hudCanvas && isAiSpeaking && voiceData) {
        const hudCtx = hudCanvas.getContext('2d');
        if (hudCtx) {
          hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
          const hw = hudCanvas.width;
          const hh = hudCanvas.height;

          // A. Draw 32-band frequency equalizer bars
          const freqData = voiceData.frequencyData;
          if (freqData) {
            const barCount = 32;
            const barWidth = (hw / barCount) - 1.5;
            for (let b = 0; b < barCount; b++) {
              const binIdx = Math.floor((b / barCount) * (freqData.length / 2));
              const rawHeight = (freqData[binIdx] / 255) * (hh * 0.85);
              const bx = b * (barWidth + 1.5);
              const by = hh - rawHeight;

              const barGrad = hudCtx.createLinearGradient(0, hh, 0, by);
              barGrad.addColorStop(0, `${primaryColor}40`);
              barGrad.addColorStop(0.7, primaryColor);
              barGrad.addColorStop(1, '#ffffff');

              hudCtx.fillStyle = barGrad;
              hudCtx.fillRect(bx, by, barWidth, rawHeight);
            }
          }

          // B. Draw neon oscilloscope waveform line
          const waveData = voiceData.waveformData;
          if (waveData) {
            hudCtx.beginPath();
            hudCtx.strokeStyle = '#ffffff';
            hudCtx.lineWidth = 1.6;
            hudCtx.shadowColor = primaryColor;
            hudCtx.shadowBlur = 8;

            const sliceWidth = hw / waveData.length;
            let hx = 0;
            for (let i = 0; i < waveData.length; i++) {
              const v = (waveData[i] - 128) / 128; // -1 to 1
              const hy = (hh * 0.5) + v * (hh * 0.42);
              if (i === 0) hudCtx.moveTo(hx, hy);
              else hudCtx.lineTo(hx, hy);
              hx += sliceWidth;
            }
            hudCtx.stroke();
            hudCtx.shadowBlur = 0;
          }
        }
      }

      // -------------------------------------------------------------
      // 2. Draw Perimeter Border Waveform on Terminal Workstation
      // -------------------------------------------------------------
      const radius = 16;
      const borderPadding = 1.5;

      const glowBlur = (isAiSpeaking || isMicActive)
        ? 6 + smoothedVol * 28
        : 3;

      ctx.save();
      ctx.shadowColor = isAiSpeaking ? '#00f2ff' : primaryColor;
      ctx.shadowBlur = glowBlur;

      const waveLen = activeWaveform ? activeWaveform.length : 128;

      // Audio displacement for border edge points
      const getAudioDisplacement = (progress: number, edge: 'top' | 'right' | 'bottom' | 'left') => {
        if (activeWaveform && (isAiSpeaking || (isMicActive && smoothedVol > 0.03))) {
          const sampleIdx = Math.floor((progress * waveLen) % waveLen);
          const rawWave = (activeWaveform[sampleIdx] - 128) / 128; // -1.0 to 1.0
          const multiplier = isAiSpeaking
            ? 4 + smoothedVol * 32
            : 3 + smoothedVol * 24;
          return rawWave * multiplier;
        } else if (isMicActive || isAiSpeaking) {
          return Math.sin(progress * Math.PI * 12 + t * 2.5) * 2;
        } else {
          // Ambient idle breathing wave
          return Math.sin(progress * Math.PI * 6 + t) * 0.7;
        }
      };

      // Create gradient for border waveform
      const grad = ctx.createLinearGradient(0, 0, w, h);
      if (isAiSpeaking) {
        grad.addColorStop(0, '#00f2ff');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, '#00f2ff');
      } else {
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(0.5, secondaryColor);
        grad.addColorStop(1, primaryColor);
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = (isAiSpeaking || isMicActive)
        ? Math.max(1.8, 2.0 + smoothedVol * 3.6)
        : 1.4;

      // TOP EDGE
      ctx.beginPath();
      ctx.moveTo(radius, borderPadding);
      const topSteps = 38;
      for (let i = 1; i <= topSteps; i++) {
        const prog = i / topSteps;
        const x = radius + prog * (w - 2 * radius);
        const disp = getAudioDisplacement(prog, 'top');
        ctx.lineTo(x, borderPadding + disp);
      }

      // TOP-RIGHT CORNER
      ctx.arcTo(w - borderPadding, borderPadding, w - borderPadding, radius, radius);

      // RIGHT EDGE
      const rightSteps = 26;
      for (let i = 1; i <= rightSteps; i++) {
        const prog = i / rightSteps;
        const y = radius + prog * (h - 2 * radius);
        const disp = getAudioDisplacement(prog, 'right');
        ctx.lineTo(w - borderPadding - disp, y);
      }

      // BOTTOM-RIGHT CORNER
      ctx.arcTo(w - borderPadding, h - borderPadding, w - radius, h - borderPadding, radius);

      // BOTTOM EDGE
      const bottomSteps = 38;
      for (let i = 1; i <= bottomSteps; i++) {
        const prog = i / bottomSteps;
        const x = (w - radius) - prog * (w - 2 * radius);
        const disp = getAudioDisplacement(prog, 'bottom');
        ctx.lineTo(x, h - borderPadding - disp);
      }

      // BOTTOM-LEFT CORNER
      ctx.arcTo(borderPadding, h - borderPadding, borderPadding, h - radius, radius);

      // LEFT EDGE
      const leftSteps = 26;
      for (let i = 1; i <= leftSteps; i++) {
        const prog = i / leftSteps;
        const y = (h - radius) - prog * (h - 2 * radius);
        const disp = getAudioDisplacement(prog, 'left');
        ctx.lineTo(borderPadding + disp, y);
      }

      // TOP-LEFT CORNER
      ctx.arcTo(borderPadding, borderPadding, radius, borderPadding, radius);

      ctx.stroke();

      // 3. Corner Plasma Sparks during Speech Output or Mic Input
      if ((isAiSpeaking || isMicActive) && smoothedVol > 0.06) {
        const sparkCount = Math.floor(smoothedVol * 10) + 2;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 14;

        for (let s = 0; s < sparkCount; s++) {
          const cornerPick = (Math.floor(s + t * 4)) % 4;
          let sx = radius;
          let sy = radius;
          if (cornerPick === 1) { sx = w - radius; sy = radius; }
          else if (cornerPick === 2) { sx = w - radius; sy = h - radius; }
          else if (cornerPick === 3) { sx = radius; sy = h - radius; }

          const jitterX = (Math.random() - 0.5) * (16 + smoothedVol * 24);
          const jitterY = (Math.random() - 0.5) * (16 + smoothedVol * 24);
          ctx.beginPath();
          ctx.arc(sx + jitterX, sy + jitterY, 1.5 + Math.random() * 2.2, 0, Math.PI * 2);
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

  const isAiSpeaking = voiceDataState?.isSpeaking || false;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-20"
      style={{
        boxShadow: (isAiSpeaking || (isMicActive && liveVolume > 0.04))
          ? `inset 0 0 ${Math.round(liveVolume * 45)}px ${primaryColor}55, 0 0 ${Math.round(liveVolume * 50)}px ${primaryColor}77`
          : undefined,
        transition: 'box-shadow 0.08s ease-out',
      }}
    >
      {/* 60fps Real-Time Audio Border Waveform Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* =========================================================================
          REAL-TIME AI VOICE RESPONSE WAVEFORM & SPECTRUM OVERLAY (FLOATING HUD)
          ========================================================================= */}
      {isAiSpeaking && voiceDataState && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto px-3 py-2 rounded-xl border border-cyan-400/80 bg-black/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.45)] flex flex-col gap-1.5 max-w-lg w-[90%] font-mono text-xs z-30 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Row: Live Telemetry, Profile & Stop Control */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <Activity className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-bold text-white text-[11px] tracking-wide flex items-center gap-1.5">
                <span>AI VOICE RESPONSE STREAM</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] uppercase border border-cyan-400/40">
                  {voiceDataState.profile} // {voiceDataState.carrierFreq}Hz
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-300/80 font-bold">
                RMS: {(liveVolume * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => audioVoiceService.stopSpeaking()}
                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/50 text-[9px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Interrupt AI Voice Speech"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>MUTE</span>
              </button>
            </div>
          </div>

          {/* Real-time Oscilloscope & Spectrum Display Canvas */}
          <div className="relative w-full h-11 bg-black/70 rounded-lg overflow-hidden border border-cyan-500/30">
            <canvas
              ref={hudCanvasRef}
              width={400}
              height={44}
              className="w-full h-full block"
            />
            {/* Ambient grid lines */}
            <div className="absolute inset-0 pointer-events-none border-t border-b border-cyan-500/10 flex flex-col justify-between" />
          </div>

          {/* Spoken Utterance Subtitle Readout */}
          {voiceDataState.activeText && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 truncate">
              <span className="text-cyan-400 font-bold shrink-0">VOCALIZING:</span>
              <span className="italic truncate text-slate-200">
                "{voiceDataState.activeText}"
              </span>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MICROPHONE LISTENING SENSOR BADGE (When Mic Active & AI Not Speaking)
          ========================================================================= */}
      {isMicActive && !isAiSpeaking && (
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
            {isSpeaking ? 'USER VOICE DETECTED' : 'MIC ACTIVE // LISTENING'}
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
