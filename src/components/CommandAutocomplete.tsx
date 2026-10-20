import React, { useState } from 'react';
import { CommandSuggestion } from '../services/autocompleteService';
import { ChevronRight, Sparkles, Terminal, HardDrive, Cpu, Radio, Layers, Compass } from 'lucide-react';
import { EnvironmentState } from '../types';

interface CommandAutocompleteProps {
  suggestions: CommandSuggestion[];
  selectedIndex: number;
  onSelect: (command: string) => void;
  onHover: (index: number) => void;
  query: string;
  primaryColor: string;
  secondaryColor: string;
  envState?: EnvironmentState;
  mountedDevices?: string[];
}

export const CommandAutocomplete: React.FC<CommandAutocompleteProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
  query,
  primaryColor,
  secondaryColor,
  envState,
  mountedDevices = [],
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  if (suggestions.length === 0) return null;

  // Filter items if a specific category tab is selected
  const filteredSuggestions = activeCategoryFilter === 'ALL'
    ? suggestions
    : suggestions.filter((s) => s.category.toUpperCase().includes(activeCategoryFilter));

  const itemsToRender = filteredSuggestions.length > 0 ? filteredSuggestions : suggestions;

  // Highlight the matching substring in the command
  const renderHighlightedCommand = (cmd: string) => {
    const qLower = query.toLowerCase().trim();
    const cmdLower = cmd.toLowerCase();
    const matchIdx = cmdLower.indexOf(qLower);

    if (matchIdx === -1 || !qLower) {
      return <span>{cmd}</span>;
    }

    const before = cmd.slice(0, matchIdx);
    const match = cmd.slice(matchIdx, matchIdx + qLower.length);
    const after = cmd.slice(matchIdx + qLower.length);

    return (
      <span>
        {before}
        <span
          className="font-bold underline"
          style={{ color: primaryColor, textDecorationColor: `${primaryColor}aa` }}
        >
          {match}
        </span>
        {after}
      </span>
    );
  };

  const getBadgeStyle = (item: CommandSuggestion) => {
    if (item.badgeColor) {
      return {
        backgroundColor: `${item.badgeColor}22`,
        color: item.badgeColor,
        borderColor: `${item.badgeColor}55`,
      };
    }
    if (item.isMountedPath || item.category === 'Mount') {
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        color: '#10b981',
        borderColor: 'rgba(16, 185, 129, 0.5)',
      };
    }
    if (item.isEnvironmentAdaptive) {
      return {
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        color: '#ec4899',
        borderColor: 'rgba(236, 72, 153, 0.5)',
      };
    }
    return {
      backgroundColor: `${secondaryColor}22`,
      color: secondaryColor,
      borderColor: `${secondaryColor}44`,
    };
  };

  return (
    <div
      role="listbox"
      aria-label="Command suggestions"
      className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden font-mono text-xs z-50 shadow-2xl transition-all duration-150 animate-in fade-in slide-in-from-bottom-2 select-none"
      style={{
        backgroundColor: 'rgba(3, 7, 18, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${primaryColor}66`,
        boxShadow: `0 -12px 35px rgba(0, 0, 0, 0.85), 0 0 30px ${primaryColor}26`,
      }}
    >
      {/* Autocomplete Top Telemetry Header Bar */}
      <div
        className="px-3.5 py-2 bg-black/80 border-b flex flex-wrap items-center justify-between gap-2 text-[10px]"
        style={{ borderColor: `${primaryColor}33` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold tracking-wider" style={{ color: primaryColor }}>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>ADAPTIVE COMMAND RADAR</span>
          </div>

          {/* Real-Time Environment State Pills */}
          {envState && (
            <div className="hidden sm:flex items-center gap-1.5 text-[9px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1">
                <Compass className="w-2.5 h-2.5 text-cyan-400" />
                {envState.topology}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold">
                {envState.sentiment}
              </span>
              {envState.rgbLed && (
                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                  envState.rgbLed.enabled
                    ? 'bg-fuchsia-950/60 border-fuchsia-500/40 text-fuchsia-300'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}>
                  LED: {envState.rgbLed.enabled ? envState.rgbLed.profile : 'OFF'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Keyboard navigation instructions */}
        <div className="flex items-center gap-2 text-slate-400 text-[9px]">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">Tab</kbd> /{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">↵</kbd> Complete
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">↑↓</kbd> Select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">Esc</kbd> Close
          </span>
        </div>
      </div>

      {/* Category quick filters */}
      <div className="px-3 py-1 bg-black/50 border-b border-white/5 flex items-center gap-1 overflow-x-auto text-[9px]">
        {['ALL', 'MOUNT', '3D VISUALS', 'AI & VOICE', 'SYSTEM', 'VFS'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategoryFilter(cat)}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer font-bold ${
              activeCategoryFilter === cat
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-[9px] text-slate-500">
          {itemsToRender.length} suggestions
        </span>
      </div>

      {/* Suggestion Items List */}
      <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
        {itemsToRender.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const badgeStyle = getBadgeStyle(item);

          return (
            <div
              key={item.command}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => onHover(idx)}
              onClick={() => onSelect(item.command)}
              className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                isSelected ? 'bg-cyan-500/15' : 'hover:bg-white/[0.03]'
              }`}
              style={{
                borderLeft: isSelected ? `3px solid ${primaryColor}` : '3px solid transparent',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ChevronRight
                  className="w-3.5 h-3.5 shrink-0 transition-transform"
                  style={{
                    color: isSelected ? primaryColor : '#475569',
                    transform: isSelected ? 'translateX(3px)' : 'none',
                  }}
                />
                <span className="font-bold text-slate-100 font-mono text-xs truncate">
                  {renderHighlightedCommand(item.command)}
                </span>

                {/* State-adaptive status hint */}
                {item.statusHint && (
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider hidden sm:inline"
                    style={badgeStyle}
                  >
                    {item.statusHint}
                  </span>
                )}

                <span className="text-[10px] text-slate-400 font-sans truncate hidden md:inline">
                  — {item.description}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border"
                  style={badgeStyle}
                >
                  {item.badge}
                </span>
                <span className="text-[9px] text-slate-500 hidden sm:inline">
                  {isSelected ? '⏎' : 'Tab'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Mounted Device Paths Bar */}
      {mountedDevices.length > 0 && (
        <div
          className="px-3.5 py-1.5 bg-black/90 border-t flex items-center justify-between text-[10px]"
          style={{ borderColor: `${primaryColor}22` }}
        >
          <div className="flex items-center gap-2 text-slate-400">
            <HardDrive className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-bold">MOUNTED DEVICE PATHS:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {mountedDevices.map((dev) => (
                <button
                  key={dev}
                  type="button"
                  onClick={() => onSelect(`cd ${dev}`)}
                  className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] cursor-pointer transition-colors"
                  title={`Click to auto-complete: cd ${dev}`}
                >
                  {dev}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[9px] text-slate-500 hidden lg:inline">
            Plug-n-Play Virtual Bus
          </span>
        </div>
      )}
    </div>
  );
};
