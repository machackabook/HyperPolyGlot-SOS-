import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash, webcrypto} from 'node:crypto';
import {runInNewContext, Script} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import {gaiaMeshV4} from '../src/services/gaiaMeshSyncV4.mjs';

const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const html=readFileSync(resolve(ROOT,'public/gaia-absorption-quine.html'),'utf8');
const match=html.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/);
assert.ok(match,'Executable Quine script exists');
const runtime=match[1];

class Element {
 constructor(id){this.id=id;this.textContent='';this.value='';this.children=[];this.listeners=new Map();this.disabled=false;this.href='';this.download='';}
 addEventListener(type,fn){this.listeners.set(type,fn)}
 async fire(type,evt){const fn=this.listeners.get(type);assert.ok(fn,'listener '+type);return fn(evt)}
 append(...children){this.children.push(...children)}
 appendChild(child){this.children.push(child)}
 replaceChildren(...children){this.children=children}
 click(){}
 remove(){}
}
async function makeHarness(archive='[]'){
 const ids=new Map(),blobs=[];
 const el=(id)=>{if(!ids.has(id))ids.set(id,new Element(id));return ids.get(id)};
 el('nexus-code-archive').textContent=archive;
 const doc={
  getElementById:el,
  createElement:(tag)=>new Element(tag),
  body:{appendChild(){}},
  documentElement:{
   get outerHTML(){
    return html.replace('<script id="nexus-code-archive" type="application/json">[]</script>',
      '<script id="nexus-code-archive" type="application/json">'+el('nexus-code-archive').textContent+'</script>');
   }
  }
 };
 const env={document:doc,crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Blob,
  URL:{createObjectURL:(blob)=>{blobs.push(blob);return 'blob:gaia-local'},revokeObjectURL(){}},
  btoa,atob,confirm:()=>true,setTimeout:()=>0,Date,JSON,String,Number,Object,Array,Error,Set,Promise};
 runInNewContext(runtime,env,{timeout:1500});
 await new Promise(resolve=>setTimeout(resolve,35));
 return {el,blobs};
}
test('embedded runtime parses without importing script tags or network dependencies',()=>{
 assert.doesNotThrow(()=>new Script(runtime));
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 assert.match(html,/id="nexus-code-archive" type="application\/json"/);
 assert.doesNotMatch(runtime,/\beval\s*\(/);
});
test('unicode, malicious HTML and checksums survive deterministic archive readback and export',async()=>{
 const {el,blobs}=await makeHarness();
 const value='const glyph="⚛️";\n</script><script>doNotRun()</script>\n// inert';
 el('code-input').value=value;
 await el('absorb-button').fire('click');
 const records=JSON.parse(el('nexus-code-archive').textContent);
 assert.equal(records.length,1);
 assert.equal(Buffer.from(records[0].b64,'base64').toString('utf8'),value);
 assert.equal(records[0].sha256,createHash('sha256').update(value).digest('hex'));
 assert.equal(el('archive-list').children.length,1);
 el('code-input').value='';
 await el('archive-list').children[0].children[1].fire('click');
 assert.equal(el('code-input').value,value,'replay exact Unicode bytes');
 await el('save-button').fire('click');
 assert.equal(blobs.length,1);
 const exported=await blobs[0].text();
 assert.match(exported,/<!DOCTYPE html>/);
 assert.doesNotMatch(exported,/<script>doNotRun\(\)<\/script>/);
 const marker=exported.match(/<script id="nexus-code-archive" type="application\/json">([^]*?)<\/script>/);
 assert.ok(marker);
 assert.equal(JSON.parse(marker[1])[0].sha256,records[0].sha256);
 const second=await makeHarness(marker[1]);
 assert.match(second.el('status').textContent,/verified/i);
 assert.equal(second.el('archive-list').children.length,1,'downloaded file restores archive');
});
test('oversize, corrupted archives, and duplicate IDs are rejected without mutation',async()=>{
 const {el}=await makeHarness();
 el('code-input').value='x'.repeat(32769);
 await el('absorb-button').fire('click');
 assert.match(el('status').textContent,/rejected/i);
 assert.equal(el('nexus-code-archive').textContent,'[]');
 el('code-input').value='safe';
 await el('absorb-button').fire('click');
 const good=JSON.parse(el('nexus-code-archive').textContent);
 const bad=[{...good[0],sha256:'0'.repeat(64)}];
 const file={size:JSON.stringify(bad).length,text:async()=>JSON.stringify(bad)};
 await el('import-archive').fire('change',{target:{files:[file],value:'name.json'}});
 assert.match(el('status').textContent,/Import rejected/);
 assert.equal(JSON.parse(el('nexus-code-archive').textContent)[0].sha256,good[0].sha256);
 const duplicates=[good[0],good[0]];
 const dupFile={size:JSON.stringify(duplicates).length,text:async()=>JSON.stringify(duplicates)};
 await el('import-archive').fire('change',{target:{files:[dupFile],value:'name.json'}});
 assert.match(el('status').textContent,/Duplicate IDs/);
});
test('Mesh Sync v4 exposes declared forge and its meaningful tethers',()=>{
 const frame=gaiaMeshV4.snapshot();
 const entry=frame.nodes.find(n=>n.id==='nexus.absorption');
 assert.ok(entry);
 assert.equal(entry.status,'declared','do not pretend browser session is production verified');
 assert.match(entry.sourceRef,/public\/gaia-absorption-quine.html$/);
 for(const id of ['nexus.core','nexus.memory','nexus.canvas'])
  assert.ok(frame.links.some(e=>e.from==='nexus.absorption'&&e.to===id||
    e.to==='nexus.absorption'&&e.from===id),'missing link '+id);
});
