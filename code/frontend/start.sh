#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server 8080 --bind 127.0.0.1
else
  exec python -m http.server 8080 --bind 127.0.0.1
fi
