#!/usr/bin/env node

/**
 * PostToolUse:Edit|Write hook — switch/if-else 분기 과다 감지
 *
 * 같은 변수에 대한 switch case 또는 if-else 분기가 5개 이상이면
 * /ocp 스킬 사용을 제안한다.
 */

import { readFileSync } from 'fs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

if (!filePath.includes('/src/') || !/\.[tj]sx?$/.test(filePath)) process.exit(0)
if (filePath.includes('.test.') || filePath.includes('__tests__')) process.exit(0)

let content
try {
  content = readFileSync(filePath, 'utf8')
} catch {
  process.exit(0)
}

const warnings = []

// switch 문 감지: case 5개 이상
const switchRe = /switch\s*\([^)]+\)\s*\{/g
let match
while ((match = switchRe.exec(content)) !== null) {
  const start = match.index
  let depth = 0
  let end = start
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++
    if (content[i] === '}') depth--
    if (depth === 0) { end = i; break }
  }
  const block = content.slice(start, end + 1)
  const caseCount = (block.match(/\bcase\s+/g) || []).length
  if (caseCount >= 5) {
    const line = content.slice(0, start).split('\n').length
    warnings.push(`L${line}: switch ${caseCount} cases`)
  }
}

// 같은 변수에 대한 if-else 체인 감지: 5개 이상
const lines = content.split('\n')
let chainCount = 0
let chainStart = 0
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim()
  if (/^if\s*\(/.test(trimmed) || /^}\s*else\s+if\s*\(/.test(trimmed) || /^else\s+if\s*\(/.test(trimmed)) {
    if (chainCount === 0) chainStart = i + 1
    chainCount++
  } else if (chainCount > 0 && !/^}\s*else\s*\{/.test(trimmed) && !/^\}$/.test(trimmed)) {
    if (chainCount >= 5) {
      warnings.push(`L${chainStart}: if-else chain ${chainCount} branches`)
    }
    chainCount = 0
  }
}
if (chainCount >= 5) {
  warnings.push(`L${chainStart}: if-else chain ${chainCount} branches`)
}

if (warnings.length > 0) {
  const name = filePath.split('/src/')[1] || filePath
  process.stderr.write(
    `\u26a0\ufe0f OCP: ${name} \u2014 ${warnings.join(', ')}. \ubd84\uae30\uac00 \uc5f4\ub9b0 \uc9d1\ud569\uc774\uba74 /ocp \uc2a4\ud0ac\ub85c \uc120\uc5b8\uc801 \ub9f5 \uc804\ud658\uc744 \uac80\ud1a0\ud558\uc138\uc694.`
  )
}
