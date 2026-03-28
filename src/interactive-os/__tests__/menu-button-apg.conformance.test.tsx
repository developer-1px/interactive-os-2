// V1: 2026-03-28-popup-axis-prd.md
/**
 * APG Conformance: Menu Button (Actions Menu Button using element.focus())
 * https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { menuButton } from '../pattern/roles/menuButton'
import { useAria } from '../primitives/useAria'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { POPUP_ID } from '../axis/popup'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      actions: { id: 'actions', data: { name: 'Actions' } },
      cut: { id: 'cut', data: { name: 'Cut' } },
      copy: { id: 'copy', data: { name: 'Copy' } },
      paste: { id: 'paste', data: { name: 'Paste' } },
    },
    relationships: {
      [ROOT_ID]: ['actions'],
      actions: ['cut', 'copy', 'paste'],
    },
  })
}

// ---------------------------------------------------------------------------
// Test component
// ---------------------------------------------------------------------------

function TestMenuButton({ data, onActivate }: { data: NormalizedData; onActivate?: (id: string) => void }) {
  const aria = useAria({ data, pattern: menuButton, onActivate })
  const store = aria.getStore()
  const popupEntity = store.entities[POPUP_ID] as Record<string, unknown> | undefined
  const isOpen = (popupEntity?.isOpen as boolean) ?? false
  const triggerId = (popupEntity?.triggerId as string) ?? ''
  const showChildren = isOpen && triggerId === 'actions'

  return (
    <div {...aria.containerProps} data-aria-container="">
      <div {...aria.getNodeProps('actions')} data-testid="trigger">
        Actions
      </div>
      {showChildren && (
        <>
          <div {...aria.getNodeProps('cut')} data-testid="cut">Cut</div>
          <div {...aria.getNodeProps('copy')} data-testid="copy">Copy</div>
          <div {...aria.getNodeProps('paste')} data-testid="paste">Paste</div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderMenuButton(data?: NormalizedData) {
  return render(<TestMenuButton data={data ?? fixtureData()} />)
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getAllVisibleNodeIds(container: HTMLElement): string[] {
  const nodes = container.querySelectorAll('[data-node-id]')
  return Array.from(nodes).map((n) => n.getAttribute('data-node-id')!).filter(Boolean)
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure — Closed State
// ---------------------------------------------------------------------------

describe('APG Menu Button — ARIA Structure (Closed)', () => {
  it('trigger has aria-haspopup="menu"', () => {
    const { container } = renderMenuButton()
    const trigger = getNode(container, 'actions')
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu')
  })

  it('trigger has aria-expanded="false" when closed', () => {
    const { container } = renderMenuButton()
    const trigger = getNode(container, 'actions')
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')
  })

  it('only trigger is visible when closed', () => {
    const { container } = renderMenuButton()
    expect(getAllVisibleNodeIds(container)).toEqual(['actions'])
  })

  it('trigger has tabindex="0" (initial focus)', () => {
    const { container } = renderMenuButton()
    expect(getFocusedNodeId(container)).toBe('actions')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard: Open with Enter
// ---------------------------------------------------------------------------

describe('APG Menu Button — Keyboard: Enter', () => {
  it('Enter opens popup and focuses first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard('{Enter}')

    expect(getNode(container, 'actions')?.getAttribute('aria-expanded')).toBe('true')
    expect(getAllVisibleNodeIds(container)).toContain('cut')
    expect(getFocusedNodeId(container)).toBe('cut')
  })

  it('Space opens popup and focuses first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard(' ')

    expect(getNode(container, 'actions')?.getAttribute('aria-expanded')).toBe('true')
    expect(getFocusedNodeId(container)).toBe('cut')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard: Close with Escape
// ---------------------------------------------------------------------------

describe('APG Menu Button — Keyboard: Escape', () => {
  it('Escape closes popup and returns focus to trigger', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    // Open
    getNode(container, 'actions')!.focus()
    await user.keyboard('{Enter}')
    expect(getFocusedNodeId(container)).toBe('cut')

    // Close
    await user.keyboard('{Escape}')
    expect(getNode(container, 'actions')?.getAttribute('aria-expanded')).toBe('false')
    expect(getFocusedNodeId(container)).toBe('actions')
  })

  it('menu items are hidden after Escape', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard('{Enter}')
    expect(getAllVisibleNodeIds(container)).toContain('cut')

    await user.keyboard('{Escape}')
    expect(getAllVisibleNodeIds(container)).toEqual(['actions'])
  })
})

// ---------------------------------------------------------------------------
// 4. Keyboard: ArrowDown opens + focuses first
// ---------------------------------------------------------------------------

describe('APG Menu Button — Keyboard: ArrowDown on trigger', () => {
  it('ArrowDown opens popup and focuses first item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard('{ArrowDown}')

    expect(getNode(container, 'actions')?.getAttribute('aria-expanded')).toBe('true')
    expect(getFocusedNodeId(container)).toBe('cut')
  })
})

// ---------------------------------------------------------------------------
// 5. Keyboard: ArrowUp opens + focuses last
// ---------------------------------------------------------------------------

describe('APG Menu Button — Keyboard: ArrowUp on trigger', () => {
  it('ArrowUp opens popup and focuses last item', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard('{ArrowUp}')

    expect(getNode(container, 'actions')?.getAttribute('aria-expanded')).toBe('true')
    expect(getFocusedNodeId(container)).toBe('paste')
  })
})

// ---------------------------------------------------------------------------
// 6. Keyboard: Navigation within open menu
// ---------------------------------------------------------------------------

describe('APG Menu Button — Keyboard: Navigation within menu', () => {
  it('ArrowDown moves to next item within open menu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard('{Enter}')
    expect(getFocusedNodeId(container)).toBe('cut')

    await user.keyboard('{ArrowDown}')
    expect(getFocusedNodeId(container)).toBe('copy')
  })

  it('ArrowDown wraps from last item back toward trigger', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard('{ArrowUp}') // open, focus last
    expect(getFocusedNodeId(container)).toBe('paste')

    await user.keyboard('{ArrowDown}')
    // Visible nodes when open: [actions, cut, copy, paste] — wraps to 'actions'
    expect(getFocusedNodeId(container)).toBe('actions')
  })

  it('ArrowUp moves to previous item within open menu', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    getNode(container, 'actions')!.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowDown}') // cut → copy
    expect(getFocusedNodeId(container)).toBe('copy')

    await user.keyboard('{ArrowUp}')
    expect(getFocusedNodeId(container)).toBe('cut')
  })
})

// ---------------------------------------------------------------------------
// 7. Only one tabindex=0 at a time
// ---------------------------------------------------------------------------

describe('APG Menu Button — Focus invariant', () => {
  it('only one item has tabindex=0 at any time', async () => {
    const user = userEvent.setup()
    const { container } = renderMenuButton()

    // Closed state
    const tabindex0Closed = container.querySelectorAll('[tabindex="0"]')
    expect(tabindex0Closed).toHaveLength(1)

    // Open state
    getNode(container, 'actions')!.focus()
    await user.keyboard('{Enter}')
    const tabindex0Open = container.querySelectorAll('[tabindex="0"]')
    expect(tabindex0Open).toHaveLength(1)
  })
})
