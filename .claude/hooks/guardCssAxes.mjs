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

// CSS 파일만 대상
if (!/\.css$/.test(filePath)) process.exit(0)

// 디자인 시스템 정의 파일 + 테스트 제외
const EXEMPT = ['tokens.css', 'axes.css', 'palette.css', 'reset.css', 'layers.css', 'structure.css', 'interactive.css', 'ax.css', 'app.css', 'layout.css', 'landingTokens.css']
if (EXEMPT.some(f => filePath.endsWith(f)) || filePath.includes('__tests__')) process.exit(0)

const content =
  input.tool_name === 'Write'
    ? (input.tool_input?.content ?? '')
    : (input.tool_input?.new_string ?? '')

if (!content) process.exit(0)

// 속성별 ax() 대체 경로 안내
const AX_ALTERNATIVES = {
  // surface 소유
  'background': "ax({ surface: 'display' }) 또는 ax({ tone: 'accent' })",
  'background-color': "ax({ surface: 'display' }) 또는 ax({ tone: 'accent' })",
  'border': "ax({ border: 'subtle' }) 또는 ax({ surface: 'input' })",
  'border-color': "ax({ border: 'subtle' })",
  'border-width': "ax({ border: 'default' })",
  'border-style': "ax({ border: 'default' })",
  'box-shadow': "ax({ surface: 'overlay' })",
  'cursor': "ax({ surface: 'action' })",
  // textStyle 소유
  'font-size': "ax({ textStyle: 'caption' | 'body' | 'label' | ... })",
  'font-weight': "ax({ weight: 'medium' | 'semi' | 'bold' }) 또는 ax({ textStyle: '...' })",
  'line-height': "ax({ textStyle: '...' })",
  'letter-spacing': "ax({ textStyle: '...' })",
  // text/tone 소유
  'color': "ax({ text: 'primary' | 'secondary' | 'muted' }) 또는 ax({ tone: '...' })",
  // shape 소유
  'border-radius': "ax({ shape: 'sm' | 'md' | 'lg' | 'pill' }) 또는 ax({ controlSize: 'md' })",
  // opacity 소유
  'opacity': "ax({ opacity: 'dim' | 'faint' | 'hidden' })",
  // motion 소유
  'animation': "ax({ motion: 'pulse' | 'spin' | 'fade-in' })",
  'animation-name': "ax({ motion: '...' })",
  // layout 소유
  'display': "ax({ layout: 'row' | 'column' | 'bar' | 'spread' | 'stack' })",
  'flex-direction': "ax({ layout: 'row' | 'column' })",
  'align-items': "ax({ layout: 'bar' | 'center' })",
  'justify-content': "ax({ layout: 'spread' | 'center' })",
  // gap 소유
  'gap': "ax({ gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl' })",
  'row-gap': "ax({ gap: '...' })",
  'column-gap': "ax({ gap: '...' })",
  // padding 소유
  'padding': "ax({ padding: 'xs' | 'sm' | 'md' | 'lg' | 'xl' })",
  'padding-top': "ax({ padding: '...' })",
  'padding-right': "ax({ padding: '...' })",
  'padding-bottom': "ax({ padding: '...' })",
  'padding-left': "ax({ padding: '...' })",
  'padding-inline': "ax({ padding: '...' })",
  'padding-block': "ax({ padding: '...' })",
  'padding-inline-start': "ax({ padding: '...' })",
  'padding-inline-end': "ax({ padding: '...' })",
  // width 소유
  'width': "ax({ width: 'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg' })",
  'min-width': "ax({ width: '...' })",
  'max-width': "ax({ width: '...' })",
  // flex 소유
  'flex': "ax({ flex: 'none' | 'auto' | '1' })",
  'flex-grow': "ax({ flex: '...' })",
  'flex-shrink': "ax({ flex: '...' })",
  'flex-basis': "ax({ flex: '...' })",
  // size 소유
  'height': "ax({ size: 'sm' | 'md' | 'lg' }) 또는 ax({ controlSize: 'md' })",
  'min-height': "ax({ controlSize: '...' })",
  'max-height': "ax({ size: '...' })",
  // clamp 소유
  'text-overflow': "ax({ clamp: '1' })",
  'white-space': "ax({ clamp: '1' | 'pre' })",
  '-webkit-line-clamp': "ax({ clamp: '2' | '3' | '4' })",
  // scroll 소유
  'overflow': "ax({ scroll: 'hidden' | 'y' | 'x' | 'auto' })",
  'overflow-x': "ax({ scroll: 'x' })",
  'overflow-y': "ax({ scroll: 'y' })",
  // placement 소유
  'position': "ax({ placement: 'above' | 'below' | 'sticky' | 'viewport' })",
  'top': "ax({ placement: '...' })",
  'bottom': "ax({ placement: '...' })",
  'left': "ax({ placement: '...' })",
  'right': "ax({ placement: '...' })",
  'inset': "ax({ placement: '...' })",
  'inset-inline-start': "ax({ placement: '...' })",
  'inset-inline-end': "ax({ placement: '...' })",
  'inset-block-start': "ax({ placement: '...' })",
  'inset-block-end': "ax({ placement: '...' })",
}

