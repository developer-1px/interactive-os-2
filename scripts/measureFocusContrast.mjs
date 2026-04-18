#!/usr/bin/env node
// @ts-check
/**
 * measureFocusContrast — P1-1 (docs/research/ax/04-gap-plan.md §3.1)
 *
 * 목적: Focus ring의 APCA Lc ≥ 60 (24px body 기준) 보장.
 *
 * 동작:
 *  1) src/styles/palette.css + src/styles/tokens.css 파싱
 *  2) surface 대표값 11종 × focus(alpha 0.35 blended) 조합에서 APCA Lc 계산
 *  3) Lc < 60 발생 시 exit 1
 *  4) docs/research/ax/reports/focus-apca-{date}.md 리포트 출력
 *
 * 실행: node scripts/measureFocusContrast.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APCAcontrast, sRGBtoY, alphaBlend } from 'apca-w3'

// ════════════════════════════════════════════════════════════
// Paths
// ════════════════════════════════════════════════════════════
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const PALETTE_CSS = resolve(ROOT, 'src/styles/palette.css')
const TOKENS_CSS = resolve(ROOT, 'src/styles/tokens.css')
const REPORT_DIR = resolve(ROOT, 'docs/research/ax/reports')

// ════════════════════════════════════════════════════════════
// §1. CSS 파싱 — palette.css + tokens.css에서 OKLCH 값 추출
// ════════════════════════════════════════════════════════════

/**
 * CSS 변수 정의를 수집한다. 같은 이름이 여러 곳에 선언되면 마지막 값 사용 (cascade 유사).
 * theme 분기(`[data-theme="light"]`)는 별도 맵으로 분리.
 *
 * @param {string} css
 * @returns {{ root: Map<string, string>, light: Map<string, string> }}
 */
function parseCssVars(css) {
  const root = new Map()
  const light = new Map()

  // 블록 단위 스캐닝 — :root {…}, [data-theme="light"] {…}
  const blockRe = /(:root|\[data-theme="light"\])\s*\{([\s\S]*?)\n\}/g
  let m
  while ((m = blockRe.exec(css)) !== null) {
    const selector = m[1]
    const body = m[2]
    const target = selector === ':root' ? root : light
    // --name: value; 단 한 줄씩 추출
    const varRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g
    let mv
    while ((mv = varRe.exec(body)) !== null) {
      const name = mv[1].trim()
      const value = mv[2].trim()
      target.set(name, value)
    }
  }
  return { root, light }
}

/**
 * OKLCH 문자열 파싱. 3가지 형태 지원:
 *   - oklch(L% C H)
 *   - oklch(L% C H / a)
 *   - oklch(from var(--X) <expr> <expr> <expr>)  ← 변수 체인 + expr 평가
 *
 * @param {string} value
 * @param {Map<string, string>} vars
 * @returns {{ l: number, c: number, h: number, a: number } | null}
 */
