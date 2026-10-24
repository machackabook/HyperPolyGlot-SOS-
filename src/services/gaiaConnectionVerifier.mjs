/**
 * GAIA connection verifier — measured heartbeat and source-specific status.
 * "Configured" does not imply an authenticated external account.
 */
import {quineMeshService} from './quineMeshService.mjs';
const IDS=['bridge','scribe','god','forge','runtime','ollama','github-cli','xai','gemini','cryptic-news'];
const STALE_MS=35000;
const empty=id=>({id,state:'unverified',proof:'not checked',observedAt:null,latencyMs:null});
export function createConnectionVerifier({mesh=quineMeshService,pollMs=15000,clock=()=>Date.now(),
 setRepeating=(fn,ms)=>setInterval(fn,ms),clearRepeating=id=>clearInterval(id)}={}){
 if(!Number.isSafeInteger(pollMs)||pollMs<5000||pollMs>120000)throw RangeError('Poll interval must be 5-120 seconds');
 let connected=false,timer=null,off=null,inflight=null,revision=0,generation=0;
 let entries=Object.fromEntries(IDS.map(id=>[id,empty(id)]));
 const listeners=new Set();
 const snapshot=()=>{
   const now=clock(),services=IDS.map(id=>{
     const x=entries[id];
     return {...x,state:x.observedAt!==null&&now-x.observedAt>STALE_MS&&
       x.state==='verified'?'stale':x.state};
   });
   return {version:'gaia-connection-verifier-v1',revision,
     bridgePaired:connected,checkedAt:Math.max(0,...services.map(x=>x.observedAt||0))||null,
     services,externalAccountsVerified:false,collection:'service-health-only'};
 };
 function emit(){revision++;const s=snapshot();for(const fn of listeners){try{fn(s)}catch{}}}
 function mark(id,state,proof,rtt=null){
   entries[id]={id,state,proof:String(proof).slice(0,140),
     observedAt:clock(),latencyMs:Number.isFinite(rtt)?Math.round(rtt*100)/100:null};
 }
 function clear(){entries=Object.fromEntries(IDS.map(id=>[id,empty(id)]));emit()}
 async function refresh(){
   if(inflight)return inflight;
   const currentGeneration=generation;
   const running=(async()=>{
     connected=mesh.status().state==='connected';
     if(!connected){clear();return snapshot()}
     let ping;
     try{ping=await mesh.ping()}catch{
       if(currentGeneration===generation){clear();mark('bridge','unavailable','Heartbeat failed');emit()}
       return snapshot();
     }
     if(currentGeneration!==generation)return snapshot();
     mark('bridge','verified','Authenticated local websocket pong',ping.rttMs);
     const checks=[
       ['scribe',()=>mesh.scribeStatus()],
       ['god',()=>mesh.godStatus()],
       ['forge',()=>mesh.forgeStatus()],
       ['runtime',()=>mesh.runtimeStatus()],
       ['ollama',()=>mesh.localAIStatus()],
       ['github-cli',()=>mesh.status().host],
       ['xai',()=>mesh.xaiCardStatus()]
     ];
     const results=await Promise.allSettled(checks.map(async([id,fn])=>[id,await fn()]));
     if(currentGeneration!==generation)return snapshot();
     for(let i=0;i<results.length;i++){
       const id=checks[i][0],record=results[i];
       if(record.status!=='fulfilled'){mark(id,'unavailable','Paired host endpoint unreachable');continue}
       const obj=record.value[1];
       if(id==='ollama'){
         mark(id,obj?.reachable&&obj?.model_available?'verified':'unavailable',
           obj?.reachable?(obj?.model_available?'Local model listed':'Model not installed'):'Ollama offline');
       }else if(id==='github-cli'){
         mark(id,'unverified',obj?.gh_installed?'CLI installed; gh auth untested':'CLI authentication unverified');
       }else if(id==='xai'){
         mark('xai',obj?.configured&&obj?.sdk_installed?'configured':'unverified',
           'SDK/key detection only; no authenticated request executed');
         mark('gemini',obj?.gemini?.configured&&obj?.gemini?.sdk_installed?'configured':'unverified',
           'SDK/key detection only; no authenticated request executed');
       }else if(id==='runtime'){
         mark(id,obj?.source==='local-python-executor'?'verified':'unverified',
           'Responding local worker status');
       }else if(id==='scribe'){
         mark(id,obj?.source==='local-nexus-scribe-v4'?'verified':'unverified',
           'Paired Scribe endpoint responded');
       }else{
         mark(id,obj&&typeof obj==='object'?'verified':'unverified',
           'Paired local '+id+' endpoint responded');
       }
     }
     mark('cryptic-news','unverified','Site login requires server-issued identity verification');
     emit();
     return snapshot();
   })();
   inflight=running;
   try{return await running}finally{if(inflight===running)inflight=null}
 }
 function start(){
   if(timer!==null)return snapshot();
   connected=mesh.status().state==='connected';
   off=mesh.subscribe(s=>{
     const was=connected;connected=s.state==='connected';
     if(!connected&&was){generation++;clear()}
     else if(connected&&!was){void refresh().catch(()=>{})}
   });
   timer=setRepeating(()=>void refresh().catch(()=>{}),pollMs);
   void refresh().catch(()=>{});
   return snapshot();
 }
 function stop(){
   if(timer!==null){clearRepeating(timer);timer=null}
   if(off){off();off=null}
   generation++;connected=false;clear();
 }
 return {refresh,start,stop,snapshot,subscribe(fn){
   if(typeof fn!=='function')throw TypeError('Listener required');
   listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);
 }};
}
export const gaiaConnectionVerifier=createConnectionVerifier();
