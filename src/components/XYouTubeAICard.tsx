import React, { useEffect, useRef, useState } from 'react';
import { X, RotateCcw, Send, Share2, Tv, Video, PhoneOff } from 'lucide-react';
import type { EnvironmentState } from '../types';
import { quineMeshService } from '../services/quineMeshService.mjs';
import { youtubeService } from '../services/youtubeService';
import { createRoomId, fromInviteHash, inviteUrl, normalizeInvite } from '../services/gaiaInviteCard.mjs';
import { createCrypticCall } from '../services/gaiaWebRTC.mjs';
import { gaiaCommsState } from '../services/gaiaCommsState.mjs';

type Turn = {role:'user'|'assistant';content:string};
type Provider = 'xai'|'gemini';
type Status = {configured:boolean;sdk_installed:boolean;model:string};
type FullStatus = Status&{gemini?:Status};
type Invite = {title:string;videoId:string;roomId:string;createdAt:number;expiresAt:number;kind:string;meetUrl?:string};

const wss = String((import.meta as any).env?.VITE_GAIA_RTC_WSS||'');
export const XYouTubeAICard: React.FC<{envState:EnvironmentState}> = ({envState})=>{
  const [open,setOpen]=useState(false);
  const [flipped,setFlipped]=useState(false);
  const [opacity,setOpacity]=useState(.74);
  const [invite,setInvite]=useState<Invite|null>(null);
  const [meetUrl,setMeetUrl]=useState('');
  const [notice,setNotice]=useState('');
  const [provider,setProvider]=useState<Provider>('xai');
  const [status,setStatus]=useState<FullStatus|null>(null);
  const [mesh,setMesh]=useState(quineMeshService.status().state==='connected');
  const [prompt,setPrompt]=useState('');
  const [turns,setTurns]=useState<Turn[]>([]);
  const [sid,setSid]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [callState,setCallState]=useState('not connected');
  const [callError,setCallError]=useState('');
  const [localStream,setLocalStream]=useState<MediaStream|null>(null);
  const [remoteStream,setRemoteStream]=useState<MediaStream|null>(null);
  const call=useRef<any>(null);
  const localVideo=useRef<HTMLVideoElement|null>(null);
  const remoteVideo=useRef<HTMLVideoElement|null>(null);
  const videoId=invite?.videoId||envState.youtube.currentTrack?.id||'';
  const validVideo=/^[A-Za-z0-9_-]{11}$/.test(videoId);
  const watchUrl=validVideo?youtubeService.getNativeWatchUrl({videoId}):'https://www.youtube.com/';
  const embed=validVideo?youtubeService.buildEmbedUrl({videoId},false,true):'';
  const selectedMeetURL=invite?.meetUrl||meetUrl;
  const verifiedMeetURL=/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/.test(selectedMeetURL)?selectedMeetURL:'';
  const aiStatus=provider==='gemini'?status?.gemini:status;
  const ready=mesh&&!!aiStatus?.configured&&!!aiStatus?.sdk_installed;

  useEffect(()=>quineMeshService.subscribe((x:any)=>setMesh(x.state==='connected')),[]);
  useEffect(()=>{
    const listener=()=>setOpen(true);
    window.addEventListener('gaia:open-x-card',listener);
    const hangupFromTerminal=()=>{
      call.current?.hangup();
      setLocalStream(null);
      setRemoteStream(null);
      setCallState('idle');
      gaiaCommsState.record({phase:'idle',localMedia:false,remoteMedia:false});
    };
    window.addEventListener('gaia:hangup-call',hangupFromTerminal);
    try{const item=fromInviteHash(window.location.hash) as Invite|null;
      if(item){setInvite(item);setMeetUrl(item.meetUrl||'');setOpen(true);}
    }catch{setNotice('Invalid or expired invitation');}
    return()=>{
      window.removeEventListener('gaia:open-x-card',listener);
      window.removeEventListener('gaia:hangup-call',hangupFromTerminal);
    };
  },[]);
  useEffect(()=>()=>{call.current?.close();call.current=null;gaiaCommsState.reset();},[]);
  useEffect(()=>{if(localVideo.current)localVideo.current.srcObject=localStream},[localStream,flipped]);
  useEffect(()=>{if(remoteVideo.current)remoteVideo.current.srcObject=remoteStream},[remoteStream,flipped]);
  useEffect(()=>{
    if(!open||!mesh){setStatus(null);return}
    let live=true;
    quineMeshService.xaiCardStatus().then((value:FullStatus)=>{if(live)setStatus(value)})
      .catch(()=>{if(live)setStatus(null)});
    return()=>{live=false};
  },[open,mesh]);
  useEffect(()=>{
    if(!open||!mesh){setSid(null);setTurns([]);return}
    let id='';try{id=sessionStorage.getItem('gaia-xcard-private-'+provider)||''}catch{}
    if(!id){setSid(null);setTurns([]);return}
    let live=true;
    quineMeshService.xaiCardHistory(id,30).then((data:any)=>{
      if(!live)return;
      setSid(id);
      setTurns(Array.isArray(data.messages)?data.messages.filter((x:any)=>
        (x.role==='user'||x.role==='assistant')&&typeof x.content==='string'):[]);
    }).catch(()=>{if(live){setSid(null);setTurns([])}});
    return()=>{live=false};
  },[open,mesh,provider]);

  function createInvite():Invite{
    if(!validVideo)throw Error('Select a valid YouTube video first');
    const createdAt=Date.now();
    const item=normalizeInvite({videoId,roomId:createRoomId(),title:'GAIA Watch Session',
      createdAt,expiresAt:createdAt+86400000,meetUrl}) as Invite;
    setInvite(item);return item;
  }
  function getLink(item:Invite){
    try{return inviteUrl(item,window.location.origin+window.location.pathname)}
    catch{return inviteUrl(item)}
  }
  async function share(){
    try{
      const item=invite||createInvite(),url=getLink(item);
      if(typeof navigator.share==='function'){
        await navigator.share({title:item.title,text:'GAIA Watch Invitation',url});
        setNotice('Shared through your device');
      }else if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(url);
        setNotice('Copied for Google Voice, chat or messages');
      }else setNotice(url);
    }catch(e:any){if(e?.name!=='AbortError')setNotice(String(e?.message||e))}
  }
  async function copy(){
    try{await navigator.clipboard.writeText(getLink(invite||createInvite()));setNotice('Copied invitation URL')}
    catch(e:any){setNotice('Copy unavailable: '+String(e?.message||e))}
  }
  function sendMail(){
    try{window.location.href='mailto:?subject='+encodeURIComponent('GAIA Watch Session')+
      '&body='+encodeURIComponent('Invitation:\n'+getLink(invite||createInvite()))}
    catch(e:any){setNotice(String(e?.message||e))}
  }
  function sendText(){
    try{window.location.href='sms:?body='+encodeURIComponent('GAIA Watch: '+getLink(invite||createInvite()))}
    catch(e:any){setNotice(String(e?.message||e))}
  }
  async function ask(e:React.FormEvent){
    e.preventDefault();if(!prompt.trim()||busy)return;
    if(!ready){setError('Pair local Quine mesh and configure the selected AI provider');return}
    setBusy(true);setError('');
    try{
      const question=prompt.trim();
      const result=await quineMeshService.xaiCardChat(question,videoId,sid,provider);
      const expected=provider==='gemini'?'gemini-openai-sdk':'xai-sdk';
      if(result.provider!==expected||!result.saved||typeof result.reply!=='string')
        throw Error('No verified provider response');
      setSid(result.sessionId);
      try{sessionStorage.setItem('gaia-xcard-private-'+provider,result.sessionId)}catch{}
      setTurns(old=>[...old.slice(-28),{role:'user',content:question},
        {role:'assistant',content:result.reply}]);
      setPrompt('');
    }catch(e:any){setError('AI unavailable: '+String(e?.message||e))}
    finally{setBusy(false)}
  }
  function connect(){
    setCallError('');
    if(!wss){setCallError('Cryptic WSS signaling is not deployed. Google Meet can be used instead.');gaiaCommsState.record({phase:'signaling-unconfigured',signaling:'unconfigured'});return}
    try{
      call.current?.close();
      const room=invite?.roomId||createInvite().roomId;
      call.current=createCrypticCall({roomId:room,signalingUrl:wss,
        onState:(e:any)=>{
          setCallState(e.state);
          gaiaCommsState.record({phase:e.state,
            signaling:e.state==='signaling-connected'?'connected':
              e.state==='signaling-disconnected'?'disconnected':
              e.state==='signaling-error'?'error':undefined,
            remotePeerCount:e.peers});
        },
        onRemoteStream:(stream:MediaStream|null)=>{
          setRemoteStream(stream);
          gaiaCommsState.record({remoteMedia:!!stream?.getTracks().length});
        }});
      call.current.connect();
    }catch(e:any){setCallError(String(e?.message||e))}
  }
  async function accept(){
    try{
      if(!call.current)throw Error('Connect signaling first');
      const stream=await call.current.startCall();
      setLocalStream(stream);
      gaiaCommsState.record({localMedia:!!stream?.getTracks().length});
    }catch(e:any){setCallError(String(e?.message||e))}
  }
  function hangup(){call.current?.hangup();setLocalStream(null);setRemoteStream(null);setCallState('idle');gaiaCommsState.record({phase:'idle',localMedia:false,remoteMedia:false})}
  const button='rounded-lg border border-cyan-400/40 bg-black/25 px-2 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20';
  const style:React.CSSProperties={backgroundColor:'rgba(2,6,23,'+opacity+')',
    backdropFilter:'blur(18px)',boxShadow:'0 20px 60px rgba(0,0,0,.35)'};
  return (<>
    <button onClick={()=>setOpen(!open)} className="pointer-events-auto fixed right-4 top-16 z-40 rounded-xl border border-cyan-400/50 bg-slate-950/80 px-3 py-2 text-xs text-cyan-100">
      𝕏 · GAIA INVITE
    </button>
    {open&&<aside role="dialog" aria-label="GAIA dual-side invitation card"
      style={style} className="pointer-events-auto fixed right-3 top-28 z-50 w-[min(95vw,440px)] overflow-hidden rounded-2xl border border-cyan-400/60 text-white">
      <header className="flex items-center justify-between border-b border-white/20 p-3">
        <strong className="text-xs">GAIA · CRYPTIC COMMUNICATIONS</strong>
        <div className="flex gap-2">
          <button className={button} onClick={()=>setFlipped(!flipped)}><RotateCcw size={14} className="inline"/> Flip</button>
          <button className={button} aria-label="Close invite card" onClick={()=>setOpen(false)}><X size={14}/></button>
        </div>
      </header>
      <div className="flex gap-2 px-3 pt-2 text-[11px]">
        <label htmlFor="gaia-opacity">Opacity</label>
        <input id="gaia-opacity" type="range" min=".25" max=".95" step=".05"
          value={opacity} onChange={e=>setOpacity(Number(e.target.value))} className="flex-1"/>
        <span>{Math.round(opacity*100)}%</span>
      </div>
      <div className="relative h-[min(66vh,660px)]" style={{perspective:'1200px'}}>
        <div className="relative h-full w-full" style={{transform:flipped?'rotateY(180deg)':'rotateY(0deg)',
          transformStyle:'preserve-3d',transition:'transform .55s ease'}}>
          <section aria-hidden={flipped} className="absolute inset-0 flex flex-col gap-3 overflow-y-auto p-3"
            style={{backfaceVisibility:'hidden',pointerEvents:flipped?'none':'auto'}}>
            <div className="flex items-center justify-between">
              <strong className="text-xs"><Tv size={13} className="inline"/> Watch Together</strong>
              <a className={button} target="_blank" rel="noopener noreferrer" href={watchUrl}>Open YouTube ↗</a>
            </div>
            {embed&&<iframe title="YouTube Watch Session" src={embed} className="aspect-video w-full rounded border-0"
              allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>}
            <p className="text-[11px] text-slate-300">YouTube authentication stays on youtube.com; invites contain no account tokens.</p>
            <div className="rounded-xl border border-white/20 p-2">
              <p className="mb-2 text-xs">Share this watch session:</p>
              <div className="grid grid-cols-4 gap-1">
                <button className={button} onClick={share}><Share2 size={13} className="inline"/> Share</button>
                <button className={button} onClick={copy}>Copy</button>
                <button className={button} onClick={sendMail}>Email</button>
                <button className={button} onClick={sendText}>SMS</button>
              </div>
              {invite&&<p className="mt-2 break-words text-[10px]">Room: {invite.roomId}</p>}
              {notice&&<p role="status" className="mt-2 break-words text-[11px] text-cyan-200">{notice}</p>}
            </div>
            <p className="text-[11px] text-slate-400">Shared card = public watch reference, not private terminal permission.</p>
            <button className={button} onClick={()=>setFlipped(true)}>Flip to AI and call →</button>
          </section>
          <section aria-hidden={!flipped} className="absolute inset-0 flex flex-col gap-2 overflow-y-auto p-3"
            style={{backfaceVisibility:'hidden',transform:'rotateY(180deg)',pointerEvents:flipped?'auto':'none'}}>
            <div className="flex items-center justify-between gap-2">
              <strong className="text-xs">Grok / Gemini · Video Call</strong>
              <select aria-label="AI provider" className="rounded bg-black/60 p-1 text-xs" value={provider}
                onChange={e=>setProvider(e.target.value as Provider)}>
                <option value="xai">Grok · xAI</option><option value="gemini">Gemini · OpenAI SDK</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-300">{ready?'AI host configured':'AI provider not connected'} · video has no automatic transcript</p>
            <div className="min-h-[60px] max-h-[130px] space-y-1 overflow-y-auto">
              {turns.length?turns.map((t,i)=><p key={i} className="rounded bg-black/30 p-2 text-xs break-words whitespace-pre-wrap">
                <strong>{t.role==='user'?'You: ':'AI: '}</strong>{t.content}</p>):
                <p className="text-[11px] text-slate-400">Private AI history stays with the paired host; it is not shared with invitees.</p>}
            </div>
            <form onSubmit={ask} className="flex gap-2">
              <input value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={2400}
                placeholder="Ask selected AI" aria-label="AI prompt" className="min-w-0 flex-1 rounded bg-black/40 p-2 text-xs"/>
              <button type="submit" className={button} disabled={!prompt.trim()||busy||!ready}><Send size={15}/></button>
            </form>
            {error&&<p role="alert" className="text-xs text-rose-300">{error}</p>}
            <div className="border-t border-white/15 pt-2">
              <p className="mb-1 text-xs font-semibold">Google Meet / Google Chat</p>
              <input value={meetUrl} onChange={e=>{setMeetUrl(e.target.value);setInvite(null)}}
                placeholder="Paste a real Google Meet invite link (optional)"
                aria-label="Meet URL" className="mb-2 w-full rounded bg-black/40 p-2 text-xs"/>
              <div className="flex gap-2">
                <a className={button} href={verifiedMeetURL||'https://meet.google.com/new'}
                  rel="noopener noreferrer" target="_blank">Open Google Meet</a>
                <a className={button} href="https://chat.google.com/"
                  rel="noopener noreferrer" target="_blank">Google Chat</a>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Create a Meet in Google; paste its link and share a new card. Meet is not embedded.</p>
            </div>
            <div className="border-t border-white/15 pt-2">
              <p className="mb-1 text-xs font-semibold"><Video size={13} className="inline"/> Cryptic WebRTC · STUN</p>
              <div className="flex flex-wrap gap-1">
                <button className={button} onClick={connect}>Connect</button>
                <button className={button} onClick={accept}>Start / accept media</button>
                <button className={button} onClick={hangup}><PhoneOff size={12} className="inline"/> Hang up</button>
              </div>
              <p className="mt-1 text-[11px]">State: {callState}</p>
              {callError&&<p role="alert" className="text-xs text-rose-300">{callError}</p>}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <video ref={localVideo} muted autoPlay playsInline aria-label="Local video" className="aspect-video w-full rounded bg-black"/>
                <video ref={remoteVideo} autoPlay playsInline aria-label="Remote video" className="aspect-video w-full rounded bg-black"/>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Calls require a deployed WSS server and explicit media consent. STUN alone is insufficient.</p>
            </div>
            <button className={button} onClick={()=>setFlipped(false)}>← Invite front</button>
          </section>
        </div>
      </div>
    </aside>}
  </>);
};
