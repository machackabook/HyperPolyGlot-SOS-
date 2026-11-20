import {buildV5Lattice,buildManhattanPath,buildMerkleTree,createMerkleProof,verifyMerkleProof,mineNonce,verifyWork,runComputationalSelfTest} from './gaiaComputeCore.mjs';
import {encodeQcLdpc,qcSyndrome,decodeNormalizedMinSum,qcLdpcSelfTest} from './qcLdpc.mjs';

export const GAIA_COMPUTE_DECLARATION = Object.freeze({
 name:'gaia_compute',
 description:'Run a bounded, deterministic GAIA/NEXUS computational operation. Use only for explicit mathematical or computational requests. Report returned results accurately.',
 parametersJsonSchema:{
  type:'object',
  properties:{
   operation:{type:'string',enum:['self_test','lattice_summary','manhattan_path','merkle_proof','proof_of_work','qc_ldpc_self_test','qc_ldpc_encode','qc_ldpc_decode']},
   start:{type:'array',items:{type:'integer'},minItems:4,maxItems:4},
   end:{type:'array',items:{type:'integer'},minItems:4,maxItems:4},
   leaves:{type:'array',items:{type:'string'},minItems:1,maxItems:4096},
   index:{type:'integer',minimum:0},
   header:{type:'string',maxLength:4096},
   difficultyBits:{type:'integer',minimum:0,maximum:20},
   startNonce:{type:'integer',minimum:0},
   maxAttempts:{type:'integer',minimum:1,maximum:1000000},
   message:{type:'array',items:{type:'integer',minimum:0,maximum:1},minItems:6,maxItems:6},
   llr:{type:'array',items:{type:'number'},minItems:12,maxItems:12}
  },
  required:['operation']
 }
});

export function executeGaiaCompute(args={}) {
 const op=args.operation;
 switch(op) {
  case 'self_test': return runComputationalSelfTest();
  case 'lattice_summary': {
   const l=buildV5Lattice(5);
   return {dimension:4,side:5,nodeCount:l.nodeCount,edgeCount:l.edgeCount,edgeLengthInvariant:'L1 distance is exactly 1'};
  }
  case 'manhattan_path': return buildManhattanPath(args.start,args.end);
  case 'merkle_proof': {
   if(!Array.isArray(args.leaves)||args.leaves.length>4096||!Number.isInteger(args.index))throw new RangeError('provide at most 4,096 leaves and a valid index');
   const tree=buildMerkleTree(args.leaves),proof=createMerkleProof(tree,args.index);
   return {leafCount:tree.leafCount,nodeCount:tree.nodeCount,depth:tree.depth,root:tree.root,proof,verified:verifyMerkleProof(args.leaves[args.index],proof)};
  }
  case 'proof_of_work': {
   if(typeof args.header!=='string'||args.header.length>4096)throw new TypeError('header must be a string of at most 4,096 characters');
   const result=mineNonce(args.header,{difficultyBits:args.difficultyBits??8,startNonce:args.startNonce??0,maxAttempts:args.maxAttempts??100000});
   return {...result,independentlyVerified:result.found&&verifyWork(args.header,result)};
  }
  case 'qc_ldpc_self_test': return qcLdpcSelfTest();
  case 'qc_ldpc_encode': {
   const codeword=encodeQcLdpc(args.message);
   return {codeword:Array.from(codeword),syndrome:Array.from(qcSyndrome(codeword)),valid:true};
  }
  case 'qc_ldpc_decode': return decodeNormalizedMinSum(args.llr);
  default: throw new RangeError('unsupported GAIA compute operation');
 }
}
