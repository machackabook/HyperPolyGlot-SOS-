/**
 * CRYPTIC Portal — optional, first-party event reports. Cloudflare HTTP analytics
 * can count site visits independently. These are in-app journey events only.
 * No speech, location, keystrokes, personal identifiers, credential or content.
 */
const DEST='https://crypticnews.org/api/portal/event';
const CONSENT='cryptic.portal.journey.v1';
const STAGES=new Set(['surface','crypt','crossvoid','ethernet','forge-link']);
const EVENTS=new Set(['open','flip','traverse','portal','exit','site-link']);
const SOURCES=new Set(['github-pages','crypticnews']);
function storage(){
 try{return globalThis.localStorage}catch{return null}
}
export function journeyConsent(){
 return storage()?.getItem(CONSENT)==='yes'?'yes':
   storage()?.getItem(CONSENT)==='no'?'no':'unset';
}
export function setJourneyConsent(allowed){
 if(typeof allowed!=='boolean')throw TypeError('Boolean consent required');
 storage()?.setItem(CONSENT,allowed?'yes':'no');
 return journeyConsent();
}
export function validateJourney(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!['stage','event','source'].includes(k)))
  throw TypeError('Only public journey metadata permitted');
 if(!STAGES.has(data.stage)||!EVENTS.has(data.event)||!SOURCES.has(data.source))
  throw TypeError('Unknown journey stage/event/source');
 return Object.freeze({stage:data.stage,event:data.event,source:data.source});
}
export async function reportJourney(data, fetchFn=globalThis.fetch){
 const record=validateJourney(data);
 if(journeyConsent()!=='yes')return {status:'not-sent',reason:'no-optional-consent'};
 if(typeof fetchFn!=='function')return {status:'unavailable'};
 try{
  const result=await fetchFn(DEST,{method:'POST',mode:'cors',credentials:'omit',
   cache:'no-store',keepalive:true,headers:{'Content-Type':'text/plain;charset=UTF-8'},
   body:JSON.stringify(record),signal:AbortSignal.timeout(4000)});
  if(!result.ok)return {status:'unavailable',httpStatus:result.status};
  const receipt=await result.json();
  return receipt?.recorded===true?{status:'recorded'}:{status:'unverified'};
 }catch{return {status:'unavailable'}}
}
export const portalTelemetryDestination=DEST;
