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

// 규칙 17: 삭제됨 — surface:'overlay'는 depth ladder 층위일 뿐, width 필수가 아님
// dialog/panel 컨테이너가 width를 가져야 하는 건 맞지만 overlay surface 전체에 강제할 규칙이 아님

// 규칙 14: CSS 파일에서 ax() 축 소유 속성 사용 금지 — os 내부도 예외 없음
// module.css든 일반 .css든 last-mile(축에 없는 속성)만 허용
// 예외: ax.css — 축 시스템 자체이므로 축 소유 속성 당연히 사용
const isCss = /\.css$/.test(filePath)
const isAxCss = filePath.endsWith('/styles/ax.css')
const isResetCss = filePath.endsWith('/styles/reset.css')
if (isCss && !isAxCss && !isResetCss) {
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

// 규칙 21: 글자 닫기 버튼 금지 — CloseIndicator 사용
if (!isExempt && isTsx && />\s*[×✕✖]\s*<\/\s*button/ms.test(content)) {
  violations.push(
    '글자(×/x) 닫기 버튼 금지 — <CloseIndicator /> (ui/indicators/) 를 사용하세요: import { CloseIndicator } from \'@os/ui/indicators\''
  )
}

// 규칙 19: CSS ::after/::before content로 아이콘/인디케이터 대체 금지 — indicators/ 사용
if (isCss && /::(?:after|before)\s*\{[^}]*content\s*:\s*['"][^'"]+['"]/s.test(content)) {
  violations.push(
    'CSS pseudo-element(::after/::before content)로 아이콘/인디케이터 대체 금지 — src/interactive-os/ui/indicators/ 컴포넌트를 사용하세요'
  )
}

// 규칙 22: stopPropagation() 금지 — defaultPrevented 가드 패턴 사용
if (!isExempt && isTsx && /\.stopPropagation\s*\(/.test(content)) {
  violations.push(
    'stopPropagation() 금지 — 이벤트 전파 차단 대신 `if (e.defaultPrevented) return` 가드 패턴을 사용하세요. CLAUDE.md feedback_nested_bubbling_guard 참조'
  )
}

// 규칙 23: pages에서 수동 dialog showModal 금지 — useOverlay 사용
// .close()는 EventSource/WebSocket 등에도 사용되므로 showModal만 검사
if (isPages && isTsx && /\.showModal\s*\(/.test(content)) {
  violations.push(
    'dialog.showModal() 수동 제어 금지 — useOverlay({ type: \'modal\' })를 사용하세요. overlay/useOverlay.ts가 dialog sync, backdrop, focus restoration, layer stack을 소유합니다'
  )
}

// 규칙 24a: FlatLayout widget 노드에 props 필드 Push 금지 — widget은 Context/hook pull
// (a) updateEntityData(data, 'xxx', { props: ... }) 패턴
// (b) definePage 내부 { type: 'widget', ..., props: ... } 패턴
if (isPages && isTsx) {
  const pushA = /updateEntityData\s*\([^,]+,\s*['"][^'"]+['"]\s*,\s*\{[\s\S]{0,40}?\bprops\s*:/.test(content)
  const pushB = /type\s*:\s*['"]widget['"][\s\S]{0,200}?\bprops\s*:/.test(content)
  if (pushA || pushB) {
    violations.push(
      'FlatLayout widget 노드에 props 필드 전달 금지 (Push 모델) — definePage는 구조/id만 담고, widget이 도메인 Context/hook으로 값을 pull 하세요. 전범: src/pages/cms/cmsContext.tsx + cmsWidgets.tsx. 원칙: feedback_flatlayout_pull_not_push'
    )
  }
}

// 규칙 24b: src/pages/에서 @os/(store|engine|axis|pattern|primitives|plugins) 직접 import 권장 위반 (Phase 1: 경고)
// 단일 entry: @os/ui, @os/layout, @os/schema, @os/advanced 만 권장
if (isPages && /from\s+['"]@os\/(?:store|engine|axis|pattern|primitives|plugins)\b/.test(content)) {
  warnings.push(
    'single-entry 권장: @os/(store|engine|axis|pattern|primitives|plugins) 대신 @os/ui · @os/layout · @os/schema · @os/advanced 4개 단일 entry를 사용하세요. (Phase 1: 경고 — 후속 plan에서 차단으로 승격)'
  )
}

// 규칙 25: 위젯에서 ax({ placement: ... }) 금지 — 배치는 FlatLayout이 소유
const isWidgetFile = isPages && isTsx && /[Ww]idget/.test(filePath)
if (isWidgetFile && /\bax\(\{[^}]*\bplacement\s*:/.test(content)) {
  violations.push(
    'widget에서 ax({ placement: ... }) 금지 — 위치 배치는 FlatLayout(floating/overlay 노드)이 소유합니다. definePage에 floating/overlay 노드를 추가하세요'
  )
}

// 규칙 26: 위젯에서 document.querySelector/getElementById 금지 — ref 또는 engine 사용
if (isWidgetFile && /\bdocument\s*\.\s*(?:querySelector(?:All)?|getElementById|getElementsBy\w+)\s*\(/.test(content)) {
  violations.push(
    'widget에서 document.querySelector/getElementById 금지 — useRef 또는 engine의 navigate 축을 사용하세요'
  )
}

// 규칙 27: 위젯에서 requestAnimationFrame 금지 — engine 렌더 구독 사용
if (isWidgetFile && /\brequestAnimationFrame\s*\(/.test(content)) {
  violations.push(
    'widget에서 requestAnimationFrame 금지 — engine 렌더 구독 또는 useEffect를 사용하세요'
  )
}

// 규칙 28: recipe 레거시 사용 금지 — role 축 사용
// container만 잔존 허용, control/item/badge는 role로 이전 완료
if (isTsx && /\brecipe\s*:\s*['"](?:control|control-sm|control-lg|item|item-sm|badge)['"]/.test(content)) {
  violations.push(
    "recipe: 'control'/'item'/'badge' 레거시 금지 — role: 'control' | 'item' | 'badge' 축을 사용하세요. role이 크기(height/font/padding/gap/shape)를 소유합니다"
  )
}

// 규칙 30: controlSize 레거시 사용 금지 — role 축으로 대체 완료
if (isTsx && /\bcontrolSize\s*:/.test(content)) {
  violations.push(
    "controlSize 레거시 금지 — role: 'control' 축을 사용하세요. role이 min-height/font-size/padding/gap/shape를 소유합니다"
  )
}

// 규칙 29: interactive 요소에 role 미사용 금지
// ax() 호출 내에 interactive:가 있으면 role:도 있어야 함
if (isTsx) {
  const axCalls = content.match(/ax\(\{[^}]+\}\)/g) ?? []
  for (const call of axCalls) {
    if (/\binteractive\s*:/.test(call) && !/\brole\s*:/.test(call)) {
      violations.push(
        "interactive 축 사용 시 role 축 필수 — role: 'control' (버튼/인풋) 또는 role: 'item' (목록 행)을 함께 선언하세요. role이 크기 일관성을 보장합니다"
      )
      break
    }
  }
}

// 규칙 31: pages/에서 <button> + ax() 수동 조합 금지 — Button 컴포넌트 사용
// 예외: ThemeAxes (축 데모), cmsNodePresentation (CMS 프레젠테이션 레이어)
const isButtonExempt = filePath.includes('ThemeAxes') || filePath.includes('cmsNodePresentation')
if (isPages && isTsx && !isButtonExempt && /<button[\s\S]*?className=\{.*?ax\(\{/.test(content)) {
  violations.push(
    "<button className={ax({...})}> 수동 조합 금지 — <Button> 컴포넌트를 사용하세요. variant='ghost'|'accent', icon={true}(아이콘 전용). import { Button } from '@os/ui/Button'"
  )
}

// 규칙 33: items/*.tsx에서 bespoke className 리터럴 금지 — ax() 또는 indicators/ 사용
// items/ 레이어는 축 조합만으로 표현 가능해야 함. "timeline-dot", "stepper-item--vertical" 같은
// 문자열 클래스는 대응 module.css도 없는 dead string인 경우가 많고, 있어도 last-mile 경계를 넘어
// ax() 축 소유 속성을 재정의하는 drift의 통로가 됨
const isItemsFile = /\/src\/interactive-os\/ui\/items\/[^/]+\.tsx$/.test(filePath)
if (isItemsFile) {
  // className="foo-bar" 또는 className={`foo-bar ...`} 패턴에서 kebab-case 문자열 리터럴 검출
  const bespokeMatches = [
    ...content.matchAll(/className=["']([a-z][a-z0-9]*-[a-z0-9-]+)["']/g),
    ...content.matchAll(/className=\{`([a-z][a-z0-9]*-[a-z0-9-]+)\s/g),
  ]
  if (bespokeMatches.length > 0) {
    const names = [...new Set(bespokeMatches.map(m => m[1]))].join(', ')
    violations.push(
      `items/에서 bespoke className 리터럴 금지 (${names}) — ax() 축으로 표현하거나 ui/indicators/ 컴포넌트를 사용하세요. items/ 레이어는 축 조합만으로 완결되어야 합니다`
    )
  }
}

// 규칙 32: data-checked 중복 상태 채널 금지 — aria-checked가 SSOT
if (isTsx && /\bdata-checked\s*=\s*\{/.test(content)) {
  violations.push(
    'data-checked 금지 — checked 상태는 aria-checked (OS 자동 설정)가 유일한 SSOT입니다. indicator는 prop 없는 순수 시각 마커로, 부모의 aria-checked로 CSS가 제어됩니다'
  )
}

// ── 경고 (차단 아님) ──
const warnings = []

// 경고 W1: pages/에서 .map() + raw <div — ui/ 컴포넌트 사용 검토 권유
if (isPages && isTsx && /\.map\s*\([\s\S]*?=>\s*[\s\S]*?<div[\s>]/.test(content)) {
  warnings.push(
    '.map() + raw <div> 발견 — 반복 렌더링 항목이 인터랙티브하다면 ui/ 컴포넌트(NavList, Badge 등)를 사용하세요. (antipattern 체크리스트 #8 참조)'
  )
}

// 경고 출력 (stderr, 차단하지 않음)
if (warnings.length > 0) {
  process.stderr.write(
    `⚠ os 경고 ${warnings.length}건:\n${warnings.map((w, i) => `  ${i + 1}. ${w}`).join('\n')}\n`
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
