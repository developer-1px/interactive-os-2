#!/usr/bin/env node
/**
 * shadcn/ui 소스 DOM vs aria-os 실제 렌더 DOM 비교
 *
 * 선행: pnpm test -- scripts/dumpDom.test.tsx  (dom-dump.json 생성)
 * 실행: node scripts/compareShadcn.mjs
 *       node scripts/compareShadcn.mjs button badge  (필터)
 *
 * 출력: scripts/shadcn-compare.txt
 */

import fs from 'fs'

// ── 우리 DOM 덤프 로드 ──
const OUR_DUMP_PATH = 'scripts/dom-dump.json'
if (!fs.existsSync(OUR_DUMP_PATH)) {
  console.error('❌ scripts/dom-dump.json 없음. 먼저 실행: pnpm test -- scripts/dumpDom.test.tsx')
  process.exit(1)
}
const ourDump = JSON.parse(fs.readFileSync(OUR_DUMP_PATH, 'utf8'))

// ── shadcn 소스 URL ──
const SHADCN_BASE = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui'

// ── 매핑: shadcn 파일 → 우리 demo slug(들) ──
const MAPPING = [
  { shadcn: 'button.tsx',      ours: ['Button'],         name: 'Button' },
  { shadcn: 'badge.tsx',       ours: ['Badge'],          name: 'Badge' },
  { shadcn: 'input.tsx',       ours: ['TextInput'],      name: 'Input' },
  { shadcn: 'textarea.tsx',    ours: ['Textarea'],       name: 'Textarea' },
  { shadcn: 'card.tsx',        ours: ['Card'],           name: 'Card' },
  { shadcn: 'alert.tsx',       ours: ['Alert'],          name: 'Alert' },
  { shadcn: 'avatar.tsx',      ours: ['Avatar'],         name: 'Avatar' },
  { shadcn: 'skeleton.tsx',    ours: ['Skeleton'],       name: 'Skeleton' },
  { shadcn: 'progress.tsx',    ours: ['Progress'],       name: 'Progress' },
  { shadcn: 'tooltip.tsx',     ours: ['Tooltip'],        name: 'Tooltip' },
  { shadcn: 'select.tsx',      ours: ['Select'],         name: 'Select' },
  { shadcn: 'tabs.tsx',        ours: ['TabList'],        name: 'Tabs' },
  { shadcn: 'accordion.tsx',   ours: ['Accordion'],      name: 'Accordion' },
  { shadcn: 'checkbox.tsx',    ours: ['Checkbox'],       name: 'Checkbox' },
  { shadcn: 'radio-group.tsx', ours: ['RadioGroup'],     name: 'RadioGroup' },
  { shadcn: 'switch.tsx',      ours: ['SwitchGroup'],    name: 'Switch' },
  { shadcn: 'slider.tsx',      ours: ['Slider'],         name: 'Slider' },
  { shadcn: 'toggle.tsx',      ours: ['Toggle'],         name: 'Toggle' },
  { shadcn: 'dialog.tsx',      ours: ['Dialog', 'AlertDialog'], name: 'Dialog' },
  { shadcn: 'popover.tsx',     ours: ['Popover'],        name: 'Popover' },
  { shadcn: 'table.tsx',       ours: ['Table'],          name: 'Table' },
  { shadcn: 'separator.tsx',   ours: ['Divider'],        name: 'Separator' },
  { shadcn: 'scroll-area.tsx', ours: ['ScrollArea'],     name: 'ScrollArea' },
  { shadcn: 'breadcrumb.tsx',  ours: ['Breadcrumb'],     name: 'Breadcrumb' },
  { shadcn: 'kbd.tsx',         ours: ['Kbd'],            name: 'Kbd' },
]

// ── shadcn 소스에서 sub-component별 DOM 구조 추출 ──

