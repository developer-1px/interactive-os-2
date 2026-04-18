#!/usr/bin/env node
// @ts-check
/**
 * saveBaseline — Ratcheting Convergence Loop의 "측정 고정" 단계
 *
 * 목적: 현재 측정 지표를 baseline JSON으로 고정.
 *   이후 모든 변경은 이 baseline 대비 **개선**이어야 통과 (회귀 금지).
 *
 * 동작:
 *   1) measureFocusContrast.mjs --json → focus-apca 결과 수집
 *   2) verifyModularScale.mjs --json → modular-scale 결과 수집
 *   3) `ax-baseline.json`에 merge하여 저장
 *
 * 회귀 기준 (compareToBaseline.mjs에서 적용):
 *   - focus-apca: pass 수가 줄어들면 회귀
 *   - modular-scale: warnings가 늘어나면 회귀
 *
 * 실행:
 *   node scripts/saveBaseline.mjs           # 전체 metric 저장
 *   node scripts/saveBaseline.mjs --dry-run # 저장 없이 stdout 출력만
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const BASELINE_PATH = resolve(ROOT, 'ax-baseline.json')

const METRICS = [
  { name: 'focus-apca', script: 'scripts/measureFocusContrast.mjs' },
  { name: 'text-apca', script: 'scripts/measureTextContrast.mjs' },
  { name: 'modular-scale', script: 'scripts/verifyModularScale.mjs' },
  { name: 'spatial-grid', script: 'scripts/verifySpatialGrid.mjs' },
]

/**
 * 측정 스크립트를 --json으로 실행하여 payload 수집.
 * exit code는 무시 (focus-apca는 fail 시 exit 1이지만 baseline은 현재 상태를 저장하는 것이 목적).
 */
function runMetric(scriptPath) {
  const absPath = resolve(ROOT, scriptPath)
  const result = spawnSync('node', [absPath, '--json'], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  })
  if (result.error) {
    throw new Error(`${scriptPath} 실행 실패: ${result.error.message}`)
  }
  if (!result.stdout || result.stdout.length === 0) {
    throw new Error(`${scriptPath}에서 JSON 출력 없음. stderr: ${result.stderr}`)
  }
  try {
    return JSON.parse(result.stdout)
  } catch (e) {
    throw new Error(`${scriptPath} JSON 파싱 실패: ${e instanceof Error ? e.message : e}`)
  }
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const date = new Date().toISOString().slice(0, 10)

  const metrics = {}
  for (const m of METRICS) {
    console.log(`[baseline] 측정: ${m.name}`)
    metrics[m.name] = runMetric(m.script)
  }

  const baseline = {
    generatedAt: new Date().toISOString(),
    date,
    metrics,
  }

  const json = JSON.stringify(baseline, null, 2) + '\n'

  if (dryRun) {
    process.stdout.write(json)
    console.error(`[baseline] --dry-run: 저장 스킵`)
    return
  }

  // 기존 baseline이 있으면 비교 요약 출력
  if (existsSync(BASELINE_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'))
      console.log(`[baseline] 이전 baseline: ${prev.date ?? prev.generatedAt}`)
      for (const key of ['focus-apca', 'text-apca']) {
        const p = prev.metrics?.[key]
        const c = metrics[key]
        if (p && c) console.log(`  ${key}: pass ${p.pass}/${p.total} → ${c.pass}/${c.total}`)
      }
      const msPrev = prev.metrics?.['modular-scale']
      const msCur = metrics['modular-scale']
      if (msPrev && msCur) {
        console.log(`  modular-scale: warnings ${msPrev.warnings} → ${msCur.warnings}`)
      }
      const sgPrev = prev.metrics?.['spatial-grid']
      const sgCur = metrics['spatial-grid']
      if (sgPrev && sgCur) {
        console.log(`  spatial-grid: violations ${sgPrev.total_violations} → ${sgCur.total_violations}`)
      }
    } catch (e) {
      console.warn(`[baseline] 이전 baseline 파싱 실패 (덮어쓰기 진행): ${e instanceof Error ? e.message : e}`)
    }
  }

  writeFileSync(BASELINE_PATH, json)
  console.log(`[baseline] 저장: ${BASELINE_PATH}`)
  for (const key of ['focus-apca', 'text-apca']) {
    const m = metrics[key]
    if (m) console.log(`  ${key}: pass=${m.pass}/${m.total}`)
  }
  console.log(`  modular-scale: warnings=${metrics['modular-scale'].warnings}`)
  console.log(`  spatial-grid: violations=${metrics['spatial-grid'].total_violations}`)
}

try {
  main()
} catch (err) {
  console.error('[baseline] 실패:', err instanceof Error ? err.message : err)
  process.exit(2)
}
