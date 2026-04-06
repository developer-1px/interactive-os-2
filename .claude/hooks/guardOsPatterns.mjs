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

// os 내부, devtools, styles는 날코딩 규칙 제외
const isExempt = isOsInternal || isDevtools || isStyles

const violations = []

// 규칙 1: src/pages/에서 primitives 직접 import (AriaRoute는 허용)
if (isPages && /from\s+['"].*interactive-os\/primitives(?!\/AriaRoute)/.test(content)) {
  const comps = listComponents('').join(', ')
  violations.push(
    `primitives 직접 import 금지 — ui/ 완성품을 사용하세요 (AriaRoute는 예외): ${comps}`
  )
}

// 규칙 2: src/pages/에서 useAria/useAriaZone 직접 사용
if (isPages && /\buseAria(?:Zone)?\b/.test(content)) {
  const comps2 = listComponents('').join(', ')
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

// 규칙 5: onKeyDown/onKeyUp JSX 핸들러 — 멀티라인 대응
if (!isExempt && isTsx && /\bonKey(?:Down|Up)\s*=\s*\n?\s*\{/m.test(content)) {
  violations.push(
    'onKeyDown/onKeyUp 핸들러 금지 — axis의 keyMap 또는 plugin의 keyMap 선언을 사용하세요'
  )
}

// 규칙 6: role="..." 수동 ARIA 역할 (JSX에서)
if (!isExempt && isTsx && /\brole\s*=\s*["'](?:listbox|tree|treegrid|grid|menu|menubar|tablist|combobox|radiogroup)["']/.test(content)) {
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
      : `role="..." 수동 선언 금지 — pattern이 자동 생성합니다. ui/ 완성품을 사용하세요: ${listComponents('').join(', ')}`
  )
}

// 규칙 7: aria-selected/aria-expanded 등 수동 ARIA 속성
if (!isExempt && isTsx && /\baria-(?:selected|expanded|activedescendant|checked|pressed|current)\s*=\s*\{/.test(content)) {
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

// 규칙 9: useState로 인터랙션 상태 관리
if (!isExempt && isTsx && /useState\s*[<(].*\b(?:selected|expanded|focused|active|checked|isOpen)\b/.test(content)) {
  violations.push(
    'useState(selected/expanded/focused/active/checked) 금지 — NormalizedData + Command를 사용하세요. store에 노드 상태를 선언하고, select/expand/activate 축이 관리합니다'
  )
}

// 규칙 10: 이모지/특수기호를 아이콘/인디케이터 대용으로 사용 금지
if (isTsx && /['"`](?:▾|▸|▶|▼|►|◀|◁|△|▲|▽|▿|⚠|✓|✗|✕|✖|✔|✘|●|○|◉|◎|★|☆|⬜|🟢|🔴|🟡|⚡|🔥|❌|✅|⏳|📌|🚀|💡|🎯|📝|🔧|⭐|💬|📦|🗑|🔗|📋)['"`]/.test(content)) {
  const indicators = listComponents('indicators').join(', ')
  violations.push(
    `이모지/특수기호 아이콘 대용 금지 — ui/indicators/ 사용: ${indicators}`
  )
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

// 규칙 4: style={{ }} 인라인 리터럴 — CSS module.css, ax() 사용
// style={variable} (prop 전달)은 허용, style={{ ... }} (인라인 리터럴)만 차단
// 예외: backgroundImage, var() 만 사용하는 경우 허용
if (/\bstyle\s*=\s*\{\{/.test(content)) {
  if (/\.[tj]sx?$/.test(filePath)) {
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