function parseOklch(value, vars) {
  const trimmed = value.trim()

  // oklch(from var(--X) l c h) 형태: from 뒤 참조 색상의 l/c/h를 기반으로 재조합
  const fromRe = /^oklch\(\s*from\s+var\(\s*(--[a-zA-Z0-9_-]+)\s*\)\s+(.+)\)\s*$/
  const fromMatch = trimmed.match(fromRe)
  if (fromMatch) {
    const refName = fromMatch[1]
    const rest = fromMatch[2]
    const refRaw = resolveVar(refName, vars)
    if (!refRaw) return null
    const ref = parseOklch(refRaw, vars)
    if (!ref) return null
    // expression 3-4개를 파싱. 아주 단순한 대체만 처리:
    //   l -> ref.l, c -> ref.c, h -> ref.h
    //   clamp(0, calc(l + 0.03 * 1), 0.95) 같은 CSS math는 단순 평가
    const tokens = splitTopLevel(rest)
    if (tokens.length < 3) return null
    const resolved = tokens.map((t) => evalExpr(t.trim(), ref))
    if (resolved.some((v) => Number.isNaN(v))) return null
    const [l, c, h] = resolved
    const a = tokens[3] !== undefined ? evalExpr(tokens[3].trim(), ref) : 1
    return { l: clamp(l, 0, 1), c: Math.max(0, c), h: (h + 360) % 360, a }
  }

  // 표준 oklch(L C H [/ A])
  const stdRe = /^oklch\(\s*([^)]+)\)\s*$/
  const stdMatch = trimmed.match(stdRe)
  if (!stdMatch) return null
  const inner = stdMatch[1]
  const [lch, alphaPart] = inner.split('/').map((s) => s.trim())
  const parts = lch.split(/\s+/).filter(Boolean)
  if (parts.length < 3) return null
  const l = parsePercent(parts[0])
  const c = parseFloat(parts[1])
  const h = parseFloat(parts[2])
  const a = alphaPart !== undefined ? parseFloat(alphaPart) : 1
  if ([l, c, h].some((v) => Number.isNaN(v))) return null
  return { l, c, h, a }
}

/** 'L%' → 0..1, 'L' → L/100 기준 */
function parsePercent(s) {
  if (s.endsWith('%')) return parseFloat(s) / 100
  const n = parseFloat(s)
  // oklch는 L이 0..1 또는 0%..100% 모두 유효. 값 >1 이면 %로 간주.
  return n > 1 ? n / 100 : n
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x))
}

/** 최상위 공백으로 split, 괄호 중첩 보호 */
function splitTopLevel(s) {
  const out = []
  let depth = 0
  let buf = ''
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (depth === 0 && /\s/.test(ch) && buf.length > 0) {
      out.push(buf)
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.length > 0) out.push(buf)
  return out
}

/**
 * 수식 평가기. 지원:
 *   - 숫자 리터럴 (percent 포함)
 *   - 식별자 l|c|h → ref.{l,c,h}
 *   - clamp(a, b, c) → min(c, max(a, b))
 *   - calc(expr) → expr 평가
 *   - 사칙연산 (+ - * /)
 */
function evalExpr(expr, ref) {
  // clamp(a, b, c)
  const clampRe = /^clamp\(\s*(.+)\s*\)$/
  const calcRe = /^calc\(\s*(.+)\s*\)$/
  if (clampRe.test(expr)) {
    const inner = expr.match(clampRe)[1]
    const args = splitArgsByComma(inner)
    if (args.length !== 3) return NaN
    const [lo, v, hi] = args.map((a) => evalExpr(a.trim(), ref))
    return clamp(v, lo, hi)
  }
  if (calcRe.test(expr)) {
    return evalExpr(expr.match(calcRe)[1].trim(), ref)
  }
  // 식별자 치환
  if (expr === 'l') return ref.l
  if (expr === 'c') return ref.c
  if (expr === 'h') return ref.h
  // 순수 숫자
  if (/^[-+0-9.%]+$/.test(expr)) return parsePercent(expr)
  // 사칙연산 — 괄호 없는 단순 식만
  return evalArith(expr, ref)
}

function splitArgsByComma(s) {
  const out = []
  let depth = 0
  let buf = ''
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(buf)
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.length > 0) out.push(buf)
  return out
}

function evalArith(expr, ref) {
  // 아주 단순한 좌→우 평가 (tokens.css의 `l + 0.03 * 1` 수준만 처리)
  const tokens = expr.match(/([-+*/])|([a-z]+)|([-+]?\d*\.?\d+%?)|\(([^)]+)\)/g)
  if (!tokens) return NaN
  let acc = NaN
  let op = '+'
  for (const t of tokens) {
    if ('+-*/'.includes(t)) {
      op = t
      continue
    }
    let v
    if (t === 'l' || t === 'c' || t === 'h') v = ref[t]
    else if (t.startsWith('var(')) {
      // not supported at this depth
      return NaN
    } else v = parsePercent(t)
    if (Number.isNaN(acc)) {
      acc = v
    } else {
      if (op === '+') acc += v
      else if (op === '-') acc -= v
      else if (op === '*') acc *= v
      else if (op === '/') acc /= v
    }
  }
  return acc
}

