import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Check,
  X,
  Play,
  Accessibility,
  Radio,
  Headphones,
  Eye,
  Shield,
} from 'lucide-react';
import { audioVoiceService } from '../services/audioVoiceService';

interface VoiceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfileId: string;
  onSelectProfile: (profileId: string) => void;
  pitch: number;
  rate: number;
  onPitchChange: (pitch: number) => void;
  onRateChange: (rate: number) => void;
  chromeVoxEnabled: boolean;
  onToggleChromeVox: (enabled: boolean) => void;
  highContrast: boolean;
  onToggleHighContrast: (enabled: boolean) => void;
}

export const VoiceProfileModal: React.FC<VoiceProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfileId,
  onSelectProfile,
  pitch,
  rate,
  onPitchChange,
  onRateChange,
  chromeVoxEnabled,
  onToggleChromeVox,
  highContrast,
  onToggleHighContrast,
}) => {
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const profiles = audioVoiceService.getVoiceProfiles();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestSpeech = async (phrase?: string) => {
    setIsPlayingSample(true);
    audioVoiceService.playEarcon('stream');
    await audioVoiceService.speak(
      phrase || 'Polymorphic neural voice active. Frequency alignment verified across the vector plane.'
    );
    setIsPlayingSample(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-950/95 border border-purple-500/50 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col max-h-[90vh] font-mono text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-cyan-950/60 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 id="voice-modal-title" className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
                <span>NEURAL VOICE &amp; CHROMEVOX MATRIX</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Multi-faceted AI voice profiles, carrier frequencies, and accessibility protocol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Profile Cards */}
          <div>
            <label className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-2 block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" /> Select Voice Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {profiles.map((p) => {
                const isSelected = p.id === currentProfileId;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProfile(p.id);
                      audioVoiceService.setVoiceProfile(p.id);
                      audioVoiceService.playTone(p.carrierFreq, 'sine', 120, 0.03);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/50 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs">{p.name}</span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">{p.carrierFreq} Hz</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{p.description}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1.5 border-t border-slate-800/80">
                      <span>Pitch: {p.pitch.toFixed(2)}x</span>
                      <span>Rate: {p.rate.toFixed(2)}x</span>
                      <span className="text-purple-300 font-bold">{p.carrierFreq}Hz Harmonic</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sliders for Pitch and Rate Tuning */}
          <div className="p-3 bg-black/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" /> Fine Vocal Parameters
              </span>
              <button
                type="button"
                onClick={() => {
                  onPitchChange(1.0);
                  onRateChange(1.05);
                }}
                className="text-[10px] text-slate-500 hover:text-cyan-400 cursor-pointer"
              >
                Reset to default
              </button>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Vocal Pitch (Fundamental Frequency)</span>
                <span className="text-purple-300 font-bold">{pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.05"
                value={pitch}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onPitchChange(val);
                  audioVoiceService.setVoiceParams(val, rate);
                }}
                className="w-full accent-purple-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Vocal Cadence (Speaking Rate)</span>
                <span className="text-purple-300 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={rate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onRateChange(val);
                  audioVoiceService.setVoiceParams(pitch, val);
                }}
                className="w-full accent-purple-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* ChromeVox Screen Reader & High Contrast Accessibility Controls */}
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2.5">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block flex items-center gap-1.5">
              <Accessibility className="w-3 h-3 text-cyan-400" /> ChromeVox &amp; Accessibility Subsystem
            </span>

            <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-slate-800/80">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400" /> ChromeVox Screen Reader Protocols
                </span>
                <p className="text-[10px] text-slate-400">
                  Enables ARIA live polite regions and semantic audio earcon cues for blind &amp; low-vision navigation
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !chromeVoxEnabled;
                  onToggleChromeVox(next);
                  audioVoiceService.playEarcon(next ? 'success' : 'error');
                  if (next) {
                    audioVoiceService.announce('ChromeVox accessibility protocol enabled for HyperTerminal Polyglot Quine OS.');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  chromeVoxEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {chromeVoxEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-slate-800/80">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-amber-400" /> High-Contrast Visual Matrix
                </span>
                <p className="text-[10px] text-slate-400">
                  Increases border luminosity, text weight, and background opacity for maximum legibility
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !highContrast;
                  onToggleHighContrast(next);
                  audioVoiceService.playEarcon('switch');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  highContrast
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {highContrast ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleTestSpeech()}
            disabled={isPlayingSample}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-[0_0_12px_rgba(168,85,247,0.35)]"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isPlayingSample ? 'animate-spin' : ''}`} />
            <span>{isPlayingSample ? 'Vocalizing...' : 'Audition Profile Sample'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
