"""Local demo guardrails: PII redaction and keyword moderation.

This is intentionally small and deterministic. It is not a replacement for a
production moderation service or NER-based PII detection.
"""
from __future__ import annotations

import re

PHONE = re.compile(r"(?<!\d)1[3-9]\d{9}(?!\d)")
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
ID_CARD = re.compile(r"(?<!\d)\d{17}[\dXx](?!\d)")
BANK_CARD = re.compile(r"(?<!\d)\d{16,19}(?!\d)")

BLOCKED_TERMS = (
    "制作炸弹",
    "制造炸弹",
    "制毒",
    "自残教程",
    "儿童色情",
)


def redact_pii(text):
    """Replace common PII with stable placeholders."""
    value = str(text or "")
    redacted = False
    for pattern, label in (
        (PHONE, "[PHONE]"),
        (EMAIL, "[EMAIL]"),
        (ID_CARD, "[ID]"),
        (BANK_CARD, "[BANK]"),
    ):
        value, count = pattern.subn(label, value)
        redacted = redacted or count > 0
    return value, redacted


def moderation_issues(text):
    """Return matched blocked terms; empty list means pass."""
    value = str(text or "")
    return [term for term in BLOCKED_TERMS if term in value]


def inspect_text(text):
    """Inspect input and return redacted text plus safety metadata."""
    redacted, had_pii = redact_pii(text)
    issues = moderation_issues(redacted)
    return {
        "redacted": redacted,
        "piiRedacted": had_pii,
        "issues": issues,
        "ok": not issues,
    }
