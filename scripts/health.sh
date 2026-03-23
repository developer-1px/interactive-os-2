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

# ── 자동 제외: useAriaZone/useAria를 import하는 파일은 엔진 위임 ──
OS_INTEGRATED=$(grep -rl 'from.*useAria\|from.*useAriaZone' $CONSUMER_DIRS --include='*.ts' --include='*.tsx' 2>/dev/null || true)

# ── 수동 허용: 폼/모달/인라인 에디터 등 os 대상이 아닌 정당한 raw 패턴 ──
OS_SYMPTOM_ALLOWLIST=(
  "src/pages/cms/CmsFloatingToolbar.tsx"    # action toolbar — Escape only
  "src/pages/cms/CmsDetailPanel.tsx"        # form editor — Enter to commit
  "src/pages/cms/CmsInlineEditable.tsx"     # contentEditable inline editor
  "src/pages/cms/CmsTemplatePicker.tsx"     # transient picker popup
  "src/pages/cms/CmsPresentMode.tsx"        # modal fullscreen — global Escape
  "src/pages/cms/CmsHamburgerDrawer.tsx"    # modal nav drawer — global Escape
  "src/pages/cms/CmsI18nSheet.tsx"          # spreadsheet cell editor
  "src/interactive-os/ui/Spinbutton.tsx"    # native input wrapper
  "src/pages/PageAlertDialog.tsx"           # alert dialog — native role
  "src/interactive-os/ui/Tooltip.tsx"       # tooltip — os 범위 밖, 네이티브 API 우선
)

# 제외 목록 합산 (자동 + 수동)
EXCLUDE_FILES=""
if [ -n "$OS_INTEGRATED" ]; then
  EXCLUDE_FILES="$OS_INTEGRATED"
fi
for f in "${OS_SYMPTOM_ALLOWLIST[@]}"; do
  EXCLUDE_FILES="${EXCLUDE_FILES}
${f}"
done

filter_excluded() {
  local hits="$1"
  if [ -z "$hits" ]; then
    echo ""
    return
  fi
  echo "$hits" | while IFS= read -r line; do
    local file="${line%%:*}"
    local skip=false
    echo "$EXCLUDE_FILES" | while IFS= read -r excl; do
      [ -z "$excl" ] && continue
      if [ "$file" = "$excl" ]; then
        echo "SKIP"
        break
      fi
    done | grep -q "SKIP" && continue
    echo "$line"
  done
}

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
HITS=$(filter_excluded "$HITS")
print_hits "addEventListener" "$HITS"

# role= 하드코딩
HITS=$(grep -rn 'role="' $CONSUMER_DIRS --include='*.tsx' 2>/dev/null | grep -v "__tests__" || true)
HITS=$(filter_excluded "$HITS")
print_hits "hardcoded role=" "$HITS"

# tabIndex 직접 관리 (코멘트/문서 제외)
HITS=$(grep -rn 'tabIndex' $CONSUMER_DIRS --include='*.tsx' 2>/dev/null | grep -v "__tests__" | grep -v '//' | grep -v '{/\*' | grep -v '<code>' || true)
HITS=$(filter_excluded "$HITS")
print_hits "manual tabIndex" "$HITS"

# onKeyDown 직접 핸들링 (코멘트/문서 제외)
HITS=$(grep -rn 'onKeyDown' $CONSUMER_DIRS --include='*.tsx' 2>/dev/null | grep -v "__tests__" | grep -v '//' | grep -v '{/\*' || true)
HITS=$(filter_excluded "$HITS")
print_hits "onKeyDown direct" "$HITS"

# ── 징후: 비대 파일 (>300 LOC) ──
# Allowlist: 단일 관심사 파일 — 분리하면 오히려 복잡해지는 것들
# - core.ts: plugin commands + middleware 집합
# - useAria.ts / useAriaZone.ts: os hook 인터페이스
# - Combobox.tsx: 복합 위젯 (single/multi/grouped/creatable)
# - App.tsx: 라우트 정의
BIGFILE_ALLOWLIST=(
  "src/interactive-os/plugins/core.ts"
  "src/interactive-os/hooks/useAria.ts"
  "src/interactive-os/hooks/useAriaZone.ts"
  "src/interactive-os/ui/Combobox.tsx"
  "src/App.tsx"
  "src/pages/PageViewer.tsx"
)

echo ""
echo -e "${BOLD}[징후: 비대 파일 (>300 LOC)]${RESET}"

is_allowed() {
  local file="$1"
  for allowed in "${BIGFILE_ALLOWLIST[@]}"; do
    if [ "$file" = "$allowed" ]; then
      return 0
    fi
  done
  return 1
}

big_files=""
while IFS= read -r f; do
  lines=$(wc -l < "$f" | tr -d ' ')
  if [ "$lines" -gt 300 ] && ! is_allowed "$f"; then
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
