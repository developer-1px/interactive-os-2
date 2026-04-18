#!/usr/bin/env node
// @ts-check
/**
 * measureSurfacePairs — Surface 간 시각 구분성 (APCA Lc)
 *
 * 목적: 인접 surface 쌍이 APCA Lc ≥ 10 대비로 시각적으로 구분 가능한지 검사.
 *   "컨테이너 안/밖 경계 불명확" 비평을 측정화.
 *
 * 검사 쌍: depth ladder 인접 + 기능 대비 인접
 *   - sunken ↔ base, base ↔ raised, raised ↔ overlay, overlay ↔ trap (depth ladder)
 *   - base ↔ placeholder, ghost ↔ base, base ↔ inverted (feature 경계)
 *
 * 기준: APCA Lc ≥ 10 (surface 차이 인식 가능 최소)
 *   - Lc < 10: 두 surface가 거의 동일 — 경계 없음 상태
 *   - Lc ≥ 10 ~ 25: 미세한 elevation, shadow 병행 권장
 *   - Lc ≥ 25: 명확 구분
 *
 * 실행:
 *   node scripts/measureSurfacePairs.mjs
 *   node scripts/measureSurfacePairs.mjs --json
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
// 공통 CSS 파싱 (measureFocusContrast / measureTextContrast와 중복 — 후속 simplify 시 공통화)
// ════════════════════════════════════════════════════════════

function parseCssVars(css) {
  const root = new Map(), light = new Map()
  const blockRe = /(:root|\[data-theme="light"\])\s*\{([\s\S]*?)\n\}/g
  let m
  while ((m = blockRe.exec(css)) !== null) {
    const target = m[1] === ':root' ? root : light
    const varRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g
    let mv
    while ((mv = varRe.exec(m[2])) !== null) target.set(mv[1].trim(), mv[2].trim())
  }
  return { root, light }
}

function parseOklch(value, vars) {
  const t = value.trim()
  const fromRe = /^oklch\(\s*from\s+var\(\s*(--[a-zA-Z0-9_-]+)\s*\)\s+(.+)\)\s*$/
  const fromMatch = t.match(fromRe)
  if (fromMatch) {
    const refRaw = resolveVar(fromMatch[1], vars)
    if (!refRaw) return null
    const ref = parseOklch(refRaw, vars)
    if (!ref) return null
    const tokens = splitTopLevel(fromMatch[2])
    if (tokens.length < 3) return null
    const r = tokens.map((x) => evalExpr(x.trim(), ref))
    if (r.some((v) => Number.isNaN(v))) return null
    return { l: clamp(r[0], 0, 1), c: Math.max(0, r[1]), h: (r[2] + 360) % 360, a: 1 }
  }
  const stdRe = /^oklch\(\s*([^)]+)\)\s*$/
  const m = t.match(stdRe)
  if (!m) return null
  const [lch, a] = m[1].split('/').map((s) => s.trim())
  const parts = lch.split(/\s+/).filter(Boolean)
  if (parts.length < 3) return null
  const l = parsePct(parts[0]), c = parseFloat(parts[1]), h = parseFloat(parts[2])
  if ([l, c, h].some((v) => Number.isNaN(v))) return null
  return { l, c, h, a: a !== undefined ? parseFloat(a) : 1 }
}

function parsePct(s) { if (s.endsWith('%')) return parseFloat(s) / 100; const n = parseFloat(s); return n > 1 ? n / 100 : n }
function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)) }
function splitTopLevel(s) { const out = []; let d = 0, b = ''; for (const c of s) { if (c === '(') d++; else if (c === ')') d--; if (d === 0 && /\s/.test(c) && b.length > 0) { out.push(b); b = '' } else b += c } if (b.length) out.push(b); return out }
function evalExpr(e, ref) { if (e === 'l') return ref.l; if (e === 'c') return ref.c; if (e === 'h') return ref.h; if (/^[-+0-9.%]+$/.test(e)) return parsePct(e); return NaN }
function resolveVar(name, vars) { let cur = vars.get(name); let g = 0; while (cur && cur.startsWith('var(') && g < 20) { const m = cur.match(/^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)\s*$/); if (!m) break; cur = vars.get(m[1]); g++ } return cur }
function varToOklch(name, vars) { const r = resolveVar(name, vars); return r ? parseOklch(r, vars) : null }

function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr), b = c * Math.sin(hr)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const L = l_ ** 3, M = m_ ** 3, S = s_ ** 3
  let R = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S
  let G = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S
  let B = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S
  R = clamp(R, 0, 1); G = clamp(G, 0, 1); B = clamp(B, 0, 1)
  const toG = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
  return [Math.round(toG(R) * 255), Math.round(toG(G) * 255), Math.round(toG(B) * 255)]
}

// ════════════════════════════════════════════════════════════
// Surface pair 정의
// ════════════════════════════════════════════════════════════

/** Surface 대표 var (measureFocusContrast와 같은 SURFACES 기준) */
const SURFACE_VARS = {
  sunken:      { dark: '--stone-950', light: '--stone-100' },
  base:        { dark: '--stone-875', light: '--stone-50'  },
  placeholder: { dark: '--stone-950', light: '--stone-100' },
  ghost:       { dark: '--stone-875', light: '--stone-50'  },
  raised:      { dark: '--stone-750', light: '--stone-0'   },
  overlay:     { dark: '--stone-750', light: '--stone-0'   },
  trap:        { dark: '--stone-700', light: '--stone-0'   },
  action:      { dark: '--stone-750', light: '--stone-0'   },
  input:       { dark: '--stone-900', light: '--stone-0'   },
  display:     { dark: '--stone-875', light: '--stone-50'  },
  inverted:    { dark: '--stone-0',   light: '--stone-950' },
}

