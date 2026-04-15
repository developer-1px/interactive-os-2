#!/usr/bin/env node
// keylineCheck.mjs — ax() 정적 분석으로 key line 일관성 검증
//
// 사용법:
//   node scripts/keylineCheck.mjs              # 전체 ui/ 스캔
//   node scripts/keylineCheck.mjs Button.tsx   # 특정 파일만
//   node scripts/keylineCheck.mjs --json       # JSON 출력 (LLM 소비용)
//
// 검증 항목:
//   1. role 누락 — interactive 요소인데 role 미선언
//   2. sizing override — module.css에서 sizing 속성 재정의
//   3. key line 불일치 — 같은 role인데 content 축 조합이 다른 패턴 감지
//   4. 미등록 ax() 축 — 존재하지 않는 축 값 사용

import { readFileSync, readdirSync } from 'node:fs'
import { join, basename, relative } from 'node:path'

// ── 토큰 테이블 (tokens.css + ax.css에서 정적 추출) ──

const SPACE = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }

const ROLE_KEYLINES = {
  control: {
    minHeight: 36, minWidth: 36, fontSize: 14, fontWeight: 500,
    paddingBlock: 8, paddingInline: 16, gap: 8,
    borderRadius: 'var(--shape-sm-radius)', // 6px
  },
  'control-group': {
    minHeight: 36, fontSize: 14, fontWeight: 500,
    gap: 0, borderRadius: 'var(--shape-sm-radius)',
  },
  item: {
    minHeight: 28, fontSize: 13, fontWeight: 450,
    paddingBlock: SPACE.xs, paddingInline: SPACE.xs, gap: 8,
    borderRadius: 'var(--shape-2xs-radius)', // 4px
  },
  badge: {
    fontSize: 12, fontWeight: 500,
    paddingBlock: SPACE.xs, paddingInline: SPACE.xs, gap: 4,
    borderRadius: 'var(--shape-pill-radius)',
  },
}

// content 축이 padding-inline에 미치는 영향 (--pd-ratio)
const PD_RATIO = { text: 2, code: 0, bubble: 2, icon: 0 }

// role의 padding-inline은 role 자체에서 고정. content의 --pd-ratio는 item/badge에만 영향.
// control의 padding-inline은 16px 고정 (var(--pd-ratio) 미사용).

// sizing 속성 — module.css에서 이것들을 재정의하면 key line을 깨뜨림
const SIZING_PROPS = new Set([
  'min-height', 'max-height', 'height',
  'font-size', 'font-weight', 'line-height',
  'padding', 'padding-block', 'padding-inline',
  'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
])

// module.css sizing override 화이트리스트 — 레이아웃 엔진 등 정당한 override
const SIZING_WHITELIST = new Set([
  'FlatLayout.module.css', // 레이아웃 엔진: height/min-height는 레이아웃 책임
])

// interactive 축 값 — 이것이 있으면 role이 필수
const INTERACTIVE_VALUES = new Set(['item', 'tab', 'check', 'cell', 'input', 'button'])

// 유효한 축 값 테이블
const VALID_AXES = {
  role: new Set(['control', 'control-group', 'item', 'badge']),
  content: new Set(['text', 'code', 'bubble', 'icon']),
  interactive: INTERACTIVE_VALUES,
  surface: new Set(['action', 'input', 'display', 'overlay', 'trap', 'ghost', 'placeholder', 'sunken', 'base', 'raised']),
  layout: new Set(['row', 'center', 'bar', 'spread', 'stack', 'scroll', 'scroll-x', 'fill', 'row-fill', 'wrap',
    'grid-2', 'grid-3', 'grid-4', 'grid-5', 'grid-7', 'self-start', 'self-end', 'self-center']),
  padding: new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl']),
  gap: new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  width: new Set(['full', 'auto', 'fit', 'sm', 'md', 'lg', 'xl', 'prose']),
  icon: new Set(['xs', 'sm', 'md', 'lg']),
  square: new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  clamp: new Set(['1', '2', '3', '4', 'pre', 'scroll']),
}

// ── 파일 탐색 ──

const ROOT = join(import.meta.dirname, '..', 'src', 'interactive-os', 'ui')

function findTsxFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...findTsxFiles(join(dir, entry.name)))
    } else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.demo.tsx') && !entry.name.endsWith('.test.tsx')) {
      results.push(join(dir, entry.name))
    }
  }
  return results
}

function findModuleCssFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...findModuleCssFiles(join(dir, entry.name)))
    } else if (entry.name.endsWith('.module.css')) {
      results.push(join(dir, entry.name))
    }
  }
  return results
}

// ── ax() 호출 파싱 ──

/**
 * TSX 파일에서 모든 ax() 호출의 축 값을 추출한다.
 * 정규식 기반 — AST 불필요 (ax()는 단일 객체 리터럴만 받음).
 */
function parseAxCalls(filePath) {
  const src = readFileSync(filePath, 'utf-8')
  const calls = []

  // ax({ ... }) 패턴 매칭 — 중첩 {} 1단계까지 허용
  const axPattern = /\bax\(\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\)/g
  let match
  while ((match = axPattern.exec(src)) !== null) {
    const body = match[1]
    const axes = {}
    const offset = match.index
    const line = src.slice(0, offset).split('\n').length

    // key: 'value' 또는 key: value 추출
    const propPattern = /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(\w+))/g
    let prop
    while ((prop = propPattern.exec(body)) !== null) {
      const key = prop[1]
      const val = prop[2] ?? prop[3] ?? prop[4]
      // 스프레드나 변수 참조는 건너뜀 — 리터럴 문자열만 수집
      if (val === 'true' || val === 'false' || val === 'undefined') continue
      // 따옴표 없이 매칭된 값(group 4)은 변수 참조 — 첫 글자 소문자+camelCase면 건너뜀
      if (prop[2] == null && prop[3] == null && /^[a-z]/.test(val)) continue
      axes[key] = val
    }

    calls.push({ axes, line, raw: match[0] })
  }

  return calls
}

// ── module.css sizing override 검사 ──

function checkModuleCssOverrides(cssPath) {
  const src = readFileSync(cssPath, 'utf-8')
  const violations = []

  // 선언 단위로 파싱
  const lines = src.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    for (const prop of SIZING_PROPS) {
      // property: value 패턴 (주석 제외)
      if (line.startsWith('/*') || line.startsWith('//') || line.startsWith('*')) continue
      const propPattern = new RegExp(`^${prop.replaceAll('-', '\\-')}\\s*:`)
      if (propPattern.test(line)) {
        violations.push({
          file: cssPath,
          line: i + 1,
          property: prop,
          declaration: line.replace(';', '').trim(),
        })
      }
    }
  }

  return violations
}

// ── 검증 규칙 ──

function runChecks(files, filter) {
  const findings = {
    missingRole: [],       // interactive인데 role 없음
    sizingOverride: [],    // module.css sizing override
    invalidAxis: [],       // 유효하지 않은 축 값
    keylineSummary: [],    // role별 ax() 사용 요약
  }

  // 1. TSX 파일 스캔
  for (const filePath of files) {
    const relPath = relative(join(ROOT, '..', '..', '..'), filePath)
    const calls = parseAxCalls(filePath)

    for (const call of calls) {
      const { axes, line } = call

      // Rule 1: interactive가 있는데 role이 없으면 경고
      if (axes.interactive && INTERACTIVE_VALUES.has(axes.interactive) && !axes.role) {
        findings.missingRole.push({
          file: relPath,
          line,
          interactive: axes.interactive,
          hint: 'interactive 요소는 role(control/item/badge) 필수 — key line 보장 안 됨',
        })
      }

      // Rule 2: 유효하지 않은 축 값 검사
      for (const [axis, value] of Object.entries(axes)) {
        if (VALID_AXES[axis] && !VALID_AXES[axis].has(value)) {
          findings.invalidAxis.push({
            file: relPath,
            line,
            axis,
            value,
            valid: [...VALID_AXES[axis]].join(', '),
          })
        }
      }

      // key line 요약 수집
      if (axes.role && ROLE_KEYLINES[axes.role]) {
        const keyline = { ...ROLE_KEYLINES[axes.role] }
        // content 축에 의한 padding 조정 (item/badge만 — --pd-ratio 사용)
        if ((axes.role === 'item' || axes.role === 'badge') && axes.content) {
          const ratio = PD_RATIO[axes.content] ?? 1
          keyline.paddingInline = (keyline.paddingInline ?? 0) * ratio
        }
        findings.keylineSummary.push({
          file: relPath,
          line,
          component: basename(filePath, '.tsx'),
          role: axes.role,
          content: axes.content || null,
          interactive: axes.interactive || null,
          expectedKeyline: keyline,
        })
      }
    }
  }

  // 2. module.css 스캔 (화이트리스트 제외)
  const cssFiles = findModuleCssFiles(ROOT)
  for (const cssPath of cssFiles) {
    if (SIZING_WHITELIST.has(basename(cssPath))) continue
    const overrides = checkModuleCssOverrides(cssPath)
    findings.sizingOverride.push(...overrides.map(v => ({
      ...v,
      file: relative(join(ROOT, '..', '..', '..'), v.file),
    })))
  }

  return findings
}

