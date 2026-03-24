#!/usr/bin/env node
/**
 * Demo page → V8 coverage PoC
 * Usage: node scripts/demoCoverage.mjs [page-path] [source-filter]
 * Example: node scripts/demoCoverage.mjs /internals/axis/navigate navigate.ts
 */
import puppeteer from 'puppeteer-core'

const pagePath = process.argv[2] || '/internals/axis/navigate'
const sourceFilter = process.argv[3] || 'navigate.ts'
const baseUrl = process.env.BASE_URL || 'http://localhost:5173'

import { existsSync } from 'node:fs'

// macOS Chrome paths
const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

async function main() {
  const execPath = process.env.CHROME_PATH || chromePaths.find(p => existsSync(p))
  if (!execPath) throw new Error('Chrome not found. Set CHROME_PATH env var.')

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath,
    args: ['--no-sandbox'],
  })

  const page = await browser.newPage()

  // Start V8 JS coverage (per-block granularity)
  await page.coverage.startJSCoverage({ includeRawScriptCoverage: true })

  // Navigate to demo page
  await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('[role="listbox"], [role="grid"]', { timeout: 5000 })

  // --- Interact with the demo ---

  // 1. List mode: vertical navigation
  const listbox = await page.$('[role="listbox"]')
  if (listbox) {
    await listbox.click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('Home')
    await page.keyboard.press('End')
  }

  // 2. Switch orientation to horizontal
  const orientSelect = await page.$('select')
  if (orientSelect) {
    await orientSelect.select('horizontal')
    const target = await page.$('[role="listbox"]')
    if (target) {
      await target.click()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('Home')
      await page.keyboard.press('End')
    }
  }

  // 3. Switch to 'both'
  if (orientSelect) {
    await orientSelect.select('both')
    const target = await page.$('[role="listbox"]')
    if (target) {
      await target.click()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowLeft')
    }
  }

  // 4. Toggle wrap
  const wrapCheckbox = await page.$('input[type="checkbox"]')
  if (wrapCheckbox) {
    await wrapCheckbox.click()
    const target = await page.$('[role="listbox"]')
    if (target) {
      await target.click()
      await page.keyboard.press('ArrowDown')
    }
  }

  // 5. Switch to grid mode
  const modeSelects = await page.$$('select')
  const modeSelect = modeSelects[0]
  if (modeSelect) {
    await modeSelect.select('grid')
    await page.waitForSelector('[role="grid"]', { timeout: 3000 })
    const grid = await page.$('[role="grid"]')
    if (grid) {
      await grid.click()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('Home')
      await page.keyboard.press('End')
      await page.keyboard.down('Meta')
      await page.keyboard.press('Home')
      await page.keyboard.up('Meta')
      await page.keyboard.down('Meta')
      await page.keyboard.press('End')
      await page.keyboard.up('Meta')
    }
  }

  // --- Collect coverage ---
  const coverage = await page.coverage.stopJSCoverage()

  // Filter to target source file
  const matched = coverage.filter(e => e.url.includes(sourceFilter))

  if (matched.length === 0) {
    console.log(`\n⚠ No coverage entries matching "${sourceFilter}"`)
    console.log(`\nAll loaded scripts (${coverage.length}):`)
    coverage
      .filter(e => e.url.includes('/src/'))
      .slice(0, 20)
      .forEach(e => console.log(`  ${e.url.replace(baseUrl, '')}`))
    await browser.close()
    process.exit(1)
  }

  console.log(`\n📊 Demo Coverage: ${pagePath} → ${sourceFilter}\n`)

  for (const entry of matched) {
    const source = entry.text
    const totalBytes = source.length

    // Calculate covered bytes from ranges
    let coveredBytes = 0
    for (const range of entry.ranges) {
      coveredBytes += range.end - range.start
    }

    const pct = ((coveredBytes / totalBytes) * 100).toFixed(1)
    const shortUrl = entry.url.replace(baseUrl, '')

    console.log(`${shortUrl}`)
    console.log(`  ${pct}% covered (${coveredBytes}/${totalBytes} bytes)\n`)

    // Show uncovered regions as line numbers
    const lines = source.split('\n')
    const coveredSet = new Set()
    for (const range of entry.ranges) {
      // Map byte offsets to line numbers
      let offset = 0
      for (let i = 0; i < lines.length; i++) {
        const lineEnd = offset + lines[i].length + 1 // +1 for \n
        if (range.start < lineEnd && range.end > offset) {
          coveredSet.add(i + 1)
        }
        offset = lineEnd
      }
    }

    const uncoveredLines = []
    for (let i = 1; i <= lines.length; i++) {
      if (!coveredSet.has(i) && lines[i - 1].trim().length > 0) {
        uncoveredLines.push(i)
      }
    }

    if (uncoveredLines.length > 0) {
      // Group consecutive lines into ranges
      const ranges = []
      let start = uncoveredLines[0]
      let end = start
      for (let i = 1; i < uncoveredLines.length; i++) {
        if (uncoveredLines[i] === end + 1) {
          end = uncoveredLines[i]
        } else {
          ranges.push(start === end ? `${start}` : `${start}-${end}`)
          start = uncoveredLines[i]
          end = start
        }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`)

      console.log(`  ❌ Uncovered lines: ${ranges.join(', ')}`)

      // Show uncovered code snippets
      console.log(`\n  Uncovered code:`)
      for (const lineNum of uncoveredLines) {
        const line = lines[lineNum - 1]
        console.log(`    ${lineNum}: ${line}`)
      }
    } else {
      console.log(`  ✅ All lines covered!`)
    }
  }

  await browser.close()
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})
