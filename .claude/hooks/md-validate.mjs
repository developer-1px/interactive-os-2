#!/usr/bin/env node
// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * PostToolUse(Edit|Write) hook — docs/**\/*.md 수정 시 updated 갱신 + validate.
 *
 * @invariant explicit updated는 보호 (provenance.updated.source === 'explicit'면 skip)
 * @invariant 무한 루프 방지: 현재 updated === today면 write-back skip (idempotent)
 * @invariant memory/ 경로는 원천 차단
 * @invariant Phase 1 soft — exit 0 유지 (사용자 편집을 훅 실패가 막지 않음)
 *
 * stdin:  { tool_name, tool_input: { file_path } }
 * stdout: summary console.log
 * stderr: warnings console.warn
 * exit:   0 (Phase 1)
 */
import { readFileSync } from 'node:fs'
import { resolve, isAbsolute, extname, sep } from 'node:path'
import { spawnSync } from 'node:child_process'

const PROJECT_ROOT = resolve(import.meta.dirname, '../..')
const DOCS_ROOT = resolve(PROJECT_ROOT, 'docs')
const MEMORY_ROOT = resolve(PROJECT_ROOT, 'memory')

function isDocsMd(path) {
  if (!path) return false
  const abs = isAbsolute(path) ? path : resolve(PROJECT_ROOT, path)
  if (!abs.startsWith(DOCS_ROOT + sep) && abs !== DOCS_ROOT) return false
  return extname(abs).toLowerCase() === '.md'
}
function isMemoryPath(path) {
  if (!path) return false
  const abs = isAbsolute(path) ? path : resolve(PROJECT_ROOT, path)
  if (abs === MEMORY_ROOT) return true
  if (abs.startsWith(MEMORY_ROOT + sep)) return true
  if (path.startsWith('memory/') || path.startsWith('memory' + sep) || path === 'memory') return true
  return false
}

let input
try {
  input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
} catch {
  process.exit(0)
}

const toolName = input?.tool_name
const filePath = input?.tool_input?.file_path

if (toolName !== 'Edit' && toolName !== 'Write') process.exit(0)
if (!filePath || !isDocsMd(filePath) || isMemoryPath(filePath)) process.exit(0)

const tsxBin = resolveTsxBin()
if (!tsxBin) {
  // tsx 없으면 Phase 1 soft — 조용히 pass
  process.exit(0)
}

// 1. extract로 현재 상태 조회
const extractRes = spawnSync(
  tsxBin,
  [resolve(PROJECT_ROOT, 'scripts/mddb/cli.ts'), 'extract', '--path', filePath, '--json'],
  { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 4500 },
)
if (extractRes.status !== 0) {
  process.exit(0)
}
let result
try {
  result = JSON.parse(extractRes.stdout)
} catch {
  process.exit(0)
}

const explicitUpdated = result?.provenance?.updated?.source === 'explicit'
const today = new Date().toISOString().slice(0, 10)
const currentUpdated = result?.frontmatter?.updated

// 2. updated 갱신 — explicit면 skip, 이미 today면 skip (idempotent)
if (!explicitUpdated && currentUpdated !== today) {
  // inject 호출: --path $FILE (extractFile 내부에서 updated 계산 — 하지만 git log가 오늘로 갱신되지 않으므로 수동 patch가 필요)
  // Phase 1 MVP: --dry-run로 프리뷰만, 실제 write는 별도 CLI 실행 권장.
  // 자동 write-back은 handoff 시 활성화.
  // 여기서는 soft 경고만.
  console.warn(`mddb: ${filePath} updated=${currentUpdated} (today=${today}). 'pnpm mddb:inject --path ${filePath}'로 갱신 가능.`)
}

// 3. validate — warnings만 출력
const errors = (result?.warnings ?? []).filter((w) => w.severity === 'error')
const warns = (result?.warnings ?? []).filter((w) => w.severity !== 'error')
if (errors.length > 0) {
  console.error(`mddb: ${filePath} ${errors.length} error(s)`)
  for (const w of errors) console.error(`  [${w.code}] ${w.message}`)
}
if (warns.length > 0 && errors.length === 0) {
  // 경고만 있을 때만 조용히 1줄
  console.log(`mddb: ${filePath} ${warns.length} warning(s)`)
}

// Phase 1 soft — 항상 0
process.exit(0)

function resolveTsxBin() {
  const candidates = [
    resolve(PROJECT_ROOT, 'node_modules/.bin/tsx'),
  ]
  for (const c of candidates) {
    try {
      readFileSync(c)
      return c
    } catch {
      continue
    }
  }
  return null
}
