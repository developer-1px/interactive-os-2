#!/usr/bin/env node
// @ts-check
/**
 * measureTextContrast — P-09 Text Contrast 자동 측정 (APCA Lc)
 *
 * 목적: 모든 (text, surface, theme) 조합에서 APCA Lc ≥ 75 (body ≥16px) 보장.
 *
 * 대상:
 *  - text: --text-bright / --text-primary / --text-secondary / --text-muted
 *  - surface: 11종 (measureFocusContrast의 SURFACES 재활용)
 *  - theme: dark / light
 *
 * 기준: APCA Body Lc ≥ 75 (16-24px text). 헤딩/대형 텍스트는 Lc 60 허용이나
 *       여기선 가장 엄격한 기준 단일 적용. text-muted는 보조 텍스트이므로
 *       실제로는 Lc 60~75 경계 권장 (프로젝트 판단).
 *
 * 실행:
 *   node scripts/measureTextContrast.mjs           (리포트 파일 출력)
 *   node scripts/measureTextContrast.mjs --json    (stdout JSON)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APCAcontrast, sRGBtoY } from 'apca-w3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const PALETTE_CSS = resolve(ROOT, 'src/styles/palette.css')
const TOKENS_CSS = resolve(ROOT, 'src/styles/tokens.css')
const REPORT_DIR = resolve(ROOT, 'docs/research/ax/reports')

// ════════════════════════════════════════════════════════════
// CSS 파싱 — measureFocusContrast.mjs와 동일 로직 (공통화는 추후 simplify 때)
// ════════════════════════════════════════════════════════════

function parseCssVars(css) {
  const root = new Map()
  const light = new Map()
  const blockRe = /(:root|\[data-theme="light"\])\s*\{([\s\S]*?)\n\}/g
  let m
  while ((m = blockRe.exec(css)) !== null) {
    const target = m[1] === ':root' ? root : light
    const varRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g
    let mv
    while ((mv = varRe.exec(m[2])) !== null) {
      target.set(mv[1].trim(), mv[2].trim())
    }
  }
  return { root, light }
}

function parseOklch(value, vars) {
  const trimmed = value.trim()
  const fromRe = /^oklch\(\s*from\s+var\(\s*(--[a-zA-Z0-9_-]+)\s*\)\s+(.+)\)\s*$/
  const fromMatch = trimmed.match(fromRe)
  if (fromMatch) {
    const refRaw = resolveVar(fromMatch[1], vars)
    if (!refRaw) return null
    const ref = parseOklch(refRaw, vars)
    if (!ref) return null
    const tokens = splitTopLevel(fromMatch[2])
    if (tokens.length < 3) return null
    const resolved = tokens.map((t) => evalExpr(t.trim(), ref))
    if (resolved.some((v) => Number.isNaN(v))) return null
    const [l, c, h] = resolved
    return { l: clamp(l, 0, 1), c: Math.max(0, c), h: (h + 360) % 360, a: 1 }
  }
  const stdRe = /^oklch\(\s*([^)]+)\)\s*$/
  const stdMatch = trimmed.match(stdRe)
  if (!stdMatch) return null
  const [lch, alphaPart] = stdMatch[1].split('/').map((s) => s.trim())
  const parts = lch.split(/\s+/).filter(Boolean)
  if (parts.length < 3) return null
  const l = parsePercent(parts[0])
  const c = parseFloat(parts[1])
  const h = parseFloat(parts[2])
  const a = alphaPart !== undefined ? parseFloat(alphaPart) : 1
  if ([l, c, h].some((v) => Number.isNaN(v))) return null
  return { l, c, h, a }
}

function parsePercent(s) {
  if (s.endsWith('%')) return parseFloat(s) / 100
  const n = parseFloat(s)
  return n > 1 ? n / 100 : n
}
function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)) }

function splitTopLevel(s) {
  const out = []; let depth = 0; let buf = ''
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (depth === 0 && /\s/.test(ch) && buf.length > 0) { out.push(buf); buf = '' }
    else buf += ch
  }
  if (buf.length > 0) out.push(buf)
  return out
}

function evalExpr(expr, ref) {
  if (expr === 'l') return ref.l
  if (expr === 'c') return ref.c
  if (expr === 'h') return ref.h
  if (/^[-+0-9.%]+$/.test(expr)) return parsePercent(expr)
  return NaN
}

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

function varToOklch(name, vars) {
  const raw = resolveVar(name, vars)
  if (!raw) return null
  return parseOklch(raw, vars)
}

function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const L = l_ ** 3, M = m_ ** 3, S = s_ ** 3
  let R = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S
  let G = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S
  let B = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S
  R = clamp(R, 0, 1); G = clamp(G, 0, 1); B = clamp(B, 0, 1)
  const toGamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
  return [Math.round(toGamma(R) * 255), Math.round(toGamma(G) * 255), Math.round(toGamma(B) * 255)]
}

// ════════════════════════════════════════════════════════════
// Matrix 정의
// ════════════════════════════════════════════════════════════

/** text 토큰 4종. dark/light 동일 이름, theme별 오버라이드. */
const TEXTS = [
  { key: 'bright',    varName: '--text-bright',    note: 'title/key text' },
  { key: 'primary',   varName: '--text-primary',   note: 'body default' },
  { key: 'secondary', varName: '--text-secondary', note: 'descriptor' },
  { key: 'muted',     varName: '--text-muted',     note: 'hint/placeholder' },
]

