"""SQLite-backed demo memory store for games, runs, and summaries."""
from __future__ import annotations

import json
import os
import sqlite3
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("ECHOQUEST_DB", str(ROOT / "data" / "echoquest.db")))


def _connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(DB_PATH), timeout=5)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """Create the demo memory tables if they do not exist."""
    with _connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS games (
                game_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT NOT NULL,
                node_id TEXT NOT NULL,
                choice TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS summaries (
                game_id TEXT PRIMARY KEY,
                summary TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )


def save_game(game_id, title, payload):
    """Upsert one game and return its stored length."""
    init_db()
    body = json.dumps(payload, ensure_ascii=False)
    now = time.strftime("%Y-%m-%dT%H:%M:%S%z")
    with _connect() as db:
        db.execute(
            """
            INSERT INTO games (game_id, title, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(game_id) DO UPDATE SET
                title = excluded.title,
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (str(game_id), str(title)[:120], body, now),
        )
    return len(body)


def load_game(game_id):
    """Load a game payload, or return None."""
    init_db()
    with _connect() as db:
        row = db.execute(
            "SELECT game_id, title, payload, updated_at FROM games WHERE game_id = ?",
            (str(game_id),),
        ).fetchone()
    if not row:
        return None
    return {
        "gameId": row["game_id"],
        "title": row["title"],
        "payload": json.loads(row["payload"]),
        "updatedAt": row["updated_at"],
    }


def append_run(game_id, node_id, choice):
    """Append one player step to the run log."""
    init_db()
    with _connect() as db:
        db.execute(
            "INSERT INTO runs (game_id, node_id, choice, created_at) VALUES (?, ?, ?, ?)",
            (str(game_id), str(node_id), str(choice)[:300], time.strftime("%Y-%m-%dT%H:%M:%S%z")),
        )


def save_summary(game_id, summary):
    """Upsert a compact run summary."""
    init_db()
    with _connect() as db:
        db.execute(
            """
            INSERT INTO summaries (game_id, summary, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(game_id) DO UPDATE SET
                summary = excluded.summary,
                updated_at = excluded.updated_at
            """,
            (str(game_id), str(summary)[:2000], time.strftime("%Y-%m-%dT%H:%M:%S%z")),
        )
