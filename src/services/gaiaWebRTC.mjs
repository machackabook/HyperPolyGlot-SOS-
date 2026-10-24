/**
 * GAIA Cryptic Comm — STUN-first peer-to-peer WebRTC session.
 * Signaling messages travel through a separately deployed WSS server.
 * No camera or microphone is opened until startCall() is invoked by a user.
 */
const ROOM=/^gaia-[a-f0-9]{24}$/;
const STUN=Object.freeze([
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
]);
export function iceConfiguration({turnServers=[]}={}){
  if(!Array.isArray(turnServers)||turnServers.length>3)throw new TypeError('Invalid TURN list');
  const safe=turnServers.map(v=>{
    if(!v||typeof v!=='object'||!v.urls||typeof v.username!=='string'||typeof v.credential!=='string')
      throw new Error('TURN requires explicit scoped credentials');
    const urls=Array.isArray(v.urls)?v.urls:[v.urls];
    if(!urls.every(u=>typeof u==='string'&&/^turns?:[^?#\s]+/.test(u)))throw Error('Invalid TURN URL');
    return {urls:v.urls,username:v.username,credential:v.credential};
  });
  return {iceServers:[...STUN,...safe],iceCandidatePoolSize:2};
}
export function createCrypticCall({roomId,signalingUrl,onState=()=>{},onRemoteStream=()=>{},
                                  WebSocketCtor=globalThis.WebSocket,
                                  PeerCtor=globalThis.RTCPeerConnection,
                                  acquireMedia=()=>globalThis.navigator.mediaDevices.getUserMedia({audio:true,video:true}),
                                  config=iceConfiguration()}){
  if(typeof roomId!=='string'||!ROOM.test(roomId))throw new TypeError('Valid invite room required');
  if(typeof signalingUrl!=='string'||!/^wss:\/\/[^\s/#?]+\/[^\s#?]*$/.test(signalingUrl))
    throw new TypeError('Configured encrypted WSS signaling endpoint required');
  if(typeof WebSocketCtor!=='function'||typeof PeerCtor!=='function')throw Error('WebRTC not available');
  let socket=null,pc=null,media=null,peers=0,closed=false,negotiating=false;
  const emit=(state,extra={})=>onState({state,roomId,...extra});
  const signal=message=>{
    if(socket?.readyState!==1)throw Error('Signaling not connected');
    socket.send(JSON.stringify(message));
  };
  async function ensurePeer(){
    if(pc)return pc;
    const peer=new PeerCtor(config);
    pc=peer;
    peer.ontrack=e=>onRemoteStream(e.streams?.[0]||null);
    peer.onicecandidate=e=>{if(e.candidate&&socket?.readyState===1)signal({type:'candidate',candidate:e.candidate.toJSON?.()||e.candidate})};
    peer.onconnectionstatechange=()=>emit(peer.connectionState==='connected'?'connected':peer.connectionState);
    if(media)for(const track of media.getTracks())peer.addTrack(track,media);
    return peer;
  }
  async function offer(){
    if(!media||peers<1||negotiating)return;
    negotiating=true;
    try{
      const peer=await ensurePeer();
      const offer=await peer.createOffer();await peer.setLocalDescription(offer);
      signal({type:'offer',description:{type:'offer',sdp:offer.sdp}});
      emit('calling');
    }finally{negotiating=false}
  }
  async function incoming(raw){
    if(!raw||typeof raw!=='object')return;
    switch(raw.type){
      case 'ready':peers=Math.max(0,Math.min(1,Number(raw.peers)||0));emit('ready',{peers});break;
      case 'peer-joined':peers=1;emit('peer-ready',{peers});await offer();break;
      case 'peer-left':peers=0;emit('peer-left');if(pc){pc.close();pc=null}break;
      case 'offer': {
        if(!media){emit('incoming-call');return} // Must explicitly accept to capture devices.
        const p=await ensurePeer();
        if(raw.description?.type!=='offer'||typeof raw.description.sdp!=='string')return;
        await p.setRemoteDescription(raw.description);
        const answer=await p.createAnswer();await p.setLocalDescription(answer);
        signal({type:'answer',description:{type:'answer',sdp:answer.sdp}});
        emit('answering');break;
      }
      case 'answer':{
        if(!pc||raw.description?.type!=='answer'||typeof raw.description.sdp!=='string')return;
        await pc.setRemoteDescription(raw.description);break;
      }
      case 'candidate':{
        if(!pc||!pc.remoteDescription||!raw.candidate)return;
        await pc.addIceCandidate(raw.candidate);break;
      }
      case 'hangup':stopMedia();emit('hangup');break;
    }
  }
  function connect(){
    if(socket||closed)throw Error('Already connected or closed');
    const url=new URL(signalingUrl);url.searchParams.set('room',roomId);
    socket=new WebSocketCtor(url.href);
    socket.onopen=()=>emit('signaling-connected');
    socket.onclose=()=>{peers=0;emit('signaling-disconnected')};
    socket.onerror=()=>emit('signaling-error');
    socket.onmessage=e=>{
      try{void incoming(JSON.parse(e.data)).catch(()=>emit('protocol-error'))}
      catch{emit('protocol-error')}
    };
    emit('connecting');
  }
  async function startCall(){
    if(closed||!socket||socket.readyState!==1)throw Error('Signaling unavailable');
    if(!media)media=await acquireMedia(); // Invoke ONLY following explicit start/accept click.
    if(!media?.getTracks||media.getTracks().length===0)throw Error('No granted media tracks');
    await ensurePeer();
    emit('local-media-ready',{peers});
    if(peers>0)await offer();
    return media;
  }
  function stopMedia(){
    if(media){for(const track of media.getTracks())track.stop();media=null}
    if(pc){pc.close();pc=null}
  }
  function hangup(){
    if(socket?.readyState===1)signal({type:'hangup'});
    stopMedia();emit('idle');
  }
  function close(){
    hangup();closed=true;
    if(socket){socket.close();socket=null}
    emit('closed');
  }
  return {connect,startCall,hangup,close,status:()=>({roomId,peers,mediaActive:!!media,
    signaling:socket?.readyState===1,peerState:pc?.connectionState||'none'})};
}
