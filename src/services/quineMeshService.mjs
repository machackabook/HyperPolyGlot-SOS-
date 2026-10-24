/** Authenticated browser-to-localhost bridge for HyperTerminal Polyglot Quine OS.
 * Never automatically connects or authorizes host-level commands. */
import {gaiaAuthorizationGate} from './gaiaAuthorizationGate.mjs';
const HOST='http://127.0.0.1:8791',WS='ws://127.0.0.1:8791/v1/ws';
const GOOD_TOKEN=/^[a-zA-Z0-9_-]{32,256}$/;
export function createQuineMeshService({fetchFn,WebSocketCtor,clock}={}){
 const getFetch=fetchFn||((...x)=>fetch(...x));
 const Socket=WebSocketCtor||globalThis.WebSocket;
 const now=clock||(()=>performance.now());
 let token=null,socket=null,seq=0,localTicket=null,ticketExpiresAt=0;
 let state={state:'disconnected',source:'none',host:null,scribe:null,rttMs:null,reason:'Not connected'};
 const pending=new Map(),listeners=new Set();
 const snapshot=()=>({...state,host:state.host?{...state.host}:null,scribe:state.scribe?{...state.scribe}:null});
 const update=x=>{state={...state,...x};for(const cb of listeners){try{cb(snapshot())}catch{}}};
 async function read(path,params=''){
  if(!token)throw new Error('Bridge not paired');
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),3200);
  try{
   const r=await getFetch(HOST+path+params,{method:'GET',
    headers:{Authorization:'Bearer '+token},signal:abort.signal,
    cache:'no-store',credentials:'omit',mode:'cors'});
   if(!r.ok)throw new Error('Loopback service HTTP '+r.status);
   return await r.json();
  }finally{clearTimeout(timer)}
 }
 function disconnect(){
  const old=socket;socket=null;token=null;localTicket=null;ticketExpiresAt=0;
  if(old){try{old.close(1000,'User detached')}catch{}}
  for(const [id,p] of pending){clearTimeout(p.timer);p.reject(new Error('Bridge disconnected'));pending.delete(id)}
  update({state:'disconnected',source:'none',host:null,scribe:null,rttMs:null,reason:'User detached'});
  return snapshot();
 }
 async function connect(secret){
  if(!GOOD_TOKEN.test(secret||''))throw new TypeError('Requires a valid 32+ character pairing token');
  disconnect();token=secret;update({state:'connecting',reason:'Authenticating localhost'});
  try{
   const host=await read('/v1/status');
   if(host.protocol!=='quine-mesh-v1'||host.source!=='python-process-observed'||host.status!=='attached-localhost')throw new Error('Unknown bridge protocol');
   if(!Socket)throw new Error('WebSocket API unavailable');
   await new Promise((resolve,reject)=>{
    const ws=new Socket(WS,['quine-mesh-v1','auth.'+token]);socket=ws;
    const timeout=setTimeout(()=>{reject(new Error('Local WebSocket timeout'));try{ws.close()}catch{}},4000);
    ws.addEventListener('open',()=>{clearTimeout(timeout);resolve()},{once:true});
    ws.addEventListener('error',()=>{clearTimeout(timeout);reject(new Error('Socket rejected'))},{once:true});
    ws.addEventListener('message',e=>{
     let d;try{d=JSON.parse(e.data)}catch{return}
     if(d.type==='attached'&&d.status?.source==='python-process-observed')update({host:d.status});
     else if(d.type==='pong'&&pending.has(d.id)){
      const p=pending.get(d.id);pending.delete(d.id);clearTimeout(p.timer);
      const rtt=Math.round((now()-p.start)*1000)/1000;
      update({rttMs:rtt});p.resolve({rttMs:rtt,receivedAt:d.received_at});
     }
    });
    ws.addEventListener('close',()=>{
     if(socket!==ws)return;socket=null;token=null;
     for(const [id,p] of pending){clearTimeout(p.timer);p.reject(new Error('Socket closed'));pending.delete(id)}
     update({state:'disconnected',source:'none',host:null,reason:'Local socket closed'});
    });
   });
   update({state:'connected',source:'authenticated-localhost',host,reason:null});
   // The runtime ticket is requested automatically after successful local pairing.
   // A missing Ollama service never interrupts unrelated terminal functionality.
   void getRuntimeTicket().catch(()=>{});
   return snapshot();
  }catch(err){disconnect();update({state:'error',reason:String(err?.message||err)});throw err}
 }
 async function ping(){
  if(!socket||socket.readyState!==1)throw new Error('No authenticated localhost connection');
  const id='p'+(++seq).toString(36)+Math.round(now()*1000).toString(36);
  return new Promise((resolve,reject)=>{
   const p={start:now(),resolve,reject,timer:null};
   p.timer=setTimeout(()=>{pending.delete(id);reject(new Error('Ping timeout'))},3000);
   pending.set(id,p);
   try{socket.send(JSON.stringify({type:'ping',id}))}
   catch(err){clearTimeout(p.timer);pending.delete(id);reject(err)}
  });
 }
 async function scribeStatus(){
  const scribe=await read('/v1/scribe/status');update({scribe});return scribe;
 }
 async function scribeSearch(query,limit=5){
  if(typeof query!=='string'||!query.trim()||query.length>256)throw new TypeError('Search query must be 1-256 characters');
  if(!Number.isSafeInteger(limit)||limit<1||limit>8)throw new RangeError('Search limit is 1-8');
  return read('/v1/scribe/search','?q='+encodeURIComponent(query)+'&limit='+limit);
 }
 async function writeMount(path,body){
  if(!token || state.state!=='connected')throw new Error('Authenticate localhost mesh first');
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),123000);
  try {
   const response=await getFetch(HOST+path,{method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:abort.signal,cache:'no-store',credentials:'omit',mode:'cors'});
   if(!response.ok)throw new Error('Local mount operation HTTP '+response.status);
   return await response.json();
  }finally{clearTimeout(timer)}
 }
 function listMounts(){return read('/v1/mounts')}
 async function cloneMount(mount,repository){
  if(!/^[a-z][a-z0-9-]{0,39}$/.test(mount)||
     !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,38}\/[-a-zA-Z0-9_.]{1,100}$/.test(repository))
    throw new TypeError('Expected safe mount and GitHub OWNER/REPO');
  if(state.state!=='connected')throw new Error('Pair the local bridge first');
  const authorizedHost=state.host?.node_session;
  if(!authorizedHost)throw new Error('Authenticated host session unavailable');
  await gaiaAuthorizationGate.request('github.mount.clone',mount+'@'+repository);
  if(state.state!=='connected'||state.host?.node_session!==authorizedHost)
   throw new Error('Host session changed before authorization completed');
  return writeMount('/v1/mounts/clone',{mount,repository});
 }
 async function linkMount(mount,url){
  if(!/^[a-z][a-z0-9-]{0,39}$/.test(mount)||typeof url!=='string'||
     !url.startsWith('https://'))throw new TypeError('Expected mount and HTTPS URL');
  const target=new URL(url);
  if(target.protocol!=='https:'||target.username||target.password)
    throw new TypeError('Website URL cannot contain login credentials');
  if(state.state!=='connected')throw new Error('Pair the local bridge first');
  // Do not expose URL query values or tokens inside authorization prompts.
  const authorizedHost=state.host?.node_session;
  if(!authorizedHost)throw new Error('Authenticated host session unavailable');
  await gaiaAuthorizationGate.request('github.mount.link',
    (mount+'@'+target.hostname+target.pathname).slice(0,220));
  if(state.state!=='connected'||state.host?.node_session!==authorizedHost)
   throw new Error('Host session changed before authorization completed');
  return writeMount('/v1/mounts/link',{mount,url});
 }

 function xaiCardStatus(){return read('/v1/xai/card/status')}
 function xaiCardHistory(sessionId,limit=40){
  if(typeof sessionId!=='string'||!/^[a-f0-9-]{36}$/i.test(sessionId))throw new TypeError('Expected card session UUID');
  if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw new RangeError('History limit 1-100');
  return read('/v1/xai/card/history','?sessionId='+encodeURIComponent(sessionId)+'&limit='+limit);
 }
 function xaiCardChat(message,videoId,sessionId=null,provider='xai'){
  if(!['xai','gemini'].includes(provider))throw new TypeError('Unknown AI provider');
  if(typeof message!=='string'||!message.trim()||message.length>2400)
   throw new TypeError('Prompt must contain 1-2400 characters');
  if(typeof videoId!=='string'||!/^[A-Za-z0-9_-]{11}$/.test(videoId))
   throw new TypeError('Valid YouTube video ID required');
  if(sessionId!==null&&(typeof sessionId!=='string'||!/^[a-f0-9-]{36}$/i.test(sessionId)))
   throw new TypeError('Invalid card session UUID');
  const body={message:message.trim(),videoId,provider};
  if(sessionId)body.sessionId=sessionId;
  return writeMount('/v1/xai/card/chat',body);
 }

 async function runtimeStatus(){return read('/v1/runtime/status')}
 async function runtimeResult(jobId){
  if(typeof jobId!=='string'||!/^[a-f0-9]{32}$/.test(jobId))throw new TypeError('Bad runtime job id');
  return read('/v1/runtime/jobs/'+jobId)
 }
 async function runtimeSubmit(kind,payload={}){
  if(!['digest','symplectic','relations'].includes(kind))throw new TypeError('Unknown bounded compute');
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new TypeError('Invalid job payload');
  return writeMount('/v1/runtime/jobs',{kind,payload});
 }
 async function mcpCatalog(){return read('/v1/mcp/catalog')}
 async function mcpRead(name){
  if(!['gaia_runtime_status','gaia_comms_status'].includes(name))throw new TypeError('Unknown MCP adapter read');
  return writeMount('/v1/mcp/adapter/call',{name});
 }

 async function getRuntimeTicket(){
  if(!token||state.state!=='connected')throw new Error('Pair local Quine mesh first');
  if(localTicket && Date.now()+45000<ticketExpiresAt)return localTicket;
  const issued=await read('/v1/ai/runtime/ticket');
  if(issued.scope!=='local-inference'||typeof issued.ticket!=='string'||
     !Number.isSafeInteger(issued.expires_in)||issued.expires_in<60)
    throw new Error('Invalid local runtime ticket');
  localTicket=issued.ticket;
  ticketExpiresAt=Date.now()+issued.expires_in*1000;
  return localTicket;
 }
 async function localAIStatus(){return read('/v1/ai/runtime/status')}
 async function decodeLocalSeed(response){
  const seed=response?.transport;
  if(!seed||typeof seed.data!=='string')throw Error('Missing local response transport');
  let plain;
  if(seed.encoding==='utf8')plain=seed.data;
  else if(seed.encoding==='gzip+base64'){
   if(typeof DecompressionStream==='undefined')throw Error('This browser cannot decompress Gzip seeds');
   const binary=atob(seed.data),bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));
   const readable=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
   const decoded=await new Response(readable).arrayBuffer();
   if(decoded.byteLength>30000)throw Error('Decoded response budget exceeded');
   plain=new TextDecoder().decode(decoded);
  }else throw Error('Unknown local response encoding');
  const bytes=new TextEncoder().encode(plain);
  if(bytes.byteLength!==seed.bytes ||bytes.byteLength>30000)throw Error('Seed size mismatch');
  if(typeof seed.sha256==='string'&&globalThis.crypto?.subtle){
   const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
   const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   if(actual!==seed.sha256)throw Error('Seed content hash mismatch');
  }
  return {...response,text:plain,transport:{encoding:seed.encoding,
    bytes:seed.bytes,transport_bytes:seed.transport_bytes,sha256:seed.sha256}};
 }
 async function localAIChat(prompt,context='',maxTokens=256){
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>3200)throw TypeError('Prompt 1-3200 characters');
  if(typeof context!=='string'||context.length>6000)throw TypeError('Context exceeds 6000 characters');
  if(!Number.isSafeInteger(maxTokens)||maxTokens<16||maxTokens>1024)throw TypeError('Output budget 16-1024');
  const ticket=await getRuntimeTicket();
  const response=await writeMount('/v1/ai/runtime/chat',{ticket,prompt,context,maxTokens});
  return decodeLocalSeed(response);
 }
 async function localAIStream(prompt,onFrame,{context='',maxTokens=256}={}){
  if(typeof onFrame!=='function')throw TypeError('Frame callback required');
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>3200)throw TypeError('Prompt 1-3200 characters');
  if(typeof context!=='string'||context.length>6000)throw TypeError('Context exceeds 6000 characters');
  if(!Number.isSafeInteger(maxTokens)||maxTokens<16||maxTokens>1024)throw TypeError('Output budget 16-1024');
  const ticket=await getRuntimeTicket(),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),102000);
  let completed=false,chars=0,final=null;
  try{
   const response=await getFetch(HOST+'/v1/ai/runtime/stream',{method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({ticket,prompt,context,maxTokens}),signal:abort.signal,
    cache:'no-store',credentials:'omit',mode:'cors'});
   if(!response.ok ||!response.body)throw Error('Local streaming service HTTP '+response.status);
   const reader=response.body.getReader(),decoder=new TextDecoder();
   let buffer='';
   while(true){
    const {done,value}=await reader.read();if(done)break;
    buffer+=decoder.decode(value,{stream:true});
    if(buffer.length>65536)throw Error('Oversized local streaming frame');
    let index;
    while((index=buffer.indexOf('\n'))>=0){
     const line=buffer.slice(0,index).trim();buffer=buffer.slice(index+1);
     if(!line)continue;
     const event=JSON.parse(line);
     if(event.type==='delta'){
      if(typeof event.text!=='string')throw Error('Invalid text delta');
      chars+=event.text.length;
      if(chars>20000)throw Error('Local output budget exceeded');
      onFrame(event);
     }else if(event.type==='done'){completed=true;final=event;onFrame(event)}
     else if(event.type==='error')throw Error('Local Ollama runtime unavailable');
    }
   }
   if(!completed)throw Error('Stream ended without model completion');
   return final;
  }finally{clearTimeout(timer)}
 }
 async function localPDF(file){
  if(!file ||typeof file.size!=='number'||file.size<5||file.size>8*1024*1024)
   throw TypeError('PDF size must be <=8MiB');
  const ticket=await getRuntimeTicket(),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),35000);
  try{
   const r=await getFetch(HOST+'/v1/ai/runtime/pdf',{method:'POST',
    headers:{Authorization:'Bearer '+token,'X-GAIA-Runtime-Ticket':ticket,
      'Content-Type':'application/pdf'},
    body:file,signal:abort.signal,cache:'no-store',credentials:'omit',mode:'cors'});
   if(!r.ok)throw Error('Local PDF extraction HTTP '+r.status);
   const result=await r.json();
   if(result?.source!=='host-local-extraction'||result.cloud_uploaded!==false)
    throw Error('Unexpected PDF processing response');
   return result;
  }finally{clearTimeout(timer)}
 }


 function godStatus(){return read('/v1/god/status')}
 function godDecide(capability,destination=null){
  if(typeof capability!=='string'||! /^[a-z][a-z0-9.]{1,63}$/.test(capability))
   throw new TypeError('Invalid GOD capability');
  if(destination!==null&&(typeof destination!=='string'||destination.length>512))
   throw new TypeError('Invalid bounded network destination');
  return writeMount('/v1/god/decision',{capability,...(destination?{destination}:{})});
 }
 function forgeStatus(){return read('/v1/forge/status')}
 function forgePlan(capability,destination=null){
  if(typeof capability!=='string'||! /^[a-z][a-z0-9.]{1,63}$/.test(capability))
   throw new TypeError('Invalid Forge capability');
  if(destination!==null&&(typeof destination!=='string'||destination.length>512))
   throw new TypeError('Invalid network destination');
  return writeMount('/v1/forge/plan',{capability,...(destination?{destination}:{})});
 }
 function forgeCompute(kind,payload={}){
  if(!['symplectic','digest','relations'].includes(kind))throw new TypeError('Unknown Forge compute');
  return writeMount('/v1/forge/compute',{kind,payload});
 }
 function forgeGitHubRead(destination){
  if(typeof destination!=='string'||!/^https:\/\/api\.github\.com\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/(?:readme|contents|git\/trees|git\/refs)[A-Za-z0-9_./%-]*)?$/.test(destination))
   throw new TypeError('Only public api.github.com repository metadata can be read');
  return writeMount('/v1/forge/github/read',{destination});
 }

 return {connect,disconnect,ping,scribeStatus,scribeSearch,xaiCardStatus,xaiCardHistory,xaiCardChat,
  getRuntimeTicket,localAIStatus,localAIChat,localAIStream,localPDF,
  runtimeStatus,runtimeResult,runtimeSubmit,mcpCatalog,mcpRead,
  godStatus,godDecide,forgeStatus,forgePlan,forgeCompute,forgeGitHubRead,
  listMounts,cloneMount,linkMount,status:snapshot,
  subscribe(cb){if(typeof cb!=='function')throw new TypeError('Callback required');
   listeners.add(cb);return()=>listeners.delete(cb)}};
}
export const quineMeshService=createQuineMeshService();