/** 인접 쌍 — depth ladder + 기능 대비.
 *  raised↔overlay, ghost↔base 같이 의도적으로 동일 stone을 공유하는 쌍은 제외.
 *  surface 구분은 "의미가 다른 쌍" 사이에서만 의미 있음. */
const PAIRS = [
  // Depth ladder (세로 계층)
  { a: 'sunken',  b: 'base',    kind: 'depth', note: 'sidebar ↔ page' },
  { a: 'base',    b: 'raised',  kind: 'depth', note: 'page ↔ card' },
  { a: 'overlay', b: 'trap',    kind: 'depth', note: 'popover ↔ dialog' },
  // Feature 대비 (수평 관계, 의도적 다른 stone)
  { a: 'base',    b: 'placeholder', kind: 'feature', note: 'page ↔ empty' },
  { a: 'base',    b: 'input',       kind: 'feature', note: 'page ↔ input' },
  { a: 'base',    b: 'inverted',    kind: 'feature', note: 'page ↔ tooltip' },
]

/**
 * 판정 기준 (OR):
 *   - APCA Lc ≥ LC_MIN — perceptual contrast (text 기준이지만 큰 차이에 민감)
 *   - OKLCH L delta ≥ L_DELTA_MIN — surface 구분용 (APCA가 낮은 contrast에서 0으로 clip하는 한계 보완)
 *
 * 이유: APCA는 텍스트 대비 기준이라 surface 간 중간 lightness 비교에서 usable threshold 이하를 0으로 처리.
 * surface 구분 ≠ 텍스트 가독성이므로 L delta 기반 병행이 UI 현실 부합.
 */
const LC_MIN = 10
const L_DELTA_MIN = 0.05

function loadVars() {
  const palette = parseCssVars(readFileSync(PALETTE_CSS, 'utf-8'))
  const tokens = parseCssVars(readFileSync(TOKENS_CSS, 'utf-8'))
  const root = new Map([...palette.root, ...tokens.root])
  const light = new Map([...palette.root, ...tokens.root, ...tokens.light])
  return { root, light }
}

function measurePair(aVar, bVar, vars) {
  const aO = varToOklch(aVar, vars), bO = varToOklch(bVar, vars)
  if (!aO || !bO) return null
  const aY = sRGBtoY(oklchToRgb(aO))
  const bY = sRGBtoY(oklchToRgb(bO))
  const lc = Math.abs(Number(APCAcontrast(aY, bY)))
  const lDelta = Math.abs(aO.l - bO.l)
  return { lc, lDelta }
}

function main() {
  const jsonMode = process.argv.includes('--json')
  const { root, light } = loadVars()

  const rows = []
  for (const theme of ['dark', 'light']) {
    const vars = theme === 'dark' ? root : light
    for (const p of PAIRS) {
      const aVar = SURFACE_VARS[p.a][theme]
      const bVar = SURFACE_VARS[p.b][theme]
      const m = measurePair(aVar, bVar, vars)
      const lc = m?.lc ?? null
      const lDelta = m?.lDelta ?? null
      const pass = m !== null && (lc >= LC_MIN || lDelta >= L_DELTA_MIN)
      rows.push({
        theme, pairA: p.a, pairB: p.b, kind: p.kind, note: p.note,
        lc: lc !== null ? Number(lc.toFixed(2)) : null,
        l_delta: lDelta !== null ? Number(lDelta.toFixed(3)) : null,
        pass,
      })
    }
  }

  const passCount = rows.filter((r) => r.pass).length
  const failCount = rows.length - passCount

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify({
        metric: 'surface-pairs',
        threshold: { lc_min: LC_MIN, l_delta_min: L_DELTA_MIN },
        total: rows.length,
        pass: passCount,
        fail: failCount,
        items: rows.map((r) => ({
          theme: r.theme,
          pair: `${r.pairA}↔${r.pairB}`,
          kind: r.kind,
          lc: r.lc,
          l_delta: r.l_delta,
          pass: r.pass,
        })),
      }),
    )
    process.exit(failCount > 0 ? 1 : 0)
  }

  const date = new Date().toISOString().slice(0, 10)
  const reportPath = resolve(REPORT_DIR, `surface-pairs-${date}.md`)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })
  const lines = []
  lines.push(`# Surface Pair Contrast — ${date}`)
  lines.push('')
  lines.push(`**기준:** 인접 surface 쌍 APCA Lc ≥ ${LC_MIN} (구분 인식 최소)`)
  lines.push('')
  lines.push(`**결과:** ${passCount}/${rows.length} pass, ${failCount} fail`)
  lines.push('')
  for (const theme of ['dark', 'light']) {
    lines.push(`## Theme: \`${theme}\``)
    lines.push('')
    lines.push('| pair | kind | Lc | pass? | note |')
    lines.push('|------|------|----|:-----:|------|')
    for (const r of rows.filter((x) => x.theme === theme)) {
      lines.push(`| \`${r.pairA}↔${r.pairB}\` | ${r.kind} | ${r.lc ?? 'ERR'} | ${r.pass ? '✅' : '❌'} | ${r.note} |`)
    }
    lines.push('')
  }
  writeFileSync(reportPath, lines.join('\n') + '\n')

  console.log(`[surface-pairs] pass=${passCount}/${rows.length} fail=${failCount}`)
  console.log(`[surface-pairs] report: ${reportPath}`)
  process.exit(failCount > 0 ? 1 : 0)
}

try { main() } catch (err) { console.error('[surface-pairs] 실패:', err); process.exit(2) }
