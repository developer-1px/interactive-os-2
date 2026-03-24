#!/usr/bin/env node

/**
 * PostToolUse hook: CSS/TSX 파일에서 raw 수치를 감지한다.
 *
 * 원칙: 디자인 속성에 raw 숫자가 있으면 위반. 어떤 토큰을 쓸지는 안내하지 않는다.
 * "수치가 있으니 토큰을 쓰라"만 경고한다.
 *
 * 제외: tokens.css(정의 파일), landingTokens.css, node_modules, 테스트 파일
 */

import { readFileSync } from 'fs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

if (
  filePath.includes('tokens.css') ||
  filePath.includes('landingTokens.css') ||
  filePath.includes('node_modules') ||
  filePath.includes('.test.') ||
  filePath.includes('__tests__')
) {
  process.exit(0)
}

const isCSS = /\.css$/.test(filePath)
const isTSX = /\.[tj]sx?$/.test(filePath)
if (!isCSS && !isTSX) process.exit(0)

let content
try {
  content = readFileSync(filePath, 'utf8')
} catch {
  process.exit(0)
}

/**
 * CSS 속성 → 토큰 카테고리 매핑
 * raw 숫자(px, bare number)가 보이면 해당 카테고리의 토큰을 쓰라고 경고
 */
const CSS_RULES = [
  { prop: 'font-size',      token: '--text-*',    regex: /font-size:\s*(\d+(?:\.\d+)?px)/g },
  { prop: 'padding',        token: '--space-*',   regex: /padding:\s*([^;]*\d+px)/g },
  { prop: 'margin',         token: '--space-*',   regex: /margin:\s*([^;]*\d+px)/g },
  { prop: 'gap',            token: '--space-*',   regex: /gap:\s*(\d+(?:\.\d+)?px)/g },
  { prop: 'border-radius',  token: '--radius*',   regex: /border-radius:\s*([^;]*\d+px)/g },
  { prop: 'line-height',    token: '--leading-*',  regex: /line-height:\s*(\d+\.\d+)\s*;/g },
  { prop: 'box-shadow',     token: '--shadow-*',  regex: /box-shadow:\s*([^;]*rgba\([^)]+\)[^;]*)/g },
  { prop: 'font-family',    token: '--sans/--mono', regex: /font-family:\s*(?!var\()([^;]+)/g },
]

/**
 * TSX inline style 속성 → 토큰 카테고리
 */
const TSX_RULES = [
  { prop: 'fontSize',       token: '--text-*',    regex: /fontSize:\s*(?:(\d+)|['"](\d+(?:\.\d+)?px)['"])/g },
  { prop: 'padding',        token: '--space-*',   regex: /padding:\s*['"]([^'"]*\d+px[^'"]*)['"]/g },
  { prop: 'margin',         token: '--space-*',   regex: /margin:\s*['"]([^'"]*\d+px[^'"]*)['"]/g },
  { prop: 'gap',            token: '--space-*',   regex: /gap:\s*(?:(\d+)|['"](\d+px)['"])/g },
  { prop: 'borderRadius',   token: '--radius*',   regex: /borderRadius:\s*(?:(\d+)|['"](\d+px)['"])/g },
  { prop: 'lineHeight',     token: '--leading-*',  regex: /lineHeight:\s*(\d+\.\d+)/g },
  { prop: 'fontFamily',     token: '--sans/--mono', regex: /fontFamily:\s*['"](?!var\()([^'"]+)['"]/g },
  { prop: 'paddingLeft',    token: '--space-*',   regex: /paddingLeft:\s*(\d+)(?!\s*[+*])/g },
  { prop: 'paddingRight',   token: '--space-*',   regex: /paddingRight:\s*(\d+)/g },
  { prop: 'paddingTop',     token: '--space-*',   regex: /paddingTop:\s*(\d+)/g },
  { prop: 'paddingBottom',  token: '--space-*',   regex: /paddingBottom:\s*(\d+)/g },
  { prop: 'marginLeft',     token: '--space-*',   regex: /marginLeft:\s*(?:(\d+)|['"](\d+px)['"])/g },
  { prop: 'marginRight',    token: '--space-*',   regex: /marginRight:\s*(?:(\d+)|['"](\d+px)['"])/g },
  { prop: 'marginTop',      token: '--space-*',   regex: /marginTop:\s*(?:(\d+)|['"](\d+px)['"])/g },
  { prop: 'marginBottom',   token: '--space-*',   regex: /marginBottom:\s*(?:(\d+)|['"](\d+px)['"])/g },
]

const warnings = []

function lineNum(text, index) {
  return text.substring(0, index).split('\n').length
}

function isVarLine(line) {
  return line.includes('var(--')
}

function isZeroValue(match) {
  // "0", "0px" — 허용
  return /^0(px)?$/.test(match.trim())
}

if (isCSS) {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('/*') || line.startsWith('//') || isVarLine(line)) continue

    for (const rule of CSS_RULES) {
      rule.regex.lastIndex = 0
      const m = rule.regex.exec(line)
      if (m && !isZeroValue(m[1] || '')) {
        warnings.push(`  L${i + 1}: ${rule.prop} — raw 값 감지, var(${rule.token}) 사용`)
      }
    }
  }
}

if (isTSX) {
  for (const rule of TSX_RULES) {
    rule.regex.lastIndex = 0
    let m
    while ((m = rule.regex.exec(content)) !== null) {
      const val = m[1] || m[2] || ''
      if (isZeroValue(val)) continue
      // var( 참조는 건너뛴다
      if (val.includes('var(')) continue
      const ln = lineNum(content, m.index)
      warnings.push(`  L${ln}: ${rule.prop} — raw 값 '${val}', var(${rule.token}) 사용`)
    }
  }
}

if (warnings.length > 0) {
  const msg = [
    `⚠️ 디자인 토큰 미사용 (${warnings.length}건):`,
    ...warnings.slice(0, 10),
    ...(warnings.length > 10 ? [`  ... 외 ${warnings.length - 10}건`] : []),
    '',
    '원칙: 디자인 속성에 raw 숫자 금지. tokens.css에 토큰 추가 후 참조.',
  ].join('\n')
  process.stderr.write(msg)
}