// ── 리포트 포매팅 ──

function formatTextReport(findings) {
  const lines = []
  const hr = '─'.repeat(60)

  lines.push('╔══════════════════════════════════════════════════════════╗')
  lines.push('║           ax() Key Line 정적 분석 리포트                ║')
  lines.push('╚══════════════════════════════════════════════════════════╝')
  lines.push('')

  // ── Missing Role ──
  if (findings.missingRole.length > 0) {
    lines.push(`❌ FAIL: role 누락 (${findings.missingRole.length}건)`)
    lines.push(hr)
    for (const f of findings.missingRole) {
      lines.push(`  ${f.file}:${f.line}`)
      lines.push(`    interactive: '${f.interactive}' → role 미선언`)
      lines.push(`    ${f.hint}`)
    }
    lines.push('')
  }

  // ── Sizing Override ──
  if (findings.sizingOverride.length > 0) {
    lines.push(`❌ FAIL: module.css sizing override (${findings.sizingOverride.length}건)`)
    lines.push(hr)
    for (const f of findings.sizingOverride) {
      lines.push(`  ${f.file}:${f.line}`)
      lines.push(`    ${f.declaration}`)
      lines.push(`    → role 축이 소유하는 속성을 재정의. key line 깨짐 위험.`)
    }
    lines.push('')
  }

  // ── Invalid Axis ──
  if (findings.invalidAxis.length > 0) {
    lines.push(`❌ FAIL: 유효하지 않은 축 값 (${findings.invalidAxis.length}건)`)
    lines.push(hr)
    for (const f of findings.invalidAxis) {
      lines.push(`  ${f.file}:${f.line}`)
      lines.push(`    ${f.axis}: '${f.value}' → 유효값: ${f.valid}`)
    }
    lines.push('')
  }

  // ── Key Line Summary ──
  lines.push(`📊 Key Line 요약 (${findings.keylineSummary.length}개 ax() 호출)`)
  lines.push(hr)

  // role별 그룹핑
  const byRole = {}
  for (const entry of findings.keylineSummary) {
    if (!byRole[entry.role]) byRole[entry.role] = []
    byRole[entry.role].push(entry)
  }

  for (const [role, entries] of Object.entries(byRole)) {
    const kl = ROLE_KEYLINES[role]
    lines.push('')
    lines.push(`  ── ${role} (${entries.length}개) ── key line: ${kl.minHeight ?? '?'}px height, ${kl.fontSize}px font`)

    // 컴포넌트별 정리
    const seen = new Set()
    for (const e of entries) {
      const key = `${e.component}:${e.content || 'default'}`
      if (seen.has(key)) continue
      seen.add(key)

      const pdInline = e.expectedKeyline.paddingInline
      const pdStr = pdInline != null ? `${pdInline}px` : 'n/a'
      lines.push(`    ${e.component.padEnd(24)} content:${(e.content || '-').padEnd(6)} pd-inline:${pdStr.padEnd(6)}  ${e.file}:${e.line}`)
    }
  }

  // ── 총평 ──
  lines.push('')
  const failCount = findings.missingRole.length + findings.sizingOverride.length + findings.invalidAxis.length
  if (failCount === 0) {
    lines.push('✅ PASS — key line 위반 없음')
  } else {
    lines.push(`❌ ${failCount}건 위반 발견`)
  }

  return lines.join('\n')
}

function formatJsonReport(findings) {
  return JSON.stringify(findings, null, 2)
}

// ── Main ──

const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const fileFilter = args.filter(a => !a.startsWith('--'))

let files = findTsxFiles(ROOT)
if (fileFilter.length > 0) {
  files = files.filter(f => fileFilter.some(filter => f.includes(filter)))
}

const findings = runChecks(files)

if (jsonMode) {
  console.log(formatJsonReport(findings))
} else {
  console.log(formatTextReport(findings))
}

const failCount = findings.missingRole.length + findings.sizingOverride.length + findings.invalidAxis.length
process.exit(failCount > 0 ? 1 : 0)
