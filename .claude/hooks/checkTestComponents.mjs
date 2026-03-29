#!/usr/bin/env node

/**
 * PostToolUse hook: 테스트 파일에 자체 컴포넌트 정의가 있으면 경고.
 * 차단하지 않음 — additionalContext로 모델에 피드백만 전달.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { execFileSync } from 'child_process'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

// .test.tsx/.test.ts 파일만 검사
if (!/\.test\.tsx?$/.test(filePath)) process.exit(0)

const root = resolve(import.meta.dirname, '..', '..')
const scriptPath = resolve(root, 'scripts/checkTestComponents.mjs')

let output
try {
  output = execFileSync('node', [scriptPath], { cwd: root, encoding: 'utf8', timeout: 5000 })
  // exit 0 = clean
  process.exit(0)
} catch (err) {
  // exit 1 = violations found, stdout has the report
  output = err.stdout || ''
}

// 방금 작성한 파일이 위반 목록에 있는지 확인
const relPath = filePath.startsWith(root) ? filePath.slice(root.length + 1) : filePath
const fileViolations = output.split('\n').filter(line =>
  line.trim().startsWith(relPath) || (line.trim().startsWith('L') && output.includes(relPath))
)

if (!output.includes(relPath)) process.exit(0)

// 해당 파일의 위반만 추출
const lines = output.split('\n')
const relevant = []
let capturing = false
for (const line of lines) {
  if (line.trim() === relPath) {
    capturing = true
    continue
  }
  if (capturing && line.startsWith('    L')) {
    relevant.push(line.trim())
  } else if (capturing && !line.startsWith('    ')) {
    capturing = false
  }
}

if (relevant.length === 0) process.exit(0)

const msg = JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    additionalContext: [
      `⚠️ 테스트 컴포넌트 위반 (${relPath}):`,
      ...relevant,
      '',
      '규칙: 테스트 파일에서 자체 컴포넌트 정의 금지.',
      'showcase Page를 import하여 render해야 합니다.',
      '불가피한 hook harness는 // @test-harness 주석으로 억제.',
    ].join('\n'),
  },
})

process.stdout.write(msg)
