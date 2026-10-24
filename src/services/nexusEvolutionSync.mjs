/**
 * GAIA Nexus Evolution — bounded data-only event bus.
 * "nexus-sync" updates the in-memory graph and subscribers, NOT module code.
 * This does not mean persistent model training or a cloud connection.
 */
import {gaiaMeshV4} from './gaiaMeshSyncV4.mjs';
const ID=/^[a-z][a-z0-9_.:/-]{1,95}$/;
let revision=0,lastError=null;
const observers=new Set();
export function applyNexusSync(detail){
 if(!detail||typeof detail!=='object'||typeof detail.artifactId!=='string'||
    !ID.test(detail.artifactId)||!detail.newData||typeof detail.newData!=='object'||
    Array.isArray(detail.newData))throw TypeError('Malformed nexus-sync message');
 const current=gaiaMeshV4.snapshot();
 const id=detail.artifactId;
 const previous=current.nodes.find(x=>x.id===id);
 const patch=detail.newData;
 const allowed=['title','sourceRef','kind','status','contentHash'];
 if(Object.keys(patch).some(k=>!allowed.includes(k)))throw TypeError('Only graph metadata can be synchronized');
 if(!previous || previous.id.startsWith('nexus.'))throw Error('Core and undeclared nodes cannot be overwritten');
 const updated={...previous,...patch,id};
 // Atomically validate update using the existing strict registry.
 const next=gaiaMeshV4.ingest({
  nodes:current.nodes.filter(n=>!n.id.startsWith('nexus.')).map(n=>n.id===id?updated:n),
  links:current.links.filter(e=>!(e.from.startsWith('nexus.')&&e.to.startsWith('nexus.')))
 });
 revision++;
 for(const fn of observers){try{fn({revision,artifactId:id,frame:next})}catch{}}
 return {revision,artifactId:id,meshRevision:next.revision};
}
export function startNexusSync(win){
 if(!win||typeof win.addEventListener!=='function')throw TypeError('Window event source required');
 const listener=event=>{
  try{lastError=null;applyNexusSync(event.detail)}
  catch(error){lastError=String(error?.message||error)}
 };
 win.addEventListener('nexus-sync',listener);
 return ()=>win.removeEventListener('nexus-sync',listener);
}
export const nexusSyncStatus=()=>({revision,lastError,source:'browser-custom-event',externalSyncVerified:false});
export function subscribeNexusSync(fn){
 if(typeof fn!=='function')throw TypeError('Observer required');
 observers.add(fn);return ()=>observers.delete(fn);
}
