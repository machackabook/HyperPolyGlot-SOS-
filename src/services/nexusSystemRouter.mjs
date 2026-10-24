/**
 * GAIA system-page router and instance-scoped live coordination.
 *
 * #/system/<slug> can be bookmarked and opened from any device; it conveys
 * NO credentials or private memory. Live data is retrieved only after the
 * existing authenticated local Quine bridge is paired on THAT device.
 *
 * Until a verified site-login provider is installed, scope is the current
 * paired LOCAL HOST session, not a claimed Google/ChatGPT user identity.
 */
export const SYSTEM_PAGES=Object.freeze([
 {slug:'terminal',node:'nexus.core',title:'HyperTerminal',command:'mesh status',group:'Workspace'},
 {slug:'god',node:'nexus.god',title:'GOD Network Policy',command:'god status',group:'Security'},
 {slug:'forge',node:'nexus.forge',title:'Golden Army Forge',command:'forge status',group:'Compute'},
 {slug:'singularity',node:'nexus.sqe',title:'Singularity / SQE',command:'core status',group:'Compute'},
 {slug:'terrasphere',node:'nexus.terrasphere',title:'TerraSphere',command:'geosync',group:'Spatial'},
 {slug:'memory',node:'nexus.memory',title:'GAIA Memory Fabric',command:'memory status',group:'Memory'},
 {slug:'scribe',node:'nexus.scribe',title:'Herald & Scribe',command:'scribe status',group:'Memory'},
 {slug:'canvas',node:'nexus.canvas',title:'Spatial Canvas',command:'core graph',group:'Spatial'},
 {slug:'resonance',node:'nexus.wave',title:'Wave / Resonance',command:'core phase',group:'Spatial'},
 {slug:'calibration',node:'nexus.calibration',title:'Omni Calibration',command:'core status',group:'Compute'},
 {slug:'mcp',node:'nexus.mcp',title:'Native MCP',command:'mcp list',group:'Connectivity'},
 {slug:'ollama',node:'nexus.localai',title:'Local Ollama AI',command:'ollama status',group:'AI'},
 {slug:'sensor',node:'nexus.sensor',title:'PLLM Sensor',command:'core status',group:'Monitoring'},
 {slug:'neutronality',node:'nexus.neutronality',title:'Neutronality V15',command:'memory status',group:'Memory'},
 {slug:'voip',node:'nexus.voip',title:'Cryptic VoIP',command:'voip status',group:'Connectivity'},
 {slug:'invite',node:'nexus.invite',title:'GAIA Invite Card',command:'xcard open',group:'Connectivity'},
]);
const ROUTE=/^#\/system\/([a-z][a-z0-9-]{1,29})$/;
const ALLOWED_COMMANDS=new Set(SYSTEM_PAGES.map(x=>x.command));
export const getSystemPage=slug=>SYSTEM_PAGES.find(x=>x.slug===slug)||null;
export const routeFromHash=hash=>{
 if(typeof hash!=='string')return null;
 const matched=ROUTE.exec(hash);
 return matched?getSystemPage(matched[1]):null;
};
export const systemPageURL=(slug,location=globalThis.location)=>{
 if(!getSystemPage(slug))throw Error('Unknown system page');
 if(!location||typeof location.origin!=='string'||typeof location.pathname!=='string')
  throw Error('Location unavailable');
 return location.origin+location.pathname+'#/system/'+slug;
};
export function createSystemPageMesh(){
 const listeners=new Set();
 let revision=0,terminalInstance='inst-1',hostSession=null;
 let hostAuthenticated=false;
 const events=[];
 function snapshot(){
  return {revision,terminalInstance,hostSession,hostAuthenticated,
   siteUserVerified:false,principalScope:hostAuthenticated?'paired-local-host':'unpaired-browser',
   syncTransport:'same-page-react-eventbus',independentAccountLogin:'not-configured',
   recent:events.map(e=>({...e}))};
 }
 const publish=()=>{
  const next=snapshot();
  for(const f of listeners){try{f(next)}catch{}}
  return next;
 };
 function pair(status){
  const connected=status?.state==='connected';
  const nextSession=connected && typeof status.host?.node_session==='string'&&
    /^[a-f0-9]{16,96}$/i.test(status.host.node_session)
      ?status.host.node_session:null;
  // Reset transient events whenever the pairing principal changes.
  if(!nextSession||nextSession!==hostSession)events.length=0;
  hostSession=nextSession;hostAuthenticated=!!nextSession;
  revision++;return publish();
 }
 function attachInstance(value){
  if(typeof value!=='string'||!/^inst-[a-zA-Z0-9_-]{1,50}$/.test(value))
   throw TypeError('Invalid terminal instance');
  if(value!==terminalInstance){terminalInstance=value;events.length=0;revision++}
  return publish();
 }
 function record(slug,kind,detail={}){
  if(!getSystemPage(slug))throw Error('Unknown system page');
  if(!['opened','terminal-linked','observed'].includes(kind))throw Error('Unsupported page event');
  if(detail&&Object.keys(detail).length>0)throw Error('No raw telemetry, credentials or memory in page bus');
  const x={slug,kind,at:Date.now(),instance:terminalInstance,scope:hostAuthenticated?'local-paired':'public'};
  events.push(x);if(events.length>32)events.shift();
  revision++;publish();return {...x};
 }
 return {snapshot,pair,attachInstance,record,subscribe(fn){
   if(typeof fn!=='function')throw TypeError('Expected observer');
   listeners.add(fn);return()=>listeners.delete(fn);
 }};
}
export const nexusSystemPageMesh=createSystemPageMesh();
/** A fixed, allowlisted UI -> terminal command: no arbitrary command injection. */
export function isPageTerminalCommand(value){return ALLOWED_COMMANDS.has(value)}
export function openSystemPage(slug,win=globalThis.window){
 if(!getSystemPage(slug))throw Error('Unknown system page');
 if(!win?.location)throw Error('Browser navigation unavailable');
 const path='#/system/'+slug;
 if(win.location.hash!==path)win.location.hash=path;
 if(typeof win.dispatchEvent==='function'&&typeof CustomEvent==='function')
  win.dispatchEvent(new CustomEvent('nexus:page-opened',{detail:{slug}}));
 return path;
}
