const BASE = Object.freeze([[0, 1, 0, -1], [1, 0, -1, 0]]);
export const QC_LDPC_PROFILE = Object.freeze({z:3,baseMatrix:BASE,n:12,k:6,m:6,rate:0.5,normalization:0.8,maxIterations:30});
export function expandQcLdpc(profile=QC_LDPC_PROFILE) {
 const {z,baseMatrix}=profile, rows=baseMatrix.length*z, cols=baseMatrix[0].length*z;
 const H=Array.from({length:rows},()=>new Uint8Array(cols));
 for(let br=0;br<baseMatrix.length;br++)for(let bc=0;bc<baseMatrix[br].length;bc++){
  const shift=baseMatrix[br][bc];if(shift<0)continue;
  for(let r=0;r<z;r++)H[br*z+r][bc*z+(r+shift)%z]=1;
 }
 return H;
}
export function gf2Rank(matrix) {
 const a=matrix.map(row=>Uint8Array.from(row)), rows=a.length,cols=a[0]?.length||0;let rank=0;
 for(let c=0;c<cols&&rank<rows;c++){let pivot=rank;while(pivot<rows&&!a[pivot][c])pivot++;if(pivot===rows)continue;
  [a[rank],a[pivot]]=[a[pivot],a[rank]];
  for(let r=0;r<rows;r++)if(r!==rank&&a[r][c])for(let j=c;j<cols;j++)a[r][j]^=a[rank][j];
  rank++;
 }
 return rank;
}
export function encodeQcLdpc(message,profile=QC_LDPC_PROFILE) {
 if(!Array.isArray(message)&&!(message instanceof Uint8Array))throw new TypeError('message bits required');
 if(message.length!==profile.k||Array.from(message).some(b=>b!==0&&b!==1))throw new RangeError('message must contain k binary bits');
 const H=expandQcLdpc(profile);
 const output=new Uint8Array(profile.n);output.set(message);
 for(let r=0;r<profile.m;r++){let parity=0;for(let c=0;c<profile.k;c++)parity^=H[r][c]&message[c];output[profile.k+r]=parity;}
 return output;
}
export function qcSyndrome(word,profile=QC_LDPC_PROFILE) {
 if(word.length!==profile.n)throw new RangeError('codeword length mismatch');
 const H=expandQcLdpc(profile);
 return H.map(row=>{let s=0;for(let c=0;c<profile.n;c++)s^=row[c]&word[c];return s;});
}
export function decodeNormalizedMinSum(llr,{profile=QC_LDPC_PROFILE,maxIterations=profile.maxIterations,alpha=profile.normalization}={}) {
 if(!Array.isArray(llr)&&!(llr instanceof Float32Array)&&!(llr instanceof Float64Array))throw new TypeError('LLR array required');
 if(llr.length!==profile.n||Array.from(llr).some(x=>!Number.isFinite(x)))throw new RangeError('invalid LLR vector');
 const H=expandQcLdpc(profile),checks=H.map(row=>Array.from(row.keys()).filter(c=>row[c]));
 const variables=Array.from({length:profile.n},(_,v)=>checks.map((edges,i)=>edges.includes(v)?i:-1).filter(i=>i>=0));
 const q=checks.map(edges=>edges.map(v=>llr[v])),r=checks.map(edges=>edges.map(()=>0));
 let hard=new Uint8Array(profile.n),syndrome=[];
 for(let iteration=1;iteration<=maxIterations;iteration++){
  for(let ci=0;ci<checks.length;ci++)for(let j=0;j<checks[ci].length;j++){
   let sign=1,min=Infinity;
   for(let k=0;k<checks[ci].length;k++)if(k!==j){const x=q[ci][k];if(x<0)sign=-sign;min=Math.min(min,Math.abs(x));}
   r[ci][j]=alpha*sign*(min===Infinity?0:min);
  }
  const posterior=Array.from(llr);
  for(let ci=0;ci<checks.length;ci++)for(let j=0;j<checks[ci].length;j++)posterior[checks[ci][j]]+=r[ci][j];
  hard=Uint8Array.from(posterior,x=>x<0?1:0);syndrome=qcSyndrome(hard,profile);
  if(syndrome.every(x=>x===0))return{converged:true,iterations:iteration,codeword:Array.from(hard),syndrome};
  for(let ci=0;ci<checks.length;ci++)for(let j=0;j<checks[ci].length;j++)q[ci][j]=posterior[checks[ci][j]]-r[ci][j];
 }
 return{converged:false,iterations:maxIterations,codeword:Array.from(hard),syndrome};
}
export function qcLdpcSelfTest() {
 const H=expandQcLdpc(),rank=gf2Rank(H),message=[1,0,1,1,0,1],word=encodeQcLdpc(message),syndrome=qcSyndrome(word);
 const llr=Array.from(word,b=>b? -6:6);llr[2]=word[2]?0.35:-0.35;
 const decoded=decodeNormalizedMinSum(llr);
 return{passed:rank===6&&syndrome.every(x=>x===0)&&decoded.converged&&decoded.codeword.every((b,i)=>b===word[i]),profile:{z:3,rows:H.length,columns:H[0].length,rank},syndrome:Array.from(syndrome),decoded};
}
