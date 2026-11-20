import test from 'node:test';
import assert from 'node:assert/strict';
import {QC_LDPC_PROFILE,expandQcLdpc,gf2Rank,encodeQcLdpc,qcSyndrome,decodeNormalizedMinSum,qcLdpcSelfTest} from '../src/computational/qcLdpc.mjs';
test('QC-LDPC Z=3 expansion produces H 6x12 with full row rank',()=>{const H=expandQcLdpc();assert.equal(H.length,6);assert.equal(H[0].length,12);assert.equal(gf2Rank(H),6);});
test('systematic encoder always produces zero syndrome',()=>{for(let i=0;i<64;i++){const m=Array.from({length:6},(_,b)=>(i>>b)&1),c=encodeQcLdpc(m);assert.deepEqual(qcSyndrome(c),[0,0,0,0,0,0]);}});
test('normalized min-sum recovers one deliberately uncertain bit',()=>{const m=[1,0,1,1,0,1],c=encodeQcLdpc(m),llr=Array.from(c,b=>b?-6:6);llr[2]=c[2]?0.35:-0.35;const d=decodeNormalizedMinSum(llr);assert.equal(d.converged,true);assert.deepEqual(d.codeword,Array.from(c));});
test('QC-LDPC integrated self-test passes',()=>assert.equal(qcLdpcSelfTest().passed,true));
