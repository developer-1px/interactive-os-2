#!/usr/bin/env node
/**
 * Pipeline Snapshot — 단계별 관측 아티팩트 생성
 *
 * Usage:
 *   node scripts/pipelineSnapshot.mjs todo 4      # todo/stage-4: 스샷 + DOM dump
 *   node scripts/pipelineSnapshot.mjs todo 5
 *
 * 입력:
 *   - <sample> 이름 (예: todo) → 라우트 /<sample>
 *   - <stage> 번호 (4~5만 렌더 단계, 스샷/DOM 생성)
 *
 * 출력:
 *   docs/research/pipeline/<sample>/<stage>-layout.png   (viewport 375×812)
 *   docs/research/pipeline/<sample>/<stage>-layout.dom.html
 *
 * 요구:
 *   - dev server @ localhost:5173
 *   - Chrome 설치
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const VIEWPORT = { width: 375, height: 812, deviceScaleFactor: 2 }

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const STAGE_NAMES = {
  4: 'layout',
  5: 'assembly',
}

const findChrome = () => CHROME_PATHS.find((p) => existsSync(p))

const ensureDir = (filePath) => {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const main = async () => {
  const [sample, stageArg] = process.argv.slice(2)
  if (!sample || !stageArg) {
    console.error('Usage: node scripts/pipelineSnapshot.mjs <sample> <stage>')
    process.exit(1)
  }

  const stage = Number(stageArg)
  const stageName = STAGE_NAMES[stage]
  if (!stageName) {
    console.error(`✗ Stage ${stage} not a render stage (supported: 4, 5)`)
    process.exit(1)
  }

  const chromePath = findChrome()
  if (!chromePath) {
    console.error('✗ Chrome not found')
    process.exit(1)
  }

  const outDir = resolve(process.cwd(), 'docs/research/pipeline', sample)
  const imgPath = `${outDir}/${stage}-${stageName}.png`
  const domPath = `${outDir}/${stage}-${stageName}.dom.html`

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    defaultViewport: VIEWPORT,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport(VIEWPORT)
    const url = `${BASE_URL}/${sample}`
    console.log(`  ${url} @ ${VIEWPORT.width}×${VIEWPORT.height}`)

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await page.waitForFunction(
      () => document.querySelector('#root')?.children.length > 0,
      { timeout: 10000 },
    ).catch(() => {
      console.warn('  ⚠ #root 미mount, 그대로 진행')
    })
    await new Promise((r) => setTimeout(r, 1500))

    ensureDir(imgPath)
    await page.screenshot({ path: imgPath, fullPage: false })
    console.log(`  ✓ ${imgPath}`)

    const html = await page.content()
    writeFileSync(domPath, html)
    console.log(`  ✓ ${domPath}`)

    await page.close()
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('✗', err.message)
  process.exit(1)
})
