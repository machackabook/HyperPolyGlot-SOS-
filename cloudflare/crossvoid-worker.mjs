/**
 * CrossVoid route policy for Cryptic News.
 * Cloudflare Access must protect the /operator/* origin separately.
 * In addition, this Worker cryptographically verifies Cloudflare Access JWTs
 * before returning even a minimal operator status.
 *
 * No GitHub token, model key, terminal command, or raw visit identifiers in this Worker.
 */
const TERMINAL='https://machackabook.github.io/HyperPolyGlot-SOS-/';
const ACTIONS='https://github.com/machackabook/HyperPolyGlot-SOS-/actions';
const ORIGINS=new Set(['https://machackabook.github.io','https://crypticnews.org']);
const STAGES=new Set(['surface','crypt','crystalline','crossvoid','ethernet','forge-link']);
const EVENTS=new Set(['open','flip','traverse','portal','exit','site-link']);
const SOURCES=new Set(['github-pages','crypticnews']);
let jwks=null,jwksExpiry=0;
function responseJson(body,status=200,origin=''){
 const h=new Headers({'content-type':'application/json;charset=utf-8',
   'cache-control':'no-store','x-content-type-options':'nosniff',
   'content-security-policy':"default-src 'none'; frame-ancestors 'none'"});
 if(ORIGINS.has(origin)){
  h.set('access-control-allow-origin',origin);
  h.set('vary','Origin');
 }
 return new Response(JSON.stringify(body),{status,headers:h});
}
function unbase64(str){
 if(typeof str!=='string'||!/^[A-Za-z0-9_-]+$/.test(str))throw Error('Invalid encoded token');
 const raw=atob(str.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-str.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function verifyAccessJWT(token,env){
 const team=String(env.CF_ACCESS_TEAM_DOMAIN||'').toLowerCase();
 const aud=String(env.CF_ACCESS_AUD||'');
 const owner=String(env.CF_OPERATOR_EMAIL||'').trim().toLowerCase();
 if(!/^[a-z0-9.-]+\.cloudflareaccess\.com$/.test(team)||!aud||!owner||typeof token!=='string'||token.length>8192)
  return false;
 const parts=token.split('.');
 if(parts.length!==3)return false;
 try{
  const header=JSON.parse(new TextDecoder().decode(unbase64(parts[0])));
  const payload=JSON.parse(new TextDecoder().decode(unbase64(parts[1])));
  const now=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||!header.kid||typeof header.kid!=='string'||header.kid.length>256)
   return false;
  if(typeof payload.email!=='string'||payload.email.toLowerCase()!==owner||
    payload.iss!=='https://'+team||!Array.isArray(payload.aud)||!payload.aud.includes(aud)||
    !Number.isFinite(payload.exp)||payload.exp<=now||payload.exp>now+86400||
    !Number.isFinite(payload.iat)||payload.iat>now+90)return false;
  if(!jwks||jwksExpiry<Date.now()){
   const r=await fetch('https://'+team+'/cdn-cgi/access/certs',
     {signal:AbortSignal.timeout(4500)});
   if(!r.ok) return false;
   const data=await r.json();
   if(!Array.isArray(data.keys)||data.keys.length>30)return false;
   jwks=data.keys;
   jwksExpiry=Date.now()+5*60*1000;
  }
  const key=jwks.find(x=>x.kid===header.kid&&x.kty==='RSA');
  if(!key)return false;
  const cryptoKey=await crypto.subtle.importKey('jwk',key,
   {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const signature=unbase64(parts[2]);
  const message=new TextEncoder().encode(parts[0]+'.'+parts[1]);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',cryptoKey,signature,message);
 }catch{return false}
}
async function handle(req,env){
 const url=new URL(req.url),origin=req.headers.get('origin')||'';
 if(req.method==='OPTIONS'&&url.pathname.startsWith('/api/')){
  if(!ORIGINS.has(origin))return responseJson({error:'origin-not-allowed'},403);
  const r=new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'vary':'Origin','cache-control':'no-store'}});
  r.headers.set('access-control-allow-methods','GET,POST,OPTIONS');
  r.headers.set('access-control-allow-headers','content-type');
  r.headers.set('access-control-max-age','300');
  return r;
 }
 if(req.method==='GET'&&url.pathname==='/api/crossvoid/status'){
  return responseJson({protocol:'crossvoid-v1',source:'crypticnews-worker',
    operatorAccess:'requires-verified-Cloudflare-Access-JWT',
    actions:'release-and-build-workflows-not-browser-auth',
    publicTerminal:TERMINAL,sourceMode:'source-derived-crystalline'},200,origin);
 }
 if(req.method==='GET'&&url.pathname==='/crossvoid/go/terminal')
  return Response.redirect(TERMINAL,302);
 if(req.method==='GET'&&url.pathname==='/crossvoid/go/actions')
  return Response.redirect(ACTIONS,302);
 if(req.method==='GET'&&url.pathname==='/crossvoid/go/operator'){
  // Fail closed until Access is configured; do not grant privileges by redirect.
  if(!env.CF_ACCESS_TEAM_DOMAIN||!env.CF_ACCESS_AUD)
   return responseJson({error:'operator-auth-not-configured'},503,origin);
  return Response.redirect('https://crypticnews.org/operator/',302);
 }
 if(req.method==='GET'&&url.pathname==='/api/crossvoid/operator/status'){
  const valid=await verifyAccessJWT(req.headers.get('Cf-Access-Jwt-Assertion'),env);
  return valid?responseJson({authorized:true,scope:'operator-status-only',
    accessVerified:true},200,origin):
    responseJson({authorized:false,accessVerified:false},401,origin);
 }
 if(req.method==='GET'&&url.pathname==='/api/crossvoid/operator/events/summary'){
  // Aggregate opt-in journey events only. Never return IPs, fingerprint IDs or raw sessions.
  const verified=await verifyAccessJWT(req.headers.get('Cf-Access-Jwt-Assertion'),env);
  if(!verified)return responseJson({error:'operator-access-required'},401,origin);
  if(!env.EVENT_DB)return responseJson({error:'event-store-not-configured'},503,origin);
  const number=Number(url.searchParams.get('days')||7);
  if(!Number.isSafeInteger(number)||number<1||number>30)
    return responseJson({error:'invalid-day-range'},400,origin);
  const since=Date.now()-number*86400000;
  try{
   const data=await env.EVENT_DB.prepare(
    'SELECT stage,event,source,COUNT(*) AS total FROM crossvoid_events '+
    'WHERE created_at >= ?1 GROUP BY stage,event,source ORDER BY total DESC LIMIT 60'
   ).bind(since).all();
   return responseJson({source:'crossvoid-first-party-d1',days:number,
    counts:Array.isArray(data?.results)?data.results:[],rawIdentifiersIncluded:false,
    note:'Opt-in journey events only; independent request logs are not represented.'},200,origin);
  }catch{return responseJson({error:'event-summary-unavailable'},503,origin)}
 }
 if(req.method==='POST'&&url.pathname==='/api/portal/event'){
  if(!ORIGINS.has(origin))return responseJson({error:'invalid-origin'},403,origin);
  const size=Number(req.headers.get('content-length')||0);
  if(!Number.isFinite(size)||size>500)return responseJson({error:'event-too-large'},413,origin);
  let record;try{
   const raw=await req.text();
   if(raw.length>500)throw Error('size');
   record=JSON.parse(raw);
  }catch{return responseJson({error:'invalid-json'},400,origin)}
  if(!record||typeof record!=='object'||Array.isArray(record)||
     Object.keys(record).length!==3||
     !STAGES.has(record.stage)||!EVENTS.has(record.event)||!SOURCES.has(record.source)||
     Object.keys(record).some(x=>!['stage','event','source'].includes(x)))
    return responseJson({error:'invalid-public-event'},400,origin);
  if(!env.EVENT_DB)return responseJson({recorded:false,error:'event-store-not-configured'},503,origin);
  try{
   await env.EVENT_DB.prepare(
     'INSERT INTO crossvoid_events (stage,event,source,created_at) VALUES (?1,?2,?3,?4)'
   ).bind(record.stage,record.event,record.source,Date.now()).run();
   return responseJson({recorded:true},200,origin);
  }catch{return responseJson({recorded:false,error:'event-store-unavailable'},503,origin)}
 }
 return responseJson({error:'not-found'},404,origin);
}
export default {fetch:handle};