// 상태 선택자 감지
const STATE_SELECTORS = [':hover', ':focus', ':active', ':disabled', ':focus-visible', ':focus-within']

// AX_ALTERNATIVES에서 파생 — 단일 소스
const AX_OWNED_PROPS = Object.keys(AX_ALTERNATIVES)

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
        const value = trimmed.split(':').slice(1).join(':').trim().replace(/;$/, '').trim()
        // var()/calc()/min()/max()/clamp() 사용, inherit/initial/unset/none/0, 퍼센트값 허용
        if (/^(?:var|calc|min|max|clamp)\(/.test(value)) continue
        if (/^(inherit|initial|unset|none|transparent|grid|inline|pointer|auto);?\s*$/.test(value)) continue
        // 숫자값(소수 포함, 단위/퍼센트 포함) — ax() 프리셋에 없는 구체 값은 last-mile
        if (/^\d*\.?\d+(%|vh|vw|dvh|dvw|svh|svw)?;?\s*$/.test(value)) continue
        // display: grid는 grid-template과 함께 사용하는 last-mile 패턴 허용
        if (prop === 'display' && /^grid\s*;?\s*$/.test(value)) continue
        // white-space: pre-wrap/nowrap/pre-line/break-spaces는 ax() clamp에 없는 last-mile
        if (prop === 'white-space' && /^(pre-wrap|nowrap|pre-line|break-spaces)\s*;?\s*$/.test(value)) continue
        // align-items: center가 grid 컨텍스트(grid-template 있는 블록)에 있으면 허용
        if (prop === 'align-items' && /^center\s*;?\s*$/.test(value) && /grid-template/.test(content)) continue
        // 퍼센트, vh/vw/dvh 단위 값은 ax() 프리셋으로 표현 불가 → last-mile 허용
        if (/^\d+(\.\d+)?(%|vh|vw|dvh|dvw|svh|svw)\s*;?\s*$/.test(value)) continue
        violations.push(prop)
        break
      }
    }
  }
}

// 상태 선택자 감지 (셀렉터 컨텍스트만 — 값이나 주석 내 매칭 방지)
const stateViolations = []
for (const selector of STATE_SELECTORS) {
  // 셀렉터 뒤에 공백이나 {가 오는 패턴만 매칭
  const re = new RegExp(`[.\\[\\w\\]]${selector.replaceAll(':', '\\:')}[\\s,{]`)
  if (re.test(content)) {
    stateViolations.push(selector)
  }
}

// 중복 제거
const unique = [...new Set(violations)]

if (unique.length > 0 || stateViolations.length > 0) {
  const lines = []

  if (unique.length > 0) {
    lines.push(`ax() 소유 속성 ${unique.length}건 감지 — module.css는 last-mile만:`)
    lines.push(...unique.map(p => `  - ${p} → ${AX_ALTERNATIVES[p] ?? 'ax()로 이동'}`))
    lines.push('')
  }

  if (stateViolations.length > 0) {
    lines.push(`상태 선택자 ${stateViolations.length}건 감지:`)
    lines.push(...stateViolations.map(s => `  - ${s}`))
    lines.push("  → ax({ interactive: 'item' | 'tab' | 'button' | ... }) 사용 — interactive 축이 상태 스타일 소유")
    lines.push('')
  }

  lines.push("import { ax } from '@styles/ax'")
  lines.push('module.css에는 z-index, transform, grid-template, ::before/::after 등 축에 없는 속성만.')

  process.stdout.write(JSON.stringify({ decision: 'block', reason: lines.join('\n') }))
}
