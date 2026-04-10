#!/usr/bin/env node

/**
 * PreToolUse:Write|Edit hook — os 우회 패턴 차단
 *
 * Write/Edit 시 작성될 내용을 검사하여 interactive-os 우회 코딩을 블로킹한다.
 *
 * 차단 규칙:
 * 1. src/pages/에서 primitives 직접 import
 * 2. src/pages/에서 useAria/useAriaZone 직접 사용
 * 3. addEventListener('key*'/'mouse*') 사용
 * 4. style={{}} 인라인 스타일 사용
 * 5. onKeyDown/onKeyUp JSX 핸들러
 * 6. role="..." 수동 ARIA 역할
 * 7. aria-selected/aria-expanded 등 수동 ARIA 속성
 * 8. .focus() 수동 포커스
 * 9. useState로 인터랙션 상태 관리 (selected/expanded/focused/active/checked)
 *
 * 제외 폴더: interactive-os/ (os 내부), devtools/, styles/
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UI_DIR = resolve(__dirname, '../../src/interactive-os/ui')

function listComponents(subdir) {
  try {
    const dir = subdir ? resolve(UI_DIR, subdir) : UI_DIR
    return readdirSync(dir)
      .filter(f => /\.tsx$/.test(f) && !f.includes('.test.'))
      .map(f => f.replace('.tsx', ''))
  } catch { return [] }
}

function listComponentsWithCatalog(subdir) {
  try {
    const dir = subdir ? resolve(UI_DIR, subdir) : UI_DIR
    return readdirSync(dir)
      .filter(f => /\.tsx$/.test(f) && !f.includes('.test.'))
      .map(f => {
        const name = f.replace('.tsx', '')
        try {
          const content = readFileSync(resolve(dir, f), 'utf8')
          const match = content.match(/\/\*\*\s*@catalog\s+(.+?)\s*\*\//)
          return match ? `${name} — ${match[1]}` : name
        } catch { return name }
      })
  } catch { return [] }
}

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const toolName = input.tool_name
const filePath = input.tool_input?.file_path ?? ''

// 대상: src/ 하위 파일만
if (!filePath.includes('/src/')) process.exit(0)

// 제외: 테스트, node_modules, tokens
if (
  filePath.includes('node_modules') ||
  filePath.includes('.test.') ||
  filePath.includes('__tests__') ||
  filePath.includes('tokens.css')
) {
  process.exit(0)
}

// 검사할 내용 추출
const content =
  toolName === 'Write'
    ? (input.tool_input?.content ?? '')
    : (input.tool_input?.new_string ?? '')

if (!content) process.exit(0)

const isPages = filePath.includes('/src/pages/')
const isOsInternal = filePath.includes('/src/interactive-os/')
const isDevtools = filePath.includes('/src/devtools/')
const isStyles = filePath.includes('/src/styles/')
const isTsx = /\.[tj]sx?$/.test(filePath)

// inspector overlay — 동적 DOM 하이라이팅만 면제 (style={{}}로 position/size 계산 필수)
const INSPECTOR_OVERLAY_FILES = ['InspectorOverlay', 'inspectorUtils', 'MarqueeSelect']
const isInspectorOverlay = isDevtools && INSPECTOR_OVERLAY_FILES.some(f => filePath.includes(f))

// os 내부, styles, inspector overlay만 날코딩 규칙 제외
// devtools 일반 파일(demo, page)은 규칙 적용
const isExempt = isOsInternal || isStyles || isInspectorOverlay

const violations = []

// 규칙 1: src/pages/에서 primitives 직접 import (AriaRoute는 허용)
if (isPages && /from\s+['"].*interactive-os\/primitives(?!\/AriaRoute)/.test(content)) {
  const comps = listComponentsWithCatalog('').join(', ')
  violations.push(
    `primitives 직접 import 금지 — ui/ 완성품을 사용하세요 (AriaRoute는 예외): ${comps}`
  )
}

// 규칙 2: src/pages/에서 useAria/useAriaZone 직접 사용
if (isPages && /\buseAria(?:Zone)?\b/.test(content)) {
  const comps2 = listComponentsWithCatalog('').join(', ')
  violations.push(
    `useAria/useAriaZone 직접 사용 금지 — ui/ 완성품을 사용하세요: ${comps2}`
  )
}

// 규칙 3: addEventListener('key*'/'mouse*') — 멀티라인 대응
if (!isExempt && /addEventListener\s*\(\s*\n?\s*['"](?:key|mouse)\w*['"]/m.test(content)) {
  violations.push(
    'addEventListener(key*/mouse*) 금지 — axis의 keyMap 또는 plugin의 keyMap 선언을 사용하세요'
  )
}

