var e=`/**
 * Integration test: QuickOpen click selection triggers onSelect
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickOpen } from '../ui/QuickOpen'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'

function fixtureFileStore(): NormalizedData {
  return createStore({
    entities: {
      file1: { id: 'file1', data: { name: 'vite-plugin-fs.ts', type: 'file', path: '/root/vite-plugin-fs.ts' } },
      file2: { id: 'file2', data: { name: 'index.ts', type: 'file', path: '/root/src/index.ts' } },
    },
    relationships: { [ROOT_ID]: ['file1', 'file2'] },
  })
}

describe('QuickOpen click selection', () => {
  it('clicking an item calls onSelect with the file path', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onClose = vi.fn()

    const { container } = render(
      <QuickOpen
        fileStore={fixtureFileStore()}
        root="/root"
        onSelect={onSelect}
        onClose={onClose}
      />
    )

    // Wait for mount effect to open combobox
    await new Promise(r => setTimeout(r, 50))

    // Verify items are rendered
    const items = container.querySelectorAll('[data-node-id]')
    expect(items.length).toBeGreaterThan(0)

    // Find the first file item
    const item = container.querySelector('[data-node-id="file1"]') as HTMLElement
    expect(item).toBeTruthy()

    // Click the item
    await user.click(item)

    // Verify onSelect was called
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('/root/vite-plugin-fs.ts')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('pressing Enter on focused item calls onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onClose = vi.fn()

    // We can't pass logger to QuickOpen, so we test the underlying behavior
    const { container } = render(
      <QuickOpen
        fileStore={fixtureFileStore()}
        root="/root"
        onSelect={onSelect}
        onClose={onClose}
      />
    )

    await new Promise(r => setTimeout(r, 50))

    const input = container.querySelector('input') as HTMLElement
    expect(input).toBeTruthy()

    // Check that combobox is open (items should be visible)
    const itemsBefore = container.querySelectorAll('[data-node-id]')
    expect(itemsBefore.length).toBeGreaterThan(0)

    // file1 is already focused (first item). Enter should select it.
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('/root/vite-plugin-fs.ts')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
`;export{e as default};