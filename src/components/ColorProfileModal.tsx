import React from 'react';
import {
  COLOR_PROFILES,
  RgbLedConfig,
  RgbLedProfile,
  RgbLedMode,
  computeRgbLedState,
  hslToHex
} from '../services/colorProfileService';
import { Palette, X, Sparkles, RefreshCw, Sliders, Zap, Sun, Shield } from 'lucide-react';

interface ColorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RgbLedConfig;
  onChange: (updated: Partial<RgbLedConfig>) => void;
}

export const ColorProfileModal: React.FC<ColorProfileModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  if (!isOpen) return null;

  const currentPreview = computeRgbLedState(Date.now() / 1000, config, 0.4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div
        className="w-full max-w-4xl bg-[#030712] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] flex flex-col overflow-hidden max-h-[90vh] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wider">
                  HIGH-END RENDERING COLOR PROFILES & RGB-LED ENGINE
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  COLOR SCIENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dynamic HSL% hue gradient, spectral gamut matrices, and real-time 3D lighting modulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Ribbon & Gamut Indicator */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-900 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>LIVE RGB-LED HSL% GRADIENT PREVIEW</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-cyan-300">
                HUE: {config.huePercent.toFixed(1)}% ({Math.round((config.huePercent / 100) * 360)}°)
              </span>
              <span className="text-[11px] text-slate-400">
                PROFILE: <strong className="text-white">{config.profile}</strong>
              </span>
            </div>
          </div>

          {/* Dynamic Spectrum Bar */}
          <div
            className="h-4 w-full rounded-full border border-slate-700/80 relative overflow-hidden shadow-inner"
            style={{
              background: currentPreview?.cssGradient || 'linear-gradient(90deg, #00f2ff, #a855f7)',
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_8px_white] transition-all"
              style={{ left: `${config.huePercent}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Master Toggle, Hue Slider, Mode */}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">RGB-LED Engine Power</span>
                <button
                  onClick={() => onChange({ enabled: !config.enabled })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    config.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  {config.enabled ? 'ENGINE ACTIVE' : 'DISABLED'}
                </button>
              </div>

              {/* HSL Hue% Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">HSL Hue Percentage:</span>
                  <span className="text-cyan-400 font-bold">
                    {config.huePercent.toFixed(1)}% ({Math.round((config.huePercent / 100) * 360)}°)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={config.huePercent}
                    onChange={(e) => onChange({ huePercent: parseFloat(e.target.value) })}
                    className="w-full h-2.5 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background:
                        'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                    }}
                  />
                </div>
              </div>

              {/* Modulation Mode */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400">Dynamic Modulation Mode:</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['cycle', 'pulse', 'static', 'audio'] as RgbLedMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onChange({ mode })}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        config.mode === mode
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                          : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {mode === 'cycle' && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
                      {mode === 'pulse' && <Zap className="w-3 h-3 text-purple-400" />}
                      {mode === 'static' && <Shield className="w-3 h-3 text-amber-400" />}
                      {mode === 'audio' && <Sun className="w-3 h-3 text-rose-400 animate-pulse" />}
                      <span className="capitalize">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Fine-tuning Sliders */}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Color Science Calibration</span>
              </div>

              {/* Cycle Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Wave Speed Multiplier:</span>
                  <span className="text-slate-200 font-bold">{config.speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.1"
                  value={config.speed}
                  onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Gamut Saturation:</span>
                  <span className="text-slate-200 font-bold">{config.saturation.toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={config.saturation}
                  onChange={(e) => onChange({ saturation: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-purple-400 cursor-pointer"
                />
              </div>

              {/* Lightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Photonic Lightness:</span>
                  <span className="text-slate-200 font-bold">{config.lightness.toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="1"
                  value={config.lightness}
                  onChange={(e) => onChange({ lightness: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Gradient Spread */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Hue Gradient Spread Angle:</span>
                  <span className="text-slate-200 font-bold">{config.spread}°</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="5"
                  value={config.spread}
                  onChange={(e) => onChange({ spread: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Color Profiles Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 tracking-wide">
                SELECT HIGH-END RENDERING COLOR PROFILE
              </span>
              <span className="text-[10px] text-slate-500">
                Industry Standards & Ultra-Wide Chromatic Gamuts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.values(COLOR_PROFILES).map((prof) => {
                const isSelected = config.profile === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => {
                      onChange({
                        profile: prof.id,
                        huePercent: (prof.baseHue / 360) * 100,
                      });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400/80 shadow-[0_0_20px_rgba(0,242,255,0.2)]'
                        : 'bg-black/30 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white tracking-wider">
                          {prof.id}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {prof.standard.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-[10px] text-cyan-300 font-semibold mt-1">
                        {prof.name}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {prof.gamutDescription}
                      </p>
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                      {prof.palette.map((hex, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-black/50 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400">
            Current Profile Primaries: <strong className="text-cyan-400">{config.profile}</strong> ({COLOR_PROFILES[config.profile]?.standard})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.4)]"
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
