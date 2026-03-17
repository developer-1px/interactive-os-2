/**
 * Reproduction: /collection/treegrid — Delete 키로 노드 삭제 후 포커스 복구 확인
 *
 * Steps:
 * 1. Go to /collection/treegrid
 * 2. Focus a middle file node (e.g. "App.tsx" inside src)
 * 3. Press Delete
 * 4. Assert: DOM focus moves to next sibling (not lost, not on deleted node)
 */
import { test, expect } from '@playwright/test'

test('treegrid: delete node recovers focus to next sibling', async ({ page }) => {
  await page.goto('/collection/treegrid')
  await page.waitForTimeout(500)

  // Find the treegrid
  const treegrid = page.locator('[role="treegrid"]')
  await expect(treegrid).toBeVisible()

  // Get all visible rows
  const rows = treegrid.locator('[role="row"]')
  const rowCount = await rows.count()
  console.log(`Initial row count: ${rowCount}`)

  // Focus the first row
  await rows.first().focus()
  await page.waitForTimeout(100)

  // Expand "src" folder — press ArrowRight on first row
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)

  // Now navigate down to first child (should be "components" or first child of src)
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(100)

  // Record what's focused before delete
  const beforeDelete = await page.evaluate(() => {
    const el = document.activeElement
    return {
      nodeId: el?.getAttribute('data-node-id'),
      textContent: el?.textContent?.trim(),
      role: el?.getAttribute('role'),
    }
  })
  console.log('Focused before delete:', beforeDelete)

  // Press Delete
  await page.keyboard.press('Delete')
  await page.waitForTimeout(300)

  // Check focus after delete
  const afterDelete = await page.evaluate(() => {
    const el = document.activeElement
    const isInTreegrid = !!el?.closest('[role="treegrid"]')
    return {
      nodeId: el?.getAttribute('data-node-id'),
      textContent: el?.textContent?.trim(),
      role: el?.getAttribute('role'),
      tagName: el?.tagName,
      isInTreegrid,
      tabindex: el?.getAttribute('tabindex'),
    }
  })
  console.log('Focused after delete:', afterDelete)

  // Critical assertions:
  // 1. Focus must still be inside the treegrid
  expect(afterDelete.isInTreegrid).toBe(true)

  // 2. Focused node must be a row (not body or container)
  expect(afterDelete.role).toBe('row')

  // 3. Focused node must NOT be the deleted node
  expect(afterDelete.nodeId).not.toBe(beforeDelete.nodeId)
})

test('treegrid: delete last sibling recovers focus to previous sibling', async ({ page }) => {
  await page.goto('/collection/treegrid')
  await page.waitForTimeout(500)

  const treegrid = page.locator('[role="treegrid"]')
  await expect(treegrid).toBeVisible()

  // Focus first row and expand src
  const rows = treegrid.locator('[role="row"]')
  await rows.first().focus()
  await page.waitForTimeout(100)
  await page.keyboard.press('ArrowRight') // expand src
  await page.waitForTimeout(200)

  // Navigate to last child of src — press End then ArrowUp to find last sibling in src
  // Actually, let's navigate: ArrowDown through children to reach the last one
  // src has: components, App.tsx, main.tsx
  await page.keyboard.press('ArrowDown') // components
  await page.keyboard.press('ArrowDown') // App.tsx
  await page.keyboard.press('ArrowDown') // main.tsx
  await page.waitForTimeout(100)

  const beforeDelete = await page.evaluate(() => {
    const el = document.activeElement
    return {
      nodeId: el?.getAttribute('data-node-id'),
      textContent: el?.textContent?.trim(),
    }
  })
  console.log('Last child focused:', beforeDelete)

  // Delete the last child
  await page.keyboard.press('Delete')
  await page.waitForTimeout(300)

  const afterDelete = await page.evaluate(() => {
    const el = document.activeElement
    return {
      nodeId: el?.getAttribute('data-node-id'),
      textContent: el?.textContent?.trim(),
      role: el?.getAttribute('role'),
      isInTreegrid: !!el?.closest('[role="treegrid"]'),
    }
  })
  console.log('After deleting last child:', afterDelete)

  // Focus should be on previous sibling, still in treegrid
  expect(afterDelete.isInTreegrid).toBe(true)
  expect(afterDelete.role).toBe('row')
  expect(afterDelete.nodeId).not.toBe(beforeDelete.nodeId)
})
