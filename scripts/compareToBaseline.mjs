#!/usr/bin/env node
// @ts-check
/**
 * compareToBaseline — Ratcheting Convergence Loop의 "회귀 차단" 단계
 *
 * 목적: 현재 측정값 vs `ax-baseline.json` 비교.
 *   **회귀(지표 악화)**가 하나라도 발견되면 exit 1.
 *   개선(지표 향상)은 허용하되 baseline 갱신은 별도 명령(`pnpm baseline:save`).
 *
 * 회귀 정의:
 *   - focus-apca: pass 수가 baseline보다 적음 OR 개별 조합 중 pass → fail 전환
 *   - modular-scale: 총 warnings가 늘어남 OR 개별 step status 악화
 *
 * 실행:
 *   node scripts/compareToBaseline.mjs
 *   node scripts/compareToBaseline.mjs --json  # machine-readable 결과
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const BASELINE_PATH = resolve(ROOT, 'ax-baseline.json')

const METRICS = [
  { name: 'focus-apca', script: 'scripts/measureFocusContrast.mjs' },
  { name: 'modular-scale', script: 'scripts/verifyModularScale.mjs' },
]

function runMetric(scriptPath) {
  const absPath = resolve(ROOT, scriptPath)
  const result = spawnSync('node', [absPath, '--json'], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  })
  if (!result.stdout) throw new Error(`${scriptPath} JSON 출력 없음`)
  return JSON.parse(result.stdout)
}

/**
 * focus-apca 회귀 검사.
 *   - total pass 수 감소 → 회귀
 *   - 개별 조합 (theme/key) 단위로 baseline pass → 현재 fail 전환 → 회귀
 */
function diffFocusApca(prev, cur) {
  /** @type {{type: string, detail: string}[]} */
  const regressions = []
  /** @type {{type: string, detail: string}[]} */
  const improvements = []

  if (cur.pass < prev.pass) {
    regressions.push({
      type: 'total_pass',
      detail: `pass ${prev.pass}/${prev.total} → ${cur.pass}/${cur.total}`,
    })
  } else if (cur.pass > prev.pass) {
    improvements.push({
      type: 'total_pass',
      detail: `pass ${prev.pass}/${prev.total} → ${cur.pass}/${cur.total} (+${cur.pass - prev.pass})`,
    })
  }

  const prevMap = new Map(prev.items.map((i) => [`${i.theme}/${i.key}`, i]))
  const curMap = new Map(cur.items.map((i) => [`${i.theme}/${i.key}`, i]))

  // Lc delta 집계 — individual 상승/하락도 추적 (pass 수가 바닥인 상태에서 유일한 진행 지표)
  const LC_EPS = 0.5 // 부동소수 노이즈 무시
  const risen = [] // { id, prevLc, curLc, delta }
  const dropped = []

  for (const [id, prevItem] of prevMap) {
    const curItem = curMap.get(id)
    if (!curItem) continue
    // pass 전환 우선 분류
    if (prevItem.pass && !curItem.pass) {
      regressions.push({
        type: 'item_fail',
        detail: `${id}: pass → fail (Lc ${prevItem.lc} → ${curItem.lc})`,
      })
      continue
    }
    if (!prevItem.pass && curItem.pass) {
      improvements.push({
        type: 'item_pass',
        detail: `${id}: fail → pass (Lc ${prevItem.lc} → ${curItem.lc})`,
      })
      continue
    }
    // 상태 불변이면 Lc delta 추적
    const delta = (curItem.lc ?? 0) - (prevItem.lc ?? 0)
    if (delta > LC_EPS) risen.push({ id, prevLc: prevItem.lc, curLc: curItem.lc, delta })
    else if (delta < -LC_EPS) dropped.push({ id, prevLc: prevItem.lc, curLc: curItem.lc, delta })
  }

  // 집계 요약으로 append — 모든 item을 나열하면 노이즈
  if (risen.length > 0) {
    const avgDelta = risen.reduce((a, r) => a + r.delta, 0) / risen.length
    improvements.push({
      type: 'lc_rise',
      detail: `Lc 상승 ${risen.length}건 (평균 +${avgDelta.toFixed(2)}, 최대 +${Math.max(...risen.map((r) => r.delta)).toFixed(2)})`,
    })
  }
  if (dropped.length > 0) {
    const avgDelta = dropped.reduce((a, r) => a + r.delta, 0) / dropped.length
    // pass 유지하는데 하락하면 경계 근접 — 회귀로 분류 (개선이 아님)
    regressions.push({
      type: 'lc_drop',
      detail: `Lc 하락 ${dropped.length}건 (평균 ${avgDelta.toFixed(2)}, 최소 ${Math.min(...dropped.map((r) => r.delta)).toFixed(2)})`,
    })
  }

  // 새로 추가된 조합 (baseline에 없음) — 정보만
  for (const [id, curItem] of curMap) {
    if (!prevMap.has(id)) {
      improvements.push({
        type: 'new_item',
        detail: `${id}: 신규 조합 (${curItem.pass ? 'pass' : 'fail'}, Lc ${curItem.lc})`,
      })
    }
  }

  return { regressions, improvements }
}