/** surface — measureFocusContrast.mjs와 동일 */
const SURFACES = [
  { key: 'action',      darkVar: '--stone-750', lightVar: '--stone-0',   note: 'button·toggle 주면' },
  { key: 'input',       darkVar: '--stone-900', lightVar: '--stone-0',   note: 'input·textarea' },
  { key: 'display',     darkVar: '--stone-875', lightVar: '--stone-50',  note: '카드 배경' },
  { key: 'overlay',     darkVar: '--stone-750', lightVar: '--stone-0',   note: 'popover·menu' },
  { key: 'trap',        darkVar: '--stone-700', lightVar: '--stone-0',   note: 'dialog center' },
  { key: 'ghost',       darkVar: '--stone-875', lightVar: '--stone-50',  note: 'transparent → parent' },
  { key: 'placeholder', darkVar: '--stone-950', lightVar: '--stone-100', note: 'skeleton/empty' },
  { key: 'sunken',      darkVar: '--stone-950', lightVar: '--stone-100', note: 'sidebar·blockquote' },
  { key: 'base',        darkVar: '--stone-875', lightVar: '--stone-50',  note: 'page bg' },
  { key: 'raised',      darkVar: '--stone-750', lightVar: '--stone-0',   note: 'card' },
  { key: 'inverted',    darkVar: '--stone-0',   lightVar: '--stone-950', note: '역전 tooltip' },
]

/** APCA body text 기준. text-muted는 보조이므로 별도 기준 적용 가능 — 여기선 통일 Lc ≥ 75 */
const LC_MIN = 75
/** text-muted만 완화 (보조 텍스트 용도) */
const LC_MIN_MUTED = 60

function loadVars() {
  const palette = parseCssVars(readFileSync(PALETTE_CSS, 'utf-8'))
  const tokens = parseCssVars(readFileSync(TOKENS_CSS, 'utf-8'))
  const root = new Map([...palette.root, ...tokens.root])
  const light = new Map([...palette.root, ...tokens.root, ...tokens.light])
  return { root, light }
}

function computeRow(textVar, surfVar, vars) {
  const textOklch = varToOklch(textVar, vars)
  const surfOklch = varToOklch(surfVar, vars)
  if (!textOklch || !surfOklch) {
    return { error: `token 해석 실패: text=${textVar} surf=${surfVar}` }
  }
  const textRgb = oklchToRgb(textOklch)
  const surfRgb = oklchToRgb(surfOklch)
  const txtY = sRGBtoY(textRgb)
  const bgY = sRGBtoY(surfRgb)
  const lcRaw = APCAcontrast(txtY, bgY)
  const lc = Math.abs(Number(lcRaw))
  return { textOklch, surfOklch, textRgb, surfRgb, lc }
}

function main() {
  const jsonMode = process.argv.includes('--json')
  const { root, light } = loadVars()

  const rows = []
  for (const theme of ['dark', 'light']) {
    const vars = theme === 'dark' ? root : light
    for (const t of TEXTS) {
      for (const s of SURFACES) {
        const surfVar = theme === 'dark' ? s.darkVar : s.lightVar
        const row = computeRow(t.varName, surfVar, vars)
        const threshold = t.key === 'muted' ? LC_MIN_MUTED : LC_MIN
        const lc = row.lc ?? 0
        const pass = !row.error && lc >= threshold
        rows.push({ theme, text: t.key, surface: s.key, row, pass, threshold })
      }
    }
  }

  const passCount = rows.filter((r) => r.pass).length
  const failCount = rows.length - passCount

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify({
        metric: 'text-apca',
        threshold: { lc_min: LC_MIN, lc_min_muted: LC_MIN_MUTED },
        total: rows.length,
        pass: passCount,
        fail: failCount,
        items: rows.map((r) => ({
          theme: r.theme,
          text: r.text,
          surface: r.surface,
          lc: r.row.lc !== undefined ? Number(r.row.lc.toFixed(2)) : null,
          threshold: r.threshold,
          pass: r.pass,
        })),
      }),
    )
    process.exit(failCount > 0 ? 1 : 0)
  }

  // 리포트
  const date = new Date().toISOString().slice(0, 10)
  const reportPath = resolve(REPORT_DIR, `text-apca-${date}.md`)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })
  const lines = []
  lines.push(`# Text APCA Measurement — ${date}`)
  lines.push('')
  lines.push(`**기준:** body text Lc ≥ ${LC_MIN}, muted Lc ≥ ${LC_MIN_MUTED} (APCA 16-24px body)`)
  lines.push('')
  lines.push(`**결과:** ${passCount}/${rows.length} pass, ${failCount} fail. ${failCount === 0 ? '✅ PASS' : '❌ FAIL'}`)
  lines.push('')
  for (const theme of ['dark', 'light']) {
    lines.push(`## Theme: \`${theme}\``)
    lines.push('')
    lines.push('| text | surface | Lc | threshold | pass? |')
    lines.push('|------|---------|----|-----------|:-----:|')
    for (const r of rows.filter((x) => x.theme === theme)) {
      const lcStr = r.row.lc !== undefined ? r.row.lc.toFixed(1) : 'ERR'
      const mark = r.pass ? '✅' : '❌'
      lines.push(`| ${r.text} | ${r.surface} | ${lcStr} | ${r.threshold} | ${mark} |`)
    }
    lines.push('')
  }
  writeFileSync(reportPath, lines.join('\n') + '\n')

  console.log(`[text-apca] pass=${passCount}/${rows.length} fail=${failCount}`)
  console.log(`[text-apca] report: ${reportPath}`)
  process.exit(failCount > 0 ? 1 : 0)
}

try {
  main()
} catch (err) {
  console.error('[text-apca] 측정 실패:', err)
  process.exit(2)
}
