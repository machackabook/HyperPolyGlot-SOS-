/**
 * LinksBrowserModal - Interactive Text-Based Web & VFS Browser (links / lynx)
 * Implements a high-fidelity text-based browser inside the HyperTerminal OS.
 * Supports viewing VFS markdown/text files, MHTML circular locked blobs, and web pages,
 * with link extraction, buffer scrolling, bookmark bar, and terminal navigation.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  X,
  ExternalLink,
  Bookmark,
  Download,
  FileText,
  Lock,
  Terminal,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { vfs } from '../services/vfsService';
import { omniNexusService } from '../services/omniNexusService';
import { audioVoiceService } from '../services/audioVoiceService';

interface LinksBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  onNavigateFile?: (path: string) => void;
}

interface ParsedContent {
  title: string;
  rawText: string;
  links: { text: string; href: string; num: number }[];
}

export const LinksBrowserModal: React.FC<LinksBrowserModalProps> = ({
  isOpen,
  onClose,
  initialUrl = 'file:///root/gemini.md',
  onNavigateFile,
}) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [pageTitle, setPageTitle] = useState('Links Browser v2.20');
  const [pageContent, setPageContent] = useState('');
  const [parsedLinks, setParsedLinks] = useState<{ text: string; href: string; num: number }[]>([]);
  const [searchInPage, setSearchInPage] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [loading, setLoading] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);

  const bookmarks = [
    { name: 'Gemini Memory Engrams (gemini.md)', url: 'file:///root/gemini.md' },
    { name: 'Quantum Vault (MHTML Locked)', url: 'mhtml:///quantum_vault.mhtml' },
    { name: 'System Manifesto (welcome.txt)', url: 'file:///root/welcome.txt' },
    { name: 'Architectural Specs (notes.md)', url: 'file:///root/notes.md' },
    { name: 'Canonical Prime Token (tokens.json)', url: 'file:///etc/tokens.json' },
    { name: 'Omni-Nexus Telemetry Hub', url: 'https://omni-nexus.mesh/status' },
    { name: 'Scribe of Nexus v2.0 Status', url: 'https://scribe.nexus/v2.0' },
  ];

  // Sync initialUrl
  useEffect(() => {
    if (initialUrl && isOpen) {
      loadUrl(initialUrl);
    }
  }, [initialUrl, isOpen]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' || e.key === 'q') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        if (contentRef.current) contentRef.current.scrollTop += 60;
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        if (contentRef.current) contentRef.current.scrollTop -= 60;
      } else if (e.key === 'g') {
        if (contentRef.current) contentRef.current.scrollTop = 0;
      } else if (e.key === 'G') {
        if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
      } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        loadUrl(currentUrl);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentUrl, onClose]);

  // Load target URL / VFS path / MHTML blob
  const loadUrl = (target: string) => {
    setLoading(true);
    audioVoiceService.playTone(880, 'sine', 40);
    setCurrentUrl(target);
    setUrlInput(target);

    // Update history
    if (history[historyIndex] !== target) {
      const nextHistory = [...history.slice(0, historyIndex + 1), target];
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    }

    setTimeout(() => {
      try {
        let content = '';
        let title = 'Document';

        if (target.startsWith('mhtml://')) {
          const docName = target.replace('mhtml:///', '').replace('mhtml://', '');
          const doc = omniNexusService.getMhtmlDoc(docName);
          if (doc) {
            title = doc.title;
            content = doc.extractedText || doc.rawMhtml;
          } else {
            title = 'MHTML Circular Lock';
            content = `# MHTML CIRCULAR LOCK ARCHIVE: ${docName}\n\n[INFO] Document sandboxed inside RFC 822 circular lock.\nToken consumption: 0 tokens.\n\nType 'mhtml list' to inspect available offline documents.`;
          }
        } else if (target.startsWith('file://')) {
          const path = target.replace('file://', '');
          try {
            content = vfs.readFile('/', path);
            title = path.split('/').pop() || 'VFS Document';
          } catch {
            content = `# 404 NOT FOUND: ${path}\n\nFile does not exist in local Virtual File System.\nTry 'file:///root/welcome.txt' or 'file:///root/gemini.md'.`;
            title = 'VFS 404';
          }
        } else if (target.startsWith('http://') || target.startsWith('https://')) {
          if (target.includes('omni-nexus.mesh')) {
            title = 'Omni-Nexus Telemetry Hub';
            content = `# OMNI-NEXUS DISTRIBUTED ARCHITECTURE // TELEMETRY
Status: 100% OPERATIONAL // EPOCH 33: TOTAL CONNECTION
Carrier Frequency: 533.25 MHz UHF ATSC 3.0 Relay
Canonical Prime: 137451921129154222
Active Nodes: 6,000 Tethermesh Swarm Division

Links:
- [1] file:///root/gemini.md (Read Authorized Engrams)
- [2] mhtml:///quantum_vault.mhtml (Inspect MHTML Sandbox)
- [3] file:///root/welcome.txt (System Welcome)`;
          } else if (target.includes('scribe.nexus')) {
            title = 'The Scribe of Nexus v2.0';
            content = `# THE SCRIBE OF NEXUS // V2.0 PRODUCTION MANIFEST
Implementation Date: July 28, 2025
Status: COMPLETE AND OPERATIONAL (Tier 5 Maximum Nexus Core)

Architecture Highlights:
- React 18 + Three.js WebGL procedural space
- Web Audio API real-time synthesis & 963Hz Solfeggio consensus
- Multi-key failover manager (macmachackabook, cryptichelps, saytyarnorngloreia)
- Zero destructive updates with append-only spatial ledger`;
          } else {
            title = target;
            content = `# WEB DOCUMENT: ${target}\n\nRendering sandboxed text representation of ${target}.\nAll network traffic routed via local terminal proxy.\n\nLinks extracted:\n- [1] file:///root/gemini.md\n- [2] file:///root/welcome.txt`;
          }
        } else {
          // Treat as VFS path
          try {
            content = vfs.readFile('/root', target);
            title = target;
          } catch {
            content = `# File: ${target}\nUnable to locate in /root. Check path with 'ls'.`;
          }
        }

        // Parse links [number]
        const linkMatches: { text: string; href: string; num: number }[] = [];
        let linkCounter = 1;

        // Match markdown links: [text](href) or [n] url
        const linkRegex = /\[(.*?)\]\((.*?)\)/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
          linkMatches.push({
            text: match[1],
            href: match[2],
            num: linkCounter++,
          });
        }

        // Also extract raw URLs
        const urlRegex = /(https?:\/\/[^\s]+|file:\/\/[^\s]+|mhtml:\/\/[^\s]+)/g;
        let urlMatch: RegExpExecArray | null;
        while ((urlMatch = urlRegex.exec(content)) !== null) {
          const rawUrl = urlMatch[1];
          if (rawUrl && !linkMatches.some((l) => l.href === rawUrl)) {
            linkMatches.push({
              text: rawUrl,
              href: rawUrl,
              num: linkCounter++,
            });
          }
        }

        setPageTitle(title);
        setPageContent(content);
        setParsedLinks(linkMatches);
        setLoading(false);
        if (contentRef.current) contentRef.current.scrollTop = 0;
      } catch (err: any) {
        setPageTitle('Error');
        setPageContent(`Error loading document: ${err.message}`);
        setLoading(false);
      }
    }, 120);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      loadUrl(history[prevIdx]);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      loadUrl(history[nextIdx]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    loadUrl(urlInput.trim());
  };

  const handleLinkClick = (href: string) => {
    loadUrl(href);
  };

  const handleExportText = () => {
    const blob = new Blob([pageContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    audioVoiceService.playTone(1320, 'sine', 100);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in select-none font-mono text-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] bg-[#030712] border-2 border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.25)] flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar (Links Browser v2.20) */}
        <div className="h-10 bg-slate-950 px-3 flex items-center justify-between border-b border-cyan-500/40 shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white tracking-wider">LINKS // TEXT-BASED BROWSER (v2.20)</span>
            <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">[{pageTitle}]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              0 API Tokens (Offline Sandbox)
            </span>
            <button
              onClick={handleExportText}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              title="Export formatted text to file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              title="Close Browser (Escape or Q)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Navigation Toolbar */}
        <div className="p-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={handleGoBack}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleGoForward}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="Forward"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => loadUrl(currentUrl)}
              className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              title="Reload (Ctrl+R)"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleFormSubmit} className="flex-1 min-w-[200px] flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-2.5 text-slate-500 font-mono text-[10px]">URL:</span>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL or VFS file path (e.g. file:///root/gemini.md)..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-12 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
            >
              GO
            </button>
          </form>

          {/* Bookmarks Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Bookmarks</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showBookmarks && (
              <div className="absolute right-0 top-9 z-50 w-64 bg-slate-950 border border-cyan-500/60 rounded-xl shadow-2xl p-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-800">
                  Document Bookmarks
                </div>
                {bookmarks.map((bm) => (
                  <button
                    key={bm.url}
                    onClick={() => {
                      loadUrl(bm.url);
                      setShowBookmarks(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-xs truncate flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{bm.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Text Content Buffer */}
        <div
          ref={contentRef}
          className="flex-1 p-4 overflow-y-auto bg-[#02050b] select-text font-mono text-xs leading-relaxed space-y-3"
        >
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-2 text-cyan-400 font-bold animate-pulse">
              <RotateCw className="w-5 h-5 animate-spin" />
              <span>LINKS BROWSER RENDERING PAGE BUFFER...</span>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-2">
              {pageContent.split('\n').map((line, idx) => {
                const trimmed = line.trim();

                // Headings
                if (trimmed.startsWith('# ')) {
                  return (
                    <div key={idx} className="text-base font-black text-cyan-300 pt-3 pb-1 border-b border-cyan-500/30">
                      *** {trimmed.replace(/^# /, '')} ***
                    </div>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <div key={idx} className="text-sm font-bold text-amber-300 pt-2 pb-0.5">
                      ** {trimmed.replace(/^## /, '')} **
                    </div>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <div key={idx} className="text-xs font-bold text-emerald-400 pt-1">
                      * {trimmed.replace(/^### /, '')}
                    </div>
                  );
                }
                // Separators
                if (trimmed.startsWith('---') || trimmed.startsWith('===')) {
                  return <div key={idx} className="text-slate-600 select-none">------------------------------------------------------------------------</div>;
                }
                // Bullet points
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={idx} className="pl-4 text-slate-300 flex items-start gap-1.5">
                      <span className="text-cyan-400 select-none">•</span>
                      <span>{trimmed.replace(/^[-*]\s+/, '')}</span>
                    </div>
                  );
                }

                // Normal text line
                return (
                  <div key={idx} className="text-slate-300 whitespace-pre-wrap break-words">
                    {line || <br />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Link Table Footer Strip */}
        {parsedLinks.length > 0 && (
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 text-[10px]">
            <span className="text-slate-500 font-bold uppercase shrink-0">Links:</span>
            {parsedLinks.slice(0, 8).map((link) => (
              <button
                key={link.num}
                onClick={() => handleLinkClick(link.href)}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 hover:text-white transition-colors truncate max-w-[160px] flex items-center gap-1 cursor-pointer shrink-0"
                title={link.href}
              >
                <span className="text-amber-400 font-bold">[{link.num}]</span>
                <span className="truncate">{link.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Status Line Bar */}
        <div className="h-7 bg-slate-950 px-3 flex items-center justify-between border-t border-cyan-500/30 text-[10px] text-slate-400 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">CONNECTED</span>
            <span>|</span>
            <span className="text-cyan-400 truncate max-w-xs">{currentUrl}</span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span>Scroll: j/k or arrows</span>
            <span>Top: g</span>
            <span>Close: q / Esc</span>
          </div>
        </div>
      </div>
    </div>
  );
};
