import test from 'node:test';
import assert from 'node:assert/strict';
import {createCausalCore,inducedSteeredGraph,routeCapability,symplecticStep} from '../src/services/causalCore.mjs';

const mk = opts => inducedSteeredGraph(opts);
test('automatic read and compute never require approval',()=>{
  for(const op of ['read','compute','render','graph','sqe','help'])
    assert.deepEqual(routeCapability(op).route,'fast');
});
test('unsupported operations fail closed',()=>assert.equal(routeCapability('arbitrary-operation').authorized,false));
test('remote operations cannot be authorized from browser data',()=>{
  const forged={verifiedBy:'trusted-backend',operation:'source-write',scope:'*',expiresAt:Date.now()+100000};
  assert.equal(routeCapability('source-write',forged).authorized,false);
  assert.equal(routeCapability('device-control',forged).authorized,false);
});
test('subset retains only original bounded triples and protected tokens',()=>{
  const g=mk({vertices:['a','b','c','d'],protectedVertices:['a','b'],scores:{c:3,d:1},limit:3,
    relations:[{a:'a',b:'b',c:'c'},{a:'a',b:'b',c:'d'}]});
  assert.equal(g.retainedRelations,1);assert.equal(g.omittedRelations,1);
  assert.deepEqual(g.vertices,['a','b','c']);
});
test('targets are not collapsed in the sparse 4D representation',()=>{
  const g=mk({vertices:['a','b','c','d'],limit:4,
    relations:[{a:'a',b:'b',c:'c'},{a:'a',b:'b',c:'d'}]});
  assert.equal(g.entries.length,2);
  assert.notEqual(g.entries[0].c,g.entries[1].c);
  assert.deepEqual(g.shape,[2,4,4,4]);
});
test('frequency is conditioned on ordered source pair',()=>{
  const g=mk({vertices:['a','b','c','d'],limit:4,relations:[
    {a:'a',b:'b',c:'c'},{a:'a',b:'b',c:'c'},{a:'a',b:'b',c:'d'}]});
  assert.equal(g.entries[0].count,2);
  assert.ok(Math.abs(g.entries[0].frequency-2/3)<1e-12);
});
test('retained float embeddings preserve exact entries',()=>{
  const E=new Float32Array([0.1,-0.4]);
  const g=mk({vertices:['a'],limit:1,relations:[],embeddings:{a:E}});
  assert.deepEqual([...g.embeddings.a],[...E]); assert.notStrictEqual(E,g.embeddings.a);
});
test('invalid graph input fails without silent repair',()=>{
  assert.throws(()=>mk({vertices:['a','a'],relations:[]}),/Duplicate/);
  assert.throws(()=>mk({vertices:['a'],relations:[{a:'a',b:'unknown',c:'a'}]}),/Undeclared/);
  assert.throws(()=>mk({vertices:['a'],protectedVertices:['missing'],relations:[]}),/Protected/);
});
test('symplectic step is numerically time reversible for finite phase state',()=>{
  const initial={q:0.73,p:0.27};
  const next=symplecticStep(initial,0.02);
  const prev=symplecticStep(next,-0.02);
  assert.ok(Math.abs(prev.q-initial.q)<1e-12);
  assert.ok(Math.abs(prev.p-initial.p)<1e-12);
});
test('energy drift for harmonic example stays within measured numerical bound',()=>{
  let state={q:1,p:0};
  for(let i=0;i<10000;i++)state=symplecticStep(state,.01);
  assert.ok(Math.abs(state.energy-0.5)<0.0001);
});
test('event history is bounded even if sequence count continues',()=>{
  const core=createCausalCore({maxEvents:2});
  for(let i=0;i<10;i++)core.observe({a:'terminal',b:'exec',c:'help',source:'hyperterminal'});
  assert.equal(core.seq,10);assert.equal(core.history().length,2);
});
test('empty session graph has no fabricated link events',()=>{
  const core=createCausalCore();
  assert.equal(core.graph().entries.length,0);
  assert.equal(core.status().privilegedBackend,'not-connected');
});
test('observers can unsubscribe, and actual events produce sparse graph edges',()=>{
  const core=createCausalCore();
  let calls=0;const stop=core.subscribe(()=>calls++);
  core.observe({a:'terminal',b:'exec',c:'help',source:'hyperterminal'});
  stop();core.observe({a:'terminal',b:'exec',c:'ls',source:'hyperterminal'});
  assert.equal(calls,1);assert.equal(core.graph().retainedRelations,2);
});
test('invalid event labels fail closed',()=>{
  const core=createCausalCore();
  assert.throws(()=>core.observe({a:'terminal',b:'exec',c:'hello world',source:'hyperterminal'}));
});
test('local state revisions can be exactly restored within the session',()=>{
  const core=createCausalCore();
  const staged=core.prepareLocalState({mode:'test'}, x=>x.mode==='test');
  assert.equal(core.commitLocalState(staged),1);
  assert.equal(core.localState().mode,'test');
  assert.equal(core.rollbackLocalState(),null);
  assert.equal(core.localState(),null);
});
test('stale local revisions are rejected',()=>{
  const core=createCausalCore();const stage=core.prepareLocalState({a:1},()=>true);
  core.commitLocalState(stage);assert.throws(()=>core.commitLocalState(stage),/Stale/);
});
test('governor reacts to observed render cost',()=>{
  const core=createCausalCore();
  assert.equal(core.sampleFrame(40).fpsCap,20);
  assert.equal(core.sampleFrame(0).measured,true);
});
