import React from 'react';
import { CommandSuggestion } from '../services/autocompleteService';
import { ChevronRight, Sparkles, Terminal } from 'lucide-react';

interface CommandAutocompleteProps {
  suggestions: CommandSuggestion[];
  selectedIndex: number;
  onSelect: (command: string) => void;
  onHover: (index: number) => void;
  query: string;
  primaryColor: string;
  secondaryColor: string;
}

export const CommandAutocomplete: React.FC<CommandAutocompleteProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
  query,
  primaryColor,
  secondaryColor,
}) => {
  if (suggestions.length === 0) return null;

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
          style={{ color: primaryColor, textDecorationColor: `${primaryColor}88` }}
        >
          {match}
        </span>
        {after}
      </span>
    );
  };

  return (
    <div
      role="listbox"
      aria-label="Command suggestions"
      className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden font-mono text-xs z-50 shadow-2xl transition-all duration-150 animate-in fade-in slide-in-from-bottom-2"
      style={{
        backgroundColor: 'rgba(3, 7, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${primaryColor}55`,
        boxShadow: `0 -10px 30px rgba(0, 0, 0, 0.8), 0 0 25px ${primaryColor}22`,
      }}
    >
      {/* Autocomplete Header Bar */}
      <div
        className="px-3 py-1.5 bg-black/70 border-b flex items-center justify-between text-[10px] select-none"
        style={{ borderColor: `${primaryColor}33` }}
      >
        <div className="flex items-center gap-1.5 font-bold tracking-wider" style={{ color: primaryColor }}>
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>SUGGESTED SYSTEM COMMANDS ({suggestions.length})</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-[9px]">
          <span>
            <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Tab</kbd> /{' '}
            <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↵</kbd> Accept
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↑↓</kbd> Select
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Esc</kbd> Close
          </span>
        </div>
      </div>

      {/* Suggestion Items List */}
      <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
        {suggestions.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={item.command}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => onHover(idx)}
              onClick={() => onSelect(item.command)}
              className={`px-3 py-2 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
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
                    transform: isSelected ? 'translateX(2px)' : 'none',
                  }}
                />
                <span className="font-bold text-slate-100 font-mono text-xs truncate">
                  {renderHighlightedCommand(item.command)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans truncate hidden sm:inline">
                  — {item.description}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${secondaryColor}22`,
                    color: secondaryColor,
                    border: `1px solid ${secondaryColor}44`,
                  }}
                >
                  {item.badge}
                </span>
                <span className="text-[9px] text-slate-500 hidden md:inline">
                  {isSelected ? '⏎' : 'Tab'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
