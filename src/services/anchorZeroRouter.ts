// Anchor Zero local-only typed command router. No evaluation or network execution.
export type Persona = 'GAIA' | 'NEXUS' | 'SARAFINSOLARIS' | 'MUSE' | 'ADAM';
export type Panel = 'canvas' | 'docs' | 'sessions' | 'lineage' | 'settings';
export type Directive =
  | { kind: 'panel'; panel: Panel; on: boolean }
  | { kind: 'opacity'; panel: Panel; value: number }
  | { kind: 'persona'; persona: Persona }
  | { kind: 'intensity'; value: number }
  | { kind: 'undo' };
export const PANELS: readonly Panel[] = ['canvas','docs','sessions','lineage','settings'];
export function parseDirective(raw: string): Directive | null {
  if (raw.length > 240) return null;
  const s = raw.trim().toLowerCase();
  if (/^(undo|errundo)$/.test(s)) return { kind:'undo' };
  let m = s.match(/^panel (canvas|docs|sessions|lineage|settings) (on|off)$/);
  if (m) return { kind:'panel',panel:m[1] as Panel,on:m[2]==='on' };
  m = s.match(/^\(?(canvas|docs|sessions|lineage|settings)\)?\s*opacity\s+(\d{1,3})%$/);
  if (m && +m[2] <= 100) return {kind:'opacity',panel:m[1] as Panel,value:+m[2]};
  m = s.match(/^(?:wake|persona)\s+(gaia|nexus|solaris|sarafinsolaris|muse|adam)$/);
  if (m) return {kind:'persona',persona:(m[1]==='solaris'?'SARAFINSOLARIS':m[1].toUpperCase()) as Persona};
  m = s.match(/^fractal intensity (\d+(?:\.\d+)?)$/);
  if (m && +m[1] >= .2 && +m[1] <= 3) return {kind:'intensity',value:+m[1]};
  return null;
}
export function parseVoiceDirective(raw: string): Directive | null {
  // Require wake context for spoken commands; never infer destructive actions.
  const m = raw.trim().match(/^(?:hey\s+)?(gaia|nexus|solaris|sarafinsolaris|muse|adam)[,.:!]?\s*(.*)$/i);
  if (!m) return null;
  const rest = m[2].trim();
  return rest ? parseDirective(rest) : parseDirective('wake '+m[1]);
}
