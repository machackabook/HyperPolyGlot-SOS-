import test from 'node:test';
import assert from 'node:assert/strict';
import {octaveTrace,makeBathymetry,VariableDepthLeapfrog,BitwiseOctaveField,TAU} from '../src/services/resonanceEngine.mjs';
test('exact supplied four-harmonic trace at t=0',()=>{
 const p=octaveTrace(0);assert.ok(Math.abs(p.x-2.375)<1e-12);assert.equal(p.y,0);
});
test('octave periodicity',()=>{
 for(let t=0;t<6;t+=0.1){const a=octaveTrace(t),b=octaveTrace(t+TAU);
 assert.ok(Math.abs(a.x-b.x)<1e-10);assert.ok(Math.abs(a.y-b.y)<1e-10)}
});
test('conservative wave keeps uniform field unchanged',()=>{
 const a=new VariableDepthLeapfrog({nx:16,ny:12,depth:new Float32Array(192).fill(1)});
 a.current.fill(1);a.previous.fill(1);for(let i=0;i<30;i++)a.step();
 assert.ok([...a.current].every(v=>Math.abs(v-1)<1e-5));
});
test('CFL rejects unstable timestep',()=>{
 assert.throws(()=>new VariableDepthLeapfrog({nx:16,ny:12,dt:0.3,depth:new Float32Array(192).fill(1)}),/unstable/);
});
test('variable-depth field evolves with finite energy',()=>{
 const a=new VariableDepthLeapfrog({nx:40,ny:30,dt:0.07,depth:makeBathymetry(40,30,0.7)});
 a.inject(20,15,0.7);for(let i=0;i<150;i++)a.step();
 assert.ok(a.stats().rms>0);assert.ok(a.stats().peak<100);assert.equal(a.stats().iteration,150);
});
test('byte trace uses valid depth channel',()=>{
 const a=new BitwiseOctaveField(40,30,24);a.step();
 assert.equal(a.buffer.length,40*30*4);assert.ok(a.buffer.some(v=>v>0));
 assert.ok(a.agents.every(v=>v.depth>=128&&v.depth<=255));
});