function parseShadcnSource(code) {
  const components = []

  // 각 function 컴포넌트 추출
  const funcRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{/g
  const funcPositions = []
  let m
  while ((m = funcRegex.exec(code)) !== null) {
    funcPositions.push({ name: m[1], start: m.index })
  }

  for (let i = 0; i < funcPositions.length; i++) {
    const { name, start } = funcPositions[i]
    const end = funcPositions[i + 1]?.start ?? code.length
    const body = code.slice(start, end)

    // return 문 안의 JSX 추출 — 여러 패턴 시도
    const returnMatch = body.match(/return\s*\(\s*([\s\S]*?)\n\s*\)/)
      ?? body.match(/return\s*\(\s*([\s\S]+)\)[\s\n]*\}/)
      ?? body.match(/return\s+(<[\s\S]+?)[\s\n]*\}/)
    if (!returnMatch) continue

    const jsx = returnMatch[1]

    // 요소 추출
    const elements = []
    const tagRegex = /<([\w.]+)([^>]*?)(\/?)\s*>/g
    let tag
    while ((tag = tagRegex.exec(jsx)) !== null) {
      const [, tagName, attrs, selfClose] = tag
      if (tagName === 'span' && attrs.includes('sr-only')) continue

      const el = { tag: tagName }

      // data-slot
      const slotM = attrs.match(/data-slot="([^"]+)"/)
      if (slotM) el.slot = slotM[1]

      // role
      const roleM = attrs.match(/\brole="([^"]+)"/)
      if (roleM) el.role = roleM[1]

      // className에서 핵심 Tailwind 추출
      const cnM = attrs.match(/className=\{cn\(\s*(?:["'`]([^"'`]+)["'`]|[\s\S]*?["'`]([^"'`]+)["'`])/)
      const rawClassM = attrs.match(/className="([^"]+)"/)
      const twRaw = cnM?.[1] || cnM?.[2] || rawClassM?.[1] || ''

      if (twRaw) {
        // 핵심 시각 속성만 추출
        const visual = {}
        // 크기
        const sizeM = twRaw.match(/\b(size-[\d.]+|h-[\d.]+|w-[\d.]+|min-h-[\d.]+|min-w-[\d.]+)/g)
        if (sizeM) visual.size = sizeM.join(' ')
        // 레이아웃
        const layoutM = twRaw.match(/\b(flex|grid|inline-flex|items-\w+|justify-\w+|gap-[\d.]+)/g)
        if (layoutM) visual.layout = layoutM.join(' ')
        // 형태
        const shapeM = twRaw.match(/\b(rounded-\w+|border(?:-\w+)?|shadow-\w+)/g)
        if (shapeM) visual.shape = shapeM.join(' ')
        // 타이포
        const typeM = twRaw.match(/\b(text-\w+|font-\w+|leading-\w+|tracking-\w+)/g)
        if (typeM) visual.type = typeM.join(' ')
        // 패딩
        const padM = twRaw.match(/\b(p[xytblr]?-[\d.]+|p-\[[\d.]+px\])/g)
        if (padM) visual.padding = padM.join(' ')
        // 상태
        const stateM = twRaw.match(/\b(hover:\w+|focus-visible:\w+|disabled:\w+|data-\[[\w=]+\]:\w+)/g)
        if (stateM) visual.states = stateM.slice(0, 5).join(' ')
        // transition/animation
        if (twRaw.includes('transition')) visual.transition = true
        if (twRaw.includes('animate-')) visual.animation = true

        if (Object.keys(visual).length) el.tw = visual
      }

      elements.push(el)
    }

    if (elements.length) {
      components.push({ name, elements })
    }
  }

  return components
}

// ── 우리 DOM 트리에서 핵심 구조 추출 ──

function parseOurTree(treeText) {
  const lines = treeText.split('\n').filter(l => l.trim())
  return lines.map(line => {
    const indent = line.search(/\S/) / 2
    const tagM = line.match(/<(\w+)/)
    const axM = line.match(/ax=\[([^\]]+)\]/)
    const roleM = line.match(/role="([^"]+)"/)
    const ariaM = [...line.matchAll(/(aria-\w+)="([^"]*)"/g)]
    const textM = line.match(/"([^"]+)"/)

    return {
      indent,
      tag: tagM?.[1] ?? '?',
      ax: axM?.[1]?.split(' ') ?? [],
      role: roleM?.[1],
      aria: ariaM.map(m => `${m[1]}=${m[2]}`),
      text: textM?.[1],
    }
  })
}

// ── 비교 분석 ──

