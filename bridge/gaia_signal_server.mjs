#!/usr/bin/env node
/**
 * Optional Cryptic Communications WSS signaling service.
 * Deploy behind HTTPS/WSS reverse proxy. It NEVER carries media, credentials,
 * SQLite memory, or host commands. Possessing an invite room ID permits an
 * attempt to join this signaling room, but not access to a private terminal.
 *
 * Requires: npm install ws ; GAIA_RTC_ALLOWED_ORIGINS=https://... node bridge/gaia_signal_server.mjs
 */
import {createServer} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
const PORT=Number(process.env.GAIA_RTC_PORT||8792);
const ALLOWED=new Set((process.env.GAIA_RTC_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean));
const ROOM=/^gaia-[a-f0-9]{24}$/;
const peers=new Map();
const MAX_ROOMS=256,TTL=3600000;
if(!Number.isSafeInteger(PORT)||PORT<1024||PORT>65535)throw Error('Invalid port');
if(!ALLOWED.size||![...ALLOWED].every(s=>/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?$/.test(s)))
  throw Error('Configure HTTPS GAIA_RTC_ALLOWED_ORIGINS explicitly');
const server=createServer((req,res)=>{
  res.writeHead(404,{'cache-control':'no-store','content-type':'text/plain'});
  res.end('Signaling WebSocket only');
});
const wss=new WebSocketServer({noServer:true,maxPayload:32768,clientTracking:false});
server.on('upgrade',(req,socket,head)=>{
  const origin=req.headers.origin;
  if(!ALLOWED.has(origin)){socket.destroy();return}
  let url;try{url=new URL(req.url||'','http://localhost')}catch{socket.destroy();return}
  const room=url.searchParams.get('room');
  if(url.pathname!=='/v1/rtc'||!ROOM.test(room||'')){socket.destroy();return}
  const group=peers.get(room);
  if(group?.length>=2||(!group&&peers.size>=MAX_ROOMS)){socket.destroy();return}
  wss.handleUpgrade(req,socket,head,ws=>{
    const ready=peers.get(room)||[];
    if(ready.length>=2){ws.close(1008,'Room full');return}
    ready.push(ws);peers.set(room,ready);
    ws.room=room;ws.created=Date.now();ws.messages=0;ws.window=Date.now();
    ws.send(JSON.stringify({type:'ready',peers:ready.length-1}));
    for(const peer of ready)if(peer!==ws&&peer.readyState===WebSocket.OPEN)
      peer.send(JSON.stringify({type:'peer-joined'}));
    ws.on('message',payload=>{
      const now=Date.now();
      if(now-ws.window>1000){ws.window=now;ws.messages=0}
      if(++ws.messages>48){ws.close(1008,'Rate limited');return}
      let obj;try{obj=JSON.parse(String(payload))}catch{ws.close(1003,'JSON required');return}
      if(!obj||typeof obj!=='object'||!['offer','answer','candidate','hangup'].includes(obj.type))return;
      if(obj.type==='offer'||obj.type==='answer'){
        const d=obj.description;
        if(!d||d.type!==obj.type||typeof d.sdp!=='string'||d.sdp.length>28000)return;
        obj={type:obj.type,description:{type:d.type,sdp:d.sdp}};
      }
      if(obj.type==='candidate'){
        const c=obj.candidate;
        if(!c||typeof c.candidate!=='string'||c.candidate.length>6000)return;
        obj={type:'candidate',candidate:{
          candidate:c.candidate,sdpMid:typeof c.sdpMid==='string'?c.sdpMid.slice(0,64):null,
          sdpMLineIndex:Number.isSafeInteger(c.sdpMLineIndex)?c.sdpMLineIndex:null
        }};
      }
      for(const peer of peers.get(room)||[])if(peer!==ws&&peer.readyState===WebSocket.OPEN)
        peer.send(JSON.stringify(obj));
    });
    ws.on('close',()=>{
      const remaining=(peers.get(room)||[]).filter(x=>x!==ws);
      if(!remaining.length)peers.delete(room);
      else{
        peers.set(room,remaining);
        for(const peer of remaining)if(peer.readyState===WebSocket.OPEN)
          peer.send(JSON.stringify({type:'peer-left'}));
      }
    });
  });
});
const maintenance=setInterval(()=>{
  for(const [room,group] of peers)for(const ws of group)
    if(Date.now()-ws.created>TTL)ws.close(1000,'Room lifetime ended');
},60000);
process.once('SIGTERM',()=>{clearInterval(maintenance);wss.close();server.close()});
server.listen(PORT,'127.0.0.1',()=>console.log('[GAIA RTC] loopback signaling ready on '+PORT+
  '; expose only via HTTPS/WSS proxy with explicit origins'));
