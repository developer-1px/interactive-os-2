#!/usr/bin/env node

/**
 * checkTokens — 3티어 디자인 토큰 위반 스캐너
 *
 * PRD: docs/2-areas/design/prds/design-token-3tier-auto-derivation-prd.md
 *
 * 3티어 구조: palette (--stone-*) → semantic (--surface-*, --bg-*, --selection 등) → role/recipe/component
 *
 * role/recipe/component 레이어의 CSS는 semantic tier만 참조해야 한다.
 * palette/depth raw 토큰 직접 참조 및 oklch raw 리터럴은 금지.
 *
 * 검출 규칙:
 *   1. --stone-*        palette 직접 참조 금지
 *   2. --depth-*        deprecated alias, 신규 사용 금지
 *   3. oklch(...)       raw 리터럴 (semantic 우회)
 *
 * 화이트리스트 (위반 아님):
 *   - src/styles/palette.css         palette 정의 자체
 *   - src/styles/tokens.css          semantic tier가 palette 참조하는 합법 위치
 *   - src/styles/ax.css              surface/state가 semantic elev base를 잡는 합법 위치
 *   - src/pages/theme/PageThemeCreator.css  palette swatch UI (의도적 표시)
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC = resolve(ROOT, 'src')

const WHITELIST = new Set([
  'src/styles/palette.css',
  'src/styles/tokens.css',
  'src/styles/ax.css',
  'src/pages/theme/PageThemeCreator.css',
])

const RULES = [
  { id: 'stone', pattern: /--stone-[\w-]+/, label: '--stone-* palette 직접 참조 (semantic tier를 거쳐 사용)' },
  { id: 'depth', pattern: /--depth-[\w-]+/, label: '--depth-* deprecated alias (--bg-hover, --selection 등 semantic 사용)' },
  { id: 'oklch', pattern: /\boklch\s*\(/, label: 'oklch() raw 리터럴 (palette/semantic 토큰 사용)' },
]

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      walk(full, out)
    } else if (/\.css$/.test(name)) {
      out.push(full)
    }
  }
  return out
}

const files = walk(SRC)
const violations = []
const counts = { stone: 0, depth: 0, oklch: 0 }

for (const file of files) {
  const rel = relative(ROOT, file)
  if (WHITELIST.has(rel)) continue

  const lines = readFileSync(file, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // comments: skip single-line `/* ... */` and `//` prefixes
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue
    for (const rule of RULES) {
      const match = line.match(rule.pattern)
      if (match) {
        counts[rule.id]++
        violations.push({ file: rel, line: i + 1, rule: rule.id, label: rule.label, snippet: trimmed.slice(0, 100) })
      }
    }
  }
}

if (violations.length === 0) {
  console.log('✓ 토큰 위반 0건')
  process.exit(0)
}

// Group by file for readability
const byFile = new Map()
for (const v of violations) {
  if (!byFile.has(v.file)) byFile.set(v.file, [])
  byFile.get(v.file).push(v)
}

console.error(`✗ 토큰 위반 ${violations.length}건 (stone=${counts.stone}, depth=${counts.depth}, oklch=${counts.oklch})`)
console.error('')
for (const [file, vs] of byFile) {
  console.error(`  ${file} (${vs.length})`)
  for (const v of vs) {
    console.error(`    ${v.line}:[${v.rule}] ${v.snippet}`)
  }
}
console.error('')
console.error('규칙: role/recipe/component 레이어 CSS는 semantic 토큰(--surface-*, --bg-*, --selection, --text-*, --tone-*)만 참조하세요.')
console.error('PRD: docs/2-areas/design/prds/design-token-3tier-auto-derivation-prd.md')
process.exit(1)
