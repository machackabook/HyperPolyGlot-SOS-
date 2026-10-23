/**
 * GAIA Causal Core v1 — browser computation only.
 * No simulated telemetry, remote authority, persistent-source mutations or implicit approvals.
 */
const VALID_NAME = /^[a-zA-Z0-9_.:/-]{1,96}$/;
const FAST = new Set(['observe','compute','render','read','graph','history','sqe','help']);
const PRIVILEGED = new Set(['publish','source-write','device-control','network-admin','remote-execute','secret-access']);
const finite = x => typeof x === 'number' && Number.isFinite(x);
function label(value) {
  if (typeof value !== 'string' || !VALID_NAME.test(value)) throw new TypeError('Invalid bounded vertex label');
  return value;
}
function unique(items) {
  if (!Array.isArray(items)) throw new TypeError('Expected array');
  const out = items.map(label);
  if (new Set(out).size !== out.length) throw new Error('Duplicate vertex');
  return out;
}
export function routeCapability(operation, authorization = null) {
  if (FAST.has(operation)) return {route:'fast',authorized:true,reason:'No privileged side effect'};
  if (!PRIVILEGED.has(operation)) return {route:'blocked',authorized:false,reason:'Unknown operation'};
  // A browser-side grant never establishes permission for a remote/device operation.
  if (!authorization || authorization.verifiedBy !== 'trusted-backend' || authorization.operation !== operation ||
      !finite(authorization.expiresAt) || authorization.expiresAt <= Date.now() ||
      typeof authorization.scope !== 'string' || !authorization.scope) {
    return {route:'gated',authorized:false,reason:'Require backend-verified scoped capability'};
  }
  return {route:'gated',authorized:true,reason:'Scoped grant presented; backend must verify again before execution'};
}
export function inducedSteeredGraph({vertices, relations, protectedVertices = [], scores = {}, limit = 64, embeddings = null}) {
  const all = unique(vertices);
  const pinned = unique(protectedVertices);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 4096) throw new RangeError('Invalid vertex budget');
  if (pinned.length > limit) throw new RangeError('Protected set exceeds vertex budget');
  const available = new Set(all);
  if (pinned.some(v => !available.has(v))) throw new Error('Protected vertex not in graph');
  const pins = new Set(pinned);
  const ranked = all.filter(v => !pins.has(v)).sort((a,b) => {
    const aa = Object.hasOwn(scores,a) ? scores[a] : 0, bb = Object.hasOwn(scores,b) ? scores[b] : 0;
    if (!finite(aa) || !finite(bb)) throw new TypeError('Nonfinite score');
    return bb-aa || a.localeCompare(b);
  });
  const selected = [...pinned, ...ranked.slice(0, limit-pinned.length)].sort();
  const membership = new Set(selected);
  const index = new Map(selected.map((v,i)=>[v,i]));
  if (!Array.isArray(relations)) throw new TypeError('Relations must be an array');
  const sparse = new Map(), pairCounts = new Map();
  let accepted = 0;
  for (const edge of relations) {
    if (!edge || typeof edge !== 'object') throw new TypeError('Invalid ternary relation');
    const a = label(edge.a), b = label(edge.b), c = label(edge.c);
    if (!(available.has(a) && available.has(b) && available.has(c))) throw new Error('Undeclared relation vertex');
    if (!membership.has(a) || !membership.has(b) || !membership.has(c)) continue;
    const ia = index.get(a), ib = index.get(b), ic = index.get(c);
    const key = JSON.stringify([ia,ib,ic]), pair = JSON.stringify([ia,ib]);
    sparse.set(key,(sparse.get(key)||0)+1);
    pairCounts.set(pair,(pairCounts.get(pair)||0)+1);
    accepted++;
  }
  const entries = [...sparse].map(([key,count]) => {
    const [a,b,c] = JSON.parse(key);
    const denom = pairCounts.get(JSON.stringify([a,b]));
    return {a,b,c,count,frequency:count/denom};
  }).sort((x,y)=>x.a-y.a||x.b-y.b||x.c-y.c);
  const result = {vertices:selected, retainedRelations:accepted, omittedRelations:relations.length-accepted,
    channels:2, shape:[2,selected.length,selected.length,selected.length], entries};
  if (embeddings != null) {
    result.embeddings = {};
    for (const v of selected) {
      const e=embeddings[v];
      if (!(e instanceof Float32Array || e instanceof Float64Array || Array.isArray(e)) ||
          !e.length || !Array.from(e).every(finite)) throw new Error('Missing/invalid embedding: '+v);
      result.embeddings[v] = e.slice(); // preserve retained numeric entries exactly
    }
  }
  return result;
}
export function symplecticStep(phase, dt, {mass=1, stiffness=1} = {}) {
  if (!phase || !finite(phase.q) || !finite(phase.p) || !finite(dt) ||
      !finite(mass) || mass<=0 || !finite(stiffness) || stiffness<=0 ||
      Math.abs(dt)>0.1) throw new RangeError('Invalid phase step');
  const half = phase.p - 0.5*dt*stiffness*phase.q;
  const q = phase.q + dt*half/mass;
  const p = half - 0.5*dt*stiffness*q;
  if (!finite(q) || !finite(p)) throw new Error('Nonfinite phase');
  return {q,p,energy:p*p/(2*mass)+0.5*stiffness*q*q};
}
export function createCausalCore({maxEvents=256, vertexBudget=48} = {}) {
  if (!Number.isSafeInteger(maxEvents)||maxEvents<1||maxEvents>2048) throw new RangeError('Invalid event cap');
  if (!Number.isSafeInteger(vertexBudget)||vertexBudget<3||vertexBudget>1024) throw new RangeError('Invalid vertex cap');
  const events=[]; let seq=0; let phase={q:0,p:0,energy:0}; let frameAvg=0;
  const listeners = new Set(); const revisions=[]; let currentState=null;
  const api={
    observe({a,b,c,source}) {
      const event={seq:++seq,a:label(a),b:label(b),c:label(c),source:label(source),
        observedAt:new Date().toISOString()};
      events.push(event); if(events.length>maxEvents) events.shift();
      phase.p = Math.min(2,phase.p+0.06); // bounded graphical impulse, not device telemetry
      for(const listener of listeners) { try{listener(event)}catch(e){console.error('Core subscriber failed',e)} }
      return event.seq;
    },
    subscribe(listener) { if(typeof listener!=='function')throw new TypeError('Listener required');
      listeners.add(listener);return ()=>listeners.delete(listener); },
    get seq(){return seq},
    history(){return events.map(e=>({...e}))},
    graph(){
      const vertices=[...new Set(events.flatMap(x=>[x.a,x.b,x.c]))];
      if(!vertices.length) return {vertices:[],channels:2,shape:[2,0,0,0],entries:[],retainedRelations:0,omittedRelations:0};
      const scores=Object.create(null);
      for(const e of events){for(const v of [e.a,e.b,e.c])scores[v]=(scores[v]||0)+1}
      const protectedVertices=['terminal','exec'].filter(v=>vertices.includes(v));
      return inducedSteeredGraph({vertices,relations:events,protectedVertices,scores,limit:vertexBudget});
    },
    tick(dt){phase=symplecticStep(phase,Math.max(0,Math.min(0.05,dt)));
      return {...phase}; },
    phase(){return {...phase}},
    sampleFrame(ms){
      if(!finite(ms)||ms<0)return {fpsCap:60,quality:1,measured:false};
      frameAvg=frameAvg ? frameAvg*0.9+ms*0.1 : ms;
      const fpsCap=frameAvg>35?20:frameAvg>22?30:60;
      return {fpsCap,quality:fpsCap===60?1:fpsCap===30?0.75:0.5,measured:true,frameAverageMs:frameAvg};
    },
    // Transactional local *state* with exact in-session snapshot rollback. No filesystem or GitHub write.
    prepareLocalState(candidate, verify) {
      if(typeof verify!=='function'||!verify(candidate))throw new Error('Local state verification rejected');
      const copy=JSON.parse(JSON.stringify(candidate));
      if(JSON.stringify(copy).length>65536)throw new RangeError('Local state too large');
      return {candidate:copy,revision:revisions.length+1};
    },
    commitLocalState(staged) {
      if(!staged||staged.revision!==revisions.length+1)throw new Error('Stale local revision');
      revisions.push(currentState===null?null:JSON.parse(JSON.stringify(currentState)));
      currentState=JSON.parse(JSON.stringify(staged.candidate));return revisions.length;
    },
    rollbackLocalState() {
      if(!revisions.length)throw new Error('No in-session revision to restore');
      currentState=revisions.pop();return currentState===null?null:JSON.parse(JSON.stringify(currentState));
    },
    localState(){return currentState===null?null:JSON.parse(JSON.stringify(currentState))},
    status(){return {eventsRetained:events.length,eventsObserved:seq,vertices:this.graph().vertices.length,
      phase:this.phase(),frameAverageMs:frameAvg,storage:'session-memory',privilegedBackend:'not-connected'}},
  };
  return api;
}
export const causalCore=createCausalCore();
