/**
 * Neutronality V15 — portable, bounded, append-only project-state summaries.
 * The 16-character fingerprint requested in V15 is useful as a display label,
 * but the FULL SHA-256 is retained for collision-resistant integrity checks.
 * No personal identity inference and no automatic remote synchronization.
 */
const KINDS=new Set(['mesh','memory','compute','render','sensor','sync','remedy']);
const ID=/^[a-z][a-z0-9_.:/-]{1,95}$/;
const REF=/^(?:local-source:\/\/[a-z0-9_.:/-]{1,180}|repo:\/\/[a-z0-9_.:/-]{1,180})$/;
const HASH=/^[0-9a-f]{64}$/;
const STORAGE_KEY='gaia.neutronality.v15.project-events';
const isFiniteNumber=x=>typeof x==='number'&&Number.isFinite(x);
function canonical(input) {
 if(Array.isArray(input))return '['+input.map(canonical).join(',')+']';
 if(input!==null&&typeof input==='object'){
  const keys=Object.keys(input).sort();
  return '{'+keys.map(k=>JSON.stringify(k)+':'+canonical(input[k])).join(',')+'}';
 }
 return JSON.stringify(input);
}
async function sha256(text) {
 if(typeof text!=='string')throw TypeError('Cannot hash nontext data');
 if(!globalThis.crypto?.subtle)throw Error('Web Crypto SHA-256 unavailable');
 const bytes=new TextEncoder().encode(text);
 const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function normalizePayload(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw TypeError('Project event required');
 if(!KINDS.has(value.kind))throw TypeError('Unsupported project event category');
 if(typeof value.intent!=='string'||!ID.test(value.intent))throw TypeError('Invalid bounded intent');
 if(typeof value.sourceRef!=='string'||!REF.test(value.sourceRef))throw TypeError('Source reference required');
 const metrics=value.metrics===undefined?{}:value.metrics;
 if(!metrics||typeof metrics!=='object'||Array.isArray(metrics)||Object.keys(metrics).length>12)
  throw TypeError('Finite aggregated metrics required');
 const clean={};
 for(const [key,n] of Object.entries(metrics)){
  if(!ID.test(key)||!isFiniteNumber(n)||Math.abs(n)>1e9)
   throw TypeError('Invalid metric or value');
  clean[key]=Math.round(n*1e4)/1e4;
 }
 // Do not accept raw keystrokes, speech, transcript, GPS, tokens or arbitrary text.
 const keys=Object.keys(value);
 if(keys.some(k=>!['kind','intent','sourceRef','metrics'].includes(k)))
  throw TypeError('Project ledger accepts metadata only; no raw sensor/person data');
 return {kind:value.kind,intent:value.intent,sourceRef:value.sourceRef,metrics:clean};
}
function summary(rows){
 const counts={};
 for(const e of rows)counts[e.kind]=(counts[e.kind]||0)+1;
 const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 return {version:'v15',mode:'interloped-summary-propagation',
  entries:rows.length,counts,dominantPatterns:dominant.slice(0,5).map(([kind,count])=>({kind,count})),
  recent:rows.slice(-8).map(e=>({id:e.id,kind:e.kind,intent:e.intent,
    sourceRef:e.sourceRef,fingerprint:e.hash.slice(0,16),timestamp:e.timestamp})),
  audit:{conflictsRejected:true,rawPersonalTelemetry:false,externalSync:'not-connected'}};
}
async function validateImported(item){
 if(!item||typeof item!=='object'||Object.keys(item).sort().join(',')!==
  'hash,id,intent,kind,metrics,sourceRef,timestamp')throw TypeError('Invalid ledger record');
 if(!Number.isSafeInteger(item.timestamp)||item.timestamp<0||item.timestamp>Date.now()+60000)
  throw TypeError('Invalid ledger timestamp');
 if(typeof item.id!=='string'||!/^[a-f0-9]{24}$/.test(item.id))throw TypeError('Invalid record identifier');
 const normalized=normalizePayload({kind:item.kind,intent:item.intent,sourceRef:item.sourceRef,metrics:item.metrics});
 const material={id:item.id,timestamp:item.timestamp,...normalized};
 if(item.hash!==await sha256(canonical(material)))throw Error('Fingerprint mismatch');
 return Object.freeze({...material,hash:item.hash});
}
export function createNeutronalityFabric({storage=null,maxEntries=256}={}){
 if(!Number.isSafeInteger(maxEntries)||maxEntries<1||maxEntries>2048)throw RangeError('Invalid ledger budget');
 let entries=[],conflicts=0,serial=0;
 const listeners=new Set();
 let queue=Promise.resolve();
 const emit=()=>{const data=summary(entries);for(const listener of listeners){try{listener(data)}catch{}}};
 function enqueue(fn){const job=queue.then(fn);queue=job.catch(()=>{});return job;}
 function persist(){
  if(storage)storage.setItem(STORAGE_KEY,JSON.stringify(entries)); // throws on quota rather than claiming success
 }
 return {
  async ingest(input){
   const normalized=normalizePayload(input);
   return enqueue(async()=>{
    const idBytes=new Uint8Array(12);
    if(!globalThis.crypto?.getRandomValues)throw Error('Secure IDs unavailable');
    globalThis.crypto.getRandomValues(idBytes);
    const id=[...idBytes].map(b=>b.toString(16).padStart(2,'0')).join('');
    const timestamp=Date.now(),material={id,timestamp,...normalized};
    const item=Object.freeze({...material,hash:await sha256(canonical(material))});
    const candidate=[...entries.slice(-(maxEntries-1)),item];
    if(storage)storage.setItem(STORAGE_KEY,JSON.stringify(candidate));
    entries=candidate;serial++;emit();
    return {id,hash:item.hash,fingerprint:item.hash.slice(0,16),revision:serial,
      summary:summary(entries)};
   });
  },
  async merge(remote){
   if(!Array.isArray(remote)||remote.length>maxEntries)throw RangeError('Invalid merge size');
   return enqueue(async()=>{
    const staged=[];
    for(const item of remote)staged.push(await validateImported(item));
    const index=new Map(entries.map(v=>[v.id,v]));
    let added=0,deduplicated=0;
    for(const item of staged){
     const old=index.get(item.id);
     if(old&&old.hash!==item.hash){conflicts++;throw Error('Conflicting event ID rejected')}
     if(old){deduplicated++;continue}
     index.set(item.id,item);added++;
    }
    const sorted=[...index.values()].sort((a,b)=>a.timestamp-b.timestamp||a.id.localeCompare(b.id));
    if(sorted.length>maxEntries)throw RangeError('Merge exceeds retained memory budget');
    if(storage)storage.setItem(STORAGE_KEY,JSON.stringify(sorted));
    entries=sorted;serial++;emit();
    return {added,deduplicated,revision:serial,summary:summary(entries)};
   });
  },
  async load(){
   return enqueue(async()=>{
    if(!storage)return {restored:0,summary:summary(entries)};
    const str=storage.getItem(STORAGE_KEY);
    if(!str)return {restored:0,summary:summary(entries)};
    if(str.length>2e6)throw RangeError('Saved ledger too large');
    const obj=JSON.parse(str);
    if(!Array.isArray(obj)||obj.length>maxEntries)throw TypeError('Invalid saved ledger');
    const clean=[];
    for(const item of obj)clean.push(await validateImported(item));
    const ids=new Set(clean.map(x=>x.id));
    if(ids.size!==clean.length)throw Error('Duplicate snapshot identities');
    entries=clean;serial++;emit();
    return {restored:entries.length,summary:summary(entries)};
   });
  },
  export(){return entries.map(e=>({...e,metrics:{...e.metrics}}))},
  summary(){return {...summary(entries),revision:serial,conflicts}},
  clear(){
   return enqueue(async()=>{if(storage)storage.removeItem(STORAGE_KEY);entries=[];serial++;emit();return summary(entries)});
  },
  subscribe(fn){if(typeof fn!=='function')throw TypeError('Listener required');listeners.add(fn);return ()=>listeners.delete(fn)}
 };
}
export const gaiaNeutronalityV15=createNeutronalityFabric();
