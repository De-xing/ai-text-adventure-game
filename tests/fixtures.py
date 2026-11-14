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
