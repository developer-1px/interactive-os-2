#!/usr/bin/env node

/**
 * PostToolUse hook: Edit/Write로 CSS/TSX 파일 수정 시
 * 날코딩(hardcoded) 값을 감지하고 토큰 대안을 제안한다.
 *
 * tokens.css 자체는 검사하지 않는다 (토큰 정의 파일).
 */

import { readFileSync } from 'fs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

// tokens.css 자체, node_modules, test 파일은 건너뛴다
if (
  filePath.includes('tokens.css') ||
  filePath.includes('landingTokens.css') ||
  filePath.includes('node_modules') ||
  filePath.includes('.test.') ||
  filePath.includes('__tests__')
) {
  process.exit(0)
}

// CSS 또는 TSX 파일만 검사
const isCSS = /\.(css|module\.css)$/.test(filePath)
const isTSX = /\.(tsx|jsx)$/.test(filePath)
if (!isCSS && !isTSX) process.exit(0)

let content
try {
  content = readFileSync(filePath, 'utf8')
} catch {
  process.exit(0)
}

const TOKEN_MAP = {
  // font-size
  'font-size: 9px':  'var(--text-xs)',
  'font-size: 10px': 'var(--text-xs)',
  'font-size: 11px': 'var(--text-xs)',
  'font-size: 12px': 'var(--text-sm)',
  'font-size: 13px': 'var(--text-sm)',
  'font-size: 14px': 'var(--text-md)',
  'font-size: 15px': 'var(--text-md)',
  'font-size: 16px': 'var(--text-md)',
  'font-size: 17px': 'var(--text-lg)',
  'font-size: 18px': 'var(--text-lg)',
  'font-size: 20px': 'var(--text-xl)',
  'font-size: 22px': 'var(--text-xl)',
  'font-size: 24px': 'var(--text-2xl)',
  // border-radius
  'border-radius: 4px':  'var(--radius-xs)',
  'border-radius: 6px':  'var(--radius-sm)',
  'border-radius: 8px':  'var(--radius-sm)',
  'border-radius: 10px': 'var(--radius)',
  'border-radius: 12px': 'var(--radius)',
}

// TSX inline style patterns: fontSize: 10, fontSize: '12px'
const TSX_PATTERNS = [
  { regex: /fontSize:\s*(\d+)(?!\s*[%e])/g, prop: 'fontSize (number)' },
  { regex: /fontSize:\s*['"](\d+)px['"]/g, prop: 'fontSize (string)' },
]

const FONT_SIZE_MAP = {
  9: '--text-xs', 10: '--text-xs', 11: '--text-xs',
  12: '--text-sm', 13: '--text-sm',
  14: '--text-md', 15: '--text-md', 16: '--text-md',
  17: '--text-lg', 18: '--text-lg',
  20: '--text-xl', 22: '--text-xl',
  24: '--text-2xl', 26: '--text-2xl',
}

const warnings = []

if (isCSS) {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    for (const [pattern, token] of Object.entries(TOKEN_MAP)) {
      if (line.includes(pattern) && !line.includes('var(')) {
        warnings.push(`  L${i + 1}: ${pattern} → ${token}`)
      }
    }
  }
}

if (isTSX) {
  for (const { regex, prop } of TSX_PATTERNS) {
    let match
    while ((match = regex.exec(content)) !== null) {
      const val = parseInt(match[1])
      const token = FONT_SIZE_MAP[val]
      if (token) {
        const lineNum = content.substring(0, match.index).split('\n').length
        warnings.push(`  L${lineNum}: ${prop} ${val} → var(${token})`)
      }
    }
  }
}

if (warnings.length > 0) {
  const msg = [
    `⚠️ 날코딩 감지 (${warnings.length}건) — 디자인 토큰을 사용하세요:`,
    ...warnings,
    '',
    '참고: src/styles/tokens.css',
  ].join('\n')
  // stderr로 경고 출력 (hook feedback)
  process.stderr.write(msg)
}
