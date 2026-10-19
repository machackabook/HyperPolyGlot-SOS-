import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioVoiceService } from '../services/audioVoiceService';
import type { EnvironmentState } from '../types';
import { parseDirective, parseVoiceDirective, type Directive, type Panel, type Persona, PANELS } from '../services/anchorZeroRouter';

type Snapshot = { active: Panel | null; opacity: Record<Panel, number>; persona: Persona; intensity: number };
const defaults = (): Snapshot => ({active:null,persona:'NEXUS',intensity:1,opacity:{canvas:100,docs:100,sessions:100,lineage:100,settings:100}});
export function AnchorZeroOverlay({setEnvState}:{setEnvState:React.Dispatch<React.SetStateAction<EnvironmentState>>}) {
 const [open,setOpen]=useState(false), [state,setState]=useState<Snapshot>(defaults);
 const [typed,setTyped]=useState(''), [message,setMessage]=useState('READY'), [history,setHistory]=useState<string[]>([]);
 const [doc,setDoc]=useState(''), [caption,setCaption]=useState('');
 const stateRef=useRef(state),undo=useRef<Snapshot[]>([]),last=useRef('');
 useEffect(()=>{stateRef.current=state},[state]);
 const apply=useCallback((cmd:Directive)=>{
   const prior=stateRef.current;
   if(cmd.kind==='undo') {
     const old=undo.current.pop();if(!old){setMessage('Nothing to undo');return}
     stateRef.current=old;setState(old);setMessage('ErrUndo restored prior state');
     const colors: Record<Persona,string>={GAIA:'#34d399',NEXUS:'#00ffff',SARAFINSOLARIS:'#ffcc00',MUSE:'#a855f7',ADAM:'#e0e7ff'};
     setEnvState(e=>({...e,primaryColor:colors[old.persona],audioReactiveLevel:old.opacity.canvas/100,bloomIntensity:old.intensity}));
     return;
   }
   const next:Snapshot={...prior,opacity:{...prior.opacity}};
   if(cmd.kind==='panel')next.active=cmd.on?cmd.panel:(prior.active===cmd.panel?null:prior.active);
   if(cmd.kind==='opacity')next.opacity[cmd.panel]=cmd.value;
   if(cmd.kind==='persona')next.persona=cmd.persona;
   if(cmd.kind==='intensity')next.intensity=cmd.value;
   if(JSON.stringify(next)===JSON.stringify(prior))return;
   undo.current.push(prior);if(undo.current.length>40)undo.current.shift();
   stateRef.current=next;setState(next);
   const line=new Date().toISOString()+' '+JSON.stringify(cmd);
   setHistory(h=>[line,...h].slice(0,50));
   setMessage(cmd.kind.toUpperCase()+' APPLIED LOCALLY');
   if(cmd.kind==='opacity' && cmd.panel==='canvas')setEnvState(e=>({...e,audioReactiveLevel:next.opacity.canvas/100}));
   if(cmd.kind==='intensity')setEnvState(e=>({...e,bloomIntensity:next.intensity}));
   if(cmd.kind==='persona') {
     const color:Record<Persona,string>={GAIA:'#34d399',NEXUS:'#00ffff',SARAFINSOLARIS:'#ffcc00',MUSE:'#a855f7',ADAM:'#e0e7ff'};
     setEnvState(e=>({...e,primaryColor:color[next.persona],floatingGlyph:next.persona==='SARAFINSOLARIS'?'◇':e.floatingGlyph}));
   }
 },[setEnvState]);
 useEffect(()=>audioVoiceService.onTranscript((t,final)=>{
   if(!final)return;
   setCaption(t);
   const d=parseVoiceDirective(t);if(d)apply(d);
 }),[apply]);
 const input=(value:string)=>{
   setTyped(value);
   const d=parseDirective(value);
   if(!d){last.current='';return}
   const signature=JSON.stringify(d);
   if(signature!==last.current){last.current=signature;apply(d)}
 };
 const active=state.active;
 return <div className="fixed top-0 left-0 z-[60] max-w-[min(96vw,540px)] font-mono text-xs">
   <button aria-expanded={open} aria-controls="nexus-anchor-dock" aria-label="Open Anchor Zero control dock" className="m-1 rounded border border-cyan-400 bg-[#0a0a1f]/95 px-2 py-1 text-cyan-300" onClick={()=>setOpen(v=>!v)}>◇ 0.0.0</button>
   {open&&<section id="nexus-anchor-dock" aria-label="Anchor Zero command dock" className="m-1 rounded-lg border border-cyan-400/50 bg-[#0a0a1f]/95 p-3 text-[#e0e7ff] shadow-xl">
      <div className="mb-2">COAXIAL LOCAL STAGE / {state.persona}</div>
      <label htmlFor="anchor-command" className="block text-cyan-300">Live directive</label>
      <input id="anchor-command" value={typed} onChange={e=>input(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){setTyped('');last.current=''}}} className="w-full rounded border border-slate-500 bg-black p-2" placeholder="panel canvas on / (canvas)opacity 50% / undo"/>
      <div className="flex flex-wrap gap-1 py-2">{PANELS.map(p=><button key={p} className="rounded border border-slate-600 px-2 py-1" onClick={()=>apply({kind:'panel',panel:p,on:true})}>{p}</button>)}<button className="rounded border border-amber-500 px-2 py-1" onClick={()=>apply({kind:'undo'})}>ErrUndo</button><button onClick={()=>apply({kind:'panel',panel:'canvas',on:false})} className="rounded border border-red-600 px-2 py-1">Off</button></div>
      <div role="status" aria-live="polite">{message}</div>
      <div aria-live="polite" className="text-cyan-300">{caption&&'Caption: '+caption.slice(0,160)}</div>
      {active&&<article key={active} aria-label={active+' panel'} className="my-2 max-h-[45vh] overflow-auto rounded border border-purple-500 p-2" style={{opacity:state.opacity[active]/100}}>
        <header className="flex justify-between"><strong>{active.toUpperCase()}</strong><button onClick={()=>apply({kind:'panel',panel:active,on:false})} aria-label={'Close '+active}>×</button></header>
        {active==='docs'&&<textarea aria-label="Local document, not uploaded" className="mt-2 h-36 w-full bg-black p-2" value={doc} onChange={e=>setDoc(e.target.value)}/>}
        {active==='canvas'&&<div className="p-2">The existing Three.js background remains the sole GPU renderer. Intensity: {state.intensity}; opacity: {state.opacity.canvas}%.</div>}
        {active==='settings'&&<label className="block">Fractal intensity<input className="w-full" type="range" min=".2" max="3" step=".1" value={state.intensity} onChange={e=>apply({kind:'intensity',value:Number(e.target.value)})}/></label>}
        {active==='sessions'&&<p>Local persona: {state.persona}. The original HyperTerminal owns model connections and microphone capture.</p>}
        {active==='lineage'&&<pre className="whitespace-pre-wrap">{history.join('\n')||'No local changes in this session'}</pre>}
      </article>}
      <div>Private MemoryStones are not read or transmitted by this overlay.</div>
   </section>}
 </div>;
}
