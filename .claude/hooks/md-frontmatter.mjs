#!/usr/bin/env node
// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * PreToolUse(Write) hook — docs/**\/*.md 신규 작성 시 frontmatter 존재 확인.
 *
 * @invariant memory/ 경로는 원천 차단 (불변식 #8)
 * @invariant docs/**\/*.md 외 경로는 즉시 exit 0
 * @invariant Phase 1 완전 soft — block 없음. 엄격 검증은 `pnpm mddb:validate` 별도
 *
 * stdin:  { tool_name, tool_input: { file_path, content? } }
 * exit:   0=pass (항상)
 */
import { readFileSync } from 'node:fs'
import { resolve, isAbsolute, extname, sep } from 'node:path'

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

if (toolName !== 'Write') process.exit(0)
if (!filePath || !isDocsMd(filePath) || isMemoryPath(filePath)) process.exit(0)

const hasFm = content.startsWith('---\n') || content.startsWith('---\r\n')
if (!hasFm) {
  console.error(`mddb: ${filePath} frontmatter 없음. 수동 추가 또는 'pnpm mddb:inject ${filePath}' 권장.`)
}
process.exit(0)
