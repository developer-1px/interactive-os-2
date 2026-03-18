import { test, expect } from '@playwright/test'

test('Visual CMS: arrow keys navigate between sections', async ({ page }) => {
  await page.goto('/vision/visual-cms')
  await page.waitForSelector('[data-node-id="hero"]')
  await page.click('[data-node-id="hero"]')
  await page.waitForTimeout(100)

  // ArrowDown: hero → logos
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(100)
  const after1 = await page.evaluate(() => document.activeElement?.getAttribute('data-node-id'))
  console.log('After ArrowDown:', after1)
  expect(after1).toBe('logos')

  // ArrowDown: logos → features
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(100)
  const after2 = await page.evaluate(() => document.activeElement?.getAttribute('data-node-id'))
  console.log('After 2nd ArrowDown:', after2)
  expect(after2).toBe('features')

  // Enter: features → first child (feat-heading)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(100)
  const after3 = await page.evaluate(() => document.activeElement?.getAttribute('data-node-id'))
  console.log('After Enter:', after3)
  expect(after3).toBe('feat-heading')

  // Escape: back to features
  await page.keyboard.press('Escape')
  await page.waitForTimeout(100)
  const after4 = await page.evaluate(() => document.activeElement?.getAttribute('data-node-id'))
  console.log('After Escape:', after4)
  expect(after4).toBe('features')
})
