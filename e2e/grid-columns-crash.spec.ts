/**
 * Reproduction test: Grid.tsx columns.map is not a function
 *
 * Root cause: PageCell.tsx passes columns={3} (number) to Grid,
 * but Grid expects columns: ColumnDef[] (array).
 */
import { test, expect } from '@playwright/test'

test('no Grid columns.map crash on /components/cell', async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  // Inject window.onerror to catch errors before React
  await page.addInitScript(() => {
    const captured: string[] = []
    ;(window as any).__capturedErrors = captured
    window.addEventListener('error', (e) => {
      captured.push(e.message)
    }, true)
  })

  await page.goto('/components/cell')
  await page.waitForTimeout(2000)

  const windowErrors: string[] = await page.evaluate(
    () => (window as any).__capturedErrors,
  )

  const allErrors = [...errors, ...windowErrors]

  console.log('\n=== /components/cell errors ===')
  for (const e of allErrors) console.log(`  ${e}`)

  const columnsError = allErrors.find((e) => e.includes('columns.map'))
  expect(columnsError).toBeUndefined()
})
