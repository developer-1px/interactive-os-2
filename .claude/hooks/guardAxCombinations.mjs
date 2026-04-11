#!/usr/bin/env node

/**
 * PreToolUse:Write|Edit hook — ax() 축 조합 불변 규칙 검증
 *
 * R1: surface:'action' → tone 필수
 *   action surface는 시각적 존재감을 위해 tone이 반드시 있어야 한다.
 *   tone 없는 action은 neutral 기본값이라 배경이 투명에 가까워 안 보인다.
 */

import { readFileSync } from 'fs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

// tsx/ts 파일만 대상
if (!/\.[tj]sx?$/.test(filePath)) process.exit(0)

// 테스트·pattern/examples 제외
if (filePath.includes('__tests__') || /\.test\.[tj]sx?$/.test(filePath) || filePath.includes('pattern/examples')) process.exit(0)

const content =
  input.tool_name === 'Write'
    ? (input.tool_input?.content ?? '')
    : (input.tool_input?.new_string ?? '')

if (!content) process.exit(0)

const violations = []

// R1: surface:'action' → tone 필수
// ax({ ... surface: 'action' ... }) 에서 tone이 없는 경우
const axCallRegex = /ax\(\{([^}]+)\}\)/g
let match

while ((match = axCallRegex.exec(content)) !== null) {
  const body = match[1]

  // surface: 'action' 또는 surface: "action" 확인
  const hasActionSurface = /surface:\s*['"]action['"]/.test(body)
  if (!hasActionSurface) continue

  // tone이 있는지 확인 (정적 값 또는 변수)
  const hasTone = /tone:/.test(body)
  if (hasTone) continue

  // 위반
  const lineNum = content.substring(0, match.index).split('\n').length
  violations.push(`L${lineNum}: surface:'action'에 tone이 없음 — ax({ surface: 'action', tone: '...' }) 필수`)
}

if (violations.length > 0) {
  console.error(`ax() 조합 위반 ${violations.length}건:\n  ${violations.join('\n  ')}\n\nsurface:'action'은 tone 없이 사용하면 시각적 존재감이 없습니다.\nax({ surface: 'action', tone: 'accent' }) 처럼 tone을 명시하세요.`)
  process.exit(1)
}
