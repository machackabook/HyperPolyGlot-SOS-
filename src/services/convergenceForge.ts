/* V38 Convergence Forge: local-first, bounded, browser-only. */
export type ForgeEvent={ts:string;kind:string;detail:string};
export type Intent={kind:string;score:number;reason:string;approvalRequired:boolean};
const KEY="nexus-v38-forge-ledger";
const RULES:[string,RegExp,number,boolean][]=[
 ["diagnose",/diagnos|debug|error|log|repair/i,8,false],
 ["archive",/backup|archive|snapshot|preserve/i,7,false],
 ["crawl",/crawl|spider|harvest|scan|ingest/i,7,true],
 ["molt",/molt|forge|transform|evolv|redesign/i,6,true],
 ["deploy",/deploy|publish|release|push|merge/i,5,true]
];
export function inferIntent(input:string):Intent[]{
 const text=input.slice(0,3000);return RULES.filter(([_,re])=>re.test(text))
 .map(([kind,_,base,approvalRequired])=>({kind,score:base,approvalRequired,reason:"Matched user-request vocabulary"}))
 .sort((a,b)=>b.score-a.score);
}
export function readLedger():ForgeEvent[]{
 try{return JSON.parse(localStorage.getItem(KEY)||"[]").slice(-200)}catch{return []}
}
export function record(kind:string,detail:string){
 const item={ts:new Date().toISOString(),kind,detail:detail.slice(0,600)};
 try{localStorage.setItem(KEY,JSON.stringify([...readLedger(),item].slice(-200)))}catch{}
 console.info("[V38]",kind,detail);return item;
}
export function skeletonize(html:string){
 const d=new DOMParser().parseFromString(html,"text/html");
 d.querySelectorAll("script,style,iframe,object,embed,form,base,meta[http-equiv]").forEach(e=>e.remove());
 d.querySelectorAll("*").forEach(el=>{[...el.attributes].forEach(a=>{if(/^on/i.test(a.name)||/^(href|src|action)$/i.test(a.name)&&/^(javascript:|data:)/i.test(a.value))el.removeAttribute(a.name)})});
 return (d.documentElement.outerHTML).slice(0,250000);
}
export async function ingestFile(file:File){
 if(file.size>1024*1024)throw Error("File exceeds 1 MiB limit");
 const text=await file.text();const clean=skeletonize(text);
 record("FILE_INGEST",file.name+" bytes="+file.size);return clean;
}
export async function crawlSameOrigin(start:string,maxPages=8):Promise<{url:string;html:string}[]>{
 const origin=location.origin;if(!/^https?:$/.test(location.protocol))throw Error("HTTP(S) origin required");
 const first=new URL(start,location.href);if(first.origin!==origin)throw Error("Cross-origin requests disabled");
 const queue=[first.href],visited=new Set<string>(),results:{url:string;html:string}[]=[];
 while(queue.length&&results.length<Math.min(8,Math.max(1,maxPages))){
  const url=queue.shift()!;if(visited.has(url))continue;visited.add(url);
  record("CRAWL_REQUEST",url);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6000);
  try{
   const resp=await fetch(url,{signal:controller.signal,credentials:"omit",redirect:"error"});
   if(!resp.ok||!(resp.headers.get("content-type")||"").includes("text/html"))continue;
   const size=Number(resp.headers.get("content-length")||0);if(size>1024*1024)continue;
   const txt=(await resp.text()).slice(0,1024*1024);
   const doc=new DOMParser().parseFromString(txt,"text/html");
   results.push({url,html:skeletonize(txt)});
   for(const a of [...doc.querySelectorAll("a[href]")]){
    try{const next=new URL(a.getAttribute("href")!,url);if(next.origin===origin&&/^https?:$/.test(next.protocol)&&!visited.has(next.href)&&queue.length<20)queue.push(next.href)}catch{}
   }
   record("CRAWL_SUCCESS",url);
  }catch(e){record("CRAWL_ERROR",url+" "+String(e).slice(0,120))}finally{clearTimeout(timer)}
 }
 return results;
}
export function moltPreview(source:string){
 const doc=new DOMParser().parseFromString(skeletonize(source),"text/html");
 doc.querySelectorAll("script,iframe,object,embed,form,link,base").forEach(e=>e.remove());
 const style=doc.createElement("style");
 style.textContent="body{background:#080d18!important;color:#d7f4ff!important;font:15px system-ui!important;padding:24px!important}a{color:#00e5ff!important}main,section,article,div{max-width:100%}pre{white-space:pre-wrap}";
 doc.head.appendChild(style);
 record("MOLT_PREVIEW","Deterministic style transformation (no AI/API call)");
 return "<!doctype html>"+doc.documentElement.outerHTML;
}
export function stopForge(){try{localStorage.setItem("nexus-v38-stop","1")}catch{}record("STOP","33011033 requested");}
export function isStopped(){try{return localStorage.getItem("nexus-v38-stop")==="1"}catch{return false}}
export function resumeForge(){try{localStorage.removeItem("nexus-v38-stop")}catch{}record("RESUME","Manual resume")}
