/** Public GAIA invite presentation only; never a privileged terminal or WebRTC token. */
const VIDEO=/^[A-Za-z0-9_-]{11}$/, ROOM=/^gaia-[a-f0-9]{24}$/, TITLE=/^[\p{L}\p{N} .,!?:_'()\-]{1,80}$/u;
export function createRoomId(cryptoSource=globalThis.crypto){
 if(!cryptoSource?.getRandomValues)throw Error('Secure randomness required');
 const bytes=cryptoSource.getRandomValues(new Uint8Array(12));
 return 'gaia-'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
}
export function normalizeInvite(raw, now=Date.now()){
 if(!raw||typeof raw!=='object')throw Error('Invite required');
 const title=String(raw.title||'GAIA Watch Session').trim();
 const videoId=String(raw.videoId||''),roomId=String(raw.roomId||'');
 const createdAt=Number(raw.createdAt||now),expiresAt=Number(raw.expiresAt||createdAt+86400000);
 if(!TITLE.test(title)||!VIDEO.test(videoId)||!ROOM.test(roomId))throw Error('Invalid invite fields');
 if(!Number.isSafeInteger(createdAt)||!Number.isSafeInteger(expiresAt)||
    expiresAt<=createdAt||expiresAt-createdAt>7*86400000)throw Error('Invalid duration');
 const meetUrl=raw.meetUrl===undefined||raw.meetUrl===''?'':String(raw.meetUrl);
 if(meetUrl&&!/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\/)?$/.test(meetUrl))
   throw Error('Invalid Google Meet invitation URL');
 return Object.freeze({v:1,title,videoId,roomId,createdAt,expiresAt,
   kind:'watch',...(meetUrl?{meetUrl}:{})});
}
export function encodeInvite(invite){
 const s=JSON.stringify(normalizeInvite(invite));
 const u=new TextEncoder().encode(s);
 let b='';for(const x of u)b+=String.fromCharCode(x);
 return btoa(b).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decodeInvite(value,now=Date.now()){
 if(typeof value!=='string'||value.length>1400||!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Invalid invite encoding');
 const b=atob(value.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-value.length%4)%4));
 const obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(b,x=>x.charCodeAt(0))));
 const invite=normalizeInvite(obj,now);
 if(obj.v!==1||invite.expiresAt<now)throw Error('Invite expired');
 return invite;
}
export function fromInviteHash(hash){
 const m=typeof hash==='string'?hash.match(/^#gaia-invite=([A-Za-z0-9_-]+)$/):null;
 return m?decodeInvite(m[1]):null;
}
export function inviteUrl(invite,publicUrl='https://machackabook.github.io/HyperPolyGlot-SOS-/'){
 const url=new URL(publicUrl);
 const hosts=['machackabook.github.io','crypticnews.org','www.crypticnews.org',
   'cryptic-polyglot-public.saytyarnornglorei.workers.dev'];
 if(url.protocol!=='https:'||!hosts.includes(url.hostname))throw Error('Unapproved invite host');
 url.search='';url.hash='#gaia-invite='+encodeInvite(invite);
 return url.href;
}
export function inviteCapabilities(){
 return {watch:true,share:true,grantsTerminalAccess:false,grantsVideoCall:false,
   requiresRealSignaling:true,videoTranscriptIncluded:false,privateCredentialsIncluded:false};
}
