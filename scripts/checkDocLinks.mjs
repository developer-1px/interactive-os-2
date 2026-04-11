#!/usr/bin/env node
/**
 * docs/ 내 마크다운 링크 전수 검사.
 * - [text](relative/path.md) 형태의 링크를 추출
 * - 실제 파일 존재 여부 확인
 * - 파일명으로 올바른 경로 제안 (중복 시 가장 가까운 경로 선택)
 *
 * Usage: node scripts/checkDocLinks.mjs [--fix]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname, join, basename, relative } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const DOCS_DIR = join(ROOT, 'docs')
const FIX_MODE = process.argv.includes('--fix')

// 1. docs/ 내 모든 md 파일 인덱스 빌드 (파일명 → 절대경로[])
const fileIndex = new Map()

function indexDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      indexDir(full)
    } else if (entry.name.endsWith('.md')) {
      if (!fileIndex.has(entry.name)) fileIndex.set(entry.name, [])
      fileIndex.get(entry.name).push(full)
    }
  }
}

indexDir(DOCS_DIR)

// 2. 가장 가까운 경로 선택 (공통 prefix 길이 기준)
function findClosest(fromDir, candidates) {
  if (candidates.length === 1) return candidates[0]
  const fromParts = fromDir.split('/')
  let best = candidates[0]
  let bestCommon = 0
  for (const c of candidates) {
    const cParts = dirname(c).split('/')
    let common = 0
    while (common < fromParts.length && common < cParts.length && fromParts[common] === cParts[common]) common++
    if (common > bestCommon) {
      bestCommon = common
      best = c
    }
  }
  return best
}

// 3. 상대 경로 계산
function getRelativePath(from, to) {
  return relative(dirname(from), to)
}

// 4. 각 md 파일의 링크 검사
const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g
let broken = 0
let fixed = 0

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

for (const filePath of allFiles) {
  let content = readFileSync(filePath, 'utf8')
  const replacements = []

  for (const match of content.matchAll(LINK_RE)) {
    const [, , href] = match

    // 외부 링크, 앵커, 프로토콜 스킵
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue
    // 비-md 스킵
    if (!href.endsWith('.md') && !href.includes('.md#')) continue

    const hrefPath = href.split('#')[0]
    const anchor = href.includes('#') ? '#' + href.split('#')[1] : ''
    const resolved = resolve(dirname(filePath), hrefPath)

    if (!existsSync(resolved)) {
      broken++
      const targetName = basename(hrefPath)
      const candidates = fileIndex.get(targetName)

      if (candidates && candidates.length > 0) {
        const closest = findClosest(dirname(filePath), candidates)
        const rel = getRelativePath(filePath, closest)

        if (FIX_MODE) {
          replacements.push({ from: `(${href})`, to: `(${rel}${anchor})` })
          fixed++
          console.log(`  ✅ ${relative(ROOT, filePath)}`)
          console.log(`     ${href} → ${rel}${anchor}`)
        } else {
          console.log(`  ❌ ${relative(ROOT, filePath)}`)
          console.log(`     깨진: ${href}`)
          console.log(`     제안: ${rel}${anchor}`)
        }
      } else {
        console.log(`  ❌ ${relative(ROOT, filePath)}`)
        console.log(`     깨진: ${href} (대상 파일을 찾을 수 없음)`)
      }
    }
  }

  if (FIX_MODE && replacements.length > 0) {
    for (const r of replacements) {
      content = content.replace(r.from, r.to)
    }
    writeFileSync(filePath, content)
  }
}

// 5. 결과
console.log(`\n${'─'.repeat(50)}`)
console.log(`검사 완료: ${allFiles.length}개 파일`)
console.log(`깨진 링크: ${broken}개`)
if (FIX_MODE) console.log(`자동 수정: ${fixed}개`)
if (broken === 0) console.log('✅ 모든 링크 정상')
else if (!FIX_MODE) console.log('\n💡 자동 수정: node scripts/checkDocLinks.mjs --fix')

process.exit(broken > 0 && !FIX_MODE ? 1 : 0)
