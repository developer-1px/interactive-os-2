#!/usr/bin/env bash
# module.css 전체 덤프 → docs/superpowers/specs/module-css-dump.md
# Usage: bash scripts/dumpModuleCss.sh

OUT="docs/superpowers/specs/module-css-dump.md"
DATE=$(date +%Y-%m-%d)

echo "# module.css 전체 덤프 ($DATE)" > "$OUT"
echo "" >> "$OUT"

total_files=0
total_lines=0

for f in $(find src -name '*.module.css' -not -path '*/pattern/examples/*' | sort); do
  lines=$(wc -l < "$f")
  total_files=$((total_files + 1))
  total_lines=$((total_lines + lines))

  echo "## \`$f\` (${lines}줄)" >> "$OUT"
  echo "" >> "$OUT"
  echo '```css' >> "$OUT"
  cat "$f" >> "$OUT"
  echo '```' >> "$OUT"
  echo "" >> "$OUT"
done

echo "---" >> "$OUT"
echo "" >> "$OUT"
echo "**총 ${total_files}파일, ${total_lines}줄**" >> "$OUT"

echo "Done: $OUT ($total_files files, $total_lines lines)"
