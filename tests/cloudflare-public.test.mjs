import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const cfg=JSON.parse(fs.readFileSync(new URL("../wrangler.jsonc",import.meta.url),"utf8"));
test("production serves the real Vite dist instead of a placeholder",()=>{
 assert.equal(cfg.name,"cryptic-polyglot-public");
 assert.equal(cfg.assets.directory,"./dist");
 assert.ok(cfg.assets.run_worker_first.includes("/api/*"));
});
test("the public AI endpoint refuses unconfigured inference",async()=>{
 const {default:handler}=await import("../src/cloudflare-public-worker.mjs");
 const response=await handler.fetch(new Request("https://crypticnews.org/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:'{"prompt":"hello"}'}),{});
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,"AI_NOT_CONFIGURED");
});