"""Run Pylint + Radon and collect quality metrics for one snapshot."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QA_TOOLS = ROOT / ".qa-tools"
TARGET = ROOT / "server.py"


def tool_env():
    env = os.environ.copy()
    env["PYTHONPATH"] = str(QA_TOOLS)
    env["PYTHONUTF8"] = "1"
    return env


def run(args, out_file):
    result = subprocess.run(
        args,
        cwd=ROOT,
        env=tool_env(),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out_file.write_text(result.stdout, encoding="utf-8")
    if result.returncode not in (0, 1):
        (out_file.with_suffix(out_file.suffix + ".err")).write_text(result.stderr, encoding="utf-8")
    return result


def parse_pylint(path):
    messages = json.loads(path.read_text(encoding="utf-8") or "[]")
    bugs = [m for m in messages if m["message-id"][0] in ("E", "F")]
    smells = [m for m in messages if m["message-id"][0] in ("W", "C", "R")]
    duplicates = [m for m in messages if m["message-id"] == "R0801"]
    return {
        "total_messages": len(messages),
        "bugs": len(bugs),
        "code_smells": len(smells),
        "duplicate_blocks": len(duplicates),
        "by_type": {
            "E": sum(1 for m in messages if m["message-id"].startswith("E")),
            "F": sum(1 for m in messages if m["message-id"].startswith("F")),
            "W": sum(1 for m in messages if m["message-id"].startswith("W")),
            "C": sum(1 for m in messages if m["message-id"].startswith("C")),
            "R": sum(1 for m in messages if m["message-id"].startswith("R")),
        },
        "messages": messages,
    }


def parse_radon(path):
    data = json.loads(path.read_text(encoding="utf-8") or "{}")
    blocks = []
    for file_path, entries in data.items():
        for entry in entries or []:
            blocks.append(
                {
                    "file": file_path,
                    "name": entry.get("name"),
                    "type": entry.get("type"),
                    "complexity": entry.get("complexity", 0),
                    "rank": entry.get("rank"),
                    "lineno": entry.get("lineno"),
                }
            )
    complexities = [b["complexity"] for b in blocks]
    return {
        "block_count": len(blocks),
        "sum_complexity": sum(complexities),
        "average_complexity": round(sum(complexities) / len(complexities), 2) if complexities else 0,
        "max_complexity": max(complexities) if complexities else 0,
        "blocks": sorted(blocks, key=lambda b: b["complexity"], reverse=True),
    }


def main():
    snapshot = sys.argv[1] if len(sys.argv) > 1 else "baseline"
    out_dir = ROOT / "qa" / snapshot
    out_dir.mkdir(parents=True, exist_ok=True)

    pylint_json = out_dir / "pylint.json"
    pylint_text = out_dir / "pylint.txt"
    dup_json = out_dir / "duplicate.json"
    radon_json = out_dir / "radon-cc.json"
    radon_mi = out_dir / "radon-mi.json"

    suffix = ".exe" if os.name == "nt" else ""
    pylint_exe = str(QA_TOOLS / "bin" / ("pylint" + suffix))
    radon_exe = str(QA_TOOLS / "bin" / ("radon" + suffix))
    run([pylint_exe, str(TARGET), "--output-format=json", "--reports=n", "--exit-zero"], pylint_json)
    run([pylint_exe, str(TARGET), "--output-format=text", "--reports=y", "--score=y", "--exit-zero"], pylint_text)
    run([pylint_exe, str(TARGET), "--disable=all", "--enable=duplicate-code", "--output-format=json", "--reports=n", "--exit-zero"], dup_json)
    run([radon_exe, "cc", str(TARGET), "-j"], radon_json)
    run([radon_exe, "mi", str(TARGET), "-j"], radon_mi)

    pylint_stats = parse_pylint(pylint_json)
    radon_stats = parse_radon(radon_json)
    text = pylint_text.read_text(encoding="utf-8", errors="replace")
    score_match = re.search(r"rated at\s+([0-9.]+)/10", text)
    score = float(score_match.group(1)) if score_match else None
    dup_stats = parse_pylint(dup_json)

    summary = {
        "snapshot": snapshot,
        "scope": "server.py",
        "tool": {
            "pylint": "4.1.3",
            "radon": "6.0.1",
        },
        "metrics": {
            "bugs": pylint_stats["bugs"],
            "code_smells": pylint_stats["code_smells"],
            "pylint_score": score,
            "cyclomatic_average": radon_stats["average_complexity"],
            "cyclomatic_max": radon_stats["max_complexity"],
            "duplicate_blocks": dup_stats["duplicate_blocks"],
            "duplicate_rate_percent": 0.0 if dup_stats["duplicate_blocks"] == 0 else None,
        },
        "pylint": pylint_stats,
        "radon": radon_stats,
    }
    (out_dir / "metrics.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary["metrics"], ensure_ascii=False, indent=2))
    print("\nTop complexity blocks:")
    for block in radon_stats["blocks"][:10]:
        print(block)


if __name__ == "__main__":
    main()