/**
 * var(--name) 체인을 따라가며 실제 oklch 문자열에 도달.
 * @param {string} name
 * @param {Map<string, string>} vars
 */
function resolveVar(name, vars) {
  let cur = vars.get(name)
  let guard = 0
  while (cur && cur.startsWith('var(') && guard < 20) {
    const m = cur.match(/^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)\s*$/)
    if (!m) break
    cur = vars.get(m[1])
    guard++
  }
  return cur
}

// ════════════════════════════════════════════════════════════
// §2. OKLCH → sRGB 변환
// ════════════════════════════════════════════════════════════

/**
 * OKLCH → Oklab → linear sRGB → sRGB (8bit)
 *
 * 참고: https://bottosson.github.io/posts/colorwrong/
 * 여기서는 simple conversion only; gamut mapping 없음 (clip).
 */
function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)

  // Oklab → linear sRGB (inverse matrix from Björn Ottosson)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const L = l_ ** 3
  const M = m_ ** 3
  const S = s_ ** 3

  let R = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S
  let G = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S
  let B = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S

  R = clamp(R, 0, 1)
  G = clamp(G, 0, 1)
  B = clamp(B, 0, 1)

  // linear → sRGB gamma
  const toGamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
  return [Math.round(toGamma(R) * 255), Math.round(toGamma(G) * 255), Math.round(toGamma(B) * 255)]
}

// ════════════════════════════════════════════════════════════
// §3. Measurement matrix
// ════════════════════════════════════════════════════════════

/** 11개 surface 대표값. dark + light 두 테마. */
const SURFACES = [
  // role/surface 11종 — DESIGN.md 명세 + tokens.css 실제 값 기반
  // dark: ax recipe에서 실제 깔리는 oklch 근사값
  { key: 'action', darkVar: '--stone-750', lightVar: '--stone-0', note: 'button·toggle 주면' },
  { key: 'input', darkVar: '--stone-900', lightVar: '--stone-0', note: 'input·textarea' },
  { key: 'display', darkVar: '--stone-875', lightVar: '--stone-50', note: '카드 배경' },
  { key: 'overlay', darkVar: '--stone-750', lightVar: '--stone-0', note: 'popover·menu' },
  { key: 'trap', darkVar: '--stone-700', lightVar: '--stone-0', note: 'dialog center' },
  { key: 'ghost', darkVar: '--stone-875', lightVar: '--stone-50', note: 'transparent → parent' },
  { key: 'placeholder', darkVar: '--stone-950', lightVar: '--stone-100', note: 'skeleton/empty' },
  { key: 'sunken', darkVar: '--stone-950', lightVar: '--stone-100', note: 'sidebar·blockquote' },
  { key: 'base', darkVar: '--stone-875', lightVar: '--stone-50', note: 'page bg' },
  { key: 'raised', darkVar: '--stone-750', lightVar: '--stone-0', note: 'card (+shadow)' },
  { key: 'inverted', darkVar: '--stone-0', lightVar: '--stone-950', note: '역전 tooltip' },
]

/**
 * focus 색: tokens.css의 `--focus` 토큰을 동적으로 사용.
 * root/light map에서 `--focus`가 이미 등록되어 있으므로 resolveVar로 체인 따라감.
 * 상수 하드코딩 금지 — 소스 변경이 측정에 즉시 반영되어야 함.
 */
const FOCUS_VAR = '--focus'

/** focus-ring alpha — tokens.css의 `--focus-ring-shadow: ... / <alpha>` 에서 동적 파싱. 실패 시 0.35 fallback. */
function readFocusAlpha(tokensCss) {
  const m = tokensCss.match(/--focus-ring-shadow\s*:\s*[^;]*\/\s*([\d.]+)\s*\)/)
  if (!m) return 0.35
  const v = parseFloat(m[1])
  return Number.isFinite(v) ? v : 0.35
}

