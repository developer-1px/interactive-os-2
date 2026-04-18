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

// Prompt v5 (2026-04-18) — 기준 모호 재강화. Overall 판정이 프롬프트 어감에 뒤집히는 문제
// (vP-4에서 같은 / 스샷이 ok→needs improvement로 전환됨) 해소. 서술형 기준을 제거하고
// 명시적 3-gate 체크리스트로 전환. Gate 통과 개수가 등급을 결정.
// 변경 기록: docs/research/ax/gemmaCritique/summary.md "프롬프트 버전" 섹션.
const PROMPT = `너는 일반 웹사이트 시각 디자인 비평가다. 프로젝트 맥락 없이 순수 시각 평가만.

첨부된 스크린샷 1장을 평가. **실제로 보이는 것만** 보고. 일반 디자인 상식 나열 금지.

리포트 형식 (Markdown 600자 이내):

## 주요 이슈
(실제로 관찰된 것만 번호로. 없으면 "none" 1줄로 끝. 억지로 채우지 말 것.)
1. **[제목]** — 스크린샷에 실제 보이는 **텍스트/요소명을 인용**하여 위치 지시. 무엇이 보이는지. **정량 단서 필수** (대략 픽셀 / 요소 개수 / 화면 비율 / 인접 요소 대비 배수 — 추정이라도 "대략 ~" 접두사로 허용).

## 좋은 점
(실제로 관찰된 것만. 없으면 "none" 1줄.)

## Gate 체크
각 게이트에 pass / fail 로만 답하고 1문장 근거.
- **G1 가독성**: 본문 텍스트가 대비·크기로 무리 없이 읽히는가?
- **G2 구분**: 클릭/선택 가능 요소가 주변과 시각적으로 구분되는가?
- **G3 위계**: 화면에서 무엇이 우선 읽혀야 하는지 한눈에 알 수 있는가?

## Overall: good | ok | needs improvement

판정 규칙 (서술 판단 금지, 게이트 개수로만 결정):
- 3/3 pass = **good**
- 2/3 pass = **ok**
- 0~1/3 pass = **needs improvement**

엄수:
- 수정 제안 금지 — 관찰만
- 이슈 수 맞추려 억지로 채우지 말 것. 안 보이면 "none"이 정답
- 일반 디자인 상식 나열 금지 — 이 화면에서 실제 보이는 것만
- **위치 지시 필수: 스크린샷에 실제 보이는 텍스트/요소명을 그대로 인용**
  (예: "'Get Started' 버튼 주변", "'Props' 테이블의 'type' 열")
  추상 영역명("좌측 nav", "중앙 콘텐츠")만으로는 불충분 — 구체 인용 필수
- **정량 단서 필수**: "큰 여백"/"높은 밀도" 같은 정성 표현 단독 금지.
  픽셀/요소 개수/화면 비율/인접 요소 대비 배수 중 하나 이상 병기. 확실치 않으면 "대략 ~" 허용.
- **Overall은 게이트 개수로만 결정** — 주요 이슈의 심각도나 수로 등급 조정 금지`

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
  // React mount 대기 — Vite+React는 networkidle 이후 mount가 지연될 수 있다.
  // #root에 children이 생길 때까지 최대 10초 대기 (검은 화면 방지).
  await page.waitForFunction(
    () => document.querySelector('#root')?.children.length > 0,
    { timeout: 10000 },
  ).catch(() => {
    console.warn(`  ⚠ ${route} — #root 미mount, 그대로 진행`)
  })
  // 레이아웃/폰트/이미지 안정화 추가 대기
  await new Promise((r) => setTimeout(r, 1500))
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
