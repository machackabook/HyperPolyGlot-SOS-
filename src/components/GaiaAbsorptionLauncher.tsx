import React from 'react';
import { ExternalLink, ArchiveRestore } from 'lucide-react';

/**
 * Opens the self-contained GAIA Quine Forge as an isolated, static artifact.
 * The editor stores only user-supplied inert data inside the downloaded HTML.
 */
export function GaiaAbsorptionLauncher() {
  const href = import.meta.env.BASE_URL + 'gaia-absorption-quine.html';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      title="Open the standalone, offline-capable Absorption Quine Forge"
      className="pointer-events-auto fixed bottom-28 left-4 z-30 inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-slate-950/80 px-3 py-2 text-[11px] font-mono font-semibold text-cyan-100 shadow-[0_4px_24px_rgba(0,229,255,0.15)] backdrop-blur-md hover:bg-slate-900 focus-visible:outline-cyan-200">
      <ArchiveRestore size={16}/> QUINE FORGE <ExternalLink size={13}/>
    </a>
  );
}
