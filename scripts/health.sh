#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Code Health Report
# 지표(indicator): 확정된 문제 — 숫자로 요약
# 징후(symptom):   조사 후보 — 파일:줄번호로 표시
# ─────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo -e "${BOLD}Code Health Report${RESET}"
echo "══════════════════════════════════════"

# ── 지표: Dead code (knip) ──
echo ""
echo -e "${BOLD}[지표]${RESET}"

KNIP_OUTPUT=$(npx knip --no-progress --reporter compact 2>/dev/null || true)

if [ -z "$KNIP_OUTPUT" ]; then
  echo -e "  knip:               ${GREEN}CLEAN${RESET}"
else
  echo -e "  ${YELLOW}knip 결과:${RESET}"
  echo "$KNIP_OUTPUT"
fi

# ── 지표: Circular dependencies (madge) ──
CIRCULAR=$(npx madge --circular --extensions ts,tsx src/ 2>&1 || true)
# madge 출력에서 "No circular" 포함 여부로 판단
if echo "$CIRCULAR" | grep -q "No circular"; then
  echo -e "  Circular deps:      ${GREEN}0${RESET}"
else
  CIRCULAR_COUNT=$(echo "$CIRCULAR" | grep -c "│" || true)
  echo -e "  Circular deps:      ${RED}${CIRCULAR_COUNT}${RESET}"
  echo "$CIRCULAR" | grep "│" | head -20
fi

# ── 징후: os 미사용 패턴 (소비자 코드에서만) ──
# 소비자 코드 = src/pages/, src/interactive-os/ui/, src/interactive-os/examples/
CONSUMER_DIRS="src/pages src/interactive-os/ui src/interactive-os/examples"

echo ""
echo -e "${BOLD}[징후: os 미사용]${RESET}"

print_hits() {
  local label="$1"
  local hits="$2"
  echo -e "  ${CYAN}${label}:${RESET}"
  if [ -n "$hits" ]; then
    local count
    count=$(echo "$hits" | wc -l | tr -d ' ')
    echo -e "  ${DIM}(${count}건)${RESET}"
    echo "$hits" | while read -r line; do
      echo -e "    ${DIM}${line}${RESET}"
    done
  else
    echo -e "    ${GREEN}없음${RESET}"
  fi
}

# addEventListener 직접 사용
HITS=$(grep -rn "addEventListener" $CONSUMER_DIRS --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v "__tests__" || true)
print_hits "addEventListener" "$HITS"

# role= 하드코딩
HITS=$(grep -rn 'role="' $CONSUMER_DIRS --include='*.tsx' 2>/dev/null | grep -v "__tests__" || true)
print_hits "hardcoded role=" "$HITS"

# tabIndex 직접 관리 (코멘트/문서 제외)
HITS=$(grep -rn 'tabIndex' $CONSUMER_DIRS --include='*.tsx' 2>/dev/null | grep -v "__tests__" | grep -v '//' | grep -v '{/\*' || true)
print_hits "manual tabIndex" "$HITS"

# onKeyDown 직접 핸들링 (코멘트/문서 제외)
HITS=$(grep -rn 'onKeyDown' $CONSUMER_DIRS --include='*.tsx' 2>/dev/null | grep -v "__tests__" | grep -v '//' | grep -v '{/\*' || true)
print_hits "onKeyDown direct" "$HITS"

# ── 징후: 비대 파일 (>300 LOC) ──
echo ""
echo -e "${BOLD}[징후: 비대 파일 (>300 LOC)]${RESET}"

big_files=""
while IFS= read -r f; do
  lines=$(wc -l < "$f" | tr -d ' ')
  if [ "$lines" -gt 300 ]; then
    big_files="${big_files}  ${f}  ${lines} lines\n"
  fi
done < <(find src -name '*.ts' -o -name '*.tsx' | grep -v __tests__ | sort)

if [ -n "$big_files" ]; then
  echo -e "$big_files" | sort -t' ' -k3 -rn | while read -r line; do
    if [ -n "$line" ]; then
      echo -e "  ${YELLOW}${line}${RESET}"
    fi
  done
else
  echo -e "  ${GREEN}없음${RESET}"
fi

echo ""
echo "══════════════════════════════════════"
echo -e "${DIM}Run: pnpm health${RESET}"
