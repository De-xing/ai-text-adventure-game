#!/usr/bin/env python3
"""Rebuild database/echoquest.db from schema.sql."""

from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parent
DB = ROOT / "echoquest.db"
SCHEMA = ROOT / "schema.sql"

if DB.exists():
    DB.unlink()

con = sqlite3.connect(DB)
con.executescript(SCHEMA.read_text(encoding="utf-8"))
con.commit()
print(f"rebuilt {DB} ({con.execute('select count(*) from sqlite_master where type=\'table\'').fetchone()[0]} tables)")
con.close()
