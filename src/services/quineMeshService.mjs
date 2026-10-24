/** Authenticated browser-to-localhost bridge for HyperTerminal Polyglot Quine OS.
 * Never automatically connects or authorizes host-level commands. */
const HOST='http://127.0.0.1:8791',WS='ws://127.0.0.1:8791/v1/ws';
const GOOD_TOKEN=/^[a-zA-Z0-9_-]{32,256}$/;
export function createQuineMeshService({fetchFn,WebSocketCtor,clock}={}){
 const getFetch=fetchFn||((...x)=>fetch(...x));
 const Socket=WebSocketCtor||globalThis.WebSocket;
 const now=clock||(()=>performance.now());
 let token=null,socket=null,seq=0;
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
  const old=socket;socket=null;token=null;
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
 function cloneMount(mount,repository){
  if(!/^[a-z][a-z0-9-]{0,39}$/.test(mount)||
     !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,38}\/[-a-zA-Z0-9_.]{1,100}$/.test(repository))
    throw new TypeError('Expected safe mount and GitHub OWNER/REPO');
  return writeMount('/v1/mounts/clone',{mount,repository});
 }
 function linkMount(mount,url){
  if(!/^[a-z][a-z0-9-]{0,39}$/.test(mount)||typeof url!=='string'||!
     url.startsWith('https://'))throw new TypeError('Expected mount and HTTPS URL');
  return writeMount('/v1/mounts/link',{mount,url});
 }
 return {connect,disconnect,ping,scribeStatus,scribeSearch,listMounts,cloneMount,linkMount,status:snapshot,
  subscribe(cb){if(typeof cb!=='function')throw new TypeError('Callback required');
   listeners.add(cb);return()=>listeners.delete(cb)}};
}
export const quineMeshService=createQuineMeshService();
