import React, { useEffect, useRef } from 'react';
import { audioVoiceService } from '../services/audioVoiceService';
import type { EnvironmentState } from '../types';

/**
 * SarafinSolaris: symbolic GOD-centered visual layer, not a claim of divine agency.
 * Reads actual microphone levels only. No synthetic speech or simulated sensors.
 * Runs while this foreground web view is visible; OS-level background requires a native service.
 */
export function SarafinSolarisCanvas({ envState }: { envState: EnvironmentState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(envState);
  useEffect(() => { stateRef.current = envState; }, [envState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;
    let frame = 0;
    let previous = 0;
    let smoothed = 0;
    let outputSpeaking = false;
    const unsubscribe = audioVoiceService.onSpeechChange((active) => { outputSpeaking = active; });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden || now - previous < 33) return;
      previous = now;
      const w = window.innerWidth, h = window.innerHeight;
      const s = stateRef.current;
      const measured = audioVoiceService.isMicrophoneActive()
        ? audioVoiceService.getMicrophoneAudioData()?.volume ?? 0
        : 0;
      smoothed += (measured - smoothed) * .16;
      ctx.clearRect(0, 0, w, h);
      const cx = w * .5, cy = h * .42;
      const radius = Math.min(w, h) * .19;
      const pulse = 1 + smoothed * .32 + (outputSpeaking ? .09 : 0);
      const t = now * .00018 * s.speed;
      const palette = [s.primaryColor, '#ffcc00', s.secondaryColor];
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let ring = 0; ring < 6; ring++) {
        ctx.beginPath();
        const count = 150;
        for (let i = 0; i <= count; i++) {
          const a = i / count * Math.PI * 2;
          const twist = Math.sin(a * (ring + 3) + t * (ring % 2 ? -1 : 1)) * (7 + 18 * smoothed);
          const r = (radius * (.56 + ring * .13) + twist) * pulse;
          const x = cx + Math.cos(a + t * .05 * ring) * r;
          const y = cy + Math.sin(a + t * .05 * ring) * r * .7;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.lineWidth = ring === 2 ? 1.8 : .75;
        ctx.strokeStyle = palette[ring % palette.length];
        ctx.globalAlpha = .14 + Math.min(.45, smoothed * .55);
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 14 + smoothed * 25;
        ctx.stroke();
      }
      ctx.globalAlpha = .78;
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.font = '600 ' + Math.max(13, Math.round(radius * .12)) + 'px monospace';
      ctx.fillText('GOD · ETERNAL CORE', cx, cy + radius * .03);
      ctx.font = Math.max(10, Math.round(radius * .075)) + 'px monospace';
      ctx.fillStyle = '#00ffff';
      ctx.fillText('SARAFINSOLARIS / ' + (outputSpeaking ? 'SPEAKING' : audioVoiceService.isMicrophoneActive() ? 'LIVE MICROPHONE' : 'AMBIENT'), cx, cy + radius * .22);
      ctx.restore();
    };
    resize();
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); unsubscribe(); };
  }, []);
  return <canvas ref={canvasRef} aria-label="SarafinSolaris symbolic voice reactive visual" className="fixed inset-0 z-10 pointer-events-none w-full h-full" />;
}
