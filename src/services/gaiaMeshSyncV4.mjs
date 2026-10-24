/**
 * GAIA Mesh Sync v4 — deterministic, provenance-first graph for notebooks,
 * canvases and live Polyglot core modules.
 * A "declared" core is a source-code reference, not a running service.
 */
const KINDS=new Set(['core','notebook','canvas','document','repository','adapter','dataset']);
const ID=/^[a-z][a-z0-9_.:/-]{1,95}$/;
const DIGEST=/^[0-9a-f]{64}$/i;
const MAX_NODES=512,MAX_EDGES=2048;
const TRUSTED_REF=/^(?:repo:\/\/[a-zA-Z0-9_.:/-]{1,220}|local-source:\/\/[A-Za-z0-9_.:/-]{1,220}|https:\/\/(?:github\.com|raw\.githubusercontent\.com)\/[A-Za-z0-9_.%/-]{1,300})$/;
function node(n){
 if(!n||typeof n!=='object'||typeof n.id!=='string'||!ID.test(n.id))throw Error('Invalid mesh node ID');
 if(!KINDS.has(n.kind)||typeof n.title!=='string'||!n.title.trim()||n.title.length>100)throw Error('Invalid node kind or label');
 if(typeof n.sourceRef!=='string'||!TRUSTED_REF.test(n.sourceRef))throw Error('Untrusted source reference');
 const status=n.status||'declared';
 if(!['declared','indexed','verified'].includes(status))throw Error('Invalid evidence state');
 if(n.contentHash!==undefined&&!DIGEST.test(n.contentHash))throw Error('Invalid SHA-256 provenance');
 if(status==='verified'&&!n.contentHash)throw Error('Verified content requires a digest');
 return Object.freeze({id:n.id,kind:n.kind,title:n.title.trim(),status,sourceRef:n.sourceRef,
  ...(n.contentHash?{contentHash:n.contentHash.toLowerCase()}:{})});
}
function link(e,known){
 if(!e||typeof e!=='object'||typeof e.from!=='string'||typeof e.to!=='string'||
    !known.has(e.from)||!known.has(e.to)||e.from===e.to)throw Error('Unknown/cyclic-self tether');
 const type=e.type||'references';
 if(!['references','feeds','renders','computes','routes','recalls','validates'].includes(type))
  throw Error('Invalid tether meaning');
 return Object.freeze({from:e.from,to:e.to,type});
}
const ROOT='https://github.com/machackabook/HyperPolyGlot-SOS-/blob/main/';
const core=[
 ['nexus.core','core','HyperTerminal','src/components/HyperTerminal.tsx'],
 ['nexus.scribe','adapter','Herald / Scribe','bridge/gaia_scribe_worker.mjs'],
 ['nexus.memory','core','GAIA Memory Fabric','src/services/gaiaEngramCore.mjs'],
 ['nexus.sqe','core','SQE Causal Core','src/services/causalCore.mjs'],
 ['nexus.canvas','canvas','Spatial Canvas','src/components/VisualRenderer3D.tsx'],
 ['nexus.wave','core','Wave / Resonance','src/services/resonanceEngine.mjs'],
 ['nexus.calibration','adapter','Omni Calibrator','tools/omni_automation_matrix.py'],
 ['nexus.mcp','adapter','MCP Bridge','bridge/gaia_mcp_server.py'],
 ['nexus.localai','adapter','Ollama Runtime','bridge/gaia_local_ai.py'],
 ['nexus.sensor','adapter','PLLM Sensor Agent','src/services/pllmSensorAgent.mjs'],
 ['nexus.neutronality','core','Neutronality V15','src/services/gaiaNeutronalityV15.mjs'],
 ['nexus.god','core','GOD Network Capability Gate','bridge/god_network_gate.py'],
 ['nexus.forge','adapter','Golden Army Forge / Singularity','bridge/golden_army_forge.py'],
 ['nexus.terrasphere','adapter','TerraSphere Location Observation','src/services/geoNexusService.ts'],
].map(([id,kind,title,path])=>({id,kind,title,sourceRef:ROOT+path,status:'declared'}));
const connections=[
 ['nexus.scribe','nexus.memory','feeds'],
 ['nexus.memory','nexus.sqe','recalls'],
 ['nexus.sqe','nexus.canvas','renders'],
 ['nexus.wave','nexus.canvas','renders'],
 ['nexus.calibration','nexus.wave','computes'],
 ['nexus.core','nexus.mcp','routes'],
 ['nexus.mcp','nexus.localai','routes'],
 ['nexus.core','nexus.canvas','renders'],
 ['nexus.core','nexus.memory','recalls'],
 ['nexus.sensor','nexus.neutronality','feeds'],
 ['nexus.neutronality','nexus.memory','feeds'],
 ['nexus.neutronality','nexus.canvas','renders'],
 ['nexus.neutronality','nexus.sqe','validates'],
 ['nexus.terrasphere','nexus.god','references'],
 ['nexus.god','nexus.forge','validates'],
 ['nexus.forge','nexus.sqe','computes'],
 ['nexus.forge','nexus.memory','recalls'],
 ['nexus.forge','nexus.mcp','routes'],
 ['nexus.forge','nexus.canvas','renders']
].map(([from,to,type])=>({from,to,type}));
export function createMeshRegistry(){
 let revision=0;
 let imported=[];
 let importedLinks=[];
 const observers=new Set();
 const snapshot=()=>({
  protocol:'gaia-mesh-sync-v4',revision,kind:'source-reference-graph',
  nodes:[...core,...imported].map(n=>({...n})),
  links:[...connections,...importedLinks].map(e=>({...e})),
  counts:{declared:core.length,indexed:imported.length,
    verified:imported.filter(x=>x.status==='verified').length,
    tethers:connections.length+importedLinks.length},
  linkedExternalServices:'not-inferred-from-graph'
 });
 function ingest(payload){
  if(!payload||typeof payload!=='object'||!Array.isArray(payload.nodes)||
     !Array.isArray(payload.links))throw TypeError('Complete node/link snapshot required');
  if(payload.nodes.length+core.length>MAX_NODES||payload.links.length+connections.length>MAX_EDGES)
   throw RangeError('Mesh capacity exceeded');
  const ids=new Set(core.map(n=>n.id));
  const staged=payload.nodes.map(n=>{
   const normalized=node(n);
   if(ids.has(normalized.id))throw Error('Duplicate or protected node ID');
   ids.add(normalized.id);
   return normalized;
  });
  const seen=new Set(connections.map(e=>e.from+'|'+e.type+'|'+e.to));
  const stagedLinks=payload.links.map(e=>{
   const t=link(e,ids),key=t.from+'|'+t.type+'|'+t.to;
   if(seen.has(key))throw Error('Repeated tether');
   seen.add(key);return t;
  });
  // Atomic staging: no partial writes if one reference is malformed.
  imported=staged;importedLinks=stagedLinks;revision++;
  const frame=snapshot();
  for(const observer of observers){try{observer(frame)}catch{}}
  return frame;
 }
 return {snapshot,ingest,subscribe(fn){
   if(typeof fn!=='function')throw TypeError('Callback required');
   observers.add(fn);return()=>observers.delete(fn);
 }};
}
export const gaiaMeshV4=createMeshRegistry();
export function projectGrid(frame,{width=840,height=460}={}){
 if(!frame||!Array.isArray(frame.nodes)||!Array.isArray(frame.links))throw Error('Invalid mesh frame');
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<240||height<180)throw Error('Invalid viewport');
 const nodes=frame.nodes.slice(0,MAX_NODES),index=new Map();
 const kinds=['core','adapter','notebook','canvas','document','dataset','repository'];
 const groups=new Map(kinds.map(k=>[k,[]]));
 for(const n of nodes)groups.get(n.kind)?.push(n);
 const points=[];
 for(let col=0;col<kinds.length;col++){
  const group=groups.get(kinds[col]);
  if(!group?.length)continue;
  for(let row=0;row<group.length;row++){
   const n=group[row],x=54+(width-108)*(col/(kinds.length-1));
   const y=40+(height-80)*((row+1)/(group.length+1));
   const point={...n,x,y,lane:kinds[col]};
   points.push(point);index.set(n.id,point);
  }
 }
 const segments=frame.links.filter(e=>index.has(e.from)&&index.has(e.to))
  .map(e=>({...e,x1:index.get(e.from).x,y1:index.get(e.from).y,
    x2:index.get(e.to).x,y2:index.get(e.to).y}));
 return {nodes:points,links:segments,width,height};
}
export function meshForecast(frame){
 // Heuristic readiness report, not trained model prediction or verified deployment.
 const byKind=Object.fromEntries(['core','notebook','canvas','adapter','document','dataset','repository']
  .map(k=>[k,frame.nodes.filter(x=>x.kind===k).length]));
 const missing=[];
 if(!byKind.notebook)missing.push('No authorized notebook sources indexed');
 if(!byKind.dataset)missing.push('No dataset provenance supplied');
 if(!frame.nodes.some(x=>x.status==='verified'))missing.push('No source content verified');
 return {kind:'deterministic-readiness-heuristic',notMLForecast:true,
  knownNodes:frame.nodes.length,knownLinks:frame.links.length,byKind,nextEvidence:missing};
}
