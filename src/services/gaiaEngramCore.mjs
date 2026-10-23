/**
 * GAIA Memory Fabric — source-grounded engram core.
 * Receives only authorized source records from Herald/Scribe adapters.
 * No source discovery, credentials, networking, invented memories, or privilege escalation.
 */
const ID=/^[A-Za-z0-9_.:/-]{1,192}$/;
const HASH=/^[a-f0-9]{64}$/i;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function words(text){return (text.toLowerCase().match(/[\p{L}\p{N}_-]{2,}/gu)||[]).slice(0,128);}
function safeId(id){if(typeof id!=='string'||!ID.test(id))throw new TypeError('Invalid source identity');return id;}
function sourceRecord(input){
  if(!input||typeof input!=='object')throw new TypeError('Engram source required');
  const sourceId=safeId(input.sourceId);
  if(typeof input.title!=='string'||!input.title.trim()||input.title.length>200)throw new TypeError('Invalid title');
  if(typeof input.content!=='string'||!input.content.trim()||input.content.length>262144)throw new TypeError('Invalid content');
  if(typeof input.contentHash!=='string'||!HASH.test(input.contentHash))throw new TypeError('Source SHA-256 required');
  if(typeof input.sourceRef!=='string'||!input.sourceRef.trim()||input.sourceRef.length>1024)throw new TypeError('Provenance reference required');
  if(typeof input.observedAt!=='string'||!Number.isFinite(Date.parse(input.observedAt)))throw new TypeError('Observed timestamp required');
  if(input.visibility!==undefined&&!['private','team','public'].includes(input.visibility))throw new TypeError('Unknown visibility');
  const refs=input.references===undefined?[]:input.references;
  if(!Array.isArray(refs)||refs.length>128)throw new TypeError('Invalid reference set');
  const references=[...new Set(refs.map(safeId))];
  return {sourceId,title:input.title.trim(),content:input.content,contentHash:input.contentHash.toLowerCase(),
    sourceRef:input.sourceRef,observedAt:new Date(input.observedAt).toISOString(),
    visibility:input.visibility||'private',references,verified:input.verified===true};
}
export function createEngramFabric({maxRecords=25000,allowedSources=null}={}){
  if(!Number.isSafeInteger(maxRecords)||maxRecords<1||maxRecords>250000)throw new RangeError('Record budget');
  if(allowedSources!==null&&(!Array.isArray(allowedSources)||!allowedSources.every(x=>typeof x==='string'&&x.length>0)))
    throw new TypeError('Source allowlist');
  const permitted=allowedSources===null?null:new Set(allowedSources);
  const records=new Map(),versions=new Map(),recalled=new Map();
  let ingestCount=0,duplicates=0;
  return {
    ingest(input){
      const r=sourceRecord(input);
      if(permitted&&!permitted.has(r.sourceId.split(':')[0]))throw new Error('Source adapter not authorized');
      const old=records.get(r.sourceId);
      if(old?.contentHash===r.contentHash){duplicates++;return {status:'unchanged',sourceId:r.sourceId,version:versions.get(r.sourceId)}}
      if(!old&&records.size>=maxRecords)throw new RangeError('Memory capacity exceeded');
      const version=(versions.get(r.sourceId)||0)+1;
      records.set(r.sourceId,Object.freeze({...r,version}));
      versions.set(r.sourceId,version);ingestCount++;
      return {status:old?'updated':'inserted',sourceId:r.sourceId,version};
    },
    recall(query,{limit=5,visibility='private',sourcePrefix=null}={}){
      if(typeof query!=='string'||!query.trim()||query.length>512)throw new TypeError('Query length 1-512');
      if(!Number.isSafeInteger(limit)||limit<1||limit>25)throw new RangeError('Recall limit');
      if(!['private','team','public'].includes(visibility))throw new TypeError('Visibility');
      const q=[...new Set(words(query))].slice(0,24);
      if(!q.length)return [];
      const allowed=visibility==='private'?new Set(['private','team','public']):visibility==='team'?new Set(['team','public']):new Set(['public']);
      const matches=[];
      for(const e of records.values()){
        if(!allowed.has(e.visibility)||(sourcePrefix&&!e.sourceId.startsWith(sourcePrefix)))continue;
        const title=e.title.toLowerCase(),body=e.content.toLowerCase();
        let score=0,found=0;
        for(const token of q){
          if(title.includes(token)){score+=5;found++}
          else if(body.includes(token)){score+=1;found++}
        }
        if(!score)continue;
        score+=(found/q.length)*2;
        if(e.verified)score+=0.25;
        // Learned reuse influences *ranking*, never converts a claim into verified evidence.
        score+=Math.min(1.0,(recalled.get(e.sourceId)||0)*0.02);
        matches.push({...e,score,bodyPreview:e.content.slice(0,500)});
      }
      matches.sort((a,b)=>b.score-a.score||b.observedAt.localeCompare(a.observedAt)||a.sourceId.localeCompare(b.sourceId));
      return matches.slice(0,limit).map(e=>({sourceId:e.sourceId,title:e.title,sourceRef:e.sourceRef,
        contentHash:e.contentHash,observedAt:e.observedAt,visibility:e.visibility,
        verified:e.verified,version:e.version,score:e.score,
        excerpt:e.bodyPreview,references:[...e.references]}));
    },
    noteUse(sourceId){
      safeId(sourceId);if(!records.has(sourceId))throw new Error('Unrecognized engram');
      recalled.set(sourceId,Math.min(1000,(recalled.get(sourceId)||0)+1));
    },
    get(sourceId){
      safeId(sourceId);const e=records.get(sourceId);return e?{...e,references:[...e.references]}:null;
    },
    exportRecords(){return [...records.values()].map(e=>({...e,references:[...e.references]}));},
    graph({limit=256}={}){
      if(!Number.isSafeInteger(limit)||limit<1||limit>4096)throw new RangeError('Graph limit');
      const edges=[];
      for(const rec of records.values()){
        for(const reference of rec.references){
          if(!records.has(reference))continue;
          edges.push({a:rec.sourceId,b:'references',c:reference});
          if(edges.length>=limit)return edges;
        }
      }
      return edges;
    },
    status(){return {records:records.size,ingestedRevisions:ingestCount,duplicates,
      linkedRelations:this.graph({limit:4096}).length,storage:'external-persistence-required',
      provenance:'source-file-sha256',verifiedOnlyBySource:false};}
  };
}
