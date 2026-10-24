import React,{useEffect,useMemo,useRef,useState} from 'react';
import {gaiaMeshV4,projectGrid,meshForecast} from '../services/gaiaMeshSyncV4.mjs';
import {createNeutronalityFabric} from '../services/gaiaNeutronalityV15.mjs';
import {pllmSensorAgent} from '../services/pllmSensorAgent.mjs';
import {geoNexusService, type GeoTelemetry} from '../services/geoNexusService';

const SRC='local-source://sensor/pllm';
const BTN='rounded-md border border-cyan-400/40 bg-slate-900/85 px-2 py-1.5 text-[11px] text-cyan-100 hover:bg-slate-700';
const DEFAULT_GEO=geoNexusService.getTelemetry();

export function GaiaCognitionPanel(){
 const [open,setOpen]=useState(false);
 const [frame,setFrame]=useState(gaiaMeshV4.snapshot());
 const [sampleStatus,setSampleStatus]=useState(pllmSensorAgent.status());
 const [location,setLocation]=useState<GeoTelemetry>(DEFAULT_GEO);
 const [summary,setSummary]=useState<any>(null);
 const [selected,setSelected]=useState<string>('nexus.core');
 const [issue,setIssue]=useState('');
 const ledger=useRef<any>(null);
 if(ledger.current===null) {
  // A deliberately metadata-only local journal. No typed content,
  // coordinates, secrets or voice transcripts are accepted.
  ledger.current=createNeutronalityFabric({
   storage:typeof window!=='undefined'?window.localStorage:null,maxEntries:256
  });
 }
 useEffect(()=>{
  const unsubMesh=gaiaMeshV4.subscribe((next:any)=>setFrame(next));
  const unsubSensor=pllmSensorAgent.subscribe((next:any)=>setSampleStatus(next));
  const unsubGeo=geoNexusService.onTelemetryChange(setLocation);
  const unsubLedger=ledger.current.subscribe((x:any)=>setSummary(x));
  void ledger.current.load().then(()=>setSummary(ledger.current.summary()))
    .catch(()=>setIssue('Local evolution ledger could not be verified.'));
  return()=>{
   unsubMesh();unsubSensor();unsubGeo();unsubLedger();
   pllmSensorAgent.disable();
  };
 },[]);
 useEffect(()=>{
  if(!sampleStatus.active)return;
  let id=0,previous=0;
  const tick=(timestamp:number)=>{
   if(document.visibilityState==='visible'&&previous>0){
    const delta=timestamp-previous;
    if(delta>=0&&delta<=1000)pllmSensorAgent.recordFrame(delta);
   }
   previous=timestamp;
   id=requestAnimationFrame(tick);
  };
  id=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(id);
 },[sampleStatus.active]);
 useEffect(()=>{
  if(!sampleStatus.active)return;
  // After one explicit Enable click, sample + summarize automatically.
  const timer=window.setInterval(()=>{
   try{
    const sample=pllmSensorAgent.sample();
    void ledger.current.ingest({kind:'sensor',intent:'pllm.frame',
      sourceRef:SRC,metrics:{
       frame_interval_avg_ms:sample.frame_interval_avg_ms,
       frame_jitter_variance_ms2:sample.frame_jitter_variance_ms2,
       frame_samples:sample.frame_samples,
       interaction_count:sample.click_samples
      }}).catch(()=>setIssue('Evolution ledger append failed.'));
   }catch(e:any){setIssue(String(e?.message||e))}
  },12000);
  return()=>window.clearInterval(timer);
 },[sampleStatus.active]);
 const projection=useMemo(()=>projectGrid(frame,{width:840,height:460}),[frame]);
 const forecast=useMemo(()=>meshForecast(frame),[frame]);
 const selectedNode=projection.nodes.find((n:any)=>n.id===selected);
 async function locate(){
  setIssue('');
  try{await geoNexusService.syncTerminalWithGeo()}
  catch(e:any){setIssue('TerraSphere: '+String(e?.message||e))}
 }
 const browserLocation=location.status==='active'&&location.source==='browser-geolocation';
 return <>
  <button type="button" onClick={()=>setOpen(v=>!v)}
    aria-label="Open GAIA evolving neural link mesh"
    className="pointer-events-auto fixed bottom-4 left-4 z-40 rounded-xl border border-emerald-400/40 bg-slate-950/90 px-3 py-2 text-xs font-mono text-emerald-200">
    ⚛ GAIA · MESH V4
  </button>
  {open&&<aside role="dialog" aria-label="GAIA neural links, location and evolution evidence"
    className="pointer-events-auto fixed bottom-16 left-3 z-50 flex max-h-[75vh] w-[min(96vw,940px)] flex-col overflow-hidden rounded-xl border border-emerald-400/50 bg-slate-950/95 text-slate-100 shadow-2xl">
    <header className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
     <strong className="mr-auto text-xs text-emerald-200">NEXUS EVOLUTION · NEUTRONALITY V15 · TERRASPHERE</strong>
     <button type="button" className={BTN} onClick={()=>sampleStatus.active?pllmSensorAgent.disable():pllmSensorAgent.enable()}>
      {sampleStatus.active?'Disable sampling':'Enable local sampling'}
     </button>
     <button type="button" className={BTN} onClick={locate}>TerraSphere location</button>
     <button type="button" className={BTN} onClick={()=>geoNexusService.clearLocation()}>Clear location</button>
     <button type="button" className={BTN} onClick={()=>setOpen(false)}>Close</button>
    </header>
    <div className="grid grid-cols-1 gap-2 overflow-auto p-3 md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
     <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/35">
      <svg viewBox="0 0 840 460" role="img" aria-label="Grounded neural link mesh: arrows connect declared source modules"
        className="min-w-[650px] w-full">
       <defs><marker id="gaia-link-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
        <path d="M0 0 L6 3 L0 6" fill="none" stroke="#34d399" strokeWidth="1.2"/>
       </marker></defs>
       {projection.links.map((e:any,i:number)=><line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
         stroke="#34d399" strokeOpacity=".40" strokeWidth="1.3" markerEnd="url(#gaia-link-arrow)"/>)}
       {projection.nodes.map((n:any)=>(
        <g key={n.id} onClick={()=>setSelected(n.id)} role="button" tabIndex={0}
         onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(n.id)}}}
         className="cursor-pointer">
          <circle cx={n.x} cy={n.y} r={n.id===selected?9:6}
            fill={n.status==='verified'?'#34d399':n.kind==='canvas'?'#ffcc00':'#00e5ff'}
            stroke="#0a1222" strokeWidth="2"/>
          <text x={n.x+11} y={n.y+4} fontSize="10" fill="#cbd5e1">{n.title.slice(0,21)}</text>
        </g>
       ))}
      </svg>
     </div>
     <div className="space-y-3 break-words text-xs">
      <div className="rounded-md border border-white/10 p-2">
       <strong>Source graph · {frame.nodes.length} nodes / {frame.links.length} tethers</strong>
       <p className="mt-1 text-slate-400">Declared relationships are real source references, not live external connections.</p>
       {selectedNode&&<div className="mt-2">
        <p className="text-emerald-300">{selectedNode.title} · {selectedNode.status}</p>
        <p className="break-all text-slate-400">{selectedNode.sourceRef}</p>
       </div>}
      </div>
      <div className="rounded-md border border-white/10 p-2">
       <strong>Neutronality V15 · {summary?.entries||0} integrity-linked event(s)</strong>
       <p className="mt-1 text-slate-400">Last source: {summary?.recent?.at(-1)?.sourceRef||'none'}</p>
       <p className="text-slate-400">Future gates: {forecast.nextEvidence.join('; ')||'Evidence sources registered'}</p>
      </div>
      <div className="rounded-md border border-white/10 p-2">
       <strong>TerraSphere · {browserLocation?'Browser location available':'Location not active'}</strong>
       {browserLocation?<p>Approx. lat {location.lat.toFixed(2)}, lon {location.lng.toFixed(2)}
        · accuracy {Math.round(location.accuracyMeters||0)} m</p>:
        <p className="text-slate-400">Location requires your explicit permission.</p>}
       <p className="mt-1 text-slate-400">Device identity: NOT attested. Paired-host verification is separate from GPS.</p>
      </div>
      <div className="rounded-md border border-white/10 p-2">
       <strong>PLLM · {sampleStatus.active?'Active on-device':'Inactive'}</strong>
       <p className="text-slate-400">Frame samples: {sampleStatus.frameObservations} · stored aggregates: {sampleStatus.samples}</p>
       <p className="text-slate-400">No raw keys, precise coordinates, background mic or outbound telemetry.</p>
      </div>
      {issue&&<p role="alert" className="text-rose-300">{issue}</p>}
     </div>
    </div>
  </aside>}
 </>;
}
