"""Regression tests for the EchoQuest Agent service.

These tests were added before the refactor so the five structural fixes can be
verified against observable behaviour.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import server  # noqa: E402


def make_bible():
    return {
        "title": "测试故事",
        "subtitle": "一个用于测试的故事",
        "synopsis": "测试简介",
        "characters": [
            {"name": "角色甲", "role": "主角", "tone": "stranger", "desc": "描述"},
            {"name": "角色乙", "role": "同伴", "tone": "ally", "desc": "描述"},
        ],
        "startNodeId": "s1",
        "nodes": [
            {"id": "s1", "isEnding": False, "choices": [{"to": "s2"}, {"to": "s3"}]},
            {"id": "s2", "isEnding": False, "choices": [{"to": "e1"}, {"to": "e2"}]},
            {"id": "s3", "isEnding": False, "choices": [{"to": "e1"}, {"to": "e3"}]},
            {"id": "e1", "isEnding": True, "endingType": "good", "choices": []},
            {"id": "e2", "isEnding": True, "endingType": "bad", "choices": []},
            {"id": "e3", "isEnding": True, "endingType": "hidden", "choices": []},
        ],
    }


def make_nodes(bible):
    nodes = {}
    for planned in bible["nodes"]:
        count = 0 if planned["isEnding"] else len(planned["choices"])
        nodes[planned["id"]] = {
            "text": ["测试正文"],
            "choices": [{"text": "选项", "note": "备注"} for _ in range(count)],
        }
    return {"nodes": nodes}


class ExtractJsonTests(unittest.TestCase):
    def test_plain_json(self):
        self.assertEqual(server.extract_json('{"a": 1}'), {"a": 1})

    def test_fenced_json(self):
        self.assertEqual(server.extract_json('```json\n{"a": 1}\n```'), {"a": 1})

    def test_trailing_comma_is_repaired(self):
        self.assertEqual(server.extract_json('{"a": 1,}'), {"a": 1})

    def test_non_json_raises(self):
        with self.assertRaises(ValueError):
            server.extract_json("not json")


class PlanOrderTests(unittest.TestCase):
    def test_reorders_backward_declared_nodes(self):
        data = {
            "startNodeId": "s1",
            "nodes": [
                {"id": "s1", "choices": [{"to": "s2"}, {"to": "s3"}]},
                {"id": "s3", "choices": [{"to": "s4"}]},
                {"id": "s2", "choices": [{"to": "s4"}]},
                {"id": "s4", "choices": [{"to": "e1"}]},
                {"id": "e1", "isEnding": True, "choices": []},
            ],
        }
        result = server.normalize_plan_order(copy.deepcopy(data))
        ids = [node["id"] for node in result["nodes"]]
        self.assertEqual(ids[0], "s1")
        self.assertLess(ids.index("s2"), ids.index("s4"))
        self.assertLess(ids.index("s3"), ids.index("s4"))
        self.assertEqual(ids[-1], "e1")

    def test_cycle_is_left_untouched(self):
        data = {
            "startNodeId": "s1",
            "nodes": [
                {"id": "s1", "choices": [{"to": "s2"}]},
                {"id": "s2", "choices": [{"to": "s1"}]},
            ],
        }
        self.assertEqual(server.normalize_plan_order(data), data)


class PlanSeverityTests(unittest.TestCase):
    def test_valid_plan_is_not_severe(self):
        self.assertFalse(server.plan_is_severe(make_bible()))

    def test_missing_start_is_severe(self):
        data = make_bible()
        data["startNodeId"] = "missing"
        self.assertTrue(server.plan_is_severe(data))

    def test_empty_nodes_is_severe(self):
        self.assertTrue(server.plan_is_severe({"startNodeId": "s1", "nodes": []}))


class ValidateBibleTests(unittest.TestCase):
    def test_valid_plan_has_no_issues(self):
        self.assertEqual(server.validate_bible(make_bible(), 3, "short"), [])

    def test_missing_start_node_is_reported(self):
        data = make_bible()
        data["startNodeId"] = "missing"
        issues = server.validate_bible(data, 3, "short")
        self.assertTrue(any("startNodeId" in issue for issue in issues))

    def test_wrong_ending_count_is_reported(self):
        issues = server.validate_bible(make_bible(), 1, "short")
        self.assertTrue(any("结局数量" in issue for issue in issues))

    def test_backward_edge_is_reported(self):
        data = make_bible()
        data["nodes"][1]["choices"][0]["to"] = "s1"
        issues = server.validate_bible(data, 3, "short")
        self.assertTrue(any("后续节点" in issue for issue in issues))

    def test_unreachable_node_is_reported(self):
        data = make_bible()
        data["nodes"].append({
            "id": "s4",
            "isEnding": False,
            "choices": [{"to": "e1"}, {"to": "e2"}],
        })
        issues = server.validate_bible(data, 3, "short")
        self.assertTrue(any("不可达" in issue for issue in issues))


class ValidateNodesTests(unittest.TestCase):
    def test_valid_content_has_no_issues(self):
        bible = make_bible()
        issues = server.validate_nodes(make_nodes(bible), bible)
        self.assertEqual(issues, [])

    def test_missing_node_is_reported(self):
        bible = make_bible()
        content = make_nodes(bible)
        del content["nodes"]["s2"]
        issues = server.validate_nodes(content, bible)
        self.assertTrue(any("s2" in issue for issue in issues))

    def test_wrong_choice_count_is_reported(self):
        bible = make_bible()
        content = make_nodes(bible)
        content["nodes"]["s1"]["choices"].pop()
        issues = server.validate_nodes(content, bible)
        self.assertTrue(any("s1 需要 2 个选项" in issue for issue in issues))

    def test_empty_text_is_reported(self):
        bible = make_bible()
        content = make_nodes(bible)
        content["nodes"]["s1"]["text"] = [""]
        issues = server.validate_nodes(content, bible)
        self.assertTrue(any("文本为空" in issue for issue in issues))


class SafeTextTests(unittest.TestCase):
    def test_truncates_and_strips(self):
        self.assertEqual(server.safe_text("  abcdef  ", 3), "abc")


if __name__ == "__main__":
    unittest.main()
