import React,{useState} from "react";
import {inferIntent,readLedger,record,ingestFile,crawlSameOrigin,moltPreview,stopForge,isStopped,resumeForge} from "../services/convergenceForge";
export function ConvergenceForgePanel(){
 const [open,setOpen]=useState(false),[input,setInput]=useState(""),[html,setHtml]=useState(""),[preview,setPreview]=useState(""),[events,setEvents]=useState(readLedger()),[busy,setBusy]=useState(false),[stopped,setStopped]=useState(isStopped());
 const refresh=()=>setEvents(readLedger());
 async function runCrawl(){
  if(stopped||busy)return;setBusy(true);
  try{const pages=await crawlSameOrigin(input||location.href);setHtml(pages.map(p=>p.html).join("\n"));record("CRAWL_DONE",pages.length+" pages")}
  catch(e){record("ERROR",String(e))}finally{setBusy(false);refresh()}
 }
 async function fileChange(file?:File){if(!file||stopped)return;try{setHtml(await ingestFile(file))}catch(e){record("ERROR",String(e))}refresh()}
 function runMolt(){if(stopped)return;setPreview(moltPreview(html));refresh()}
 const intents=inferIntent(input);
 return <div className="fixed bottom-3 right-3 z-[80] text-slate-100 font-mono text-xs" style={{pointerEvents:"auto"}}>
  <button className="rounded border border-cyan-400 bg-slate-950 px-3 py-2 text-cyan-300" onClick={()=>setOpen(!open)}>◈ V38 FORGE {open?"−":"+"}</button>
  {open&&<div className="mt-2 w-[min(94vw,480px)] max-h-[75vh] overflow-auto rounded-xl border border-cyan-500/50 bg-slate-950/95 p-3 shadow-2xl">
   <div className="mb-2 flex justify-between"><strong>CONVERGENCE FORGE / LOCAL</strong><button className="text-red-300" onClick={()=>{stopForge();setStopped(true);refresh()}}>STOP 33011033</button></div>
   {stopped&&<button className="mb-2 border border-amber-400 px-2 py-1" onClick={()=>{resumeForge();setStopped(false);refresh()}}>Manually resume</button>}
   <label className="block">Intent or same-origin URL</label>
   <textarea className="my-2 w-full rounded bg-slate-800 p-2" rows={2} value={input} onChange={e=>setInput(e.target.value)} placeholder="Diagnose, backup, or /local-page"/>
   <div className="mb-2">Predicted: {intents.length?intents.map(x=>x.kind+" ("+x.score+")"+(x.approvalRequired?" approval required":"")).join(", "):"none"}</div>
   <div className="flex flex-wrap gap-2">
    <button className="border border-cyan-400 p-2" disabled={busy||stopped} onClick={runCrawl}>Crawl same-origin</button>
    <label className="cursor-pointer border border-cyan-400 p-2">Ingest local file<input className="hidden" type="file" accept=".html,.htm,.txt,.md" onChange={e=>fileChange(e.target.files?.[0])}/></label>
    <button className="border border-purple-400 p-2" disabled={!html||stopped} onClick={runMolt}>Molt preview</button>
   </div>
   <textarea className="mt-2 w-full bg-slate-900 p-2" rows={4} value={html} onChange={e=>setHtml(e.target.value)} placeholder="Ingested/skeleton HTML (editable)"/>
   {preview&&<iframe title="Molt preview" sandbox="" referrerPolicy="no-referrer" srcDoc={preview} className="mt-2 h-44 w-full border border-cyan-500 bg-white"/>}
   <div className="mt-2 border-t border-slate-700 pt-2">Ledger ({events.length} local records)</div>
   <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-[10px] text-slate-400">{events.slice(-12).reverse().map(x=>x.ts+" "+x.kind+" "+x.detail).join("\n")}</pre>
   <div className="mt-2 text-slate-400">No shell execution. No external crawling. No AI key use. Stop affects this Forge module only.</div>
  </div>}
 </div>
}
