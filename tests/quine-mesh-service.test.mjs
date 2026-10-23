import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuineMeshService} from '../src/services/quineMeshService.mjs';
test('Quine bridge is disconnected until explicitly paired',()=>{
 const m=createQuineMeshService();
 const s=m.status();
 assert.equal(s.state,'disconnected');
 assert.equal(s.source,'none');
 assert.equal(s.host,null);
});
test('Never connect with short or malformed credentials',async()=>{
 const m=createQuineMeshService();
 await assert.rejects(m.connect('123'),/token/i);
 await assert.rejects(m.connect('not a secret with spaces'.repeat(3)),/token/i);
 assert.equal(m.status().state,'disconnected');
});
test('No network ping before authentication',async()=>{
 const m=createQuineMeshService();
 await assert.rejects(m.ping(),/not.*connected/i);
 await assert.rejects(m.scribeStatus(),/not paired/i);
});
test('Scribe search requires bounded real request, not generated answers',async()=>{
 const m=createQuineMeshService();
 await assert.rejects(m.scribeSearch(''),/1-256/i);
 await assert.rejects(m.scribeSearch('hello',100),/1-8/i);
 await assert.rejects(m.scribeSearch('hello'),/not paired/i);
});
