import React, {useEffect,useState} from 'react';
import {Activity, ShieldCheck, ShieldAlert, RefreshCw, X, LockKeyhole} from 'lucide-react';
import {gaiaConnectionVerifier} from '../services/gaiaConnectionVerifier.mjs';
import {gaiaAuthorizationGate} from '../services/gaiaAuthorizationGate.mjs';

type Service={id:string;state:string;proof:string;observedAt:number|null;latencyMs:number|null};
type CenterStatus={bridgePaired:boolean;checkedAt:number|null;services:Service[];revision:number};
type Approval={id:number;capability:string;resource:string;expiresAt:number};
const labels:Record<string,string>={
  bridge:'Local Quine bridge',scribe:'GAIA Memory / Scribe',god:'GOD Network Gate',
  forge:'Golden Army Forge',runtime:'Local workers',ollama:'Ollama model',
  'github-cli':'GitHub CLI',xai:'xAI SDK',gemini:'Gemini SDK','cryptic-news':'Cryptic News account'
};
const TONE:Record<string,string>={
  verified:'text-emerald-300',configured:'text-amber-300',
  unavailable:'text-rose-300',stale:'text-amber-300',unverified:'text-slate-300'
};
export function GaiaConnectionCenter(){
  const [visible,setVisible]=useState(false);
  const [health,setHealth]=useState<CenterStatus>(()=>gaiaConnectionVerifier.snapshot());
  const [request,setRequest]=useState<Approval|null>(()=>gaiaAuthorizationGate.snapshot());
  const [refreshing,setRefreshing]=useState(false);
  useEffect(()=>{
    const offHealth=gaiaConnectionVerifier.subscribe((state:CenterStatus)=>setHealth(state));
    const offPrompt=gaiaAuthorizationGate.subscribe((state:Approval|null)=>setRequest(state));
    gaiaConnectionVerifier.start();
    return()=>{
      gaiaAuthorizationGate.cancelPending();
      offPrompt();offHealth();gaiaConnectionVerifier.stop();
    };
  },[]);
  const verify=async()=>{
    if(refreshing)return;
    setRefreshing(true);
    try{await gaiaConnectionVerifier.refresh()}
    finally{setRefreshing(false)}
  };
  const verified=health.services.filter(s=>s.state==='verified').length;
  return (<>
    <button type="button" onClick={()=>setVisible(x=>!x)}
      aria-label="Open GAIA live connection verifier"
      className="pointer-events-auto fixed left-3 top-14 z-[70] flex items-center gap-2 rounded-lg border border-cyan-400/45 bg-slate-950/85 px-2.5 py-2 text-xs text-cyan-100 shadow-xl">
      {health.bridgePaired?<ShieldCheck size={15}/>:<ShieldAlert size={15}/>}
      GAIA VERIFY · {verified} local services
    </button>
    {visible&&<aside role="dialog" aria-label="GAIA connected account and service verifier"
      className="pointer-events-auto fixed left-3 top-28 z-[70] flex w-[min(92vw,360px)] max-h-[67vh] flex-col overflow-hidden rounded-xl border border-cyan-400/50 bg-slate-950/95 text-slate-100 shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/15 p-3">
        <strong className="flex items-center gap-2 text-sm"><Activity size={16}/> Verified connections</strong>
        <div className="flex gap-3">
          <button type="button" title="Check services now" aria-label="Refresh connection status"
            onClick={verify} disabled={refreshing} className="text-cyan-300 disabled:opacity-50">
            <RefreshCw size={17}/>
          </button>
          <button type="button" aria-label="Close status panel" onClick={()=>setVisible(false)}><X size={18}/></button>
        </div>
      </header>
      <div className="overflow-y-auto px-3 py-2 text-xs">
        <p className="mb-2 text-slate-300">
          {health.bridgePaired?'Local pairing established; health checked every 15 seconds.':
            'Not paired. Run mesh connect in the terminal. No service is assumed online.'}
        </p>
        <p className="mb-2 text-[10px] text-slate-400">
          Last observation: {health.checkedAt?new Date(health.checkedAt).toLocaleTimeString():'None'}
        </p>
        {health.services.map(service=><div key={service.id}
          className="mb-1.5 border-b border-white/10 pb-1.5">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-slate-100">{labels[service.id]||service.id}</strong>
            <span className={TONE[service.state]||TONE.unverified}>{service.state}</span>
          </div>
          <p className="text-[10px] text-slate-400">{service.proof}
            {service.latencyMs!==null?' · '+service.latencyMs+' ms':''}
          </p>
        </div>)}
        <p className="mt-2 text-[10px] text-slate-400">
          Connected local services are not proof of Google, GitHub or Cryptic News account identity.
          The dashboard does not upload private activity or keep a host connection alive after the page closes.
        </p>
      </div>
    </aside>}
    {request&&<section role="alertdialog" aria-modal="true"
      aria-label="Authorize a privileged GAIA operation"
      className="pointer-events-auto fixed bottom-4 right-4 z-[100] w-[min(92vw,390px)] rounded-xl border border-amber-400/70 bg-slate-950/95 p-4 text-slate-100 shadow-2xl">
      <h2 className="flex items-center gap-2 text-sm font-bold text-amber-300">
        <LockKeyhole size={18}/> Authorization requested
      </h2>
      <p className="mt-2 text-xs">A paired host operation needs your approval before it runs.</p>
      <p className="mt-2 break-all rounded bg-black/40 p-2 font-mono text-[11px]">
        {request.capability} · {request.resource}
      </p>
      <p className="mt-2 text-[10px] text-slate-400">
        One action only; expires automatically. Deny leaves the host unchanged.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={()=>gaiaAuthorizationGate.deny(request.id)}
          className="rounded-lg border border-slate-600 px-4 py-2 text-xs">Deny</button>
        <button type="button" onClick={()=>gaiaAuthorizationGate.approve(request.id)}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950">
          Authorize once
        </button>
      </div>
    </section>}
  </>);
}
