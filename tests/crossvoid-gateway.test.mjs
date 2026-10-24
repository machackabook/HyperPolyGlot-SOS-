import test from 'node:test';
import assert from 'node:assert/strict';
import {
 transitionCrossvoid,resolveCrossvoidDestination,crossvoidSecurityStatus,crossvoidSources
} from '../src/services/crossvoidGatewayV1.mjs';
import worker from '../cloudflare/crossvoid-worker.mjs';

const BASE='https://crypticnews.org';
const env={};
const request=(path,options={})=>worker.fetch(new Request(BASE+path,options),env);

test('crystalline route advances only along declared security states',()=>{
 assert.equal(transitionCrossvoid('surface','crystalline').stage,'crystalline');
 assert.equal(transitionCrossvoid('crystalline','crossvoid').stage,'crossvoid');
 assert.equal(transitionCrossvoid('crossvoid','ethernet').stage,'ethernet');
 assert.throws(()=>transitionCrossvoid('surface','ethernet'));
 assert.throws(()=>transitionCrossvoid('surface','operator'));
});
test('destination whitelist rejects arbitrary redirects and javascript links',()=>{
 assert.equal(resolveCrossvoidDestination('terminal').authority,'github-pages');
 assert.match(resolveCrossvoidDestination('actions').href,/\/actions$/);
 assert.throws(()=>resolveCrossvoidDestination('javascript:alert(1)'));
 assert.throws(()=>resolveCrossvoidDestination('__proto__'));
});
test('source provenance does not claim untested content was verified',()=>{
 assert.equal(crossvoidSources().length,4);
 assert.equal(crossvoidSources().at(-1).evidence,'name-only');
 assert.equal(crossvoidSecurityStatus().privateAccessGranted,false);
 assert.equal(crossvoidSecurityStatus().authorizedByStaticPage,false);
});
test('public status discloses no secrets or operator authority',async()=>{
 const r=await request('/api/crossvoid/status',{headers:{origin:'https://machackabook.github.io'}});
 assert.equal(r.status,200);
 assert.equal(r.headers.get('access-control-allow-origin'),'https://machackabook.github.io');
 const v=await r.json();
 assert.equal(v.protocol,'crossvoid-v1');
 assert.match(v.operatorAccess,/verified/);
 assert.equal(JSON.stringify(v).includes('api_key'),false);
});
test('unknown origins cannot read cross-origin status with CORS',async()=>{
 const r=await request('/api/crossvoid/status',{headers:{origin:'https://stranger.example'}});
 assert.equal(r.status,200);
 assert.equal(r.headers.get('access-control-allow-origin'),null);
});
test('protected status denies unsigned and forged Access headers',async()=>{
 for(const headers of [{},{'Cf-Access-Jwt-Assertion':'abc.def.ghi'}]){
  const r=await request('/api/crossvoid/operator/status',{headers});
  assert.equal(r.status,401);
  assert.equal((await r.json()).authorized,false);
 }
});
test('operator path fails closed without identity-provider configuration',async()=>{
 const r=await request('/crossvoid/go/operator');
 assert.equal(r.status,503);
 assert.equal((await r.json()).error,'operator-auth-not-configured');
});
test('redirects only to explicitly declared destinations',async()=>{
 const r=await request('/crossvoid/go/terminal',{redirect:'manual'});
 assert.equal(r.status,302);
 assert.equal(r.headers.get('location'),'https://machackabook.github.io/HyperPolyGlot-SOS-/');
 const a=await request('/crossvoid/go/actions',{redirect:'manual'});
 assert.equal(a.status,302);
 assert.match(a.headers.get('location'),/HyperPolyGlot-SOS-\/actions$/);
});
test('valid opt-in metadata cannot claim success without D1 storage',async()=>{
 const r=await request('/api/portal/event',{method:'POST',headers:{
  origin:'https://machackabook.github.io','content-type':'text/plain'
 },body:JSON.stringify({stage:'crystalline',event:'flip',source:'github-pages'})});
 assert.equal(r.status,503);
 assert.equal((await r.json()).recorded,false);
});
test('valid event is acknowledged only after actual D1 insertion',async()=>{
 let query='',bound=null,inserted=0;
 const store={prepare(sql){query=sql;return {bind(...args){bound=args;return {
   async run(){inserted++;return {success:true};}
 }}}}};
 const r=await worker.fetch(new Request(BASE+'/api/portal/event',{method:'POST',
  headers:{origin:'https://crypticnews.org','content-type':'text/plain'},
  body:JSON.stringify({stage:'crystalline',event:'flip',source:'crypticnews'})}),
 {EVENT_DB:store});
 assert.equal(r.status,200);
 assert.equal((await r.json()).recorded,true);
 assert.equal(inserted,1);
 assert.match(query,/INSERT INTO crossvoid_events/);
 assert.equal(bound[0],'crystalline');
 assert.equal(bound[2],'crypticnews');
});
test('invalid event fields or origins are rejected',async()=>{
 const r=await request('/api/portal/event',{method:'POST',
  headers:{origin:'https://machackabook.github.io','content-type':'text/plain'},
  body:JSON.stringify({stage:'crystalline',event:'flip',source:'github-pages',
   access_token:'leak'})});
 assert.equal(r.status,400);
 const second=await request('/api/portal/event',{method:'POST',
  headers:{origin:'https://attacker.example','content-type':'text/plain'},
  body:JSON.stringify({stage:'crystalline',event:'flip',source:'github-pages'})});
 assert.equal(second.status,403);
});
test('CORS preflight uses a valid bodyless 204 and strict origins',async()=>{
 const allow=await request('/api/portal/event',{method:'OPTIONS',
  headers:{origin:'https://machackabook.github.io'}});
 assert.equal(allow.status,204);
 assert.equal(await allow.text(),'');
 assert.equal(allow.headers.get('access-control-allow-origin'),'https://machackabook.github.io');
 const denied=await request('/api/portal/event',{method:'OPTIONS',
  headers:{origin:'https://attacker.example'}});
 assert.equal(denied.status,403);
});
test('unknown API paths are not open proxies',async()=>{
 const r=await request('/api/crossvoid/proxy?url=https://attacker.example');
 assert.equal(r.status,404);
});
