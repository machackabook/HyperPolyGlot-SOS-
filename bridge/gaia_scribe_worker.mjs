#!/usr/bin/env node
/**
 * GAIA Herald -> Scribe autonomous private-memory worker (Node 20+).
 * Watches one explicitly chosen local inbox; never crawls cloud accounts or publishes data.
 * Compatible with the existing Quine localhost bridge's /api/status and /api/search.
 */
import {parseArgs} from 'node:util';
import {readdir,readFile,lstat,mkdir,writeFile,rename,chmod,realpath} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {resolve,join,relative,basename,dirname,sep} from 'node:path';
import {createEngramFabric} from '../src/services/gaiaEngramCore.mjs';

const ALLOWED=new Set(['.md','.txt','.json','.jsonl']);
const unsafeName=/(^|[._-])(secret|password|credentials|apikey|api-key|private-key|token|\.env|id_rsa)([._-]|$)/i;
const sensitiveContent=/(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsk-[A-Za-z0-9_-]{20,}\b|\bgh[pousr]_[A-Za-z0-9_]{20,}\b|\bAIza[0-9A-Za-z_-]{30,}\b)/;
const sha=data=>createHash('sha256').update(data).digest('hex');
const json=res=>(res.writeHead(200,{'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','x-content-type-options':'nosniff'}),res);
const errors=(res,status,msg)=>{res.writeHead(status,{'content-type':'application/json',
  'cache-control':'no-store'});res.end(JSON.stringify({error:msg}));};
