#!/usr/bin/env node

/**
 * PreToolUse:Write|Edit hook — 코드 안티패턴 차단
 *
 * 규칙 1: import('...') 인라인 타입 금지 — import type 사용
 * 규칙 2: toHaveBeenCalled* mock 호출 검증 금지 — DOM/ARIA 상태 검증
 * 규칙 3: docs/3-resources/ 파일명 형식 — {순번}-[{태그}]{제목}.md
 */

import { readFileSync } from 'fs'
import { basename } from 'path'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const toolName = input.tool_name
const filePath = input.tool_input?.file_path ?? ''

const content =
  toolName === 'Write'
    ? (input.tool_input?.content ?? '')
    : (input.tool_input?.new_string ?? '')

if (!content) process.exit(0)

const violations = []

// 규칙 1: 함수 시그니처에 import('...') 인라인 타입 사용 금지
// src/ 하위 ts/tsx만. import() 동적 import 구문은 허용 — 타입 위치의 import()만 차단
if (filePath.includes('/src/') && /\.[tj]sx?$/.test(filePath)) {
  // 패턴: `: import('...')` 또는 `<import('...')>` — 타입 위치의 import()
  if (/:\s*import\s*\(|<import\s*\(/.test(content)) {
    violations.push(
      'import(\'...\') 인라인 타입 금지 — import type { Foo } from \'...\' 사용'
    )
  }
}

// 규칙 4: @styles/ import 경로 — @/styles/ 금지
if (filePath.includes('/src/') && /\.[tj]sx?$/.test(filePath)) {
  if (/from\s+['"]@\/styles\//.test(content)) {
    violations.push(
      '@/styles/ 경로 금지 — @styles/ (슬래시 없이) 사용'
    )
  }
}

// 규칙 2: toHaveBeenCalled* mock 호출 검증 금지
// 예외: userEvent/user.keyboard/user.click이 있는 테스트 — 콜백 prop 계약 검증은 허용
if (/\.(test|spec)\.[tj]sx?$/.test(filePath)) {
  if (/toHaveBeenCalled\b/.test(content)) {
    // 작성 중인 내용에 user interaction이 있으면 콜백 검증으로 간주 → 허용
    const hasUserInteraction = /\buser\s*\.\s*(?:keyboard|click|type|tab|pointer|hover|setup)\b|\buserEvent\b/.test(content)
    // 파일 전체도 확인 (Edit의 경우 new_string만 오므로 파일 전체에 interaction이 있을 수 있음)
    let fileHasInteraction = hasUserInteraction
    if (!fileHasInteraction && filePath) {
      try {
        const fileContent = readFileSync(filePath, 'utf8')
        fileHasInteraction = /\buser\s*\.\s*(?:keyboard|click|type|tab|pointer|hover|setup)\b|\buserEvent\b/.test(fileContent)
      } catch { /* file may not exist yet */ }
    }
    if (!fileHasInteraction) {
      violations.push(
        'toHaveBeenCalled* mock 검증 금지 — DOM/ARIA 상태를 직접 검증하세요. 예: expect(el).toHaveAttribute(\'aria-selected\', \'true\'), expect(el).toHaveFocus(), screen.getByRole(...). 콜백 prop 검증은 user interaction(userEvent)이 있는 테스트에서만 허용됩니다.'
      )
    }
  }
}

// 규칙 3: docs/3-resources/ 파일명 형식
if (filePath.includes('/docs/3-resources/') && filePath.endsWith('.md') && toolName === 'Write') {
  const name = basename(filePath)
  if (!/^\d+-\[[^\]]+\].+\.md$/.test(name)) {
    violations.push(
      `docs/3-resources 파일명 형식 위반: "${name}" → {순번}-[{태그}]{제목}.md`
    )
  }
}

if (violations.length > 0) {
  const reason = [
    `코드 패턴 위반 ${violations.length}건:`,
    ...violations.map((v, i) => `  ${i + 1}. ${v}`),
  ].join('\n')

  process.stdout.write(JSON.stringify({ decision: 'block', reason }))
}
