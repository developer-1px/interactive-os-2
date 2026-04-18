#!/usr/bin/env node
// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * PostToolUse(Edit|Write) hook — docs/**\/*.md 수정 시 informational warning만.
 *
 * @invariant memory/ 경로는 원천 차단
 * @invariant 항상 exit 0 (사용자 편집을 훅 실패가 막지 않음)
 * @invariant 자동 frontmatter 주입·updated write-back 폐기 (Phase 1 inject 의존 제거)
 *
 * stdin:  { tool_name, tool_input: { file_path } }
 * exit:   0 always
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
if (!tsxBin) process.exit(0)

const extractRes = spawnSync(
  tsxBin,
  [resolve(PROJECT_ROOT, 'scripts/mddb/cli.ts'), 'extract', '--path', filePath, '--json'],
  { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 4500 },
)
if (extractRes.status !== 0) process.exit(0)

let result
try {
  result = JSON.parse(extractRes.stdout)
} catch {
  process.exit(0)
}

const errors = (result?.warnings ?? []).filter((w) => w.severity === 'error')
const warns = (result?.warnings ?? []).filter((w) => w.severity !== 'error')
if (errors.length > 0) {
  console.error(`mddb: ${filePath} ${errors.length} error(s)`)
  for (const w of errors) console.error(`  [${w.code}] ${w.message}`)
}
if (warns.length > 0 && errors.length === 0) {
  console.log(`mddb: ${filePath} ${warns.length} warning(s)`)
}

process.exit(0)

function resolveTsxBin() {
  const candidates = [resolve(PROJECT_ROOT, 'node_modules/.bin/tsx')]
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
