"""Source-grounded local inference contracts; model output uses explicit test fixtures."""
import asyncio
import base64
import gzip
import hashlib
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from aiohttp import web
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"bridge"))
import gaia_local_ai as gaia

class GAIALocalAIContracts(unittest.TestCase):
    def test_runtime_ticket_is_scoped_and_bound_to_current_bridge(self):
        tickets=gaia.RuntimeTickets(secret=b"s"*32,lifespan=60)
        value=tickets.issue("session-test-a")
        self.assertTrue(tickets.verify(value,"session-test-a"))
        self.assertFalse(tickets.verify(value,"session-test-b"))
        self.assertFalse(tickets.verify(value[:-1]+"?", "session-test-a"))

    def test_session_ticket_expires_and_cannot_call_external_models(self):
        tickets=gaia.RuntimeTickets(secret=b"e"*32,lifespan=60)
        with patch.object(gaia.time,"time",return_value=100):
            value=tickets.issue("test-session")
        with patch.object(gaia.time,"time",return_value=160):
            self.assertFalse(tickets.verify(value,"test-session"))

    def test_short_output_not_unnecessarily_compressed(self):
        envelope=gaia.compact_seed("hello")
        self.assertEqual(envelope["encoding"],"utf8")
        self.assertEqual(envelope["data"],"hello")

    def test_large_repeat_output_compresses_losslessly(self):
        text="Hamiltonian Memory Fabric "\u002a300
        packed=gaia.compact_seed(text)
        self.assertEqual(packed["encoding"],"gzip+base64")
        restored=gzip.decompress(base64.b64decode(packed["data"])).decode()
        self.assertEqual(restored,text)
        self.assertEqual(packed["sha256"],hashlib.sha256(text.encode()).hexdigest())
        self.assertLess(packed["transport_bytes"],packed["bytes"])

    def test_prompt_size_budget_enforced(self):
        for text in ["","x"*3201]:
            with self.assertRaises(ValueError):gaia.validate_prompt(text)
        with self.assertRaises(ValueError):gaia.validate_prompt("a",max_tokens=100000)
        with self.assertRaises(ValueError):gaia.validate_prompt("a",context="z"*6001)

    def test_host_endpoint_is_literal_loopback(self):
        self.assertEqual(gaia.LOCAL_OLLAMA,"http://127.0.0.1:11434")

    def test_invalid_pdf_fails_before_optional_parser(self):
        with self.assertRaises(ValueError):gaia.extract_pdf_local(b"not-a-pdf")
        with self.assertRaises(ValueError):gaia.extract_pdf_local(b"%PDF-"*2**22)

    def test_real_pymupdf_pdf_generation_and_local_extraction(self):
        import fitz
        source=fitz.open()
        page=source.new_page()
        page.insert_text((72,72),"GAIA LOCAL PDF ENGRAM VERIFIED FIXTURE")
        payload=source.tobytes()
        source.close()
        parsed=gaia.extract_pdf_local(payload)
        self.assertEqual(parsed["source"],"host-local-extraction")
        self.assertFalse(parsed["cloud_uploaded"])
        self.assertEqual(parsed["pages_total"],1)
        self.assertIn("GAIA LOCAL PDF ENGRAM",parsed["pages"][0]["text"])
        self.assertEqual(parsed["sha256"],hashlib.sha256(payload).hexdigest())

    def test_mock_local_ollama_tags_stream_and_completed_seed(self):
        async def scenario():
            async def tags(req):
                return web.json_response({"models":[{"name":"llama3.2:1b"}]})
            async def chat(req):
                request=await req.json()
                self.assertEqual(request["model"],"llama3.2:1b")
                self.assertTrue(request["stream"])
                self.assertLessEqual(request["options"]["num_predict"],256)
                response=web.StreamResponse(status=200,headers={"content-type":"application/x-ndjson"})
                await response.prepare(req)
                for item in [
                    {"model":"llama3.2:1b","message":{"role":"assistant","content":"GAIA "},"done":False},
                    {"model":"llama3.2:1b","message":{"role":"assistant","content":"local fixture"},"done":False},
                    {"model":"llama3.2:1b","message":{"role":"assistant","content":""},"done":True,
                        "eval_count":2,"prompt_eval_count":5}
                ]:
                    await response.write((json.dumps(item)+"\n").encode())
                await response.write_eof()
                return response
            app=web.Application()
            app.router.add_get("/api/tags",tags)
            app.router.add_post("/api/chat",chat)
            runner=web.AppRunner(app)
            await runner.setup()
            site=web.TCPSite(runner,"127.0.0.1",0)
            await site.start()
            port=site._server.sockets[0].getsockname()[1]
            try:
                with patch.object(gaia,"LOCAL_OLLAMA","http://127.0.0.1:"+str(port)):
                    state=await gaia.ollama_status()
                    self.assertTrue(state["reachable"])
                    self.assertTrue(state["model_available"])
                    frames=[f async for f in gaia.ollama_stream("question")]
                    self.assertEqual([f["type"] for f in frames],["delta","delta","done"])
                    self.assertEqual("".join(f.get("text","") for f in frames),"GAIA local fixture")
                    seed=await gaia.ollama_seed("question")
                    self.assertEqual(seed["source"],"real-local-ollama")
                    self.assertEqual(seed["transport"]["data"],"GAIA local fixture")
                    self.assertEqual(seed["eval_count"],2)
            finally:await runner.cleanup()
        asyncio.run(scenario())

    def test_missing_ollama_fails_without_synthetic_response(self):
        async def scenario():
            with patch.object(gaia,"LOCAL_OLLAMA","http://127.0.0.1:1"):
                state=await gaia.ollama_status()
                self.assertFalse(state["reachable"])
                with self.assertRaises(gaia.RuntimeUnavailable):
                    await gaia.ollama_seed("Is anyone there?")
        asyncio.run(scenario())

if __name__=="__main__":
    unittest.main()
