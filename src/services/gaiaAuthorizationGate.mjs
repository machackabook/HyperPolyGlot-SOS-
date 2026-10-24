/**
 * GAIA user authorization toasts. Explicit click for privileged host mutation.
 * A confirmation is one-shot, expires quickly, and does NOT replace host-side
 * token authentication, GOD policy decisions, or service-owned permissions.
 */
const ALLOWED = new Set(['github.mount.clone','github.mount.link','network.change','device.control','source.write']);
const RESOURCE = /^[a-zA-Z0-9_.:/@?=&%-]{1,220}$/;
export function createAuthorizationGate({ttlMs=45000,clock=()=>Date.now(),
  schedule=(fn,ms)=>setTimeout(fn,ms),cancel=(id)=>clearTimeout(id)}={}){
  if(!Number.isSafeInteger(ttlMs)||ttlMs<1000||ttlMs>90000)throw RangeError('Invalid prompt expiry');
  let current=null,sequence=0;
  const listeners=new Set(),audit=[];
  function snapshot(){
    if(!current)return null;
    return {id:current.id,capability:current.capability,resource:current.resource,
      expiresAt:current.expiresAt};
  }
  function notify(){for(const fn of listeners){try{fn(snapshot())}catch{}}}
  function complete(id,approved){
    if(!current||current.id!==id)return false;
    const task=current;current=null;cancel(task.timer);
    audit.push({capability:task.capability,approved:!!approved,at:clock()});
    if(audit.length>40)audit.shift();
    notify();
    task.resolve(!!approved);
    return true;
  }
  return {
    request(capability,resource){
      if(!ALLOWED.has(capability)||typeof resource!=='string'||!RESOURCE.test(resource))
        return Promise.reject(new TypeError('Invalid privileged operation'));
      if(!listeners.size)return Promise.reject(new Error('Authorization UI unavailable; operation denied'));
      if(current)return Promise.reject(new Error('An authorization request is already pending'));
      return new Promise(resolve=>{
        const id=++sequence,expiresAt=clock()+ttlMs;
        const timer=schedule(()=>complete(id,false),ttlMs);
        current={id,capability,resource,expiresAt,resolve,timer};
        notify();
      }).then(allowed=>{
        if(!allowed)throw new Error('Operation was denied or authorization expired');
        return {authorized:true,capability,resource};
      });
    },
    approve(id){if(!current||clock()>current.expiresAt)return complete(id,false);return complete(id,true)},
    deny(id){return complete(id,false)},
    cancelPending(){if(current)complete(current.id,false)},
    snapshot,
    audit(){return audit.map(x=>({...x}))},
    subscribe(fn){
      if(typeof fn!=='function')throw new TypeError('Callback required');
      listeners.add(fn);fn(snapshot());
      return ()=>{listeners.delete(fn);if(!listeners.size&&current)complete(current.id,false)};
    }
  };
}
export const gaiaAuthorizationGate=createAuthorizationGate();
