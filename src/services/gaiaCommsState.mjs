/** GAIA live VoIP state registry — real WebRTC event origin only. */
const defaultState=()=>({source:'browser-webrtc',phase:'disconnected',remotePeerCount:null,
 localMedia:false,remoteMedia:false,measuredAt:null,signaling:'unconfigured'});
let live=defaultState();
const listeners=new Set();
function copy(){return {...live}}
export const gaiaCommsState={
 snapshot:copy,
 record(update){
  if(!update||typeof update!=='object')throw TypeError('Call event required');
  const safe={};
  if(typeof update.phase==='string'&&/^[a-z0-9-]{1,48}$/.test(update.phase))safe.phase=update.phase;
  if(typeof update.signaling==='string'&&['unconfigured','connecting','connected','disconnected','error'].includes(update.signaling))safe.signaling=update.signaling;
  if(typeof update.localMedia==='boolean')safe.localMedia=update.localMedia;
  if(typeof update.remoteMedia==='boolean')safe.remoteMedia=update.remoteMedia;
  if(Number.isSafeInteger(update.remotePeerCount)&&update.remotePeerCount>=0&&update.remotePeerCount<=1)safe.remotePeerCount=update.remotePeerCount;
  live={...live,...safe,measuredAt:new Date().toISOString()};
  for(const fn of listeners){try{fn(copy())}catch{}}
  return copy();
 },
 reset(){
  live=defaultState();return copy();
 },
 subscribe(fn){
  if(typeof fn!=='function')throw TypeError('Callback required');
  listeners.add(fn);
  return ()=>listeners.delete(fn);
 }
};
