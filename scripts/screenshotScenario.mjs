#!/usr/bin/env node
/**
 * Screenshot Scenario — 시나리오별 인터랙션 후 스크린샷 캡처
 *
 * Usage:
 *   node scripts/screenshotScenario.mjs <scenario-dir>
 *   node scripts/screenshotScenario.mjs docs/1-projects/viewer/stories/doc-browsing/features/miller-columns/4-build
 *
 * manifest.yaml의 시나리오를 읽고, 각 시나리오에 맞는 인터랙션을 수행한 뒤 스크린샷 촬영.
 * Requires: dev server running at localhost:5173
 */
import puppeteer from 'puppeteer-core'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const baseUrl = process.env.BASE_URL || 'http://localhost:5173'

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const scenarioDir = process.argv[2]
if (!scenarioDir) {
  console.error('Usage: node scripts/screenshotScenario.mjs <scenario-dir>')
  process.exit(1)
}

const absDir = resolve(process.cwd(), scenarioDir)
const manifestPath = resolve(absDir, 'manifest.yaml')

if (!existsSync(manifestPath)) {
  console.error(`manifest.yaml not found at ${manifestPath}`)
  process.exit(1)
}

const manifest = parse(readFileSync(manifestPath, 'utf-8'))
const route = manifest.route || '/docs'

/**
 * 시나리오별 인터랙션 정의
 * 각 함수는 page를 받아서 인터랙션 수행
 */
const interactions = {
  'default': async () => {
    // 아무 인터랙션 없음 — 기본 상태
  },

  'folder-selected': async (page) => {
    // 첫 번째 폴더 아이템 클릭
    const item = await page.$('.miller-item[data-has-children]')
    if (item) await item.click()
    await sleep(500)
  },

  'deep-drill': async (page) => {
    // 폴더를 3번 연속 drill-in
    for (let i = 0; i < 3; i++) {
      const items = await page.$$('.miller-column:last-of-type .miller-item[data-has-children]')
      if (items.length > 0) {
        await items[0].click()
        await sleep(400)
      }
    }
  },

  'file-preview': async (page) => {
    // 폴더 drill-in 후 파일 아이템 클릭
    const folder = await page.$('.miller-item[data-has-children]')
    if (folder) {
      await folder.click()
      await sleep(400)
    }
    // 파일 아이템(자식 없는) 클릭
    const files = await page.$$('.miller-item:not([data-has-children])')
    if (files.length > 0) {
      await files[0].click()
      await sleep(500)
    }
  },

  'many-items': async (page) => {
    // 아이템이 가장 많은 폴더를 찾아 클릭
    const folders = await page.$$('.miller-item[data-has-children]')
    // 일단 가장 큰 폴더를 클릭 (1-projects가 보통 가장 큼)
    for (const f of folders) {
      const text = await f.evaluate(el => el.textContent)
      if (text?.includes('1-projects') || text?.includes('projects')) {
        await f.click()
        await sleep(500)
        break
      }
    }
  },

  'empty-folder': async (page) => {
    // 빈 폴더 찾기 — 자식 있는 항목 중 실제 빈 폴더
    // 0-inbox가 보통 비어있음
    const items = await page.$$('.miller-item')
    for (const item of items) {
      const text = await item.evaluate(el => el.textContent)
      if (text?.includes('inbox') || text?.includes('0-inbox')) {
        await item.click()
        await sleep(500)
        break
      }
    }
  },
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const execPath = process.env.CHROME_PATH || chromePaths.find(p => existsSync(p))
  if (!execPath) {
    console.error('Chrome not found. Set CHROME_PATH env var.')
    process.exit(1)
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath,
    args: ['--no-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  let captured = 0

  for (const scenario of manifest.scenarios) {
    // 매 시나리오마다 페이지 새로 로드 (클린 상태)
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 10000 })
      await sleep(500)
    } catch {
      console.error(`  ✗ ${scenario.id} — failed to load ${route}`)
      continue
    }

    // 인터랙션 수행
    const interact = interactions[scenario.id]
    if (interact) {
      try {
        await interact(page)
      } catch (e) {
        console.error(`  ✗ ${scenario.id} — interaction failed: ${e.message}`)
      }
    }

    // 스크린샷 촬영
    const filePath = resolve(absDir, scenario.file)
    await page.screenshot({ path: filePath, fullPage: false })
    console.log(`  ✓ ${scenario.id} → ${scenario.file}`)
    captured++
  }

  await browser.close()
  console.log(`\n${captured}/${manifest.scenarios.length} screenshots saved to ${absDir}/`)
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})