// AriaZone render-props 소비자 여부 — 규칙 5, 6, 7에서 공유
// getNodeProps/AriaZone을 사용하는 파일은 OS가 생성한 props를 DOM에 전달하는 것이므로 면제
let _isAriaZoneFile = false
if (!isExempt && isTsx) {
  _isAriaZoneFile = /\bgetNodeProps\b|\bAriaZone\b/.test(content)
  if (!_isAriaZoneFile && filePath) {
    try {
      const full = readFileSync(filePath, 'utf8')
      _isAriaZoneFile = /\bgetNodeProps\b|\bAriaZone\b/.test(full)
    } catch { /* */ }
  }
}

// 규칙 5: onKeyDown/onKeyUp JSX 핸들러 — 멀티라인 대응
// 예외: AriaZone render-props 패턴 (getNodeProps에서 나온 핸들러를 DOM에 전달)
if (!isExempt && !_isAriaZoneFile && isTsx && /\bonKey(?:Down|Up)\s*=\s*\n?\s*\{/m.test(content)) {
  violations.push(
    'onKeyDown/onKeyUp 핸들러 금지 — axis의 keyMap 또는 plugin의 keyMap 선언을 사용하세요'
  )
}

// 규칙 6: role="..." 수동 ARIA 역할 (JSX에서)
// 예외: AriaZone render-props 패턴 (getNodeProps role을 DOM에 전달)
if (!isExempt && !_isAriaZoneFile && isTsx && /\brole\s*=\s*["'](?:listbox|tree|treegrid|grid|menu|menubar|tablist|combobox|radiogroup)["']/.test(content)) {
  // role → component 1:1 매핑
  const ROLE_MAP = {
    listbox: 'ListBox', tree: 'TreeView', treegrid: 'TreeGrid', grid: 'Grid',
    menu: 'MenuList', menubar: 'Menubar', tablist: 'TabList', combobox: 'Combobox',
    radiogroup: 'RadioGroup',
  }
  const detectedRole = (content.match(/\brole\s*=\s*["'](\w+)["']/)?.[1]) ?? ''
  const suggested = ROLE_MAP[detectedRole]
  violations.push(
    suggested
      ? `role="${detectedRole}" 수동 선언 금지 — ${suggested}를 사용하세요`
      : `role="..." 수동 선언 금지 — pattern이 자동 생성합니다. ui/ 완성품을 사용하세요: ${listComponentsWithCatalog('').join(', ')}`
  )
}

// 규칙 7: aria-selected/aria-expanded 등 수동 ARIA 속성
// 예외: AriaZone render-props 패턴
if (!isExempt && !_isAriaZoneFile && isTsx && /\baria-(?:selected|expanded|activedescendant|checked|pressed|current)\s*=\s*\{/.test(content)) {
  violations.push(
    'aria-* 수동 바인딩 금지 — axis(navigate/select/expand/activate/dismiss/tab/value)가 자동 생성합니다. ui/ 완성품을 사용하세요'
  )
}

// 규칙 8: .focus() 수동 포커스 관리
if (!isExempt && isTsx && /\.current\??\.\bfocus\s*\(/.test(content)) {
  violations.push(
    'ref.current.focus() 수동 포커스 금지 — engine이 포커스를 관리합니다. navigate 축 또는 focusRecovery 플러그인을 사용하세요'
  )
}

// 규칙 9: useState 전면 금지 — .tsx(컴포넌트)만. .ts(커스텀훅)는 허용
if (!isExempt && /\.tsx$/.test(filePath) && /\buseState\b/.test(content) && !/\/\/\s*@useState-hatch/.test(content)) {
  violations.push(
    'useState 금지 — OS가 모든 상태를 소유합니다. 인터랙션→축(select/expand/activate/dismiss/tab/value), 데이터→store Command, 뷰→engine. 축에 없는 상태가 필요하면 // @useState-hatch 주석으로 해치 선언하세요'
  )
}

// 규칙 10: 이모지/특수기호를 아이콘/인디케이터 대용으로 사용 금지
// 따옴표 안 어디서든 심볼이 나타나면 차단 (텍스트에 섞인 경우 포함)
const ICON_SYMBOLS = /[▾▸▶▼►◀◁△▲▽▿⚠✓✗✕✖✔✘●○◉◎★☆⬜☀☁☂☃☄☰☱☲☷⚙⚡⚠⛔⛏⛑⛓⭐🟢🔴🟡🔥❌✅⏳📌🚀💡🎯📝🔧💬📦🗑🔗📋🔍📂🕐⭕🔶🔷🟠🟣🟤⬛⬜🔲🔳▪▫◼◻⚫⚪🔘]/
if (isTsx && ICON_SYMBOLS.test(content)) {
  // 주석 라인은 제외
  const codeLines = content.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
  if (ICON_SYMBOLS.test(codeLines.join('\n'))) {
    const indicators = listComponents('indicators').join(', ')
    violations.push(
      `이모지/특수기호 아이콘 대용 금지 — lucide-react 아이콘 또는 ui/indicators/ 사용: ${indicators}`
    )
  }
}

// 규칙 11: src/pages/에서 renderItem prop 직접 전달 금지
if (isPages && isTsx && /\brenderItem\s*=\s*[\{(]/.test(content)) {
  const items = listComponents('items').join(', ')
  violations.push(
    `renderItem 직접 전달 금지 — ui/items/ 사용: ${items}. 필요하면 ui/items/에 새 Item을 추가하세요`
  )
}

// 규칙 13: src/pages/에서 renderCell prop 직접 전달 금지
if (isPages && isTsx && /\brenderCell\s*=\s*[\{(]/.test(content)) {
  const cells = listComponents('cells').join(', ')
  violations.push(
    `renderCell 직접 전달 금지 — 범용 셀은 ui/cells/ 사용: ${cells}. 도메인 셀은 entities/{엔티티}/ui/에 추가하세요`
  )
}

// 규칙 12: src/pages/에서 패널 날코딩 금지 (surface+layout:'fill' 조합 = Panel 사용)
if (isPages && isTsx && /ax\(\{[^}]*layout:\s*['"]fill['"][^}]*surface:|ax\(\{[^}]*surface:[^}]*layout:\s*['"]fill['"]/.test(content)) {
  const panels = listComponents('panels').join(', ')
  violations.push(
    `surface+layout:fill 패널 날코딩 금지 — ui/panels/ 사용: ${panels}`
  )
}

// 규칙 18: src/pages/에서 layout:'scroll' / layout:'scroll-x' 직접 사용 금지 → ScrollArea
if (isPages && isTsx && /layout:\s*['"]scroll(?:-x)?['"]/.test(content)) {
  violations.push(
    `layout:'scroll' 직접 사용 금지 — ui/ScrollArea를 사용하세요: <ScrollArea> 또는 <ScrollArea orientation="horizontal">`
  )
}

// 규칙 4: style={{ }} 인라인 리터럴 — CSS module.css, ax() 사용
// style={variable} (prop 전달)은 허용, style={{ ... }} (인라인 리터럴)만 차단
// 예외: backgroundImage, var() 만 사용하는 경우 허용
if (/\bstyle\s*=\s*\{\{/.test(content)) {
  if (!isExempt && /\.[tj]sx?$/.test(filePath)) {
    // style={{ ... }} 블록들을 추출하여 허용 패턴만 있는지 확인
    const styleBlocks = content.match(/\bstyle\s*=\s*\{\{[^}]*\}\}/g) ?? []
    for (const block of styleBlocks) {
      const inner = block.replace(/^style\s*=\s*\{\{/, '').replace(/\}\}$/, '').trim()
      if (!inner) continue
      // 각 속성이 backgroundImage, var()/calc() 값, 또는 CSS custom property(--*)만 사용하는지 확인
      const props = inner.split(',').map(p => p.trim()).filter(Boolean)
      const allAllowed = props.every(prop =>
        /^backgroundImage\s*:/.test(prop) || /:\s*['"`]?(?:var|calc)\(/.test(prop) || /^['"]?--[\w-]+['"]?\s*:/.test(prop)
      )
      if (!allAllowed) {
        violations.push(
          'style={{}} 인라인 스타일 금지 — ax() 또는 module.css를 사용하세요 (backgroundImage, var() 값은 예외)'
        )
        break
      }
    }
  }
}

// 규칙 15: prompt()/alert()/confirm() 브라우저 네이티브 다이얼로그 금지
if (!isExempt && isTsx && /\b(?:prompt|alert|confirm)\s*\(/.test(content)) {
  violations.push(
    'prompt()/alert()/confirm() 금지 — 브라우저 네이티브 다이얼로그 대신 os Dialog 또는 인라인 UI를 사용하세요'
  )
}

// 규칙 16: src/pages/에서 raw HTML form element 사용 금지
if (isPages && isTsx && /<(?:input|select|textarea)\b/.test(content)) {
  violations.push(
    `raw <input>/<select>/<textarea> 금지 — ui/ 컴포넌트를 사용하세요: ${listComponentsWithCatalog('').join(', ')}. 없으면 ui/에 먼저 만들고 pages에서 import`
  )
}

// 규칙 17: surface:'overlay'에 width 축 필수 — 오버레이 가로 고정
if (!isExempt && isTsx) {
  // ax({ ... surface: 'overlay' ... }) 블록에서 width가 없으면 위반
  const axCalls = content.match(/ax\(\{[^}]*\}\)/g) ?? []
  for (const call of axCalls) {
    if (/surface:\s*['"]overlay['"]/.test(call) && !/width:\s*['"]/.test(call)) {
      violations.push(
        `surface:'overlay'에 width 축 필수 — 오버레이 패널은 가로 크기가 고정이어야 합니다. ax({ surface: 'overlay', width: 'xl' }) 처럼 width를 지정하세요`
      )
      break
    }
  }
}

// 규칙 14: CSS 파일에서 ax() 축 소유 속성 사용 금지 — os 내부도 예외 없음
// module.css든 일반 .css든 last-mile(축에 없는 속성)만 허용
// 예외: ax.css — 축 시스템 자체이므로 축 소유 속성 당연히 사용
const isCss = /\.css$/.test(filePath)
const isAxCss = filePath.endsWith('/styles/ax.css')
if (isCss && !isAxCss) {
  // ax() 축 → 소유 CSS 속성 매핑 (패턴은 속성명만, ':'는 RegExp에서 추가)
  const AX_OWNED_PROPS = [
    // surface 축
    ['background(?!-image)', 'surface'],
    ['background-color', 'surface'],
    ['box-shadow', 'surface'],
    // shape 축
    ['border-radius', 'shape'],
    // textStyle 축
    ['font-size', 'textStyle'],
    ['font-weight', 'textStyle/weight'],
    ['line-height', 'textStyle'],
    ['letter-spacing', 'textStyle'],
    // text 축
    ['(?<!-)color', 'text'],
    // layout 축
    ['display', 'layout'],
    ['flex-direction', 'layout'],
    ['align-items', 'layout'],
    ['justify-content', 'layout'],
    ['overflow', 'layout'],
    ['overflow-y', 'layout'],
    ['overflow-x', 'layout'],
    // gap 축
    ['(?<!column-)(?<!row-)gap', 'gap'],
    // padding 축
    ['padding(?!-)', 'padding'],
    // width 축
    ['(?<!max-|min-)width', 'width'],
    // height — layout:fill 등으로 표현
    ['(?<!max-|min-)height', 'layout'],
  ]

  // 허용 값: var()/calc()/min()/max()/clamp(), CSS 키워드, 숫자(단위/퍼센트 포함), 소수
  const ALLOWED_VALUE = /^\s*(?:(?:var|calc|min|max|clamp)\(.*\)|inherit|initial|unset|none|transparent|grid|inline|pre-wrap|nowrap|pre-line|break-spaces|pointer|auto|\d*\.?\d+(?:%|vh|vw|dvh|dvw|svh|svw)?)\s*;?\s*$/

  const lines = content.split('\n')
  const found = new Set()
  let inPseudoElement = false
  for (const line of lines) {
    const trimmed = line.trim()
    // skip comments, custom properties, var() only lines
    if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) continue
    if (trimmed.startsWith('--')) continue
    // skip ::backdrop, ::before, ::after pseudo-element blocks (CSS-only, ax() inapplicable)
    if (/::(?:backdrop|before|after|placeholder)\s*\{/.test(trimmed)) { inPseudoElement = true; continue }
    if (inPseudoElement) { if (trimmed === '}') inPseudoElement = false; continue }
    for (const [pattern, axis] of AX_OWNED_PROPS) {
      const re = new RegExp(`^${pattern}\\s*:`, 'm')
      if (re.test(trimmed)) {
        // 값 부분 추출 후 허용 값이면 skip
        const valMatch = trimmed.match(/:\s*(.+)/)
        if (valMatch && ALLOWED_VALUE.test(valMatch[1])) continue
        // align-items: center가 grid 컨텍스트에 있으면 허용
        if (pattern === 'align-items' && valMatch && /^center\s*;?\s*$/.test(valMatch[1]) && /grid-template/.test(content)) continue
        found.add(`${trimmed.split(':')[0].trim()} → ax(${axis}) 사용`)
      }
    }
  }

  if (found.size > 0) {
    violations.push(
      `CSS에서 ax() 축 소유 속성 사용 금지 — ax() 또는 해당 축을 사용하세요:\n${[...found].map(f => `      • ${f}`).join('\n')}`
    )
  }
}

// 규칙 20: ui/ 컴포넌트에서 onKeyDown/onKeyUp 바닐라 핸들링 금지 — keyMap/pattern/plugin 사용
// isExempt는 os 전체를 면제하지만, ui/ 레이어는 useAria 기반 완성품이므로 키 핸들링도 os 방식이어야 함
const isUiComponent = filePath.includes('/src/interactive-os/ui/') && /\.tsx$/.test(filePath)
if (isUiComponent && !_isAriaZoneFile && /\bonKey(?:Down|Up)\s*=\s*\n?\s*\{/m.test(content)) {
  // useAria 또는 pattern/plugin keyMap을 사용하는 파일은 허용
  const usesOsKeyMap = /\buseAria\b|\bkeyMap\b|\bcomposePattern\b|\bdefinePlugin\b/.test(content)
  if (!usesOsKeyMap) {
    violations.push(
      'ui/ 컴포넌트에서 onKeyDown/onKeyUp 바닐라 핸들링 금지 — pattern keyMap 또는 plugin.keyMap으로 선언적 키 매핑을 사용하세요. CLAUDE.md "키바인딩 → KeyMap 선언" 참조'
    )
  }
}

// 규칙 19: CSS ::after/::before content로 아이콘/인디케이터 대체 금지 — indicators/ 사용
if (isCss && /::(?:after|before)\s*\{[^}]*content\s*:\s*['"][^'"]+['"]/s.test(content)) {
  violations.push(
    'CSS pseudo-element(::after/::before content)로 아이콘/인디케이터 대체 금지 — src/interactive-os/ui/indicators/ 컴포넌트를 사용하세요'
  )
}

if (violations.length > 0) {
  const reason = [
    `os 위반 ${violations.length}건 감지:`,
    ...violations.map((v, i) => `  ${i + 1}. ${v}`),
    '',
    '규칙: src/interactive-os/ 기반으로 개발하세요. CLAUDE.md "os 기반 개발" 참조.',
  ].join('\n')

  const output = JSON.stringify({ decision: 'block', reason })
  process.stdout.write(output)
}
