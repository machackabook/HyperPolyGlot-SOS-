import { createHash } from 'node:crypto';
const sha = (v) => createHash('sha256').update(v).digest();
const shaHex = (v) => sha(v).toString('hex');
const sha2 = (v) => sha(sha(v));
const power2 = (n) => Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;

export function buildV5Lattice(side = 5) {
  if (!Number.isInteger(side) || side < 2 || side > 16) throw new RangeError('side must be 2..16');
  const nodes = [], id = (x,y,z,w) => (((x*side+y)*side+z)*side+w);
  for(let x=0;x<side;x++) for(let y=0;y<side;y++) for(let z=0;z<side;z++) for(let w=0;w<side;w++)
    nodes.push({id:id(x,y,z,w),coordinate:[x,y,z,w]});
  const edges=[];
  for(const n of nodes) for(let a=0;a<4;a++) if(n.coordinate[a]+1<side) {
    const c=[...n.coordinate]; c[a]++; edges.push([n.id,id(...c)]);
  }
  return {dimension:4,side,nodes,edges,nodeCount:nodes.length,edgeCount:edges.length};
}
export function manhattanDistance(a,b) {
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==4||b.length!==4||[...a,...b].some(x=>!Number.isInteger(x))) throw new TypeError('four integer coordinates required');
  return a.reduce((s,x,i)=>s+Math.abs(x-b[i]),0);
}
export function buildManhattanPath(start,end) {
  if(!Array.isArray(start)||!Array.isArray(end)||start.length!==4||end.length!==4||[...start,...end].some(x=>!Number.isInteger(x)||x<0||x>15)) throw new TypeError('coordinates must be four integers in [0,15]');
  const path=[[...start]], c=[...start];
  for(let a=0;a<4;a++) while(c[a]!==end[a]) { c[a]+=c[a]<end[a]?1:-1; path.push([...c]); }
  const lowerBound=manhattanDistance(start,end);
  return {path,hops:path.length-1,lowerBound,optimal:path.length-1===lowerBound};
}
export function buildMerkleTree(values) {
  if(!Array.isArray(values)||!power2(values.length)) throw new RangeError('leaf count must be a power of two');
  const levels=[values.map(v=>sha(Buffer.concat([Buffer.from([0]),Buffer.from(v)])))];
  while(levels.at(-1).length>1) {
    const row=levels.at(-1), next=[];
    for(let i=0;i<row.length;i+=2) next.push(sha(Buffer.concat([Buffer.from([1]),row[i],row[i+1]])));
    levels.push(next);
  }
  return {leafCount:values.length,levels:levels.map(row=>row.map(x=>x.toString('hex'))),root:levels.at(-1)[0].toString('hex'),nodeCount:levels.reduce((s,x)=>s+x.length,0),depth:levels.length-1};
}
export function createMerkleProof(tree,index) {
  if(!tree||!Array.isArray(tree.levels)||!Number.isInteger(index)||index<0||index>=tree.leafCount) throw new RangeError('invalid tree/index');
  let i=index; const siblings=[];
  for(let l=0;l<tree.depth;l++){siblings.push({side:i%2===0?'right':'left',hash:tree.levels[l][i^1]});i=Math.floor(i/2);}
  return {leafIndex:index,leafCount:tree.leafCount,siblings,root:tree.root};
}
export function verifyMerkleProof(value,proof) {
  if(!proof||!Array.isArray(proof.siblings)||!Number.isInteger(proof.leafIndex)) return false;
  let h=sha(Buffer.concat([Buffer.from([0]),Buffer.from(value)])), i=proof.leafIndex;
  for(const s of proof.siblings) {
    if(!/^[a-f0-9]{64}$/i.test(s.hash)) return false;
    const side=i%2===0?'right':'left'; if(s.side!==side)return false;
    const sibling=Buffer.from(s.hash,'hex');
    h=side==='right'?sha(Buffer.concat([Buffer.from([1]),h,sibling])):sha(Buffer.concat([Buffer.from([1]),sibling,h]));
    i=Math.floor(i/2);
  }
  return h.toString('hex')===proof.root;
}
export function sha256dHex(value){return sha2(Buffer.from(value)).toString('hex');}
export function hasLeadingZeroBits(hex,bits) {
  if(!Number.isInteger(bits)||bits<0||bits>256||!/^[a-f0-9]{64}$/i.test(hex)) throw new RangeError('invalid digest/difficulty');
  const n=Math.floor(bits/4),r=bits%4;
  return hex.slice(0,n)==='0'.repeat(n)&&(r===0||(parseInt(hex[n],16)>>>(4-r))===0);
}
export function mineNonce(header,{difficultyBits=8,startNonce=0,maxAttempts=1000000}={}) {
  if(typeof header!=='string'||!Number.isSafeInteger(startNonce)||startNonce<0||!Number.isSafeInteger(maxAttempts)||maxAttempts<1) throw new TypeError('invalid mining parameters');
  for(let k=0;k<maxAttempts;k++){const nonce=startNonce+k,hash=sha2(Buffer.from(header+':'+nonce)).toString('hex');if(hasLeadingZeroBits(hash,difficultyBits))return{found:true,nonce,hash,difficultyBits,attempts:k+1};}
  return{found:false,nonce:null,hash:null,difficultyBits,attempts:maxAttempts};
}
export function verifyWork(header,r) {
  if(!r||!Number.isSafeInteger(r.nonce)||r.nonce<0)return false;
  const hash=sha2(Buffer.from(header+':'+r.nonce)).toString('hex');
  return hash===r.hash&&hasLeadingZeroBits(hash,r.difficultyBits);
}
const exp=new Uint8Array(512),log=new Int16Array(256).fill(-1);
{let x=1;for(let i=0;i<255;i++){exp[i]=x;log[x]=i;x<<=1;if(x&256)x^=0x11d;}for(let i=255;i<512;i++)exp[i]=exp[i-255];}
export const GF256=Object.freeze({
 add:(a,b)=>a^b,
 multiply(a,b){if(![a,b].every(x=>Number.isInteger(x)&&x>=0&&x<=255))throw new RangeError('byte operands required');return a===0||b===0?0:exp[log[a]+log[b]];},
 inverse(a){if(!Number.isInteger(a)||a<1||a>255)throw new RangeError('nonzero field element required');return exp[255-log[a]];},
 power(a,n){if(!Number.isInteger(a)||a<0||a>255||!Number.isInteger(n))throw new RangeError('invalid power');if(n===0)return 1;if(a===0)return 0;return exp[((log[a]*n)%255+255)%255];}
});
const MOD=(1n<<61n)-1n;
const scalar=v=>BigInt('0x'+sha(Buffer.from(String(v))).subarray(0,8).toString('hex'))%MOD;
// Transparent deterministic accumulator only; not a zero-knowledge proof.
export function foldTranscript(previous,witness,index) {
 if(typeof previous!=='bigint'||previous<0n||!Number.isSafeInteger(index)||index<0)throw new TypeError('invalid fold state');
 const encoded=JSON.stringify(witness),challenge=scalar('GAIA-FOLD-v1:'+index+':'+previous+':'+encoded),w=scalar(encoded);
 return(previous+challenge*w)%MOD;
}
export function verifyFoldTranscript(witnesses,claimed) {
 if(!Array.isArray(witnesses)||typeof claimed!=='bigint')return false;
 return witnesses.reduce((s,w,i)=>foldTranscript(s,w,i),0n)===claimed;
}
export function runComputationalSelfTest() {
 const l=buildV5Lattice(5),lattice=l.nodeCount===625&&l.edgeCount===2000&&l.edges.every(([a,b])=>manhattanDistance(l.nodes[a].coordinate,l.nodes[b].coordinate)===1);
 const values=Array.from({length:4096},(_,i)=>'GAIA-LEAF-'+i),tree=buildMerkleTree(values),proof=createMerkleProof(tree,2047);
 const merkle=tree.nodeCount===8191&&tree.depth===12&&verifyMerkleProof(values[2047],proof)&&!verifyMerkleProof('tampered',proof);
 const gf=Array.from({length:255},(_,i)=>i+1).every(a=>GF256.multiply(a,GF256.inverse(a))===1);
 const path=buildManhattanPath([0,0,0,0],[4,4,4,4]),work=mineNonce('GAIA-SELFTEST',{difficultyBits:8,maxAttempts:100000});
 const pow=work.found&&verifyWork('GAIA-SELFTEST',work);
 return {passed:lattice&&merkle&&gf&&path.optimal&&pow,checks:{lattice:{passed:lattice,nodes:l.nodeCount,edges:l.edgeCount},merkle:{passed:merkle,leaves:tree.leafCount,nodes:tree.nodeCount,depth:tree.depth,root:tree.root},gf256:{passed:gf,inversesChecked:255},manhattan:{passed:path.optimal,hops:path.hops,lowerBound:path.lowerBound},proofOfWork:{passed:pow,attempts:work.attempts,difficultyBits:work.difficultyBits,hash:work.hash}}};
}
