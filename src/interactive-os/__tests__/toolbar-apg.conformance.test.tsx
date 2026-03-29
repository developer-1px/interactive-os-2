// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Toolbar
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/
 *
 * Two variants:
 * - Action toolbar: Enter/Space/Click → activate (no aria-pressed)
 * - Toggle toolbar: Enter/Space/Click → toggle checked (aria-pressed)
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { captureAriaTree, extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      bold: { id: 'bold', data: { name: 'Bold' } },
      italic: { id: 'italic', data: { name: 'Italic' } },
      underline: { id: 'underline', data: { name: 'Underline' } },
    },
    relationships: {
      [ROOT_ID]: ['bold', 'italic', 'underline'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderActionToolbar(data: NormalizedData, onActivate?: (id: string) => void) {
  return render(
    <Aria pattern={toolbar()} data={data} plugins={[]} onActivate={onActivate}>
      <Aria.Item render={(props, item, state: NodeState) => (
        <span {...props} data-testid={`btn-${item.id}`} data-focused={state.focused}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function renderToggleToolbar(data: NormalizedData) {
  return render(
    <Aria pattern={toolbar({ toggle: true })} data={data} plugins={[]}>
      <Aria.Item render={(props, item, state: NodeState) => (
        <span {...props} data-testid={`btn-${item.id}`} data-focused={state.focused} data-checked={state.checked}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

// ---------------------------------------------------------------------------
// 1. ARIA Structure
// ---------------------------------------------------------------------------

describe('APG Toolbar — ARIA Structure', () => {
  it('role hierarchy: toolbar > button items', () => {
    const { container } = renderActionToolbar(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('toolbar')
    expect(hierarchy).toContain('button')
  })

  it('initial focus lands on first button (tabindex=0)', () => {
    const { container } = renderActionToolbar(fixtureData())
    expect(getFocusedNodeId(container)).toBe('bold')
  })

  it('only focused button has tabindex=0 (roving tabindex)', () => {
    const { container } = renderActionToolbar(fixtureData())
    const allTabindex0 = container.querySelectorAll('[tabindex="0"]')
    expect(allTabindex0).toHaveLength(1)
  })

  it('aria-orientation is horizontal', () => {
    const { container } = renderActionToolbar(fixtureData())
    const tb = container.querySelector('[role="toolbar"]')
    expect(tb?.getAttribute('aria-orientation')).toBe('horizontal')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Navigation
// ---------------------------------------------------------------------------

describe('APG Toolbar — Keyboard Navigation', () => {
  it('ArrowRight moves focus to next button', async () => {
    const user = userEvent.setup()
    const { container } = renderActionToolbar(fixtureData())

    getNode(container, 'bold')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getFocusedNodeId(container)).toBe('italic')
  })

  it('ArrowRight wraps from last to first (APG circular)', async () => {
    const user = userEvent.setup()
    const { container } = renderActionToolbar(fixtureData())

    getNode(container, 'underline')!.focus()
    await user.keyboard('{ArrowRight}')

    expect(getFocusedNodeId(container)).toBe('bold')
  })

  it('ArrowLeft moves focus to previous button', async () => {
    const user = userEvent.setup()
    const { container } = renderActionToolbar(fixtureData())

    getNode(container, 'italic')!.focus()
    await user.keyboard('{ArrowLeft}')

    expect(getFocusedNodeId(container)).toBe('bold')
  })

  it('ArrowLeft wraps from first to last (APG circular)', async () => {
    const user = userEvent.setup()
    const { container } = renderActionToolbar(fixtureData())

    getNode(container, 'bold')!.focus()
    await user.keyboard('{ArrowLeft}')

    expect(getFocusedNodeId(container)).toBe('underline')
  })

  it('Home moves focus to first button', async () => {
    const user = userEvent.setup()
    const { container } = renderActionToolbar(fixtureData())

    getNode(container, 'underline')!.focus()
    await user.keyboard('{Home}')

    expect(getFocusedNodeId(container)).toBe('bold')
  })

  it('End moves focus to last button', async () => {
    const user = userEvent.setup()
    const { container } = renderActionToolbar(fixtureData())

    getNode(container, 'bold')!.focus()
    await user.keyboard('{End}')

    expect(getFocusedNodeId(container)).toBe('underline')
  })
})

// ---------------------------------------------------------------------------
// 3. Action Toolbar — Activation
// ---------------------------------------------------------------------------

describe('APG Toolbar — Action: Activation', () => {
  it('action toolbar buttons have no aria-pressed', () => {
    const { container } = renderActionToolbar(fixtureData())
    const bold = getNode(container, 'bold')
    expect(bold?.getAttribute('aria-pressed')).toBeNull()
  })

  it('Enter fires onActivate', async () => {
    const user = userEvent.setup()
    const activated: string[] = []
    const { container } = renderActionToolbar(fixtureData(), (id) => activated.push(id))

    getNode(container, 'bold')!.focus()
    await user.keyboard('{Enter}')

    expect(activated).toContain('bold')
  })
})

// ---------------------------------------------------------------------------
// 4. Toggle Toolbar — aria-pressed
// ---------------------------------------------------------------------------

describe('APG Toolbar — Toggle: aria-pressed', () => {
  it('aria-pressed is false initially', () => {
    const { container } = renderToggleToolbar(fixtureData())
    const bold = getNode(container, 'bold')
    expect(bold?.getAttribute('aria-pressed')).toBe('false')
  })

  it('captureAriaTree includes aria-pressed attribute', () => {
    const { container } = renderToggleToolbar(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('pressed=false')
  })

  it('Enter toggles aria-pressed to true', async () => {
    const user = userEvent.setup()
    const { container } = renderToggleToolbar(fixtureData())

    getNode(container, 'bold')!.focus()
    await user.keyboard('{Enter}')

    expect(getNode(container, 'bold')?.getAttribute('aria-pressed')).toBe('true')
  })

  it('Space toggles aria-pressed to true', async () => {
    const user = userEvent.setup()
    const { container } = renderToggleToolbar(fixtureData())

    getNode(container, 'italic')!.focus()
    await user.keyboard('{ }')

    expect(getNode(container, 'italic')?.getAttribute('aria-pressed')).toBe('true')
  })

  it('clicking a button toggles aria-pressed', async () => {
    const user = userEvent.setup()
    const { container } = renderToggleToolbar(fixtureData())

    await user.click(getNode(container, 'italic')!)

    expect(getNode(container, 'italic')?.getAttribute('aria-pressed')).toBe('true')
  })

  it('toggling twice returns to false', async () => {
    const user = userEvent.setup()
    const { container } = renderToggleToolbar(fixtureData())

    getNode(container, 'bold')!.focus()
    await user.keyboard('{Enter}')
    expect(getNode(container, 'bold')?.getAttribute('aria-pressed')).toBe('true')

    await user.keyboard('{Enter}')
    expect(getNode(container, 'bold')?.getAttribute('aria-pressed')).toBe('false')
  })
})
