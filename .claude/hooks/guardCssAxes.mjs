#!/usr/bin/env node

/**
 * PreToolUse:Write|Edit hook — module.css에서 ax() 소유 속성 사용 차단
 *
 * ax() 12축이 소유하는 CSS 속성은 module.css에 직접 쓸 수 없다.
 * module.css는 last-mile(축에 없는 속성)만 허용한다.
 */

import { readFileSync } from 'fs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

// module.css만 대상
if (!/\.module\.css$/.test(filePath)) process.exit(0)

// tokens.css, 테스트 제외
if (filePath.includes('tokens.css') || filePath.includes('__tests__')) process.exit(0)

const content =
  input.tool_name === 'Write'
    ? (input.tool_input?.content ?? '')
    : (input.tool_input?.new_string ?? '')

if (!content) process.exit(0)

// ax() 축이 소유하는 CSS 속성 (축별 그룹)
// 이 속성들은 ax()로 제어해야 하며 module.css에 직접 쓸 수 없다
const AX_OWNED_PROPS = [
  // surface: bg, border, shadow, cursor
  'background', 'background-color', 'border', 'border-color', 'border-width', 'border-style',
  'box-shadow', 'cursor',
  // controlSize + textStyle + text + weight
  'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color',
  // shape
  'border-radius',
  // opacity
  'opacity',
  // motion
  'animation', 'animation-name',
  // layout
  'display', 'flex-direction', 'align-items', 'justify-content',
  // gap
  'gap', 'row-gap', 'column-gap',
  // padding (margin은 ax에 없으므로 last-mile)
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-inline', 'padding-block', 'padding-inline-start', 'padding-inline-end',
  // width
  'width', 'min-width', 'max-width',
  // flex
  'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
  // icon (width/height 이미 포함)
  'height', 'min-height', 'max-height',
  // clamp
  'text-overflow', 'white-space', '-webkit-line-clamp',
  // overflow (layout 축 소유)
  'overflow', 'overflow-x', 'overflow-y',
  // placement 축 소유
  'position', 'top', 'bottom', 'left', 'right', 'inset',
  'inset-inline-start', 'inset-inline-end', 'inset-block-start', 'inset-block-end',
]

// 속성명 → 정규식 (줄 단위로 매칭)
const propPatterns = AX_OWNED_PROPS.map(prop => ({
  prop,
  regex: new RegExp(`^\\s*${prop.replaceAll('-', '\\-')}\\s*:`, 'm'),
}))

const violations = []

for (const { prop, regex } of propPatterns) {
  if (regex.test(content)) {
    // var() 참조만 사용하는 경우는 허용 (토큰 바인딩)
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (new RegExp(`^${prop.replaceAll('-', '\\-')}\\s*:`).test(trimmed)) {
        const value = trimmed.split(':').slice(1).join(':').trim()
        // var()만 사용 또는 inherit/initial/unset/none/0 은 허용
        if (/^var\(/.test(value)) continue
        if (/^(inherit|initial|unset|none|0);?\s*$/.test(value)) continue
        violations.push(prop)
        break
      }
    }
  }
}

// 중복 제거
const unique = [...new Set(violations)]

if (unique.length > 0) {
  const reason = [
    `ax() 소유 속성 ${unique.length}건 감지 — module.css는 last-mile만:`,
    ...unique.map(p => `  - ${p} → ax()로 이동`),
    '',
    'module.css에는 position, z-index, transform, grid-template 등 ax()에 없는 속성만.',
    '원하는 값이 ax() 축에 없으면 ax.ts의 타입 + ax.css의 클래스를 확장한 뒤 ax()로 사용.',
  ].join('\n')

  process.stdout.write(JSON.stringify({ decision: 'block', reason }))
}
