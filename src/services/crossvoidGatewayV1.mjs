/**
 * CrossVoid v1: validated destination and state contract for the crystalline
 * security gateway between the static GitHub Pages terminal and Cryptic News.
 *
 * Static clients NEVER grant operator access. A private Access/OIDC gateway at
 * crypticnews.org must authenticate and authorize requests at the server.
 */
const STAGES=Object.freeze(['surface','crystalline','crossvoid','ethernet']);
const ALLOWED={
  cryptic:{href:'https://crypticnews.org/',authority:'crypticnews.org',access:'server-enforced'},
  terminal:{href:'https://machackabook.github.io/HyperPolyGlot-SOS-/',authority:'github-pages',access:'public'},
  actions:{href:'https://github.com/machackabook/HyperPolyGlot-SOS-/actions',authority:'github.com',access:'github-auth'},
};
const EDGES=Object.freeze({
 surface:['crystalline'],
 crystalline:['surface','crossvoid'],
 crossvoid:['crystalline','ethernet'],
 ethernet:['crossvoid','surface']
});
export function transitionCrossvoid(current,next){
 if(!STAGES.includes(current)||!STAGES.includes(next)||!EDGES[current].includes(next))
  throw new Error('Unrecognized CrossVoid transition');
 return Object.freeze({stage:next,from:current,at:new Date().toISOString(),
  securityBoundary:next==='crystalline'?'entry-display-only':'server-verified-on-destination'});
}
export function resolveCrossvoidDestination(name){
 if(typeof name!=='string'||!Object.prototype.hasOwnProperty.call(ALLOWED,name))
  throw new Error('Unknown CrossVoid destination');
 return Object.freeze({...ALLOWED[name]});
}
export function crossvoidSecurityStatus(){
 return Object.freeze({
  source:'crossvoid-public-routing-contract-v1',
  renderModes:STAGES.slice(),
  privateAccessGranted:false,
  voiceIsPrimaryAuthentication:false,
  authorizedByStaticPage:false,
  authProvider:'crypticnews.org (server-side configuration required)',
  githubActionsPurpose:'artifact validation and deployment, not login/session authority',
  captureInteractions:'retained-with-browser-permissions',
  externalRoutingLive:false
 });
}
export function crossvoidSources(){
 return Object.freeze([
  {name:'GAIA-Merger-VoidCutout-AnchoredPanels',mode:'crossVoid / crystalline / quantumLock / adam6',evidence:'source-examined'},
  {name:'GAIA-Separated-Runtime-CrossVoid',mode:'ADAM-GAIA crystalline sentinel and Three.js',evidence:'source-examined'},
  {name:'GAIA-Nexus Traffic Engine v3.8',mode:'token/leaky buckets, shedding and sliding window',evidence:'specification-only'},
  {name:'GAIA-ADAM Cross Transition',mode:'transition reference; no source content available',evidence:'name-only'}
 ]);
}