function parseFlags(){
  const a=parseArgs({options:{
    inbox:{type:'string'},store:{type:'string'},port:{type:'string',default:'8788'},
    'poll-ms':{type:'string',default:'15000'},once:{type:'boolean',default:false},
    help:{type:'boolean',short:'h',default:false}
  },strict:true}).values;
  if(a.help){process.stdout.write('node bridge/gaia_scribe_worker.mjs --inbox /private/herald-inbox --store /private/gaia-memory [--port 8788] [--poll-ms 15000] [--once]\n');process.exit(0)}
  if(!a.inbox||!a.store)throw new Error('Explicit --inbox and --store private paths are required');
  const port=Number(a.port),pollMs=Number(a['poll-ms']);
  if(!Number.isSafeInteger(port)||port<1024||port>65535)throw new Error('Invalid loopback port');
  if(!Number.isSafeInteger(pollMs)||pollMs<1000||pollMs>3600000)throw new Error('Invalid polling interval');
  const inbox=resolve(a.inbox),store=resolve(a.store);
  if(inbox===store||store.startsWith(inbox+sep)||inbox.startsWith(store+sep))
    throw new Error('Inbox and durable store must be separate private paths');
  return {inbox,store,port,pollMs,once:a.once};
}
async function safeDirectory(dir,create=false){
  if(create)await mkdir(dir,{recursive:true,mode:0o700});
  const st=await lstat(dir);
  if(!st.isDirectory()||st.isSymbolicLink())throw new Error('Memory directory must be a real directory');
  if(await realpath(dir)!==dir)throw new Error('Memory directory contains indirection');
}
async function walkInbox(root){
  const files=[];const dirs=[{path:root,depth:0}];let visited=0;
  while(dirs.length){
    const {path,depth}=dirs.shift();
    const names=await readdir(path,{withFileTypes:true});
    for(const item of names){
      if(++visited>4096)throw new Error('Ingest item capacity reached');
      if(item.name.startsWith('.')||unsafeName.test(item.name)||item.isSymbolicLink())continue;
      const full=join(path,item.name);
      if(item.isDirectory()&&depth<3)dirs.push({path:full,depth:depth+1});
      else if(item.isFile() && /\.(md|txt|json|jsonl)$/i.test(item.name))files.push(full);
    }
  }
  return files.sort();
}
async function atomicSnapshot(destination,content){
  const temp=destination+'.tmp-'+process.pid+'-'+Date.now();
  await writeFile(temp,content,{encoding:'utf8',mode:0o600,flag:'wx'});
  await chmod(temp,0o600);
  await rename(temp,destination);
}
async function run(){
  const opts=parseFlags();await safeDirectory(opts.inbox);await safeDirectory(opts.store,true);
  const dbFile=join(opts.store,'engrams.json');
  const fabric=createEngramFabric({allowedSources:['herald'],maxRecords:25000});
  // Content remains in an explicitly chosen local, non-public store.
  try{
    const saved=JSON.parse(await readFile(dbFile,'utf8'));
    if(!Array.isArray(saved))throw new Error('Invalid snapshot');
    for(const record of saved)fabric.ingest(record);
  }catch(e){if(e.code!=='ENOENT')throw new Error('Cannot recover memory snapshot: '+e.message)}
  let scanCount=0,lastScan=null,lastError=null,skippedSensitive=0,changed=0,inFlight=false;
  async function scan(){
    if(inFlight)return;
    inFlight=true;let delta=0;
    try{
      for(const file of await walkInbox(opts.inbox)){
        const st=await lstat(file);
        if(!st.isFile()||st.isSymbolicLink()||st.size===0||st.size>262144)continue;
        const content=await readFile(file);
        if(content.includes(0)||sensitiveContent.test(content.toString('utf8'))){skippedSensitive++;continue}
        const relativeFile=relative(opts.inbox,file).split(sep).join('/');
        const digest=sha(content);
        const sourceId='herald:'+sha(relativeFile).slice(0,36);
        const candidate={sourceId,title:basename(file),content:content.toString('utf8'),
          contentHash:digest,sourceRef:'herald://inbox/'+encodeURIComponent(relativeFile),
          observedAt:st.mtime.toISOString(),visibility:'private',verified:false,references:[]};
        const result=fabric.ingest(candidate);
        if(result.status!=='unchanged')delta++;
      }
      if(delta){
        await atomicSnapshot(dbFile,JSON.stringify(fabric.exportRecords()));
        changed+=delta;
      }
      scanCount++;lastScan=new Date().toISOString();lastError=null;
    }catch(e){lastError=String(e.message||e);console.error('[GAIA Scribe] scan:',lastError)}
    finally{inFlight=false}
  }
  await scan();
  const status=()=>({status:lastError?'degraded':'running',source:'local-herald-inbox',
    scope:'private-local-only',version:'gaia-scribe-0.1',ai_transcription:'not-enabled',
    counts:{engrams:fabric.status().records,processedRevisions:changed,scans:scanCount,
      skippedSensitive},last_scan:lastScan,last_error:lastError,autonomous_ingestion:true});
  if(opts.once){process.stdout.write(JSON.stringify(status())+'\n');if(lastError)process.exitCode=1;return}
  const server=createServer((req,res)=>{
    if(req.method!=='GET'){errors(res,405,'Read-only API');return}
    if(!req.socket.remoteAddress || !['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){
      errors(res,403,'Loopback only');return
    }
    const url=new URL(req.url,'http://127.0.0.1');
    if(url.pathname==='/api/status'){json(res).end(JSON.stringify(status()));return}
    if(url.pathname==='/api/search'){
      const query=url.searchParams.get('q')||'',limit=Number(url.searchParams.get('limit')||5);
      if(!query.trim()||query.length>256||!Number.isSafeInteger(limit)||limit<1||limit>8){
        errors(res,400,'Invalid bounded search request');return}
      const results=fabric.recall(query,{limit}).map(item=>({
        source_id:item.sourceId,title:item.title,snippet:item.excerpt,
        source_ref:item.sourceRef,sha256:item.contentHash,observed_at:item.observedAt,
        verified:item.verified,version:item.version,score:item.score}));
      // Ranking changes from observed recall; factual trust remains source-grounded.
      for(const item of results)fabric.noteUse(item.source_id);
      json(res).end(JSON.stringify({mode:'local_source_retrieval',query,results}));return
    }
    errors(res,404,'Unknown local endpoint');
  });
  server.listen(opts.port,'127.0.0.1',()=>{
    console.log('[GAIA Scribe] private local read-only API listening on 127.0.0.1:'+opts.port);
    console.log('[GAIA Scribe] inbox watching with polling interval (ms): '+opts.pollMs);
  });
  const timer=setInterval(()=>{void scan()},opts.pollMs);
  timer.unref?.(); // HTTP service keeps daemon alive, timer should not keep one-shot clients alive.
}
run().catch(e=>{console.error('[GAIA Scribe] fatal:',e.message);process.exitCode=1});
