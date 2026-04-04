#!/usr/bin/env node

/**
 * PostToolUse:Edit|Write hook — 300줄 초과 파일 감지
 *
 * src/ 하위 ts/tsx 파일이 300줄을 넘으면 /srp 스킬 사용을 제안한다.
 */

import { readFileSync, statSync } from 'fs'

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

const lineCount = content.split('\n').length
if (lineCount > 300) {
  process.stderr.write(
    `⚠️ ${filePath.split('/src/')[1]} — ${lineCount}줄 (300줄 초과). /srp 스킬로 책임 분리를 검토하세요.`
  )
}
