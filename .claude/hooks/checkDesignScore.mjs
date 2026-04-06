#!/usr/bin/env node

/**
 * PostToolUse hook: CSS/TSX 수정 후 디자인 점수 관련 정적 분석.
 *
 * 검증: style={} 사용, 이모지/특수기호 상태 표현, module.css 해치 증가.
 * designScoreVisual.mjs(Puppeteer)는 호출하지 않는다 — 정적 분석만.
 */

import { readFileSync } from 'fs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

// 제외
if (filePath.includes('__tests__') || filePath.includes('node_modules')) {
  process.exit(0)
}

// 확장자 필터
if (!/\.(tsx?|css)$/.test(filePath)) process.exit(0)

// UI 관련 경로만
const UI_PATHS = ['src/interactive-os/ui/', 'src/pages/', 'src/styles/']
if (!UI_PATHS.some(p => filePath.includes(p))) process.exit(0)

const isTSX = /\.tsx$/.test(filePath)
const isModuleCSS = /\.module\.css$/.test(filePath)

const warnings = []

// --- a. module.css 해치 증가 감지 (Edit tool) ---
if (isModuleCSS && input.tool_input?.new_string != null) {
  const oldLines = (input.tool_input.old_string ?? '').split('\n').length
  const newLines = input.tool_input.new_string.split('\n').length
  const delta = newLines - oldLines
  if (delta > 0) {
    warnings.push(`module.css +${delta}줄 증가 → 해치 증가 주의`)
  }
}

// TSX 파일 분석 (stdin에서 content 사용 — disk I/O 불필요)
if (isTSX) {
  const content =
    input.tool_name === 'Write'
      ? (input.tool_input?.content ?? '')
      : (input.tool_input?.new_string ?? '')
  if (!content) process.exit(0)

  const lines = content.split('\n')

  // --- b. style={} 감지 ---
  for (let i = 0; i < lines.length; i++) {
    if (/style=\{/.test(lines[i])) {
      warnings.push(`style={} 사용 감지 (line ~${i + 1}) → ax() 사용 필수`)
    }
  }

  // --- c. 이모지/특수기호 상태 표현 감지 ---
  const EMOJI_RE = /[⚠✓✗🟢🔴▾▸●○★]/g
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(EMOJI_RE)
    if (m) {
      warnings.push(`이모지 상태 표현 (${m[0]}) line ~${i + 1} → indicators/ 컴포넌트 사용`)
    }
  }
}

if (warnings.length > 0) {
  const msg = [
    '⚠️ Design check:',
    ...warnings.map(w => `  - ${w}`),
    '',
    '9/10 미만이면 /improve-design 스킬로 시각 검증 권장',
  ].join('\n')
  process.stderr.write(msg)
}

process.exit(0)
