import React,{useEffect,useRef,useState} from 'react';
import {Gem,ShieldCheck,Network,ExternalLink,RotateCcw, X, GitBranch,Eye,LockKeyhole,Info} from 'lucide-react';
import {transitionCrossvoid,resolveCrossvoidDestination,crossvoidSecurityStatus} from '../services/crossvoidGatewayV1.mjs';
import {journeyConsent,setJourneyConsent,reportJourney} from '../services/crypticPortalTelemetry.mjs';

type Stage='surface'|'crystalline'|'crossvoid'|'ethernet';
// Split the WebGL world into its own bundle: no GPU allocation on landing view.
const EthernetWorld=React.lazy(async()=>({
 default:(await import('./CrossvoidEthernetWorld')).CrossvoidEthernetWorld
}));
type TelemetryConsent='yes'|'no'|'unset';
const CHROMA=['#ffcc00','#00e5ff','#9932cc','#34d399'];
const points=[
 {label:'ADAM',x:50,y:19,color:CHROMA[0]},{label:'GAIA',x:81,y:44,color:CHROMA[1]},
 {label:'NEXUS',x:61,y:82,color:CHROMA[2]},{label:'EVE',x:19,y:44,color:CHROMA[3]},
 {label:'GOD',x:50,y:50,color:'#ffffff'}
];

