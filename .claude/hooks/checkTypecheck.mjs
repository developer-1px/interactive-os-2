#!/usr/bin/env node

/**
 * PostToolUse:Edit|Write hook (async) — tsgo로 타입 체크
 *
 * 수정된 파일이 src/ 하위 .ts/.tsx면 tsgo 전체 프로젝트 체크 실행,
 * 에러가 있으면 stderr로 출력하여 LLM에게 피드백.
 */

import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

// src/ 하위 ts/tsx만 대상
if (!filePath.includes('/src/') || !/\.[tj]sx?$/.test(filePath)) process.exit(0)

// 테스트 파일 제외
if (filePath.includes('.test.') || filePath.includes('__tests__')) process.exit(0)

// 프로젝트 루트 찾기
let projectRoot = dirname(filePath)
while (projectRoot !== '/' && !existsSync(resolve(projectRoot, 'tsconfig.tsgo.json'))) {
  projectRoot = dirname(projectRoot)
}
if (!existsSync(resolve(projectRoot, 'tsconfig.tsgo.json'))) process.exit(0)

try {
  execSync('npx @typescript/native-preview --noEmit -p tsconfig.tsgo.json', {
    cwd: projectRoot,
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
} catch (err) {
  const output = (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '')
  if (!output.trim()) process.exit(0)

  const lines = output.split('\n').filter(l => l.includes('error TS'))
  if (lines.length === 0) process.exit(0)

  const msg = [
    `\u26a0\ufe0f tsgo 타입 에러 ${lines.length}건:`,
    ...lines.slice(0, 15),
    ...(lines.length > 15 ? [`  ... 외 ${lines.length - 15}건`] : []),
  ].join('\n')

  process.stderr.write(msg)
}
