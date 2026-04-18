#!/usr/bin/env node
/**
 * Gemma 4 디자인 비평 루프 — 라우트별 스샷 → 평가 → MD 리포트
 *
 * Usage:
 *   node scripts/gemmaCritique.mjs                      # public 라우트 전체
 *   node scripts/gemmaCritique.mjs /catalog /ui         # 특정 라우트
 *
 * 흐름 (라우트마다 순차):
 *   1. puppeteer로 스샷 (screenshots/{label}.png)
 *   2. ollama gemma4:latest API 호출 (이미지 첨부)
 *   3. docs/research/ax/gemmaCritique/{label}.md 작성
 *   4. 다음 라우트
 *
 * Requires:
 *   - dev server @ localhost:5173
 *   - ollama daemon @ localhost:11434 + gemma4:latest pulled
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.GEMMA_MODEL || 'gemma4:latest'

const PUBLIC_ROUTES = ['/', '/ax-principles', '/ui', '/catalog', '/showcase/gmail']

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const VIEWPORT = { width: 1440, height: 900 }

const PROMPT = `너는 일반 웹사이트 시각 디자인 비평가다. 프로젝트 맥락 없이 순수 시각 평가만.

첨부된 스크린샷 1장을 평가.

리포트 형식 (Markdown 600자 이내):
## 주요 이슈 3-5개
1. **[제목]** — 정량 관찰(수치/비율). 깨진 원리.
## 좋은 점 1-2개
## Overall: good | ok | needs improvement
(이유 1문장)

엄수:
- 수정 제안 금지 — 관찰만
- 정량 속성 우선 (spacing, 대비, 정렬, 위계, 라인 길이, icon weight, radius 등)
- "good": 이슈 ≤2개 & critical 없음
- "ok": 이슈 3-4개, 구조적 문제 없음
- "needs improvement": 이슈 5+ or 구조적 결함`

const toLabel = (route) => {
  if (route === '/') return 'root'
  return route.replace(/^\//, '').replace(/\//g, '_')
}

const findChrome = () => CHROME_PATHS.find((p) => existsSync(p))

const ensureDir = (filePath) => {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const screenshot = async (browser, route, outPath) => {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  const url = `${BASE_URL}${route}`
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 800))
  ensureDir(outPath)
  await page.screenshot({ path: outPath, fullPage: false })
  await page.close()
}

const evaluate = async (imagePath) => {
  const image = readFileSync(imagePath).toString('base64')
  const t0 = Date.now()
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({
      model: MODEL,
      prompt: PROMPT,
      images: [image],
      stream: false,
    }),
  })
  if (!res.ok) throw new Error(`ollama ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return { response: json.response, ms: Date.now() - t0 }
}

const writeReport = (mdPath, { route, label, imagePath, response, ms }) => {
  const now = new Date().toISOString()
  const imgRel = resolve(imagePath).replace(resolve(process.cwd()) + '/', '../../../')
  const md = `# Gemma 4 Critique — ${route}

- **Route**: \`${route}\`
- **Label**: \`${label}\`
- **Timestamp**: ${now}
- **Model**: ${MODEL}
- **Latency**: ${(ms / 1000).toFixed(1)}s
- **Screenshot**: [${label}.png](${imgRel})

---

${response.trim()}
`
  ensureDir(mdPath)
  writeFileSync(mdPath, md)
}

const main = async () => {
  const args = process.argv.slice(2)
  const routes = args.length > 0 ? args : PUBLIC_ROUTES

  const chromePath = findChrome()
  if (!chromePath) {
    console.error('✗ Chrome not found')
    process.exit(1)
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: VIEWPORT,
  })

  const shotsDir = resolve(process.cwd(), 'screenshots')
  const reportsDir = resolve(process.cwd(), 'docs/research/ax/gemmaCritique')

  console.log(`◆ Gemma 4 critique loop — ${routes.length} route(s)\n`)

  try {
    for (const route of routes) {
      const label = toLabel(route)
      const imgPath = `${shotsDir}/${label}.png`
      const mdPath = `${reportsDir}/${label}.md`

      process.stdout.write(`  ${route} — shot`)
      const ts = Date.now()
      await screenshot(browser, route, imgPath)
      process.stdout.write(` (${((Date.now() - ts) / 1000).toFixed(1)}s) → eval`)

      const { response, ms } = await evaluate(imgPath)
      process.stdout.write(` (${(ms / 1000).toFixed(1)}s) → md\n`)

      writeReport(mdPath, { route, label, imagePath: imgPath, response, ms })
      console.log(`    ✓ ${mdPath.replace(resolve(process.cwd()) + '/', '')}`)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n◆ Done — ${routes.length} report(s) in docs/research/ax/gemmaCritique/`)
}

main().catch((err) => {
  console.error('✗', err.message)
  process.exit(1)
})
