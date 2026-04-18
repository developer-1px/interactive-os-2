#!/usr/bin/env node
/**
 * PostToolUse hook: docs/ 내 .md 파일이 수정/이동되면 깨진 링크를 자동 수정.
 * - Edit/Write로 .md 파일 수정 시 → 해당 파일 내 링크만 검사
 * - Bash로 git mv 등 .md 이동 시 → 전체 검사+수정
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname, join, basename, relative } from 'path'

const ROOT = resolve(import.meta.dirname, '../..')
const DOCS_DIR = join(ROOT, 'docs')

// stdin에서 hook input 읽기
const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const toolName = input.tool_name
const toolInput = input.tool_input || {}

// docs/ 내 .md 파일인지 확인
function isDocsMd(path) {
  if (!path) return false
  const abs = path.startsWith('/') ? path : resolve(ROOT, path)
  return abs.startsWith(DOCS_DIR) && abs.endsWith('.md')
}

// Bash에서 git mv 등 md 이동 감지
function bashMovedDocs(command) {
  if (!command) return false
  return /git\s+mv.*\.md/.test(command) || /mv\s+.*\.md/.test(command)
}

let shouldRun = false

if (toolName === 'Edit' || toolName === 'Write') {
  shouldRun = isDocsMd(toolInput.file_path)
} else if (toolName === 'Bash') {
  shouldRun = bashMovedDocs(toolInput.command)
}

if (!shouldRun) process.exit(0)

// --- checkDocLinks 로직 (--fix 모드) ---

const fileIndex = new Map()

function indexDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) indexDir(full)
    else if (entry.name.endsWith('.md')) {
      if (!fileIndex.has(entry.name)) fileIndex.set(entry.name, [])
      fileIndex.get(entry.name).push(full)
    }
  }
}

indexDir(DOCS_DIR)

function findClosest(fromDir, candidates) {
  if (candidates.length === 1) return candidates[0]
  const fromParts = fromDir.split('/')
  let best = candidates[0]
  let bestCommon = 0
  for (const c of candidates) {
    const cParts = dirname(c).split('/')
    let common = 0
    while (common < fromParts.length && common < cParts.length && fromParts[common] === cParts[common]) common++
    if (common > bestCommon) { bestCommon = common; best = c }
  }
  return best
}

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g

function getAllMdFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) results.push(...getAllMdFiles(full))
    else if (entry.name.endsWith('.md')) results.push(full)
  }
  return results
}

const allFiles = getAllMdFiles(DOCS_DIR)
let fixed = 0

for (const filePath of allFiles) {
  let content = readFileSync(filePath, 'utf8')
  const replacements = []

  for (const match of content.matchAll(LINK_RE)) {
    const [, , href] = match
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue
    if (!href.endsWith('.md') && !href.includes('.md#')) continue

    const hrefPath = href.split('#')[0]
    const anchor = href.includes('#') ? '#' + href.split('#')[1] : ''
    const resolved = resolve(dirname(filePath), hrefPath)

    if (!existsSync(resolved)) {
      const targetName = basename(hrefPath)
      const candidates = fileIndex.get(targetName)
      if (candidates && candidates.length > 0) {
        const closest = findClosest(dirname(filePath), candidates)
        const rel = relative(dirname(filePath), closest)
        replacements.push({ from: `(${href})`, to: `(${rel}${anchor})` })
        fixed++
      }
    }
  }

  if (replacements.length > 0) {
    for (const r of replacements) content = content.replace(r.from, r.to)
    writeFileSync(filePath, content)
  }
}

if (fixed > 0) {
  console.log(`🔗 docs 링크 ${fixed}개 자동 수정`)
}
