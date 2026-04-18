#!/usr/bin/env node
/**
 * Smoke Test — Puppeteer에서 React 앱이 mount 안 되는 이유 진단
 *
 * 단계:
 *   T1. dev server HTML serve 확인 (curl 대체)
 *   T2. JS script 로드 추적
 *   T3. console 로그 + pageerror + requestfailed 수집
 *   T4. React mount 상태 (#root children, data-theme 등)
 *   T5. 실제 페이지 텍스트 샘플
 *
 * Usage:
 *   node scripts/smokeTestPuppeteer.mjs [url]
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const URL = process.argv[2] || 'http://localhost:5173/'
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]
const chrome = CHROME_PATHS.find(existsSync)
if (!chrome) { console.error('✗ Chrome not found'); process.exit(1) }

const log = (label, ...args) => console.log(`[${label.padEnd(10)}]`, ...args)

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()

// 모든 이벤트 수집
page.on('console', (msg) => log('console', msg.type(), msg.text().substring(0, 200)))
page.on('pageerror', (err) => log('pageerror', err.message.substring(0, 300)))
page.on('requestfailed', (req) => log('reqfail', req.url(), req.failure()?.errorText))
page.on('response', (res) => {
  if (res.status() >= 400) log('4xx/5xx', res.status(), res.url())
})

log('T1', 'navigate →', URL)
try {
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 })
  log('T1', 'load complete')
} catch (e) {
  log('T1', '✗ goto failed:', e.message)
}

log('T2', '3s 추가 대기 (React mount 기회)')
await new Promise((r) => setTimeout(r, 3000))

const state = await page.evaluate(() => ({
  title: document.title,
  rootExists: !!document.querySelector('#root'),
  rootChildrenCount: document.querySelector('#root')?.children.length ?? -1,
  rootInnerHTMLSample: document.querySelector('#root')?.innerHTML.substring(0, 500) ?? '',
  bodyText: document.body.innerText.substring(0, 300),
  bodyBg: getComputedStyle(document.body).backgroundColor,
  htmlTheme: document.documentElement.getAttribute('data-theme'),
  anyScriptError: window.__smokeError ?? 'none',
  scriptCount: document.querySelectorAll('script').length,
  moduleScriptCount: document.querySelectorAll('script[type="module"]').length,
}))

log('T4', 'state:', JSON.stringify(state, null, 2))

// 시간 더 주고 재측정
log('T5', '추가 5s 대기 후 재측정')
await new Promise((r) => setTimeout(r, 5000))
const state2 = await page.evaluate(() => ({
  rootChildrenCount: document.querySelector('#root')?.children.length ?? -1,
  bodyTextLen: document.body.innerText.length,
}))
log('T5', 'after 5s:', JSON.stringify(state2))

await browser.close()
