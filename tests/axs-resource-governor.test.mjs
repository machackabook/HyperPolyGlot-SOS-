import test from 'node:test';
import assert from 'node:assert/strict';
import {octaveTrace,createAxsResourceGovernor} from '../src/services/axsResourceGovernor.mjs';

test('octave trace uses the four exact user-provided harmonics',()=>{
  assert.ok(Math.abs(octaveTrace(0).x - 2.375)<1e-12);
  assert.ok(Math.abs(octaveTrace(0).y)<1e-12);
  for(const t of [0,0.3,1,Math.PI,2*Math.PI]){
    const v=octaveTrace(t);
    assert.ok(Math.abs(v.x-(Math.cos(t)+0.5*Math.cos(2*t)+0.5*Math.cos(4*t)+0.375*Math.cos(8*t)))<1e-12);
    assert.ok(Math.abs(v.y-(2*Math.sin(t)-Math.sin(2*t)+Math.sin(4*t)-0.75*Math.sin(8*t)))<1e-12);
  }
  assert.throws(()=>octaveTrace(Infinity),/finite/);
});
test('no measurements means no measured claims',()=>{
  const g=createAxsResourceGovernor();
  assert.equal(g.status().measured,false);
  assert.equal(g.status().observedFps,null);
  assert.equal(g.status().particleCount,4000);
  g.observe(NaN);
  assert.equal(g.status().sampleCount,0);
});
test('measured heavy renderer reduces work and pixel density',()=>{
  const g=createAxsResourceGovernor();
  for(let i=0;i<36;i++)g.observe(41,i*50);
  const s=g.status();
  assert.equal(s.measured,true);
  assert.equal(s.fpsCap,20);
  assert.equal(s.particleCount,1200);
  assert.equal(s.pixelRatioCap,1);
  assert.ok(s.p90RenderMs>=40);
  assert.ok(Math.abs(s.observedFps-20)<0.001);
});
test('light render work permits deliberate recovery with hysteresis',()=>{
  const g=createAxsResourceGovernor({windowSize:12,reviewEvery:12,recoveryReviews:2});
  for(let i=0;i<24;i++)g.observe(42,i*50);
  assert.equal(g.status().fpsCap,20);
  for(let i=24;i<96;i++)g.observe(2,i*20);
  assert.equal(g.status().fpsCap,60);
  assert.equal(g.status().particleCount,4000);
});
test('bad parameters and negative samples fail closed',()=>{
  assert.throws(()=>createAxsResourceGovernor({maxParticles:0}),RangeError);
  assert.throws(()=>createAxsResourceGovernor({windowSize:3}),RangeError);
  const g=createAxsResourceGovernor();
  g.observe(-2);
  assert.equal(g.status().sampleCount,0);
  g.reset();
  assert.equal(g.status().measured,false);
});
