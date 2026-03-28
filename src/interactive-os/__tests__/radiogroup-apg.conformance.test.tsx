// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: RadioGroup (Roving tabindex)
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RadioGroup } from '../ui/RadioGroup'
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
      small:  { id: 'small',  data: { label: 'Small'  } },
      medium: { id: 'medium', data: { label: 'Medium' } },
      large:  { id: 'large',  data: { label: 'Large'  } },
    },
    relationships: {
      [ROOT_ID]: ['small', 'medium', 'large'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderRadioGroup(data: NormalizedData) {
  return render(
    <RadioGroup
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`item-${item.id}`}
          data-focused={state.focused}
          data-selected={state.selected}
        >
          {(item.data as Record<string, unknown>)?.label as string}
        </span>
      )}
    />,
  )
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

// ---------------------------------------------------------------------------
// 1. ARIA Tree Structure
// ---------------------------------------------------------------------------

describe('APG RadioGroup — ARIA Tree Structure', () => {
  it('role hierarchy: radiogroup > radio items', () => {
    const { container } = renderRadioGroup(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('radiogroup')
    expect(hierarchy).toContain('radio')
  })

  it('initial focus lands on first radio (tabindex=0)', () => {
    const { container } = renderRadioGroup(fixtureData())
    expect(getFocusedNodeId(container)).toBe('small')
  })

  it('only one radio has tabindex=0 (roving tabindex)', () => {
    const { container } = renderRadioGroup(fixtureData())
    const allTabindex0 = container.querySelectorAll('[tabindex="0"]')
    expect(allTabindex0).toHaveLength(1)
  })

  it('unfocused radios have tabindex=-1', () => {
    const { container } = renderRadioGroup(fixtureData())
    const allTabindexNeg1 = container.querySelectorAll('[tabindex="-1"]')
    expect(allTabindexNeg1.length).toBeGreaterThanOrEqual(2)
  })

  it('initially focused radio has aria-checked=true (selectionFollowsFocus)', () => {
    const { container } = renderRadioGroup(fixtureData())
    const small = getNode(container, 'small')
    // selectionFollowsFocus auto-selects the initially focused radio
    expect(small?.getAttribute('aria-checked')).toBe('true')
  })

  it('aria-checked=true on selected radio', async () => {
    const user = userEvent.setup()
    const { container } = renderRadioGroup(fixtureData())

    getNode(container, 'medium')!.focus()
    await user.keyboard('{ }')

    const medium = getNode(container, 'medium')
    expect(medium?.getAttribute('aria-checked')).toBe('true')
  })

  it('captureAriaTree includes aria-checked attribute', () => {
    const { container } = renderRadioGroup(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('checked=false')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction (Arrow keys move+select — selection follows focus)
// ---------------------------------------------------------------------------

describe('APG RadioGroup — Keyboard Interaction', () => {
  describe('ArrowDown / ArrowRight', () => {
    it('ArrowDown moves focus to next radio', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('medium')
    })

    // APG: selection follows focus — ArrowDown auto-selects
    it('ArrowDown moves focus and auto-selects (APG selectionFollowsFocus)', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ArrowDown}')

      // Focus moved AND aria-checked auto-set (selectionFollowsFocus)
      expect(getFocusedNodeId(container)).toBe('medium')
      const medium = getNode(container, 'medium')
      expect(medium?.getAttribute('aria-checked')).toBe('true')
    })

    it('ArrowDown from last item wraps to first', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'large')!.focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('small')
    })

    it('ArrowRight moves to next radio', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('medium')
    })

    it('ArrowRight from last item wraps to first', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'large')!.focus()
      await user.keyboard('{ArrowRight}')

      expect(getFocusedNodeId(container)).toBe('small')
    })
  })

  describe('ArrowUp / ArrowLeft', () => {
    it('ArrowUp moves focus to previous radio', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'medium')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('small')
    })

    it('ArrowUp from first item wraps to last', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('large')
    })

    it('ArrowLeft moves to previous radio', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'medium')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('small')
    })

    it('ArrowLeft from first item wraps to last', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ArrowLeft}')

      expect(getFocusedNodeId(container)).toBe('large')
    })
  })

  describe('Single selection', () => {
    // NOTE: APG spec requires "selection follows focus" (arrow key auto-selects).
    // This implementation requires explicit Space/click to select (gap noted in matrix).
    it('Space selects the focused radio', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'medium')!.focus()
      await user.keyboard('{ }')

      expect(getNode(container, 'medium')?.getAttribute('aria-checked')).toBe('true')
    })

    it('selecting via Space deselects previous (single mode)', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ }')
      expect(getNode(container, 'small')?.getAttribute('aria-checked')).toBe('true')

      getNode(container, 'large')!.focus()
      await user.keyboard('{ }')

      expect(getNode(container, 'small')?.getAttribute('aria-checked')).toBe('false')
      expect(getNode(container, 'large')?.getAttribute('aria-checked')).toBe('true')
    })

    it('only one radio is checked at a time after Space selection', async () => {
      const user = userEvent.setup()
      const { container } = renderRadioGroup(fixtureData())

      getNode(container, 'small')!.focus()
      await user.keyboard('{ }') // select small

      getNode(container, 'medium')!.focus()
      await user.keyboard('{ }') // select medium

      const checked = container.querySelectorAll('[aria-checked="true"]')
      expect(checked).toHaveLength(1)
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG RadioGroup — Click Interaction', () => {
  it('clicking a radio selects it', async () => {
    const user = userEvent.setup()
    const { container } = renderRadioGroup(fixtureData())

    await user.click(getNode(container, 'medium')!)

    expect(getNode(container, 'medium')?.getAttribute('aria-checked')).toBe('true')
  })

  it('clicking another radio deselects previous', async () => {
    const user = userEvent.setup()
    const { container } = renderRadioGroup(fixtureData())

    await user.click(getNode(container, 'small')!)
    await user.click(getNode(container, 'large')!)

    expect(getNode(container, 'small')?.getAttribute('aria-checked')).toBe('false')
    expect(getNode(container, 'large')?.getAttribute('aria-checked')).toBe('true')
  })
})
