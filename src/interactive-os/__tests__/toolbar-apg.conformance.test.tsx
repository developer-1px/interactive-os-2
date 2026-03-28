// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Toolbar
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from '../ui/Toolbar'
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

function renderToolbar(data: NormalizedData) {
  return render(
    <Toolbar
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`btn-${item.id}`}
          data-focused={state.focused}
          data-selected={state.selected}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
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
    const { container } = renderToolbar(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('toolbar')
    expect(hierarchy).toContain('button')
  })

  it('initial focus lands on first button (tabindex=0)', () => {
    const { container } = renderToolbar(fixtureData())
    expect(getFocusedNodeId(container)).toBe('bold')
  })

  it('only focused button has tabindex=0 (roving tabindex)', () => {
    const { container } = renderToolbar(fixtureData())
    const allTabindex0 = container.querySelectorAll('[tabindex="0"]')
    expect(allTabindex0).toHaveLength(1)
  })

  it('aria-pressed is false initially', () => {
    const { container } = renderToolbar(fixtureData())
    const bold = getNode(container, 'bold')
    expect(bold?.getAttribute('aria-pressed')).toBe('false')
  })

  it('captureAriaTree includes aria-pressed attribute', () => {
    const { container } = renderToolbar(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('pressed=false')
  })

  it('aria-orientation is horizontal', () => {
    const { container } = renderToolbar(fixtureData())
    const toolbar = container.querySelector('[role="toolbar"]')
    expect(toolbar?.getAttribute('aria-orientation')).toBe('horizontal')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Navigation
// ---------------------------------------------------------------------------

describe('APG Toolbar — Keyboard Navigation', () => {
  describe('ArrowRight', () => {
    it('ArrowRight moves focus to next button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      expect(getFocusedNodeId(container)).toBe('bold')

      getNode(container, 'bold')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('italic')
    })

    it('ArrowRight wraps from last to first (APG circular)', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNode(container, 'underline')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('bold')
    })
  })

  describe('ArrowLeft', () => {
    it('ArrowLeft moves focus to previous button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNode(container, 'italic')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('bold')
    })

    it('ArrowLeft wraps from first to last (APG circular)', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNode(container, 'bold')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('underline')
    })
  })

  describe('Home', () => {
    it('Home moves focus to first button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNode(container, 'underline')!.focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('bold')
    })
  })

  describe('End', () => {
    it('End moves focus to last button', async () => {
      const user = userEvent.setup()
      const { container } = renderToolbar(fixtureData())

      getNode(container, 'bold')!.focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('underline')
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Activation
// ---------------------------------------------------------------------------

describe('APG Toolbar — Activation', () => {
  it('Enter activates (selects) focused button', async () => {
    const user = userEvent.setup()
    const { container } = renderToolbar(fixtureData())

    getNode(container, 'bold')!.focus()
    await user.keyboard('{Enter}')

    const testNode = container.querySelector('[data-testid="btn-bold"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })

  it('Space activates (selects) focused button', async () => {
    const user = userEvent.setup()
    const { container } = renderToolbar(fixtureData())

    getNode(container, 'italic')!.focus()
    await user.keyboard('{ }')

    const testNode = container.querySelector('[data-testid="btn-italic"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })
})

// ---------------------------------------------------------------------------
// 4. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Toolbar — Click Interaction', () => {
  it('clicking a button selects it', async () => {
    const user = userEvent.setup()
    const { container } = renderToolbar(fixtureData())

    await user.click(getNode(container, 'italic')!)

    const testNode = container.querySelector('[data-testid="btn-italic"]')
    expect(testNode?.getAttribute('data-selected')).toBe('true')
  })
})