// ════════════════════════════════════════════════════════════
// §4. Main
// ════════════════════════════════════════════════════════════

function loadVars() {
  const paletteCss = readFileSync(PALETTE_CSS, 'utf-8')
  const tokensCss = readFileSync(TOKENS_CSS, 'utf-8')
  const palette = parseCssVars(paletteCss)
  const tokens = parseCssVars(tokensCss)
  // 단일 root 맵 구축 (palette :root + tokens :root, tokens가 이긴다)
  const root = new Map([...palette.root, ...tokens.root])
  const light = new Map([...palette.root, ...tokens.root, ...tokens.light])
  const focusAlpha = readFocusAlpha(tokensCss)
  return { root, light, focusAlpha }
}

/** 변수 이름을 oklch로 최종 해석 */
function varToOklch(name, vars) {
  const raw = resolveVar(name, vars)
  if (!raw) return null
  return parseOklch(raw, vars)
}

/** 하나의 matrix row 계산 */
function computeRow(surfKey, surfVar, focusVar, vars, focusAlpha) {
  const surfOklch = varToOklch(surfVar, vars)
  const focusOklch = varToOklch(focusVar, vars)
  if (!surfOklch || !focusOklch) {
    return { error: `token 해석 실패: surf=${surfVar} focus=${focusVar}` }
  }
  const surfRgb = oklchToRgb(surfOklch)
  const focusRgb = oklchToRgb(focusOklch)
  // focus ring은 tokens.css --focus-ring-shadow의 alpha로 surface 위에 blended. apca-w3 alphaBlend 사용.
  const blendedRgb = alphaBlend([...focusRgb, focusAlpha], surfRgb, true)
  // APCA: 텍스트 대비처럼 focus ring을 fg, surface를 bg로 측정
  const txtY = sRGBtoY(blendedRgb)
  const bgY = sRGBtoY(surfRgb)
  const lcRaw = APCAcontrast(txtY, bgY)
  const lc = Math.abs(Number(lcRaw))
  return {
    surfOklch,
    focusOklch,
    blendedRgb,
    surfRgb,
    lc,
  }
}

function fmtOklch(o) {
  if (!o) return '—'
  return `oklch(${(o.l * 100).toFixed(1)}% ${o.c.toFixed(3)} ${o.h.toFixed(0)})`
}

