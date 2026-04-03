#!/usr/bin/env bash
# Usage: bash scripts/genDoc.sh <title> [content-command]
#   bash scripts/genDoc.sh "API Report"                      # empty doc
#   bash scripts/genDoc.sh "Dep Graph" "node scripts/axisScorecard.mjs"  # pipe command output
#   echo "hello" | bash scripts/genDoc.sh "Note"             # pipe stdin
#
# Output: docs/0-inbox/{timestamp}-{title}.md → viewer auto-detects via HMR

set -euo pipefail

TITLE="${1:?Usage: genDoc.sh <title> [content-command]}"
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DIR="$(cd "$(dirname "$0")/.." && pwd)/docs/0-inbox"
mkdir -p "$DIR"
FILE="$DIR/${TIMESTAMP}-${SLUG}.md"

# Collect content: command arg > stdin > empty
if [[ -n "${2:-}" ]]; then
  BODY=$(eval "$2")
elif [[ ! -t 0 ]]; then
  BODY=$(cat)
else
  BODY=""
fi

cat > "$FILE" <<EOF
# ${TITLE}

_Generated: $(date '+%Y-%m-%d %H:%M:%S')_

${BODY}
EOF

echo "$FILE"
