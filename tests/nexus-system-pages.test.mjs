import test from 'node:test';
import assert from 'node:assert/strict';
import {
 SYSTEM_PAGES,getSystemPage,routeFromHash,systemPageURL,createSystemPageMesh,
 isPageTerminalCommand
} from '../src/services/nexusSystemRouter.mjs';
import {gaiaMeshV4,projectGrid} from '../src/services/gaiaMeshSyncV4.mjs';

test('sixteen unique source-linked system pages',()=>{
 assert.equal(SYSTEM_PAGES.length,16);
 assert.equal(new Set(SYSTEM_PAGES.map(x=>x.slug)).size,16);
 const frame=gaiaMeshV4.snapshot();
 for(const page of SYSTEM_PAGES)assert.ok(frame.nodes.some(x=>x.id===page.node),page.slug);
 assert.ok(projectGrid(frame).nodes.length>=SYSTEM_PAGES.length);
 for(const link of projectGrid(frame).links) {
  assert.ok(frame.nodes.some(node=>node.id===link.from));
  assert.ok(frame.nodes.some(node=>node.id===link.to));
 }
});
test('deep links route exactly and have no bearer token',()=>{
 const at={origin:'https://crypticnews.org',pathname:'/app/'};
 for(const page of SYSTEM_PAGES){
  const url=systemPageURL(page.slug,at);
  assert.equal(url,'https://crypticnews.org/app/#/system/'+page.slug);
  assert.equal(routeFromHash(new URL(url).hash).slug,page.slug);
  assert.equal(getSystemPage(page.slug),page);
  assert.ok(!url.includes('token'));
 }
});
test('unknown or malformed URL is not a privileged system page',()=>{
 for(const x of ['#/system/../../god','#/system/admin?token=x','#/system/auth','javascript:alert(1)',''])
  assert.equal(routeFromHash(x),null);
 assert.throws(()=>systemPageURL('secrets',{origin:'https://example.test',pathname:'/'}));
});
test('only curated readback commands cross to HyperTerminal',()=>{
 assert.ok(isPageTerminalCommand('god status'));
 assert.ok(isPageTerminalCommand('forge status'));
 assert.ok(isPageTerminalCommand('xcard open'));
 for(const cmd of ['bash -c whoami','forge github someone/private','ssh exec','sudo reboot','god override'])
  assert.equal(isPageTerminalCommand(cmd),false);
});
test('unpaired mesh claims no signed-in site identity',()=>{
 const mesh=createSystemPageMesh();
 const state=mesh.snapshot();
 assert.equal(state.hostAuthenticated,false);
 assert.equal(state.siteUserVerified,false);
 assert.equal(state.hostSession,null);
 assert.equal(state.independentAccountLogin,'not-configured');
});
test('paired host scopes events without sharing credentials',()=>{
 const mesh=createSystemPageMesh();
 mesh.pair({state:'connected',host:{node_session:'0123456789abcdef'}});
 mesh.record('forge','opened');
 assert.equal(mesh.snapshot().hostAuthenticated,true);
 assert.equal(mesh.snapshot().hostSession,'0123456789abcdef');
 assert.equal(mesh.snapshot().recent.length,1);
 assert.equal(mesh.snapshot().recent[0].scope,'local-paired');
 assert.equal(JSON.stringify(mesh.snapshot()).includes('Authorization'),false);
});
test('switching active terminal instance clears transient page state',()=>{
 const mesh=createSystemPageMesh();
 mesh.pair({state:'connected',host:{node_session:'0123456789abcdef'}});
 mesh.record('memory','observed');
 mesh.attachInstance('inst-2');
 assert.equal(mesh.snapshot().terminalInstance,'inst-2');
 assert.deepEqual(mesh.snapshot().recent,[]);
});
test('host session rotation and disconnect prevent account bleed',()=>{
 const mesh=createSystemPageMesh();
 mesh.pair({state:'connected',host:{node_session:'0123456789abcdef'}});
 mesh.record('god','opened');
 mesh.pair({state:'connected',host:{node_session:'fedcba9876543210'}});
 assert.equal(mesh.snapshot().recent.length,0);
 mesh.record('forge','opened');
 mesh.pair({state:'disconnected'});
 assert.equal(mesh.snapshot().recent.length,0);
 assert.equal(mesh.snapshot().hostAuthenticated,false);
 assert.equal(mesh.snapshot().hostSession,null);
});
test('reject arbitrary private telemetry in shared page event bus',()=>{
 const mesh=createSystemPageMesh();
 assert.throws(()=>mesh.record('god','observed',{token:'secret'}));
 assert.throws(()=>mesh.record('not-a-page','opened'));
 assert.throws(()=>mesh.attachInstance('../../../admin'));
});
test('event subscriptions terminate with their actual unsubscribe function',()=>{
 const mesh=createSystemPageMesh();
 let changes=0;
 const off=mesh.subscribe(()=>changes++);
 mesh.record('terminal','opened');
 off();
 mesh.record('terminal','opened');
 assert.equal(changes,1);
});
