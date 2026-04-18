#!/usr/bin/env node
// @ts-check
/**
 * verifyScrollability — Public 라우트 세로 스크롤 가능성 런타임 검증
 *
 * 목적: 배포 대상 public 라우트에서 콘텐츠가 뷰포트를 초과할 때 실제 스크롤이 작동하는지
 *   Puppeteer로 측정. 평가 에이전트가 반복 지적한 "세로 스크롤 불능" 이슈의 자동 재현 방지.
 *
 * 판정:
 *   - content ≤ viewport: pass (스크롤 불필요)
 *   - content > viewport && scrollTo 후 scrollY > 0: pass
 *   - content > viewport && scrollTo 후 scrollY === 0: fail (스크롤 차단)
 *
 * 전제: dev server (또는 preview) localhost:5173 가동 중.
 *
 * 실행:
 *   node scripts/verifyScrollability.mjs
 *   node scripts/verifyScrollability.mjs --json
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync, existsSync, accessSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const REPORT_DIR = resolve(ROOT, 'docs/research/ax/reports')

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const VIEWPORT = { width: 1280, height: 800 }

/** Public router의 라우트들 (routerPublic.tsx와 동기) */
const ROUTES = [
  { path: '/', label: 'landing' },
  { path: '/ax-principles', label: 'ax-principles' },
  { path: '/ui', label: 'ui' },
  { path: '/catalog', label: 'catalog' },
  { path: '/showcase/gmail', label: 'gmail' },
]

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

function findChrome() {
  for (const p of CHROME_PATHS) {
    try { accessSync(p); return p } catch {}
  }
  return null
}

async function measureRoute(browser, url) {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 })
    // 폰트/이미지 + React lazy import 로드 대기
    await new Promise((r) => setTimeout(r, 2000))

    const before = await page.evaluate(() => {
      // 실제 콘텐츠 높이 — body overflow hidden이어도 root는 자체 scrollHeight 보존.
      const root = document.getElementById('root')
      const realContentHeight = root ? root.scrollHeight : 0
      return {
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        realContentHeight,
        bodyOverflow: getComputedStyle(document.body).overflow,
        htmlOverflow: getComputedStyle(document.documentElement).overflow,
      }
    })

    // 실 content가 viewport 넘는지 (body overflow hidden 무관)
    const overflowsVertically = before.realContentHeight > before.clientHeight + 1

    let afterScrollY = 0
    if (overflowsVertically) {
      await page.evaluate(() => window.scrollTo(0, 500))
      await new Promise((r) => setTimeout(r, 200))
      afterScrollY = await page.evaluate(() => window.scrollY)
    }

    // Pass 조건: content가 viewport 이하 OR scroll 실제 작동
    const pass = !overflowsVertically || afterScrollY > 0
    return {
      overflows: overflowsVertically,
      scrollHeight: before.scrollHeight,
      clientHeight: before.clientHeight,
      bodyOverflow: before.bodyOverflow,
      htmlOverflow: before.htmlOverflow,
      scrollYAfter: afterScrollY,
      pass,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), pass: false }
  } finally {
    await page.close()
  }
}

async function main() {
  const jsonMode = process.argv.includes('--json')
  const chromePath = findChrome()
  if (!chromePath) {
    console.error('[scrollability] Chrome 경로 찾을 수 없음')
    process.exit(2)
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox'],
  })

  const results = []
  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`
    const m = await measureRoute(browser, url)
    results.push({ ...route, url, ...m })
    if (!jsonMode) {
      const mark = m.pass ? '✅' : '❌'
      const detail = m.error
        ? `ERROR ${m.error}`
        : `content/view=${m.realContentHeight ?? 0}/${m.clientHeight} overflows=${m.overflows} scrollYAfter=${m.scrollYAfter} body.overflow=${m.bodyOverflow}`
      console.log(`  ${mark} ${route.path.padEnd(20)} ${detail}`)
    }
  }

  await browser.close()

  const passCount = results.filter((r) => r.pass).length
  const failCount = results.length - passCount

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify({
        metric: 'scrollability',
        base_url: BASE_URL,
        viewport: VIEWPORT,
        total: results.length,
        pass: passCount,
        fail: failCount,
        items: results.map((r) => ({
          path: r.path,
          label: r.label,
          overflows: r.overflows ?? null,
          real_content_height: r.realContentHeight ?? null,
          client_height: r.clientHeight ?? null,
          body_overflow: r.bodyOverflow ?? null,
          scroll_y_after: r.scrollYAfter ?? 0,
          pass: r.pass,
          error: r.error ?? null,
        })),
      }),
    )
    process.exit(failCount > 0 ? 1 : 0)
  }

  const date = new Date().toISOString().slice(0, 10)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })
  const reportPath = resolve(REPORT_DIR, `scrollability-${date}.md`)
  const lines = []
  lines.push(`# Scrollability — ${date}`)
  lines.push('')
  lines.push(`**기준:** content가 viewport보다 크면 window.scrollTo(0,500) 후 scrollY > 0`)
  lines.push(`**Base URL:** ${BASE_URL}   **Viewport:** ${VIEWPORT.width}×${VIEWPORT.height}`)
  lines.push('')
  lines.push(`**결과:** ${passCount}/${results.length} pass`)
  lines.push('')
  lines.push('| route | overflows | scroll after | body.overflow | pass? |')
  lines.push('|-------|:---------:|-------------:|---------------|:-----:|')
  for (const r of results) {
    const e = r.error ? `ERROR` : ''
    lines.push(`| \`${r.path}\` | ${r.overflows ?? '—'} | ${r.scrollYAfter ?? '—'} | ${r.bodyOverflow ?? '—'} ${e} | ${r.pass ? '✅' : '❌'} |`)
  }
  writeFileSync(reportPath, lines.join('\n') + '\n')
  console.log(`\n[scrollability] ${passCount}/${results.length} pass`)
  console.log(`[scrollability] report: ${reportPath}`)
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('[scrollability] 실패:', err)
  process.exit(2)
})