function compare(shadcnComps, ourTree, name) {
  const issues = []

  // 1. shadcn sub-component 개수 vs 우리 DOM 요소 개수
  const shadcnParts = shadcnComps.flatMap(c => c.elements)
  const ourElements = ourTree

  // 2. 시맨틱 태그 비교
  const shadcnHtmlTags = new Set(
    shadcnParts.map(e => e.tag.toLowerCase()).filter(t => /^[a-z]/.test(t))
  )
  const ourHtmlTags = new Set(
    ourElements.map(e => e.tag.toLowerCase()).filter(t => /^[a-z]/.test(t))
  )

  const semanticTags = ['nav', 'ol', 'ul', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'kbd', 'label', 'fieldset', 'legend', 'header', 'footer', 'section', 'article', 'aside']
  for (const tag of semanticTags) {
    if (shadcnHtmlTags.has(tag) && !ourHtmlTags.has(tag)) {
      issues.push({ type: 'semantic', msg: `<${tag}> 누락 (shadcn 사용)` })
    }
  }

  // 3. <div> 남용
  const divCount = ourElements.filter(e => e.tag === 'div').length
  const total = ourElements.length
  if (total > 2 && divCount / total > 0.8) {
    issues.push({ type: 'div-heavy', msg: `div ${divCount}/${total} (${Math.round(divCount/total*100)}%)` })
  }

  // 4. shadcn CSS 패턴 vs 우리 ax 축
  const allTw = shadcnParts.flatMap(e => {
    if (!e.tw) return []
    return Object.entries(e.tw).flatMap(([k, v]) => typeof v === 'string' ? v.split(' ') : [k])
  })

  // shadow
  if (allTw.some(c => c.startsWith('shadow'))) {
    const ourHasShadow = ourElements.some(e => e.ax.some(a => a.startsWith('sf-raised') || a.startsWith('sf-overlay') || a.startsWith('bd-ring')))
    if (!ourHasShadow) issues.push({ type: 'visual', msg: 'shadow 누락' })
  }

  // border-radius
  const shadcnRadius = allTw.filter(c => c.startsWith('rounded-'))
  if (shadcnRadius.length) {
    const ourHasShape = ourElements.some(e => e.ax.some(a => a.startsWith('sh-') || a.startsWith('rl-')))
    if (!ourHasShape) issues.push({ type: 'visual', msg: `border-radius 누락 (shadcn: ${[...new Set(shadcnRadius)].join(', ')})` })
  }

  // transition/animation
  if (allTw.includes('transition')) {
    issues.push({ type: 'check', msg: 'transition 사용 확인 필요' })
  }
  if (allTw.includes('animation')) {
    issues.push({ type: 'check', msg: 'animation 사용 확인 필요' })
  }

  // 5. shadcn sub-component 구조 vs 우리
  const shadcnSlots = shadcnParts.filter(e => e.slot).map(e => e.slot)
  const ourRoles = ourElements.filter(e => e.role).map(e => e.role)

  // 6. 핵심 시각 속성 누락 체크
  for (const comp of shadcnComps) {
    for (const el of comp.elements) {
      if (!el.tw) continue

      // 크기 속성이 있는데 우리가 크기 축을 안 쓰는 경우
      if (el.tw.size && el.slot) {
        const ourHasSize = ourElements.some(e =>
          e.ax.some(a => a.startsWith('sq-') || a.startsWith('rl-') || a.startsWith('ic-'))
        )
        if (!ourHasSize) {
          issues.push({ type: 'visual', msg: `${el.slot}: 크기 축 누락 (shadcn: ${el.tw.size})` })
        }
      }

      // 패딩이 있는데 우리가 패딩 축을 안 쓰는 경우
      if (el.tw.padding && el.slot) {
        const ourHasPad = ourElements.some(e => e.ax.some(a => a.startsWith('pd-') || a.startsWith('ct-')))
        if (!ourHasPad) {
          issues.push({ type: 'visual', msg: `${el.slot}: padding 누락 (shadcn: ${el.tw.padding})` })
        }
      }
    }
  }

  return { shadcnSlots, ourRoles, issues }
}

// ── 포맷 ──

function formatShadcn(comps) {
  const lines = []
  for (const comp of comps) {
    lines.push(`  ${comp.name}:`)
    for (const el of comp.elements) {
      const parts = [`<${el.tag}>`]
      if (el.slot) parts.push(`[${el.slot}]`)
      if (el.role) parts.push(`role=${el.role}`)
      if (el.tw) {
        const twParts = []
        for (const [k, v] of Object.entries(el.tw)) {
          if (typeof v === 'boolean') twParts.push(k)
          else twParts.push(`${k}:${v}`)
        }
        parts.push(`{${twParts.join(', ')}}`)
      }
      lines.push(`    ${parts.join(' ')}`)
    }
  }
  return lines.join('\n')
}

