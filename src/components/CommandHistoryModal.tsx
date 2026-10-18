import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CommandHistoryItem } from '../types';
import {
  Clock,
  Search,
  X,
  Play,
  ArrowRight,
  Star,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { audioVoiceService } from '../services/audioVoiceService';

interface CommandHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: CommandHistoryItem[];
  onSelectCommand: (cmd: string, executeImmediately?: boolean) => void;
  onClearHistory: () => void;
  onToggleStar: (id: string) => void;
  onExportHistory?: () => void;
}

export const CommandHistoryModal: React.FC<CommandHistoryModalProps> = ({
  isOpen,
  onClose,
  historyItems,
  onSelectCommand,
  onClearHistory,
  onToggleStar,
  onExportHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterStarred, setFilterStarred] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Filter history items by search query and star status
  const filteredItems = useMemo(() => {
    let items = [...historyItems].reverse(); // newest first
    if (filterStarred) {
      items = items.filter((item) => item.starred);
    }
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.command.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.cwd.toLowerCase().includes(q)
    );
  }, [historyItems, searchQuery, filterStarred]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      audioVoiceService.playTone(660, 'sine', 60, 0.02);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        onSelectCommand(filteredItems[selectedIndex].command, true);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.2)] overflow-hidden flex flex-col max-h-[85vh] font-mono text-xs text-slate-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,242,255,0.3)]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="history-modal-title" className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
                <span>INTERACTIVE COMMAND HISTORY</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  Ctrl+R / history
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Search, filter, and instantly replay previously executed terminal commands</p>
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

        {/* Search & Filter Bar */}
        <div className="p-3 bg-black/60 border-b border-slate-800 flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Filter command history (type keyword, flags, or path)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition font-mono"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterStarred(!filterStarred)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filterStarred
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Starred</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
              <p>No matching commands found in session history.</p>
              <p className="text-[10px] text-slate-600">Execute any command in HyperTerminal to record history.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/50 border border-cyan-500/60 shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                      : 'hover:bg-slate-900/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Status icon */}
                    {item.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}

                    {/* Category pill */}
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase shrink-0 bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category || 'CMD'}
                    </span>

                    {/* Command string */}
                    <span className="font-mono text-xs text-white truncate flex-1 font-bold">
                      {item.command}
                    </span>

                    {/* Directory & Timestamp */}
                    <span className="text-[10px] text-slate-500 shrink-0 hidden sm:inline">
                      {item.cwd} • {item.timestamp}
                    </span>

                    {item.durationMs > 0 && (
                      <span className="text-[9px] px-1 rounded bg-black/60 text-slate-400 shrink-0">
                        {item.durationMs}ms
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(item.id);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                      title={item.starred ? 'Unstar command' : 'Star command'}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCommand(item.command, false);
                        onClose();
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition"
                      title="Paste into prompt"
                    >
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">Paste</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCommand(item.command, true);
                        onClose();
                      }}
                      className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      title="Run immediately"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>{historyItems.length} total recorded entries</span>
            <span>•</span>
            <span className="text-slate-500 hidden sm:inline">Use ↑↓ to navigate, Enter to run, Esc to exit</span>
          </div>

          <div className="flex items-center gap-2">
            {onExportHistory && (
              <button
                type="button"
                onClick={onExportHistory}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-[10px] flex items-center gap-1 cursor-pointer transition"
                title="Export session to .sh file"
              >
                <Download className="w-3 h-3" />
                <span>Export Script</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearHistory}
              className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-[10px] flex items-center gap-1 cursor-pointer transition"
              title="Clear all history"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
