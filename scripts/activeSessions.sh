#!/usr/bin/env bash
# 현재 세션 외 최근 5분 내 활성 세션 수를 반환한다.
# Usage: bash scripts/activeSessions.sh [my_session_id]
# Exit: 0 = 혼자, 1 = 동시 작업 중 (stdout에 활성 세션 수)

set -euo pipefail

MY_SESSION="${1:-}"
OPS_DIR="$(dirname "$0")/../.claude/agent-ops"
THRESHOLD=300  # 5분(초)

if [ ! -d "$OPS_DIR" ]; then
  echo "0"
  exit 0
fi

NOW=$(date +%s)
COUNT=0

for f in "$OPS_DIR"/*.ndjson; do
  [ -f "$f" ] || continue

  # 자기 세션 제외
  BASENAME=$(basename "$f" .ndjson)
  if [ "$BASENAME" = "$MY_SESSION" ]; then
    continue
  fi

  # 파일 mtime 기준 활성 판단
  if [ "$(uname)" = "Darwin" ]; then
    MTIME=$(stat -f %m "$f")
  else
    MTIME=$(stat -c %Y "$f")
  fi

  DIFF=$((NOW - MTIME))
  if [ "$DIFF" -le "$THRESHOLD" ]; then
    COUNT=$((COUNT + 1))
  fi
done

echo "$COUNT"

if [ "$COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi
