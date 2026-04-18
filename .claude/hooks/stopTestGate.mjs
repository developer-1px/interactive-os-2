#!/usr/bin/env node

/**
 * Stop hook — src/ 코드 변경 시 테스트 실행 강제
 *
 * Claude가 작업 완료하려 할 때:
 * 1. 세션 중 src/ 파일이 수정되었는지 확인 (agent-ops 로그)
 * 2. 테스트/타입체크 관련 Bash 실행이 있었는지 확인 (transcript)
 * 3. 코드 수정은 있는데 테스트 실행이 없으면 → block
 *
 * 판단 기준: stop_reason이 'end_turn'일 때만 (tool_use 중에는 무시)
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))

// end_turn일 때만 검사 (tool_use 중에는 패스)
if (input.stop_reason !== 'end_turn') process.exit(0)

// session_id로 agent-ops 로그에서 수정 파일 확인
const sessionId = input.session_id
if (!sessionId) process.exit(0)

const opsDir = join(__dirname, '..', 'agent-ops')
const opsFile = join(opsDir, `${sessionId}.ndjson`)

if (!existsSync(opsFile)) process.exit(0)

const ops = readFileSync(opsFile, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(line => { try { return JSON.parse(line) } catch { return null } })
  .filter(Boolean)

// src/ 하위 코드 파일(.ts/.tsx) 수정이 있었는지 (테스트 파일 제외)
const srcEdits = ops.filter(op =>
  op.file?.includes('/src/') &&
  /\.[tj]sx?$/.test(op.file) &&
  !op.file.includes('.test.') &&
  !op.file.includes('__tests__')
)

if (srcEdits.length === 0) process.exit(0)

// agent-ops 로그에서 테스트/타입체크 Bash 실행 여부 확인
const bashOps = ops.filter(op => op.tool === 'Bash' && op.command)
const testOps = bashOps.filter(op =>
  /pnpm test|vitest|pnpm typecheck|tsc/.test(op.command)
)

const hasTestRun = testOps.length > 0

// 테스트 실행이 있었더라도 마지막 테스트의 exit_code가 실패면 block
if (hasTestRun) {
  const lastTest = testOps[testOps.length - 1]
  if (lastTest.exit_code != null && lastTest.exit_code !== 0) {
    const failReason = [
      `마지막 테스트가 실패했습니다 (exit code: ${lastTest.exit_code}):`,
      `  $ ${lastTest.command}`,
      '',
      '테스트를 통과시킨 뒤 완료하세요.',
    ].join('\n')
    process.stdout.write(JSON.stringify({ decision: 'block', reason: failReason }))
    process.exit(0)
  }
  process.exit(0)
}

// 코드 수정은 있는데 테스트 실행 흔적이 없음
const editedFiles = [...new Set(srcEdits.map(op => op.file.split('/src/')[1]))]
const reason = [
  `src/ 코드 ${editedFiles.length}개 파일 수정됨 — 테스트를 실행하세요:`,
  ...editedFiles.slice(0, 5).map(f => `  - src/${f}`),
  ...(editedFiles.length > 5 ? [`  ... 외 ${editedFiles.length - 5}개`] : []),
  '',
  '`pnpm test` 또는 관련 테스트 파일을 실행한 뒤 완료하세요.',
].join('\n')

process.stdout.write(JSON.stringify({ decision: 'block', reason }))
