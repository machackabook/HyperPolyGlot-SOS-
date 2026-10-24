import test from 'node:test';
import assert from 'node:assert/strict';
import {createNeutronalityFabric} from '../src/services/gaiaNeutronalityV15.mjs';
import {createPLLMSensorAgent} from '../src/services/pllmSensorAgent.mjs';
import {createMeshRegistry,projectGrid,meshForecast} from '../src/services/gaiaMeshSyncV4.mjs';
import {gaiaMeshV4} from '../src/services/gaiaMeshSyncV4.mjs';
import {applyNexusSync,nexusSyncStatus,startNexusSync} from '../src/services/nexusEvolutionSync.mjs';
import {mapBit4ToCrypto16,normalizePulse,librationMarkers,vertexShader,fragmentShader} from '../src/services/nexusCauldronscope.mjs';
import {readFile} from 'node:fs/promises';
const payload={kind:'sensor',intent:'pllm.frame',sourceRef:'local-source://sensor/pllm',metrics:{frame_ms:16.67}};
test('V15 accepts only bounded project metadata and stores full digests',async()=>{
 const f=createNeutronalityFabric();
 const e=await f.ingest(payload);
 assert.match(e.hash,/^[a-f0-9]{64}$/);
 assert.equal(e.fingerprint,e.hash.slice(0,16));
 assert.equal(f.summary().entries,1);
 assert.throws(()=>f.ingest({...payload,rawKeys:'private typed text'}),/metadata only/);
});
test('V15 durable snapshot readback validates full fingerprint and deduplicates',async()=>{
 const data=new Map();
 const storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)||null,removeItem:k=>data.delete(k)};
 const a=createNeutronalityFabric({storage});
 await a.ingest(payload);
 const b=createNeutronalityFabric({storage});
 const restored=await b.load();
 assert.equal(restored.restored,1);
 assert.equal((await b.merge(a.export())).deduplicated,1);
 assert.equal(b.summary().entries,1);
 const tampered=a.export().map(x=>({...x,metrics:{frame_ms:200}}));
 await assert.rejects(()=>b.merge(tampered),/Fingerprint mismatch/);
 assert.equal(b.summary().entries,1);
});
test('PLLM starts off and records only bounded opt-in aggregates',()=>{
 const s=createPLLMSensorAgent({clock:()=>1000});
 assert.equal(s.recordFrame(16),false);
 assert.equal(s.status().active,false);
 s.enable();s.recordFrame(16);s.recordFrame(18);
 s.recordInteraction(1000);s.recordInteraction(1250);
 const x=s.sample();
 assert.equal(x.frame_interval_avg_ms,17);
 assert.equal(x.click_flow_ratio,1);
 assert.equal(x.gps_drift,null);
 assert.equal(x.captures_text,false);
 assert.equal(x.external_delivery,false);
 s.disable();assert.equal(s.status().active,false);
});
test('Mesh v4 grounds 11 built-in source nodes and 13 actual declared tethers',()=>{
 const m=createMeshRegistry(),f=m.snapshot(),visual=projectGrid(f);
 assert.equal(f.nodes.length,11);
 assert.equal(f.links.length,13);
 assert.equal(f.counts.verified,0);
 assert.equal(visual.links.length,13);
 assert.equal(meshForecast(f).notMLForecast,true);
});
test('Mesh v4 rejects fabricated verification or unknown reference atomically',()=>{
 const m=createMeshRegistry();
 assert.throws(()=>m.ingest({nodes:[{id:'notebook.a',kind:'notebook',title:'Notebook',status:'verified',
  sourceRef:'local-source://notebooks/a'}],links:[]}),/digest/);
 assert.throws(()=>m.ingest({nodes:[],links:[{from:'bogus',to:'nexus.memory'}]}),/Unknown/);
 assert.equal(m.snapshot().revision,0);
});
test('nexus-sync performs bounded in-place graph state updates without exposing code mutation',()=>{
 const n={id:'notebook.mytest',kind:'notebook',title:'A',status:'indexed',
  sourceRef:'local-source://notebooks/test.ipynb'};
 gaiaMeshV4.ingest({nodes:[n],links:[{from:n.id,to:'nexus.memory',type:'feeds'}]});
 const old=gaiaMeshV4.snapshot().revision;
 const ev=applyNexusSync({artifactId:n.id,newData:{title:'B'}});
 assert.equal(ev.meshRevision,old+1);
 assert.equal(gaiaMeshV4.snapshot().nodes.find(x=>x.id===n.id).title,'B');
 assert.throws(()=>applyNexusSync({artifactId:n.id,newData:{apiKey:'secret'}}),/metadata/);
 assert.throws(()=>applyNexusSync({artifactId:'nexus.core',newData:{title:'Hacked'}}),/Core/);
 assert.ok(nexusSyncStatus().revision>=1);
});
test('browser nexus-sync listener cleans up and remains functional',()=>{
 const bus=new EventTarget();
 const stop=startNexusSync(bus);
 bus.dispatchEvent(new Event('nexus-sync'));
 assert.ok(nexusSyncStatus().lastError);
 stop();
});
test('bit4-to-16-bit map uses exactly 16 evenly spaced values',()=>{
 assert.equal(mapBit4ToCrypto16(0),0);
 assert.equal(mapBit4ToCrypto16(15),65535);
 assert.equal(mapBit4ToCrypto16(8),34952);
 assert.equal(normalizePulse(65535),1);
 assert.throws(()=>mapBit4ToCrypto16(16),RangeError);
});
test('L4/L5 stylized markers symmetric at zero rotation, with shaders',()=>{
 const p=librationMarkers(0,15);
 assert.ok(Math.abs(p.L4.x-p.L5.x)<1e-10);
 assert.ok(Math.abs(p.L4.y+p.L5.y)<1e-10);
 assert.match(p.model,/not-physical/);
 assert.match(vertexShader,/u_tensorPulse/);
 assert.match(fragmentShader,/gl_FragColor/);
});
test('TerraSphere reads location only on demand and does not automatically upload raw GPS',async()=>{
 const file=await readFile(new URL('../src/services/geoNexusService.ts',import.meta.url),'utf8');
 assert.match(file,/geolocation.getCurrentPosition/);
 assert.match(file,/clearLocation/);
 assert.doesNotMatch(file,/watchPosition\s*\(/);
 assert.doesNotMatch(file,/\bfetch\s*\(/);
 assert.match(file,/deviceAttested:\s*false/);
});
test('React app mounts cognition panel and event listener',async()=>{
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 assert.match(app,/<GaiaCognitionPanel\s*\/>/);
 assert.match(app,/startNexusSync\(window\)/);
 const renderer=await readFile(new URL('../src/components/VisualRenderer3D.tsx',import.meta.url),'utf8');
 assert.match(renderer,/new THREE.ShaderMaterial/);
 assert.match(renderer,/cauldronGeometry.dispose/);
});
