/**
 * Reproduction test: Sidebar focus is stolen by Content page on navigate.
 *
 * Steps:
 * 1. Go to /behaviors/treegrid
 * 2. Focus the Sidebar's first item (TreeGrid)
 * 3. Press ArrowDown to move to next item (Listbox)
 * 4. Assert DOM focus is still inside Sidebar, not stolen by Content
 */
import { test, expect } from '@playwright/test'

test('Sidebar ArrowDown keeps focus in sidebar, not stolen by content', async ({ page }) => {
  await page.goto('/behaviors/treegrid')
  await page.waitForTimeout(500)

  // Find the sidebar listbox
  const sidebar = page.locator('[role="listbox"][aria-label="Behaviors pages"]')
  await expect(sidebar).toBeVisible()

  // Focus the first option in sidebar (TreeGrid)
  const firstOption = sidebar.locator('[role="option"]').first()
  await firstOption.focus()
  await page.waitForTimeout(100)

  // Verify focus is on first option
  const focusedBefore = await page.evaluate(() => document.activeElement?.getAttribute('data-node-id'))
  expect(focusedBefore).toBe('treegrid')

  // Press ArrowDown — should move focus to next sidebar item AND navigate
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(500) // wait for navigate + re-render

  // Assert: focus should still be inside sidebar (on "listbox" item), NOT stolen by content
  const focusedAfter = await page.evaluate(() => {
    const el = document.activeElement
    return {
      nodeId: el?.getAttribute('data-node-id'),
      role: el?.getAttribute('role'),
      isInSidebar: !!el?.closest('[aria-label="Behaviors pages"]'),
      tagName: el?.tagName,
    }
  })

  console.log('Focus after ArrowDown:', focusedAfter)

  // URL should have changed to /behaviors/listbox
  const url = page.url()
  console.log('URL after ArrowDown:', url)

  // Check: is the listbox node focusable and in the DOM?
  const debugState = await page.evaluate(() => {
    const sidebar = document.querySelector('[role="listbox"][aria-label="Behaviors pages"]')
    if (!sidebar) return { error: 'no sidebar' }
    const listboxNode = sidebar.querySelector('[data-node-id="listbox"]')
    const treegridNode = sidebar.querySelector('[data-node-id="treegrid"]')
    return {
      listboxExists: !!listboxNode,
      listboxTabindex: listboxNode?.getAttribute('tabindex'),
      treegridTabindex: treegridNode?.getAttribute('tabindex'),
      activeElementNodeId: document.activeElement?.getAttribute('data-node-id'),
      activeElementTabindex: document.activeElement?.getAttribute('tabindex'),
      activeElementInSidebar: !!document.activeElement?.closest('[aria-label="Behaviors pages"]'),
    }
  })
  console.log('Debug state:', debugState)

  // Focus must be inside sidebar
  expect(focusedAfter.isInSidebar).toBe(true)

  // The focused nodeId should be 'listbox' (next item after treegrid)
  expect(focusedAfter.nodeId).toBe('listbox')
})
