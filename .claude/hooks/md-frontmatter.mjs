#!/usr/bin/env node
// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * PreToolUse(Write) hook — docs/**\/*.md 신규 작성 시 frontmatter 자동 주입/검증.
 *
 * @invariant memory/ 경로는 원천 차단 (불변식 #8)
 * @invariant docs/**\/*.md 외 경로는 즉시 exit 0
 * @invariant explicit frontmatter schema 위반은 exit 2 (block)
 * @invariant Phase 1 soft — frontmatter 없으면 경고만 (block 없음)
 *
 * stdin:  { tool_name, tool_input: { file_path, content? } }
 * stdout: { decision?, reason? }
 * exit:   0=pass, 2=block
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
const content = input?.tool_input?.content ?? ''

// 1. scope guard
if (toolName !== 'Write') process.exit(0)
if (!filePath || !isDocsMd(filePath) || isMemoryPath(filePath)) process.exit(0)

// 2. content에 frontmatter 있으면 explicit 검증만 — tsx subprocess로 호출
const hasFm = content.startsWith('---\n') || content.startsWith('---\r\n')

if (hasFm) {
  // extract + validate를 tsx로 위임 (schema 위반 시 block)
  const tsxBin = resolveTsxBin()
  if (!tsxBin) process.exit(0)
  const res = spawnSync(
    tsxBin,
    [resolve(PROJECT_ROOT, 'scripts/mddb/cli.ts'), 'extract', '--path', filePath, '--json'],
    { cwd: PROJECT_ROOT, encoding: 'utf8', timeout: 4500 },
  )
  if (res.status !== 0) {
    process.exit(0) // soft — tsx/script 실패면 통과
  }
  let parsed
  try {
    parsed = JSON.parse(res.stdout)
  } catch {
    process.exit(0)
  }
  const warnings = parsed?.warnings ?? []
  const schemaErrors = warnings.filter((w) => w.severity === 'error' && w.code === 'schema-invalid')
  if (schemaErrors.length > 0) {
    const msg = schemaErrors.map((w) => `[${w.code}] ${w.message}`).join('\n')
    console.log(JSON.stringify({
      decision: 'block',
      reason: `mddb: explicit frontmatter schema 위반\n${msg}`,
    }))
    process.exit(2)
  }
  process.exit(0)
}

// 3. frontmatter 없음 — Phase 1 soft. stderr 경고만 출력
console.error(`mddb: ${filePath} frontmatter 없음. 수동 추가 또는 'pnpm mddb:inject ${filePath}' 권장.`)
process.exit(0)

// ── helpers ──

function resolveTsxBin() {
  const candidates = [
    resolve(PROJECT_ROOT, 'node_modules/.bin/tsx'),
  ]
  for (const c of candidates) {
    try {
      readFileSync(c) // 존재 확인
      return c
    } catch {
      continue
    }
  }
  return null
}
