import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthorizationGate} from '../src/services/gaiaAuthorizationGate.mjs';
import {createConnectionVerifier} from '../src/services/gaiaConnectionVerifier.mjs';

test('sensitive toast denies by default if UI has not mounted',async()=>{
 const gate=createAuthorizationGate({schedule:()=>1,cancel:()=>{}});
 await assert.rejects(gate.request('github.mount.clone','local@owner/repo'),/UI unavailable/);
});

test('one-shot authorization requires explicit click and clears prompt',async()=>{
 let didExpire;
 const gate=createAuthorizationGate({schedule:fn=>{didExpire=fn;return 1},cancel:()=>{}});
 const changes=[];
 const off=gate.subscribe(s=>changes.push(s));
 const pending=gate.request('github.mount.clone','gaia@owner/repo');
 assert.equal(gate.snapshot().capability,'github.mount.clone');
 assert.equal(gate.approve(gate.snapshot().id),true);
 assert.equal((await pending).authorized,true);
 assert.equal(gate.snapshot(),null);
 assert.equal(gate.approve(1),false);
 off();
});

test('user denial and automatic expiry both reject privileged requests',async()=>{
 let trigger;
 const gate=createAuthorizationGate({schedule:fn=>{trigger=fn;return 1},cancel:()=>{}});
 const off=gate.subscribe(()=>{});
 const denied=gate.request('github.mount.link','test@example.org');
 gate.deny(gate.snapshot().id);
 await assert.rejects(denied,/denied/);
 const expired=gate.request('github.mount.clone','test@owner/repo');
 trigger();
 await assert.rejects(expired,/expired/);
 off();
});

test('authorization attempts cannot escalate undeclared capabilities',async()=>{
 const gate=createAuthorizationGate({});
 const off=gate.subscribe(()=>{});
 await assert.rejects(gate.request('eval.shell','owner/repo'),/Invalid privileged/);
 off();
});

function fakeMesh(){
 let state='disconnected',pingWorks=true,callbacks=[];
 const host={gh_installed:true};
 return {
  setConnected(next){state=next;for(const fn of callbacks)fn({state:next})},
  failPing(){pingWorks=false},
  status(){return {state,host}},
  subscribe(fn){callbacks.push(fn);return ()=>{callbacks=callbacks.filter(x=>x!==fn)}},
  async ping(){if(!pingWorks)throw Error('offline');return {rttMs:8.5}},
  async scribeStatus(){return {source:'local-nexus-scribe-v4'}},
  async godStatus(){return {source:'GOD local'}},
  async forgeStatus(){return {source:'Forge local'}},
  async runtimeStatus(){return {source:'local-python-executor'}},
  async localAIStatus(){return {reachable:true,model_available:true}},
  async xaiCardStatus(){return {configured:true,sdk_installed:true,
   gemini:{configured:true,sdk_installed:true}}}
 };
}

test('unpaired system never marks any identity or service verified',async()=>{
 const mesh=fakeMesh();
 const monitor=createConnectionVerifier({mesh});
 await monitor.refresh();
 const result=monitor.snapshot();
 assert.equal(result.bridgePaired,false);
 assert.ok(result.services.every(s=>s.state==='unverified'));
});

test('authenticated local heartbeat and responding modules are verified; cloud accounts are not',async()=>{
 const mesh=fakeMesh();mesh.setConnected('connected');
 const monitor=createConnectionVerifier({mesh});
 const result=await monitor.refresh();
 const byId=Object.fromEntries(result.services.map(s=>[s.id,s]));
 assert.equal(byId.bridge.state,'verified');
 assert.equal(byId.bridge.latencyMs,8.5);
 assert.equal(byId.ollama.state,'verified');
 assert.equal(byId.runtime.state,'verified');
 assert.equal(byId['github-cli'].state,'unverified');
 assert.equal(byId.xai.state,'configured');
 assert.equal(byId.gemini.state,'configured');
 assert.equal(byId['cryptic-news'].state,'unverified');
 assert.equal(result.externalAccountsVerified,false);
});

test('dead heartbeat immediately invalidates all dependent verified statuses',async()=>{
 const mesh=fakeMesh();mesh.setConnected('connected');
 const monitor=createConnectionVerifier({mesh});
 await monitor.refresh();
 mesh.failPing();
 const result=await monitor.refresh();
 assert.equal(result.services.find(s=>s.id==='bridge').state,'unavailable');
 assert.ok(!result.services.some(s=>s.state==='verified'));
});

test('connection records grow stale if polling has not returned a fresh proof',async()=>{
 const mesh=fakeMesh();mesh.setConnected('connected');
 let t=100000;
 const monitor=createConnectionVerifier({mesh,clock:()=>t});
 await monitor.refresh();t+=36000;
 assert.equal(monitor.snapshot().services.find(s=>s.id==='bridge').state,'stale');
});

test('monitor stop clears all service claims and cancels future polling',async()=>{
 const mesh=fakeMesh();mesh.setConnected('connected');
 let intervals=0,cleared=0;
 const monitor=createConnectionVerifier({mesh,setRepeating:()=>++intervals,
 clearRepeating:()=>cleared++});
 monitor.start();
 monitor.stop();
 assert.equal(intervals,1);assert.equal(cleared,1);
 assert.ok(monitor.snapshot().services.every(s=>s.state==='unverified'));
});
