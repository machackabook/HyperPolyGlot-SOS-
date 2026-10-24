#!/usr/bin/env python3
"""HyperTerminal Polyglot Quine OS local read-only, paired bridge (aiohttp)."""
import argparse, asyncio, hmac, json, os, platform, secrets, time, shutil
from gaia_gh_mounts import list_mounts, link_website, clone_repo
from xai_card_store import XaiCardStore, ProviderUnavailable
from datetime import datetime, timezone
from aiohttp import ClientSession, ClientTimeout, web

ORIGINS=frozenset({
 'https://crypticnews.org','https://machackabook.github.io',
 'https://gaia-nexus-memory-bridge.machackabook.chatgpt.site',
 'https://cryptic-polyglot-public.saytyarnornglorei.workers.dev',
 'http://127.0.0.1:3000','http://localhost:3000',
 'http://127.0.0.1:5173','http://localhost:5173',
 'http://127.0.0.1:8791','http://localhost:8791'
})
def check_token(t):
 if not isinstance(t,str) or not 32<=len(t)<=256 or not all(c.isalnum() or c in '_-' for c in t):
  raise ValueError('Need a 32-256 character high-entropy URL-safe pairing token')
 return t
def create_app(token,scribe_port=8787):
 token=check_token(token)
 if not 1<=scribe_port<=65535:raise ValueError('Invalid Scribe port')
 started=time.monotonic();session=secrets.token_hex(8)
 @web.middleware
 async def protect(req,handler):
  if req.host.split(':')[0].lower() not in ('localhost','127.0.0.1'):
   raise web.HTTPForbidden(text='Loopback Host required')
  origin=req.headers.get('Origin')
  if origin is not None and origin not in ORIGINS:
   raise web.HTTPForbidden(text='Origin not approved')
  if req.method=='OPTIONS':
   if origin is None:raise web.HTTPForbidden(text='Preflight origin required')
   response=web.Response(status=204)
  else:
   auth=req.headers.get('Authorization','')
   accepted=auth.startswith('Bearer ') and hmac.compare_digest(auth[7:],token)
   if req.path=='/v1/ws':
    protos=[x.strip() for x in req.headers.get('Sec-WebSocket-Protocol','').split(',')]
    accepted=any(hmac.compare_digest(p,'auth.'+token) for p in protos)
   if not accepted:raise web.HTTPUnauthorized(text='Pairing required')
   response=await handler(req)
  if origin:
   response.headers.update({
    'Access-Control-Allow-Origin':origin,
    'Access-Control-Allow-Headers':'Authorization, Content-Type',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Private-Network':'true','Vary':'Origin'})
  response.headers['Cache-Control']='no-store'
  response.headers['X-Content-Type-Options']='nosniff'
  return response
 app=web.Application(middlewares=[protect],client_max_size=4096)
 xai_cards=XaiCardStore()
 def status_data():
  return {'protocol':'quine-mesh-v1','status':'attached-localhost','source':'python-process-observed',
   'node_session':session,'os':platform.system(),'python':platform.python_version(),
   'process_id':os.getpid(),'uptime_seconds':round(time.monotonic()-started,3),
   'observed_at':datetime.now(timezone.utc).isoformat(),
   'capabilities':['local-status','ws-ping','scribe-local-status','scribe-local-search','mount-status','mount-gh-clone','mount-web-link','xai-card-status','xai-card-chat','xai-card-history'],
   'remote_execution':False,'device_control':False,'privileged_authority':False,
   'gh_installed':bool(shutil.which('gh')),
   'capability_authorization':'paired-localhost-user-command-only'}
 async def status(req):return web.json_response(status_data())
 async def scribe_request(endpoint,params=None):
  try:
   async with ClientSession(timeout=ClientTimeout(total=2.5)) as client:
    async with client.get('http://127.0.0.1:'+str(scribe_port)+endpoint,params=params) as r:
     if r.status!=200:raise web.HTTPBadGateway(text='Scribe response unavailable')
     return await r.json(content_type='application/json')
  except (OSError,asyncio.TimeoutError):
   raise web.HTTPServiceUnavailable(text='Scribe not connected on loopback')
 async def scribe_status(req):
  data=await scribe_request('/api/status')
  return web.json_response({'source':'local-nexus-scribe-v4',
   'status':data.get('status'),'scope':data.get('scope'),'version':data.get('version'),
   'counts':data.get('counts'),'ai_transcription':data.get('ai_transcription')})
 async def scribe_search(req):
  q=req.query.get('q','')
  if not 1<=len(q)<=256:raise web.HTTPBadRequest(text='Query length 1-256 required')
  try:n=int(req.query.get('limit','5'))
  except ValueError:raise web.HTTPBadRequest(text='Invalid limit')
  if not 1<=n<=8:raise web.HTTPBadRequest(text='Limit must be 1-8')
  d=await scribe_request('/api/search',params={'q':q,'limit':n})
  return web.json_response({'source':'local-nexus-scribe-v4',
    'mode':d.get('mode','local_retrieval'),'query':d.get('query'),'results':d.get('results',[])})
 async def mount_list(req):
  try: return web.json_response({'source':'local-native-filesystem','mounts':await list_mounts()})
  except (OSError,ValueError,TypeError): raise web.HTTPServiceUnavailable(text='Local mount registry unavailable')
 async def mount_clone(req):
  try:
   d=await req.json()
   if not isinstance(d,dict) or set(d)-{'mount','repository'}:
    raise ValueError('Only mount and repository are accepted')
   result=await clone_repo(d.get('mount'),d.get('repository'))
   return web.json_response(result)
  except (ValueError,TypeError): raise web.HTTPBadRequest(text='Invalid mount or repository')
  except (OSError,RuntimeError): raise web.HTTPServiceUnavailable(text='gh clone unavailable on this authenticated host; check gh auth status')
 async def mount_link(req):
  try:
   d=await req.json()
   if not isinstance(d,dict) or set(d)-{'mount','url'}:
    raise ValueError('Only mount and url are accepted')
   return web.json_response(await link_website(d.get('mount'),d.get('url')))
  except (ValueError,TypeError): raise web.HTTPBadRequest(text='Invalid mount or HTTPS link')
  except (OSError,RuntimeError): raise web.HTTPServiceUnavailable(text='Local mount registry unavailable')
 async def xai_status(req):
  return web.json_response(xai_cards.status())
 async def xai_history(req):
  session_id=req.query.get('sessionId','')
  try:
   limit=int(req.query.get('limit','40'))
   rows=xai_cards.history(session_id,limit)
  except (ValueError,TypeError):
   raise web.HTTPBadRequest(text='Invalid session or history limit')
  return web.json_response({'sessionId':session_id,'messages':rows,
                            'source':'host-private-sqlite'})
 async def xai_chat(req):
  try:
   data=await req.json()
   if not isinstance(data,dict) or set(data)-{'message','videoId','sessionId'}:
    raise ValueError('Unexpected fields')
   result=await asyncio.to_thread(xai_cards.chat,
     data.get('message'),data.get('videoId'),data.get('sessionId'))
   return web.json_response(result)
  except (ValueError,TypeError):
   raise web.HTTPBadRequest(text='Invalid X card prompt, video or session')
  except ProviderUnavailable:
   raise web.HTTPServiceUnavailable(text='xAI SDK/model is not configured or unavailable on this host')
  except Exception:
   # Never print or return exception details from the provider: may contain keys.
   raise web.HTTPBadGateway(text='Real xAI provider request failed')

 async def ws_handler(req):
  ws=web.WebSocketResponse(protocols=('quine-mesh-v1',),max_msg_size=2048,heartbeat=30)
  await ws.prepare(req);await ws.send_json({'type':'attached','status':status_data()})
  async for msg in ws:
   if msg.type!=web.WSMsgType.TEXT:continue
   try:d=json.loads(msg.data)
   except (ValueError,TypeError):
    await ws.send_json({'type':'error','reason':'Invalid JSON'});continue
   if not isinstance(d,dict) or d.get('type') not in ('ping','status'):
    await ws.send_json({'type':'error','reason':'Unsupported read-only message'})
   elif d['type']=='status':
    await ws.send_json({'type':'attached','status':status_data()})
   else:
    i=d.get('id')
    if not isinstance(i,str) or len(i)>64:
     await ws.send_json({'type':'error','reason':'Invalid ping id'})
    else:
     await ws.send_json({'type':'pong','id':i,
      'received_at':datetime.now(timezone.utc).isoformat()})
  return ws
 app.router.add_get('/v1/status',status)
 app.router.add_get('/v1/scribe/status',scribe_status)
 app.router.add_get('/v1/scribe/search',scribe_search)
 app.router.add_get('/v1/xai/card/status',xai_status)
 app.router.add_get('/v1/xai/card/history',xai_history)
 app.router.add_post('/v1/xai/card/chat',xai_chat)
 app.router.add_get('/v1/mounts',mount_list)
 app.router.add_post('/v1/mounts/clone',mount_clone)
 app.router.add_post('/v1/mounts/link',mount_link)
 app.router.add_get('/v1/ws',ws_handler)
 return app
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--port',type=int,default=8791)
 p.add_argument('--scribe-port',type=int,default=8787)
 a=p.parse_args()
 if not 1<=a.port<=65535:p.error('Invalid port')
 t=os.environ.get('NEXUS_QUINE_BRIDGE_TOKEN')
 if not t:
  t=secrets.token_urlsafe(32)
  print('Pairing token (enter in the Quine pair prompt only):',t,flush=True)
 try:check_token(t)
 except ValueError as e:p.error(str(e))
 print('Quine OS localhost adapter: http://127.0.0.1:'+str(a.port),flush=True)
 print('Read-only foreground process; Ctrl+C to stop.',flush=True)
 web.run_app(create_app(t,a.scribe_port),host='127.0.0.1',port=a.port,access_log=None,print=None)
if __name__=='__main__':main()
