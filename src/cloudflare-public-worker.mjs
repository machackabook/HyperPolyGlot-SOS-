import crossvoid from '../cloudflare/crossvoid-worker.mjs';
// Production adapter for the real AI Studio React/Vite bundle in dist/.
// No provider key is present in source code; no simulated AI/network/device replies.
const HEADERS={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const error=(name,status)=>json({error:name},status);
async function verifyChallenge(token,secret,request){
 if(typeof token!=="string"||token.length<6||token.length>2048)return false;
 const form=new FormData();form.set("secret",secret);form.set("response",token);
 const ip=request.headers.get("CF-Connecting-IP");if(ip)form.set("remoteip",ip);
 const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:form,signal:AbortSignal.timeout(7000)});
 if(!r.ok)return false;return (await r.json()).success===true;
}
async function chat(request,env) {
 // Explicit operator opt-in plus secrets and anti-abuse protection are mandatory.
 if(env.AI_PUBLIC_ENABLED!=="true"||!env.GEMINI_API_KEY||!env.GEMINI_MODEL||!env.TURNSTILE_SECRET_KEY)
   return json({error:"AI_NOT_CONFIGURED",message:"AI inference is not enabled for public visitors."},503);
 if(request.headers.get("Content-Type")?.split(";")[0].trim()!=="application/json")return error("INVALID_CONTENT_TYPE",415);
 if(Number(request.headers.get("Content-Length")||0)>65536)return error("PAYLOAD_TOO_LARGE",413);
 let data;try{const raw=await request.text();if(raw.length>65536)return error("PAYLOAD_TOO_LARGE",413);data=JSON.parse(raw)}catch{return error("INVALID_JSON",400)}
 if(typeof data.prompt!=="string"||data.prompt.length<1||data.prompt.length>4000)return error("INVALID_PROMPT",400);
 let verified=false;
 try{verified=await verifyChallenge(request.headers.get("cf-turnstile-response")||data.turnstileToken,env.TURNSTILE_SECRET_KEY,request)}catch{}
 if(!verified)return json({error:"TURNSTILE_REQUIRED",message:"Fresh human verification is needed before AI inference."},403);
 const allowed=["torus","tesseract","singularity","neural","galaxy","spindle","dna","galaxy_vfs","robotics_lab","protein_fold","earth_nasa"];
 const history=Array.isArray(data.conversationHistory)?data.conversationHistory.slice(-6).filter(x=>x&&(x.role==="model"||x.role==="user")&&typeof x.text==="string").map(x=>({role:x.role,parts:[{text:x.text.slice(0,1800)}]})):[];
 let response;
 try{response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(env.GEMINI_MODEL)+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:"You are the HyperTerminal Polyglot Quine OS assistant. Give precise, evidence-based answers. Never invent live telemetry or completed actions. Return JSON fields reply, speechText, topology, sentiment, primaryColor, secondaryColor."}]},contents:[...history,{role:"user",parts:[{text:data.prompt}]}],generationConfig:{responseMimeType:"application/json"}}),signal:AbortSignal.timeout(20000)})}catch{return error("AI_PROVIDER_UNREACHABLE",502)}
 if(!response.ok)return json({error:"AI_PROVIDER_FAILED",provider_status:response.status},502);
 let result;try{const d=await response.json();result=JSON.parse((d.candidates?.[0]?.content?.parts||[]).map(x=>x.text||"").join(""));if(typeof result.reply!=="string"||!result.reply)throw Error("missing reply");}catch{return error("AI_INVALID_RESPONSE",502)}
 const color=(v,f)=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v)?v:f;
 return json({source:"gemini",model:env.GEMINI_MODEL,reply:result.reply.slice(0,8000),speechText:String(result.speechText||result.reply).slice(0,450),topology:allowed.includes(result.topology)?result.topology:"torus",sentiment:["analytical","energetic","alarm","tranquil","cosmic","chaos","creative"].includes(result.sentiment)?result.sentiment:"analytical",primaryColor:color(result.primaryColor,"#00f2ff"),secondaryColor:color(result.secondaryColor,"#a855f7")});
}
export default {
 async fetch(request,env){
  const p=new URL(request.url).pathname;
  // Cryptic News is the single public routing authority. CrossVoid and opted-in
  // telemetry share this hostname; privileged actions remain Cloudflare Access gated.
  if(p==="/api/portal/event"||p.startsWith("/api/crossvoid/")||p.startsWith("/crossvoid/go/")){
    const issuer=String(env.ACCESS_ISSUER||"").trim();
    const team=issuer.startsWith("https://")?new URL(issuer).hostname:"";
    const scope={...env,CF_ACCESS_AUD:env.CF_ACCESS_AUD||env.ACCESS_AUD,
      CF_ACCESS_TEAM_DOMAIN:env.CF_ACCESS_TEAM_DOMAIN||team,
      CF_OPERATOR_EMAIL:env.CF_OPERATOR_EMAIL||env.OWNER_EMAIL};
    return crossvoid.fetch(request,scope);
  }
  if(p==="/api/status"&&request.method==="GET")return json({
    service:"cryptic-polyglot-public",frontend:"real-ai-studio-vite-dist",
    static_assets_configured:!!env.ASSETS,
    journey_db_configured:!!env.EVENT_DB,
    ai_enabled:env.AI_PUBLIC_ENABLED==="true"&&!!(env.GEMINI_API_KEY&&env.GEMINI_MODEL&&env.TURNSTILE_SECRET_KEY)
  });
  if(p==="/api/chat")return request.method==="POST"?chat(request,env):error("METHOD_NOT_ALLOWED",405);
  if(p.startsWith("/api/"))return error("NOT_FOUND",404);
  if(!env.ASSETS||typeof env.ASSETS.fetch!=="function")
    return json({error:"STATIC_ASSETS_NOT_CONFIGURED",message:"Deploy the actual Vite dist/ as Worker static assets."},503);
  return env.ASSETS.fetch(request);
 }
};