import puppeteer from 'puppeteer-core'
const url = process.argv[2]
const out = process.argv[3]
const viewport = process.argv[4]?.split('x').map(Number) ?? [1440, 900]
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: viewport[0], height: viewport[1] },
})
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: out, fullPage: false })
await browser.close()
console.log('saved', out)