// ── 메인 ──

async function main() {
  const filterNames = process.argv.slice(2).map(s => s.toLowerCase())
  const targets = filterNames.length
    ? MAPPING.filter(c => filterNames.some(f => c.name.toLowerCase().includes(f)))
    : MAPPING

  const lines = []
  const allIssues = []

  lines.push(`${'═'.repeat(70)}`)
  lines.push(`  shadcn/ui ↔ aria-os DOM 구조 비교 (${targets.length}개)`)
  lines.push(`  shadcn: 소스 코드 파싱 / aria-os: happy-dom 실제 렌더`)
  lines.push(`${'═'.repeat(70)}`)

  for (const comp of targets) {
    lines.push(`\n${'─'.repeat(60)}`)
    lines.push(`  ${comp.name}`)
    lines.push(`${'─'.repeat(60)}`)

    // shadcn fetch
    let shadcnCode
    try {
      const res = await fetch(`${SHADCN_BASE}/${comp.shadcn}`)
      if (!res.ok) throw new Error(res.status.toString())
      shadcnCode = await res.text()
    } catch {
      lines.push('  [shadcn] fetch 실패')
      continue
    }

    const shadcnComps = parseShadcnSource(shadcnCode)
    lines.push('\n  ◼ shadcn DOM:')
    lines.push(formatShadcn(shadcnComps))

    // 우리 DOM
    lines.push('\n  ◼ aria-os DOM:')
    const ourSlug = comp.ours[0]
    const ourData = ourDump[ourSlug]
    if (!ourData) {
      lines.push('    [demo 없음]')
      continue
    }
    // tree 텍스트를 들여쓰기 추가해서 출력
    const treeLines = ourData.tree.split('\n').map(l => '    ' + l).join('\n')
    lines.push(treeLines)

    // 비교
    const ourParsed = parseOurTree(ourData.tree)
    const result = compare(shadcnComps, ourParsed, comp.name)

    if (result.issues.length) {
      allIssues.push({ name: comp.name, issues: result.issues })
      lines.push('\n  ◼ GAP:')
      for (const issue of result.issues) {
        const icon = issue.type === 'semantic' ? '🏷️' : issue.type === 'visual' ? '🎨' : issue.type === 'div-heavy' ? '📦' : '⚙️'
        lines.push(`    ${icon} ${issue.msg}`)
      }
    } else {
      lines.push('\n  ✅ 구조적 갭 없음')
    }

    // sub-component 매핑
    if (result.shadcnSlots.length) {
      lines.push(`\n  ◼ shadcn parts: ${result.shadcnSlots.join(' → ')}`)
      lines.push(`  ◼ aria-os roles: ${result.ourRoles.length ? result.ourRoles.join(', ') : '(role 없음)'}`)
    }
  }

  // 요약
  lines.push(`\n${'═'.repeat(70)}`)
  lines.push(`  요약: ${targets.length}개 중 ${allIssues.length}개 갭 발견`)
  lines.push(`${'═'.repeat(70)}`)

  if (allIssues.length) {
    // 타입별 집계
    const byType = {}
    for (const { name, issues } of allIssues) {
      for (const i of issues) {
        if (!byType[i.type]) byType[i.type] = []
        byType[i.type].push(`${name}: ${i.msg}`)
      }
    }

    lines.push('\n  ── 타입별 갭 ──')
    for (const [type, items] of Object.entries(byType)) {
      const label = { semantic: '시맨틱 태그', visual: '시각 속성', 'div-heavy': 'div 남용', check: '확인 필요' }[type] ?? type
      lines.push(`\n  [${label}] (${items.length})`)
      for (const item of items) {
        lines.push(`    • ${item}`)
      }
    }
  }

  const report = lines.join('\n') + '\n'
  fs.writeFileSync('scripts/shadcn-compare.txt', report)
  console.log(report)
  console.log(`✓ scripts/shadcn-compare.txt 저장 완료`)
}

main().catch(console.error)
