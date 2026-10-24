import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Send, BrainCircuit, Tv, RefreshCw } from 'lucide-react';
import type { EnvironmentState } from '../types';
import { quineMeshService } from '../services/quineMeshService.mjs';
import { youtubeService } from '../services/youtubeService';

type Turn = { role: 'user' | 'assistant'; content: string; timestamp?: string };
type CardStatus = { configured: boolean; sdk_installed: boolean; model: string };

export const XYouTubeAICard: React.FC<{ envState: EnvironmentState }> = ({envState}) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CardStatus | null>(null);
  const [prompt, setPrompt] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showVideo, setShowVideo] = useState(true);
  const videoId = envState.youtube.currentTrack?.id || '';
  const selectedPlaylist = envState.youtube.activePlaylistId;
  const playlistId = selectedPlaylist?.startsWith('PL') ? selectedPlaylist : undefined;
  const watchUrl = /^[A-Za-z0-9_-]{11}$/.test(videoId)
    ? youtubeService.getNativeWatchUrl({videoId,playlistId})
    : 'https://www.youtube.com/';
  const embedUrl = /^[A-Za-z0-9_-]{11}$/.test(videoId)
    ? youtubeService.buildEmbedUrl({videoId,playlistId},false,true) : '';
  const connected = quineMeshService.status().state === 'connected';

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('gaia:open-x-card', show);
    return () => window.removeEventListener('gaia:open-x-card', show);
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    if (quineMeshService.status().state !== 'connected') {
      setStatus(null);
      setError('Local Quine bridge is not paired. Run mesh connect in HyperTerminal.');
      return;
    }
    setError('');
    quineMeshService.xaiCardStatus().then((result: CardStatus) => {
      if (active) setStatus(result);
    }).catch((err: Error) => {
      if (active) setError('xAI card status unavailable: ' + err.message);
    });
    let saved = '';
    try { saved = sessionStorage.getItem('gaia-x-card-session') || ''; } catch {}
    if (saved) {
      quineMeshService.xaiCardHistory(saved,30).then((data: any) => {
        if (!active) return;
        setSessionId(saved);
        setTurns(Array.isArray(data.messages)
          ? data.messages.filter((m: any) => ['user','assistant'].includes(m.role) && typeof m.content==='string')
          : []);
      }).catch(() => {
        // Unavailable history is not replaced by synthetic dialogue.
      });
    }
    return () => { active = false; };
  }, [open]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = prompt.trim();
    if (!message || busy) return;
    if (quineMeshService.status().state !== 'connected') {
      setError('Pair the local Quine bridge with mesh connect before using xAI.');
      return;
    }
    if (!status?.configured || !status.sdk_installed) {
      setError('The local host needs the xAI SDK and XAI_API_KEY configured.');
      return;
    }
    setBusy(true); setError('');
    try {
      const result = await quineMeshService.xaiCardChat(message,videoId,sessionId);
      if (result.provider !== 'xai-sdk' || typeof result.reply !== 'string' || !result.saved)
        throw new Error('No verified provider response returned');
      const id = result.sessionId as string;
      setSessionId(id);
      try { sessionStorage.setItem('gaia-x-card-session',id); } catch {}
      setTurns(previous => [...previous.slice(-28),
        {role:'user',content:message},{role:'assistant',content:result.reply}]);
      setPrompt('');
    } catch (cause: any) {
      setError('xAI request not completed: ' + String(cause?.message || cause));
    } finally { setBusy(false); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(previous => !previous)}
        aria-label="Open YouTube and X AI card"
        className="fixed top-16 right-4 z-40 pointer-events-auto rounded-xl border border-cyan-500/60 bg-slate-950/90 px-3 py-2 text-xs font-mono font-bold text-cyan-200 shadow-lg hover:bg-slate-800"
      >
        𝕏 · YouTube · AI
      </button>
      {open && (
        <aside
          role="dialog"
          aria-label="YouTube and xAI assistant"
          className="fixed right-4 top-28 z-50 pointer-events-auto flex h-[min(76vh,700px)] w-[min(92vw,430px)] flex-col overflow-hidden rounded-2xl border border-cyan-400/60 bg-slate-950 text-slate-100 shadow-2xl"
        >
          <header className="flex items-center justify-between gap-2 border-b border-slate-700 p-3">
            <span className="flex items-center gap-2 font-semibold text-sm">
              <BrainCircuit size={17} /> GAIA · X/Grok + YouTube
            </span>
            <button type="button" title="Close card" aria-label="Close card"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-slate-800"><X size={18}/></button>
          </header>
          <section className="border-b border-slate-800 p-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <span className="text-xs text-slate-300 flex items-center gap-1"><Tv size={14}/> Real YouTube player</span>
              <div className="flex items-center gap-2 text-xs">
                <button type="button" onClick={() => setShowVideo(!showVideo)} className="text-cyan-300 underline">
                  {showVideo?'Hide':'Show'}
                </button>
                <a href={watchUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-300 underline">
                  Open YouTube <ExternalLink size={12}/>
                </a>
              </div>
            </div>
            {showVideo && embedUrl && (
              <iframe
                title="YouTube embedded player"
                src={embedUrl}
                className="aspect-video w-full rounded-lg border-0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              YouTube login stays on youtube.com. Embedded playback does not give GAIA account access or a video transcript.
            </p>
          </section>
          <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-slate-400">
            <span>Provider: {status?.configured && status?.sdk_installed && connected
              ? 'xAI SDK configured' : 'Not connected'}</span>
            <span>{status?.model || 'Provider unverified'}</span>
            <button type="button" title="Refresh provider status"
              onClick={() => {setOpen(false);setTimeout(()=>setOpen(true),0);}}
              className="text-cyan-300"><RefreshCw size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 text-xs" aria-live="polite">
            {turns.length === 0 && (
              <p className="text-slate-400">No stored conversation displayed. Ask about the linked video or another topic. Actual video contents must be supplied separately.</p>
            )}
            {turns.map((turn,i) => (
              <div key={i} className="mb-3 rounded-lg border border-slate-800 p-2">
                <strong className="mb-1 block text-cyan-300">{turn.role==='assistant'?'xAI response':'You'}</strong>
                <p className="whitespace-pre-wrap break-words">{turn.content}</p>
              </div>
            ))}
          </div>
          {error && <div role="alert" className="mx-3 mb-1 rounded bg-rose-950/50 p-2 text-xs text-rose-300">{error}</div>}
          <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-800 p-3">
            <textarea
              aria-label="Message to xAI"
              placeholder="Ask Grok…"
              rows={2} maxLength={2400} value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="min-h-[55px] flex-1 resize-none rounded-lg border border-slate-700 bg-black/60 p-2 text-xs text-white"
            />
            <button type="submit" disabled={busy||!prompt.trim()}
              className="rounded-lg bg-cyan-600 p-2 text-white disabled:opacity-40"
              aria-label="Send message to xAI">
              <Send size={18}/>
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
