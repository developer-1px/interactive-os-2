import { test, expect } from '@playwright/test'

test.describe('viewer: Quick Open (Cmd+P)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/viewer')
    await page.waitForSelector('[data-node-id]', { timeout: 5000 })
  })

  test('Cmd+P opens Quick Open dialog', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const dialog = page.locator('[role="dialog"][aria-label="Quick Open"]')
    await expect(dialog).toBeVisible()
    const input = dialog.locator('input[role="combobox"]')
    await expect(input).toBeFocused()
  })

  test('Escape closes Quick Open', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const dialog = page.locator('[role="dialog"][aria-label="Quick Open"]')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('typing filters results with fuzzy search', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const input = page.locator('input[role="combobox"]')
    await input.fill('package')
    await page.waitForTimeout(100)

    const options = page.locator('[role="option"]')
    const count = await options.count()
    expect(count).toBeGreaterThan(0)

    // At least one result should contain "package" in its text
    const firstText = await options.first().textContent()
    expect(firstText?.toLowerCase()).toContain('package')
  })

  test('ArrowDown/ArrowUp navigates results', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const input = page.locator('input[role="combobox"]')

    // Wait for results to appear
    await page.waitForSelector('[role="option"]', { timeout: 3000 })

    // First option should be focused initially
    const firstOption = page.locator('[role="option"]').first()
    await expect(firstOption).toHaveAttribute('aria-selected', 'true')

    // ArrowDown moves to second
    await input.press('ArrowDown')
    const secondOption = page.locator('[role="option"]').nth(1)
    await expect(secondOption).toHaveAttribute('aria-selected', 'true')
    await expect(firstOption).toHaveAttribute('aria-selected', 'false')

    // ArrowUp moves back to first
    await input.press('ArrowUp')
    await expect(firstOption).toHaveAttribute('aria-selected', 'true')
  })

  test('Enter selects file and closes dialog', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const input = page.locator('input[role="combobox"]')
    await input.fill('tsconfig')
    await page.waitForTimeout(100)

    // Press Enter to select
    await input.press('Enter')

    // Dialog should close
    const dialog = page.locator('[role="dialog"][aria-label="Quick Open"]')
    await expect(dialog).not.toBeVisible()

    // Content panel should show the selected file
    const breadcrumb = page.locator('.vw-breadcrumb')
    await expect(breadcrumb).toContainText('tsconfig')
  })

  test('clicking result selects file and closes dialog', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    await page.waitForSelector('[role="option"]', { timeout: 3000 })

    const firstOption = page.locator('[role="option"]').first()
    const optionText = await firstOption.locator('.qo-item__name').textContent()
    await firstOption.click()

    // Dialog should close
    const dialog = page.locator('[role="dialog"][aria-label="Quick Open"]')
    await expect(dialog).not.toBeVisible()

    // Breadcrumb should contain the selected file name
    if (optionText) {
      const breadcrumb = page.locator('.vw-breadcrumb')
      await expect(breadcrumb).toContainText(optionText)
    }
  })

  test('backdrop click closes dialog', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const dialog = page.locator('[role="dialog"][aria-label="Quick Open"]')
    await expect(dialog).toBeVisible()

    // Click backdrop (outside dialog)
    await page.locator('.qo-backdrop').click({ position: { x: 10, y: 10 } })
    await expect(dialog).not.toBeVisible()
  })

  test('ARIA: combobox has correct attributes', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const input = page.locator('input[role="combobox"]')

    await expect(input).toHaveAttribute('aria-haspopup', 'listbox')
    await expect(input).toHaveAttribute('aria-controls', 'qo-listbox')

    // With results, aria-expanded should be true
    const expanded = await input.getAttribute('aria-expanded')
    expect(expanded).toBe('true')

    // aria-activedescendant should point to focused option
    const activeDesc = await input.getAttribute('aria-activedescendant')
    expect(activeDesc).toBeTruthy()
  })

  test('empty query shows initial files, then filters on typing', async ({ page }) => {
    await page.keyboard.press('Meta+p')
    const input = page.locator('input[role="combobox"]')

    // Empty query shows some results
    const initialCount = await page.locator('[role="option"]').count()
    expect(initialCount).toBeGreaterThan(0)
    expect(initialCount).toBeLessThanOrEqual(12) // MAX_RESULTS

    // Type gibberish
    await input.fill('xyzxyzxyz')
    await page.waitForTimeout(100)
    const filteredCount = await page.locator('[role="option"]').count()
    expect(filteredCount).toBe(0)

    // Empty message should appear
    const empty = page.locator('.qo-empty')
    await expect(empty).toBeVisible()
  })
})