/**
 * modular-scale 회귀 검사.
 *   - total warnings 증가 → 회귀
 *   - 개별 step status 악화 (ok/ideal → too_*, boundary_*) → 회귀
 */
function diffModularScale(prev, cur) {
  /** @type {{type: string, detail: string}[]} */
  const regressions = []
  /** @type {{type: string, detail: string}[]} */
  const improvements = []

  if (cur.warnings > prev.warnings) {
    regressions.push({
      type: 'total_warnings',
      detail: `warnings ${prev.warnings} → ${cur.warnings}`,
    })
  } else if (cur.warnings < prev.warnings) {
    improvements.push({
      type: 'total_warnings',
      detail: `warnings ${prev.warnings} → ${cur.warnings} (-${prev.warnings - cur.warnings})`,
    })
  }

  // scale별 step 비교
  const statusRank = {
    ok: 0,
    ideal: 0,
    first: 0,
    boundary_high: 1,
    boundary_low: 1,
    too_small: 2,
    too_large: 2,
  }

  const prevScales = new Map(prev.scales.map((s) => [s.name, s]))
  for (const curScale of cur.scales) {
    const prevScale = prevScales.get(curScale.name)
    if (!prevScale) continue
    const prevSteps = new Map(prevScale.steps.map((s) => [s.step, s]))
    for (const curStep of curScale.steps) {
      const prevStep = prevSteps.get(curStep.step)
      if (!prevStep) continue
      const prevRank = statusRank[prevStep.status] ?? 0
      const curRank = statusRank[curStep.status] ?? 0
      if (curRank > prevRank) {
        regressions.push({
          type: 'step_status',
          detail: `${curScale.name}/${curStep.step}: ${prevStep.status} → ${curStep.status}`,
        })
      } else if (curRank < prevRank) {
        improvements.push({
          type: 'step_status',
          detail: `${curScale.name}/${curStep.step}: ${prevStep.status} → ${curStep.status}`,
        })
      }
    }
  }

  return { regressions, improvements }
}

function main() {
  const jsonMode = process.argv.includes('--json')

  if (!existsSync(BASELINE_PATH)) {
    console.error(`[compare] baseline 없음: ${BASELINE_PATH}`)
    console.error(`  → pnpm baseline:save로 초기 baseline 생성 필요`)
    process.exit(2)
  }

  const prev = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'))
  const curMetrics = {}
  for (const m of METRICS) {
    curMetrics[m.name] = runMetric(m.script)
  }

  const diffs = {
    'focus-apca': diffFocusApca(prev.metrics['focus-apca'], curMetrics['focus-apca']),
    'modular-scale': diffModularScale(prev.metrics['modular-scale'], curMetrics['modular-scale']),
  }

  const totalRegressions = Object.values(diffs).reduce((acc, d) => acc + d.regressions.length, 0)
  const totalImprovements = Object.values(diffs).reduce((acc, d) => acc + d.improvements.length, 0)

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify(
        {
          baseline: { date: prev.date, generatedAt: prev.generatedAt },
          regressions: totalRegressions,
          improvements: totalImprovements,
          diffs,
        },
        null,
        2,
      ) + '\n',
    )
    process.exit(totalRegressions > 0 ? 1 : 0)
  }

  console.log(`[compare] baseline: ${prev.date ?? prev.generatedAt}`)
  console.log(`[compare] 회귀: ${totalRegressions}건, 개선: ${totalImprovements}건`)
  console.log('')

  for (const [name, d] of Object.entries(diffs)) {
    if (d.regressions.length === 0 && d.improvements.length === 0) {
      console.log(`  [${name}] 변화 없음`)
      continue
    }
    console.log(`  [${name}]`)
    for (const r of d.regressions) console.log(`    ❌ ${r.detail}`)
    for (const i of d.improvements) console.log(`    ✅ ${i.detail}`)
  }
  console.log('')

  if (totalRegressions > 0) {
    console.log('[compare] 회귀 감지 — 변경 되돌리거나 원인 수정 필요')
    console.log('  (개선만 원한다면: 수정 후 `pnpm baseline:save`로 baseline 갱신)')
    process.exit(1)
  }
  if (totalImprovements > 0) {
    console.log('[compare] 개선 확인됨 — `pnpm baseline:save`로 baseline 갱신 권장')
  }
  process.exit(0)
}

try {
  main()
} catch (err) {
  console.error('[compare] 실패:', err instanceof Error ? err.message : err)
  process.exit(2)
}
