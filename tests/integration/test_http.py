"""HTTP-level regression tests for the refactored Agent API handlers."""
from __future__ import annotations

import json
import sys
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import server  # noqa: E402
from tests.fixtures import make_bible, make_nodes  # noqa: E402


class HandlerIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bible = make_bible()
        cls.nodes = make_nodes(cls.bible)
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = "http://127.0.0.1:" + str(cls.httpd.server_address[1])

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=5)

    def post(self, path, payload):
        request = urllib.request.Request(
            self.base + path,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def fake_llm(self, system_prompt, *args, **kwargs):
        text = json.dumps(self.bible if system_prompt == server.SYSTEM_ARCHITECT else self.nodes, ensure_ascii=False)
        return {"text": text, "usage": {"total_tokens": 1}, "model": "mock", "latencyMs": 1}

    def test_health_endpoint(self):
        with urllib.request.urlopen(self.base + "/api/health", timeout=10) as response:
            body = json.loads(response.read().decode("utf-8"))
        self.assertEqual(response.status, 200)
        self.assertTrue(body["ok"])
        self.assertIn("ai", body)

    def test_architect_and_write_routes(self):
        payload = {
            "background": "测试背景足够长，用于验证 HTTP 路由。",
            "genreLabel": "悬疑",
            "tone": "克制",
            "length": "short",
            "endingCount": 3,
            "statsEnabled": True,
        }
        with mock.patch.object(server, "call_llm", side_effect=self.fake_llm):
            status, architect = self.post("/api/agent/architect", payload)
            self.assertEqual(status, 200)
            self.assertTrue(architect["ok"])
            self.assertEqual(architect["data"]["title"], "测试故事")
            payload["bible"] = self.bible
            status, writer = self.post("/api/agent/write", payload)
            self.assertEqual(status, 200)
            self.assertTrue(writer["ok"])
            self.assertEqual(writer["issues"], [])

    def test_bad_origin_is_rejected(self):
        request = urllib.request.Request(
            self.base + "/api/agent/architect",
            data=b"{}",
            headers={"Content-Type": "application/json", "Origin": "https://evil.example"},
            method="POST",
        )
        with self.assertRaises(urllib.error.HTTPError) as raised:
            urllib.request.urlopen(request, timeout=10)
        self.assertEqual(raised.exception.code, 403)


if __name__ == "__main__":
    unittest.main()
