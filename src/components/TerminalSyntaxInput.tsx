import React, { useRef, useLayoutEffect, useMemo, useState } from 'react';
import {
  tokenizeCommandLine,
  analyzeCommandSyntax,
  SyntaxToken,
} from '../services/syntaxHighlightService';
import { Sparkles, Info } from 'lucide-react';

interface TerminalSyntaxInputProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  ghostSuggestion?: string;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

export const TerminalSyntaxInput: React.FC<TerminalSyntaxInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onSubmit,
  ghostSuggestion = '',
  placeholder = "Enter command or press Tab / RADAR for adaptive suggestions (e.g. 'cd /mnt/nexus_drive', 'render tesseract')...",
  inputRef: externalInputRef,
  disabled = false,
}) => {
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const activeInputRef = externalInputRef || internalInputRef;
  const highlightContainerRef = useRef<HTMLDivElement | null>(null);
  const [showSyntaxLegend, setShowSyntaxLegend] = useState(false);

  // Parse and tokenize input in real-time
  const { tokens, primaryCommand, commandCategory, flags, hasError } = useMemo(() => {
    return analyzeCommandSyntax(value);
  }, [value]);

  // Synchronize horizontal scrolling between input and syntax highlight overlay
  const handleScroll = () => {
    if (activeInputRef.current && highlightContainerRef.current) {
      highlightContainerRef.current.scrollLeft = activeInputRef.current.scrollLeft;
    }
  };

  useLayoutEffect(() => {
    if (activeInputRef.current && highlightContainerRef.current) {
      highlightContainerRef.current.scrollLeft = activeInputRef.current.scrollLeft;
    }
  }, [value]);

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown(e);
    if (e.key === 'Enter' && !e.defaultPrevented) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative flex-1 flex items-center min-w-0">
      {/* Input container with synchronized overlay */}
      <div className="relative w-full flex items-center min-w-0">
        {/* Underlying Syntax-Highlighted Layer */}
        <div
          ref={highlightContainerRef}
          aria-hidden="true"
          className="absolute inset-0 flex items-center overflow-x-hidden whitespace-pre pointer-events-none font-mono text-xs select-none"
        >
          {value.length > 0 ? (
            <>
              {tokens.map((token, idx) => (
                <span
                  key={`${idx}-${token.text}`}
                  className={`${token.colorClass} transition-colors duration-75`}
                  title={token.description}
                >
                  {token.text}
                </span>
              ))}

              {/* Ghost Autocomplete Suffix */}
              {ghostSuggestion && ghostSuggestion.toLowerCase().startsWith(value.toLowerCase()) && (
                <span className="text-slate-600 font-mono opacity-80 select-none">
                  {ghostSuggestion.slice(value.length)}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-500 font-mono text-xs select-none truncate">
              {placeholder}
            </span>
          )}
        </div>

        {/* Foreground Raw Interactive Input (Transparent text with glowing cyan caret) */}
        <input
          ref={activeInputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDownInternal}
          onScroll={handleScroll}
          disabled={disabled}
          placeholder=""
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          className="w-full bg-transparent border-none outline-none font-mono text-xs relative z-10 text-transparent selection:bg-cyan-500/35 selection:text-transparent"
          style={{
            caretColor: '#00f2ff',
          }}
        />

        {/* Right-aligned Syntax HUD badges */}
        {value.trim().length > 0 && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none z-20">
            {commandCategory && (
              <span
                className={`px-1.5 py-0.5 text-[8.5px] font-mono font-bold tracking-wider rounded uppercase flex items-center gap-1 border ${
                  commandCategory === '3D RENDER'
                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : commandCategory === 'AI & VOICE'
                    ? 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-500/50 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                    : commandCategory === 'VFS FILE'
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                    : commandCategory === 'CORE SWARM'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                    : commandCategory === 'DEV EXEC'
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                    : commandCategory === 'DEVICE CONTROL'
                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/90 text-sky-300 border-sky-500/50'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{commandCategory}</span>
              </span>
            )}
            {flags.slice(0, 2).map((flag) => (
              <span
                key={flag}
                className="px-1.5 py-0.5 text-[8.5px] font-mono font-semibold bg-amber-950/90 text-amber-300 border border-amber-500/50 rounded tracking-wider shadow-[0_0_6px_rgba(252,211,77,0.25)]"
              >
                {flag}
              </span>
            ))}
          </div>
        )}

        {/* Syntax Legend Toggle Helper */}
        <button
          type="button"
          onClick={() => setShowSyntaxLegend(!showSyntaxLegend)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1 text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer opacity-50 hover:opacity-100"
          title="Toggle OS Syntax Color Hierarchy Guide"
        >
          <Info className="w-3 h-3" />
        </button>
      </div>

      {/* Syntax Legend Modal / Dropdown */}
      {showSyntaxLegend && (
        <div className="absolute bottom-10 right-0 z-50 p-3 bg-slate-950/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl w-72 text-[10px] font-mono space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-white font-bold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3 h-3" />
              <span>OS SYNTAX COLOR MATRIX</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSyntaxLegend(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-cyan-400 font-bold">3D Visual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
              <span className="text-fuchsia-400 font-bold">AI / Voice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 font-bold">VFS Files</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="text-rose-400 font-bold">Core Swarm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-amber-400 font-bold">Dev Exec</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-300"></span>
              <span className="text-sky-300 font-bold">System</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-300"></span>
              <span className="text-cyan-300 font-bold">Device / A11y</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              <span className="text-amber-300">Flags (-la)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-300"></span>
              <span className="text-violet-300">Topologies</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-300"></span>
              <span className="text-rose-300">Sentiments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-300"></span>
              <span className="text-green-300">"Strings"</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
              <span className="text-yellow-300">Numbers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-200"></span>
              <span className="text-cyan-200">Paths (/)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