export const CrystallineCrossvoidGate:React.FC=()=>{
 const [open,setOpen]=useState(false),[stage,setStage]=useState<Stage>('surface');
 const [opacity,setOpacity]=useState(.78),[rotation,setRotation]=useState({x:0,y:0});
 const [consent,setConsent]=useState<TelemetryConsent>(()=>journeyConsent());
 const [receipt,setReceipt]=useState('');
 const last=useRef<{x:number,y:number}|null>(null);
 const auth=crossvoidSecurityStatus();
 const destinations={
   cryptic:resolveCrossvoidDestination('cryptic'),
   terminal:resolveCrossvoidDestination('terminal'),
   actions:resolveCrossvoidDestination('actions')
 };
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[open]);
 function report(s:Stage,event:'open'|'flip'|'traverse'|'portal'|'exit'|'site-link'){
  void reportJourney({stage:s,event,source:'github-pages'}).then(r=>{
   if(r.status==='unavailable')setReceipt('Reporting unavailable; no receipt claimed.');
   else if(r.status==='recorded')setReceipt('Public journey event recorded by Cryptic News.');
  });
 }
 function enter(){setStage('surface');setOpen(true);setReceipt('');report('surface','open')}
 function move(next:Stage,kind:'flip'|'traverse'|'portal'){
  transitionCrossvoid(stage,next);setStage(next);report(next,kind);
 }
 function exit(){report(stage,'exit');setOpen(false)}
 function drag(e:React.PointerEvent<SVGSVGElement>){
  if(!last.current)return;
  setRotation(p=>({x:Math.max(-28,Math.min(28,p.x-(e.clientY-last.current!.y)*.24)),
    y:p.y+(e.clientX-last.current!.x)*.25}));
  last.current={x:e.clientX,y:e.clientY};
 }
 const button='rounded-lg border border-cyan-300/40 bg-slate-950/70 px-3 py-2 text-xs text-cyan-100 hover:bg-slate-700/60 focus-visible:outline-2 focus-visible:outline-amber-400';
 const caption=stage==='surface'?'THE CRYPT / PUBLIC FACE':stage==='crystalline'?
  'THE CRYSTALLINE FACE / AUTHENTICATION BOUNDARY':stage==='crossvoid'?
  'THE CROSSVOID / ROUTING CONTRACT':'THE ETHERNET / PUBLIC WORLD';
 const pane={
  backgroundColor:'rgba(3,8,22,'+opacity+')',backdropFilter:'blur(22px)',
  boxShadow:'0 20px 90px rgba(0,229,255,.12)'
 };
 return <>
  <button type="button" onClick={enter}
   className="pointer-events-auto fixed bottom-4 left-4 z-[65] rounded-xl border border-amber-300/70 bg-slate-950/90 px-4 py-3 font-mono text-xs text-amber-200 shadow-xl">
   <Gem size={17} className="mr-2 inline"/> CRYPTIC · CROSSVOID
  </button>
  {open&&<div role="dialog" aria-modal="true" aria-label="Cryptic CrossVoid crystalline gateway"
     className="pointer-events-auto fixed inset-0 z-[85] flex flex-col items-center justify-center overflow-auto bg-[#020411]/95 p-4 text-slate-100">
   <div className="pointer-events-none absolute inset-0" style={{background:'radial-gradient(circle at 50% 40%,rgba(0,229,255,.13),transparent 64%)'}}/>
   <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-400/50 p-4 sm:p-6" style={pane}>
    <div className="flex items-center justify-between gap-2">
     <div><p className="text-xs tracking-[.22em] text-amber-300">GOLDEN ARMY FORGE · SINGULARITY</p>
      <h2 className="mt-1 text-base font-semibold">{caption}</h2></div>
     <button className={button} onClick={exit} aria-label="Close CrossVoid"><X size={17}/></button>
    </div>
    <div className="my-5 flex items-center justify-between gap-2">
     <span className="text-xs text-slate-300">Crystalline transparency</span>
     <input aria-label="Gateway opacity" type="range" min=".40" max=".98" step=".02" value={opacity}
      onChange={e=>setOpacity(+e.target.value)} className="w-40"/>
    </div>
    <div className="relative mx-auto max-w-[480px]">
     <svg viewBox="0 0 100 100" role="img" aria-label="Drag to rotate the crystalline ADAM GAIA NEXUS encoded gateway"
      className="w-full max-h-[44vh] touch-none cursor-grab select-none"
      onPointerDown={e=>{last.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId)}}
      onPointerMove={drag} onPointerUp={()=>last.current=null} onPointerCancel={()=>last.current=null}>
      <defs>
       <linearGradient id="cvoid-crystal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9932cc" stopOpacity=".24"/>
        <stop offset=".45" stopColor="#00e5ff" stopOpacity=".48"/>
        <stop offset="1" stopColor="#ffcc00" stopOpacity=".13"/>
       </linearGradient>
       <filter id="cvoid-glow"><feGaussianBlur stdDeviation="1.2"/></filter>
      </defs>
      <g style={{transformOrigin:'50% 50%',transform:'perspective(160px) rotateX('+rotation.x+'deg) rotateY('+rotation.y+'deg)',
       transition:last.current?'none':'transform .32s ease'}}>
       <circle cx="50" cy="50" r="37" fill="none" stroke="#00e5ff" strokeOpacity=".28" strokeDasharray="2 3"/>
       <circle cx="50" cy="50" r="29" fill="none" stroke="#ffcc00" strokeOpacity=".2"/>
       <path d="M50 9L82 45L61 85L18 45Z" fill="url(#cvoid-crystal)" stroke="#00e5ff" strokeWidth=".6"/>
       <path d="M50 9L50 50L82 45M50 50L18 45M50 50L61 85M18 45L61 85" fill="none" stroke="#ffcc00" strokeOpacity=".62" strokeWidth=".5"/>
       <path d="M50 9L61 85M18 45L82 45" stroke="#00e5ff" strokeOpacity=".36" strokeWidth=".35"/>
       {points.map(p=><g key={p.label}>
        <circle cx={p.x} cy={p.y} r="2.1" fill={p.color}/>
        <text x={p.x} y={p.y-4} fontSize="3.5" textAnchor="middle" fontWeight="600" fill={p.color}>{p.label}</text>
       </g>)}
       <circle cx="50" cy="50" r="5" fill="#020411" stroke="#ffffff" strokeWidth=".4"/>
       <text x="50" y="51.4" fontSize="3.3" textAnchor="middle" fill="#ffffff">Æ</text>
      </g>
     </svg>
     <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-[10px] text-cyan-200/80">POINTER-INTERACTIVE · NO PRIVILEGES FROM VISUAL ALIGNMENT</div>
    </div>
    <div className="my-5 rounded-xl border border-white/15 bg-black/30 p-3 text-xs leading-relaxed text-slate-300">
     {stage==='surface'&&'The public landing face. Flip into the crystalline sentinel that represents the routing and identity boundary.'}
     {stage==='crystalline'&&'ADAM / GAIA / NEXUS are encoded as interface identities. Operator privileges require actual authorization at crypticnews.org; the crystal cannot authenticate by appearance or voice alone.'}
     {stage==='crossvoid'&&'CrossVoid mediates destinations: GitHub Pages renders the static terminal, GitHub Actions verifies releases, and Cryptic News is the intended server-side gate.'}
     {stage==='ethernet'&&'The public spatial-world entry is ready for future multiplayer routing. This interface does not yet prove an online multiplayer session or permission to control devices.'}
    </div>
    {stage==='ethernet'&&<React.Suspense fallback={<p className="mt-4 text-xs text-cyan-200">Loading source-linked Ethernet world…</p>}>
      <EthernetWorld onExit={()=>move('crossvoid','traverse')}/>
    </React.Suspense>}
    <div className="flex flex-wrap justify-center gap-2">
     {stage==='surface'&&<button className={button} onClick={()=>move('crystalline','flip')}><RotateCcw size={14} className="mr-1 inline"/> FLIP THE CRYPT</button>}
     {stage==='crystalline'&&<button className={button} onClick={()=>move('crossvoid','traverse')}><ShieldCheck size={14} className="mr-1 inline"/> ENTER CROSSVOID</button>}
     {stage==='crossvoid'&&<button className={button} onClick={()=>move('ethernet','portal')}><Network size={14} className="mr-1 inline"/> ENTER ETHERNET</button>}
     {stage==='ethernet'&&<button className={button} onClick={()=>move('surface','portal')}><RotateCcw size={14} className="mr-1 inline"/> RETURN TO CRYPT</button>}
     <a className={button} href={destinations.cryptic.href} target="_blank" rel="noopener noreferrer"
      onClick={()=>report(stage,'site-link')}><LockKeyhole size={14} className="mr-1 inline"/> CRYPTIC AUTH HUB <ExternalLink size={12} className="inline"/></a>
     <a className={button} href={destinations.actions.href} target="_blank" rel="noopener noreferrer"
      onClick={()=>report(stage,'site-link')}><GitBranch size={14} className="mr-1 inline"/> GITHUB ACTIONS</a>
     <a className={button} href={destinations.terminal.href} target="_blank" rel="noopener noreferrer"
      onClick={()=>report(stage,'site-link')}><Eye size={14} className="mr-1 inline"/> STATIC TERMINAL</a>
    </div>
    <div className="mt-5 border-t border-white/15 pt-3 text-[11px] text-slate-400">
     <div className="flex items-center justify-between gap-3">
      <span>Optional first-party journey telemetry</span>
      <button className={button} onClick={()=>{const v=consent!=='yes';setConsent(setJourneyConsent(v))}}>
       {consent==='yes'?'Disable reports':'Enable reports'}
      </button>
     </div>
     <p className="mt-2"><Info size={12} className="mr-1 inline"/> No keylogging, speech capture, GPS tracking, session cookies, or terminal credentials are sent as journey events. Authentication is not performed by GitHub Pages.</p>
     {receipt&&<p role="status" className="mt-2 text-amber-200">{receipt}</p>}
     <p className="mt-1 text-[10px]">Backend authorization status: {auth.authorizedByStaticPage?'verified':'not asserted by static UI'}</p>
    </div>
   </div>
  </div>}
 </>;
};