function fmtRgb(rgb) {
  if (!rgb) return '—'
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

function main() {
  const jsonMode = process.argv.includes('--json')
  const { root, light, focusAlpha } = loadVars()

  /** @type {{theme: string, key: string, note: string, row: any, pass: boolean}[]} */
  const rows = []

  for (const theme of ['dark', 'light']) {
    const vars = theme === 'dark' ? root : light
    const focusVar = FOCUS_VAR
    for (const s of SURFACES) {
      const surfVar = theme === 'dark' ? s.darkVar : s.lightVar
      const row = computeRow(s.key, surfVar, focusVar, vars, focusAlpha)
      const lc = row.lc ?? 0
      const pass = !row.error && lc >= 60
      rows.push({ theme, key: s.key, note: s.note, row, pass })
    }
  }

  const failures = rows.filter((r) => !r.pass)
  const passCount = rows.filter((r) => r.pass).length

  // --json 모드: stdout으로 JSON만 출력, 리포트 쓰지 않음
  if (jsonMode) {
    const payload = {
      metric: 'focus-apca',
      threshold: { lc_min: 60 },
      params: { focus_alpha: focusAlpha },
      total: rows.length,
      pass: passCount,
      fail: failures.length,
      items: rows.map((r) => ({
        theme: r.theme,
        key: r.key,
        lc: r.row.lc !== undefined ? Number(r.row.lc.toFixed(2)) : null,
        pass: r.pass,
      })),
    }
    process.stdout.write(JSON.stringify(payload))
    process.exit(failures.length > 0 ? 1 : 0)
  }

  // 리포트 작성
  const date = new Date().toISOString().slice(0, 10)
  const reportPath = resolve(REPORT_DIR, `focus-apca-${date}.md`)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })
  const lines = []
  lines.push(`# Focus APCA Measurement — ${date}`)
  lines.push('')
  lines.push('**기준:** APCA Lc ≥ 60 (24px body, P-08 Focus Visibility)')
  lines.push('')
  lines.push(
    `**결과:** ${passCount}/${rows.length} pass, ${failures.length} fail. ${failures.length === 0 ? '✅ PASS' : '❌ FAIL'}`,
  )
  lines.push('')

  for (const theme of ['dark', 'light']) {
    lines.push(`## Theme: \`${theme}\``)
    lines.push('')
    lines.push('| surface | surface oklch | focus+alpha blended | Lc | pass? |')
    lines.push('|---------|---------------|---------------------|-----|:-----:|')
    for (const r of rows.filter((x) => x.theme === theme)) {
      const surfStr = fmtOklch(r.row.surfOklch)
      const blendStr = fmtRgb(r.row.blendedRgb)
      const lcStr = r.row.lc !== undefined ? r.row.lc.toFixed(1) : 'ERR'
      const mark = r.pass ? '✅' : '❌'
      const err = r.row.error ? ` (${r.row.error})` : ''
      lines.push(`| ${r.key} | ${surfStr} | ${blendStr} | ${lcStr} | ${mark}${err} |`)
    }
    lines.push('')
  }

  lines.push('## 실패 목록')
  lines.push('')
  if (failures.length === 0) {
    lines.push('- 없음')
  } else {
    for (const r of failures) {
      const lcStr = r.row.lc !== undefined ? r.row.lc.toFixed(1) : 'ERR'
      lines.push(`- \`${r.theme}\` · \`${r.key}\` — Lc ${lcStr} (< 60). ${r.note}`)
    }
  }
  lines.push('')
  lines.push('## 권고 조치')
  lines.push('')
  if (failures.length > 0) {
    lines.push('- **alpha 상향**: `--focus-ring-shadow` alpha 0.35 → 0.5~0.6 검토')
    lines.push('- **lightness 대비**: `--focus` 후보 blue-400 (67.4%) vs blue-500 (60.6%) 중 theme별 최적 재선택')
    lines.push('- **ring 폭 확대**: `--focus-ring: 1px` → 2px로 ring 면적 증가 (APCA는 font weight/size 기반이므로 측정 대리 안 됨. 정성 검토용)')
    lines.push('- **surface별 다른 focus hue**: sunken/placeholder처럼 어두운 surface에는 brighter focus (blue-300 등)')
  } else {
    lines.push('- 전 조합 pass. 신규 surface/theme 추가 시 재측정.')
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('> 측정: `apca-w3` 0.1.9 · 스크립트: `scripts/measureFocusContrast.mjs`')
  lines.push('> 참고: `docs/research/ax/04-gap-plan.md` §3.1')

  writeFileSync(reportPath, lines.join('\n') + '\n')

  // 콘솔 출력
  console.log(`[focus-apca] pass=${passCount}/${rows.length} fail=${failures.length}`)
  console.log(`[focus-apca] report: ${reportPath}`)
  if (failures.length > 0) {
    console.log('[focus-apca] failures:')
    for (const r of failures) {
      const lcStr = r.row.lc !== undefined ? r.row.lc.toFixed(1) : 'ERR'
      console.log(`  - ${r.theme}/${r.key}: Lc=${lcStr}`)
    }
    process.exit(1)
  }
  process.exit(0)
}

try {
  main()
} catch (err) {
  console.error('[focus-apca] 측정 실패:', err)
  process.exit(2)
}
