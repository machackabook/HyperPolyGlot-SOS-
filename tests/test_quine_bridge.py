import importlib.util, pathlib, unittest
from aiohttp.test_utils import TestClient,TestServer
SRC=pathlib.Path(__file__).resolve().parents[1]/'bridge'/'quine_local_bridge.py'
spec=importlib.util.spec_from_file_location('quine_bridge',SRC)
bridge=importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
TOKEN='trusted_quine_pairing_token_32_byte_min_test_case'
class BridgeTests(unittest.IsolatedAsyncioTestCase):
 async def asyncSetUp(self):
  self.srv=TestServer(bridge.create_app(TOKEN,scribe_port=64991))
  await self.srv.start_server()
  self.client=TestClient(self.srv)
  await self.client.start_server()
 async def asyncTearDown(self):
  await self.client.close();await self.srv.close()
 async def test_missing_token(self):
  r=await self.client.get('/v1/status')
  self.assertEqual(r.status,401)
 async def test_authenticated_real_process(self):
  r=await self.client.get('/v1/status',headers={'Authorization':'Bearer '+TOKEN})
  self.assertEqual(r.status,200);d=await r.json()
  self.assertEqual(d['source'],'python-process-observed')
  self.assertGreater(d['process_id'],0)
  self.assertEqual(d['remote_execution'],False)
  self.assertGreaterEqual(d['uptime_seconds'],0)
 async def test_cross_origin_preflight(self):
  r=await self.client.options('/v1/status',headers={'Origin':'https://crypticnews.org','Access-Control-Request-Private-Network':'true'})
  self.assertEqual(r.status,204)
  self.assertEqual(r.headers['Access-Control-Allow-Private-Network'],'true')
 async def test_foreign_origin(self):
  r=await self.client.get('/v1/status',headers={'Authorization':'Bearer '+TOKEN,'Origin':'https://evil.example'})
  self.assertEqual(r.status,403)
 async def test_host_rebinding(self):
  r=await self.client.get('/v1/status',headers={'Authorization':'Bearer '+TOKEN,'Host':'evil.example'})
  self.assertEqual(r.status,403)
 async def test_ws_requires_auth_and_handles_ping(self):
  with self.assertRaises(Exception):
   await self.client.ws_connect('/v1/ws',protocols=['quine-mesh-v1'])
  ws=await self.client.ws_connect('/v1/ws',protocols=['quine-mesh-v1','auth.'+TOKEN])
  self.assertEqual((await ws.receive_json())['type'],'attached')
  await ws.send_json({'type':'ping','id':'probe42'})
  self.assertEqual((await ws.receive_json())['id'],'probe42')
  await ws.send_json({'type':'execute','cmd':'whoami'})
  self.assertEqual((await ws.receive_json())['type'],'error')
  await ws.close()
 async def test_scribe_unavailable(self):
  r=await self.client.get('/v1/scribe/status',headers={'Authorization':'Bearer '+TOKEN})
  self.assertEqual(r.status,503)
 async def test_no_remote_execute_endpoint(self):
  r=await self.client.post('/v1/exec',headers={'Authorization':'Bearer '+TOKEN},json={'cmd':'whoami'})
  self.assertEqual(r.status,404)
 def test_invalid_secret(self):
  with self.assertRaises(ValueError):bridge.check_token('bad')
if __name__=='__main__':unittest.main()
