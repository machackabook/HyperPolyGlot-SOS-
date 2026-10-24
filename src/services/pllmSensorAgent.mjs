/**
 * PLLM Sensor Agent v1 — opt-in, ephemeral, in-app observation.
 *
 * The source sketch's global keydown logger, automatic microphone/GPS start,
 * and unauthenticated POST :7070 were not ported. This observes measured
 * rendering frame times, user-triggered sample clicks, and optional AUDIO LEVEL
 * only after explicit permission. It never records words, audio samples or GPS.
 */
const limited=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const avg=xs=>xs.length?xs.reduce((s,n)=>s+n,0)/xs.length:0;
const variance=xs=>xs.length?avg(xs.map(x=>(x-avg(xs))**2)):0;
function rounded(x){return Math.round(x*1000)/1000}
export function createPLLMSensorAgent({capacity=50,clock=()=>performance.now()}={}){
 if(!Number.isSafeInteger(capacity)||capacity<1||capacity>200)throw RangeError('Bad buffer capacity');
 let active=false,frameSamples=[],interactions=[],audioLevels=[],patterns=[],sequence=0;
 const listeners=new Set();
 function publish(){const v=status();for(const fn of listeners){try{fn(v)}catch{}}}
 const trim=arr=>{if(arr.length>capacity)arr.splice(0,arr.length-capacity)};
 function status(){return {active,samples:patterns.length,frameObservations:frameSamples.length,
  explicitInteractions:interactions.length,audioLevelObservations:audioLevels.length,
  locationTracking:false,keystrokeCapture:false,audioRecording:false,
  localOnly:true,sequence}}
 function enable(){active=true;publish();return status()}
 function disable(){
  active=false;frameSamples=[];interactions=[];audioLevels=[];publish();return status();
 }
 function recordFrame(durationMs){
  if(!active)return false;
  if(!limited(durationMs,0,1000))throw TypeError('Frame duration in ms required');
  frameSamples.push(durationMs);trim(frameSamples);return true;
 }
 function recordInteraction(at=clock()){
  if(!active)return false;
  if(!limited(at,0,1e14))throw TypeError('Invalid click timestamp');
  interactions.push(at);trim(interactions);return true;
 }
 function recordAudioLevel(value){
  if(!active)return false;
  if(!limited(value,0,1))throw TypeError('Expected normalized audio level 0..1');
  audioLevels.push(value);trim(audioLevels);return true;
 }
 function sample(){
  if(!active)throw Error('Collection disabled');
  const deltas=interactions.slice(1).map((t,i)=>t-interactions[i]).filter(n=>n>=0&&n<=60000);
  const out=Object.freeze({
   id:++sequence,at:new Date().toISOString(),origin:'measured-in-app-session',
   frame_interval_avg_ms:rounded(avg(frameSamples)),
   frame_jitter_variance_ms2:rounded(variance(frameSamples)),
   interaction_interval_avg_ms:rounded(avg(deltas)),
   click_flow_ratio:rounded(deltas.length?deltas.filter(x=>x<400).length/deltas.length:0),
   audio_energy_variance:rounded(variance(audioLevels)),
   frame_samples:frameSamples.length,click_samples:deltas.length,audio_level_samples:audioLevels.length,
   gps_drift:null, // no geolocation collection
   captures_text:false,captures_raw_audio:false,external_delivery:false
  });
  patterns.push(out);trim(patterns);publish();return out;
 }
 function summary(){return {source:'pllm-opt-in-in-app',...status(),recent:patterns.slice(-5).map(x=>({...x}))}}
 function reset(){disable();patterns=[];sequence=0;publish()}
 return {enable,disable,recordFrame,recordInteraction,recordAudioLevel,sample,summary,status,reset,
  subscribe(fn){if(typeof fn!=='function')throw TypeError('Callback required');listeners.add(fn);return()=>listeners.delete(fn)}};
}
export const pllmSensorAgent=createPLLMSensorAgent();
