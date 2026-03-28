// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Scrollable Listbox
 * https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListBox } from '../ui/ListBox'
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
      apple:  { id: 'apple',  data: { name: 'Apple'  } },
      banana: { id: 'banana', data: { name: 'Banana' } },
      cherry: { id: 'cherry', data: { name: 'Cherry' } },
      date:   { id: 'date',   data: { name: 'Date'   } },
    },
    relationships: {
      [ROOT_ID]: ['apple', 'banana', 'cherry', 'date'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderListBox(data: NormalizedData) {
  return render(
    <ListBox
      data={data}
      plugins={[]}
      renderItem={(props, item, state: NodeState) => (
        <span
          {...props}
          data-testid={`item-${item.id}`}
          data-focused={state.focused}
          data-selected={state.selected}
        >
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )}
    />,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

function getFocusedNodeId(container: HTMLElement): string | null {
  return container.querySelector('[tabindex="0"]')?.getAttribute('data-node-id') ?? null
}

function isSelected(container: HTMLElement, id: string): boolean {
  return getNode(container, id).getAttribute('aria-selected') === 'true'
}

// ---------------------------------------------------------------------------
// 1. Aria Tree Structure
// ---------------------------------------------------------------------------

describe('APG Listbox — Aria Tree Structure', () => {
  it('role hierarchy: listbox > option', () => {
    const { container } = renderListBox(fixtureData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('listbox')
    expect(hierarchy).toContain('option')
  })

  it('all four options are rendered under listbox', () => {
    const { container } = renderListBox(fixtureData())
    const options = container.querySelectorAll('[role="option"]')
    expect(options).toHaveLength(4)
  })

  it('initial focus lands on first option (tabindex=0)', () => {
    const { container } = renderListBox(fixtureData())
    expect(getFocusedNodeId(container)).toBe('apple')
  })

  it('all options initially have aria-selected=false', () => {
    const { container } = renderListBox(fixtureData())
    for (const id of ['apple', 'banana', 'cherry', 'date']) {
      expect(getNode(container, id).getAttribute('aria-selected')).toBe('false')
    }
  })

  it('aria-posinset and aria-setsize are set correctly', () => {
    const { container } = renderListBox(fixtureData())
    const ids = ['apple', 'banana', 'cherry', 'date']
    ids.forEach((id, idx) => {
      const el = getNode(container, id)
      expect(el.getAttribute('aria-posinset')).toBe(String(idx + 1))
      expect(el.getAttribute('aria-setsize')).toBe('4')
    })
  })

  it('only the focused option has tabindex=0 (roving tabindex)', () => {
    const { container } = renderListBox(fixtureData())
    const allTabindex0 = container.querySelectorAll('[tabindex="0"]')
    expect(allTabindex0).toHaveLength(1)
    expect(allTabindex0[0].getAttribute('data-node-id')).toBe('apple')
  })

  it('captureAriaTree snapshot includes aria-selected attribute', () => {
    const { container } = renderListBox(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('selected=false')
  })

  it('captureAriaTree snapshot includes aria-posinset and aria-setsize', () => {
    const { container } = renderListBox(fixtureData())
    const tree = captureAriaTree(container)
    expect(tree).toContain('posinset=1')
    expect(tree).toContain('setsize=4')
  })
})

// ---------------------------------------------------------------------------
// 2. Keyboard Interaction
// ---------------------------------------------------------------------------

describe('APG Listbox — Keyboard Interaction', () => {
  describe('ArrowDown', () => {
    it('ArrowDown moves focus to next option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      expect(getFocusedNodeId(container)).toBe('apple')

      getNode(container, 'apple').focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('banana')
    })

    it('ArrowDown at last option stays on last option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'date').focus()
      await user.keyboard('{ArrowDown}')

      expect(getFocusedNodeId(container)).toBe('date')
    })
  })

  describe('ArrowUp', () => {
    it('ArrowUp moves focus to previous option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'banana').focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })

    it('ArrowUp at first option stays on first option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{ArrowUp}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })
  })

  describe('Home', () => {
    it('Home moves focus to first option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'cherry').focus()
      await user.keyboard('{Home}')

      expect(getFocusedNodeId(container)).toBe('apple')
    })
  })

  describe('End', () => {
    it('End moves focus to last option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{End}')

      expect(getFocusedNodeId(container)).toBe('date')
    })
  })

  describe('Space — toggle selection', () => {
    it('Space toggles selection on focused option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{ }')

      expect(isSelected(container, 'apple')).toBe(true)
    })

    it('Space again deselects the option', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{ }')
      await user.keyboard('{ }')

      expect(isSelected(container, 'apple')).toBe(false)
    })

    it('Space selection does not move focus', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'banana').focus()
      await user.keyboard('{ }')

      expect(getFocusedNodeId(container)).toBe('banana')
    })
  })

  describe('Shift+ArrowDown — extended selection', () => {
    it('Shift+ArrowDown moves focus to next option and selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

      expect(getFocusedNodeId(container)).toBe('banana')
      expect(isSelected(container, 'banana')).toBe(true)
    })

    it('Shift+ArrowDown selects multiple contiguous options', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'apple').focus()
      await user.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')

      expect(getFocusedNodeId(container)).toBe('cherry')
      expect(isSelected(container, 'cherry')).toBe(true)
    })
  })

  describe('Shift+ArrowUp — extended selection', () => {
    it('Shift+ArrowUp moves focus to previous option and selects it', async () => {
      const user = userEvent.setup()
      const { container } = renderListBox(fixtureData())

      getNode(container, 'cherry').focus()
      await user.keyboard('{Shift>}{ArrowUp}{/Shift}')

      expect(getFocusedNodeId(container)).toBe('banana')
      expect(isSelected(container, 'banana')).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// 3. Click Interaction
// ---------------------------------------------------------------------------

describe('APG Listbox — Click Interaction', () => {
  it('clicking an option selects it', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    await user.click(getNode(container, 'banana'))

    expect(isSelected(container, 'banana')).toBe(true)
  })

  it('clicking a different option selects it (replaces selection)', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    await user.click(getNode(container, 'banana'))
    expect(isSelected(container, 'banana')).toBe(true)

    await user.click(getNode(container, 'cherry'))
    expect(isSelected(container, 'cherry')).toBe(true)
  })

  it('clicking an option moves focus to it', async () => {
    const user = userEvent.setup()
    const { container } = renderListBox(fixtureData())

    await user.click(getNode(container, 'cherry'))

    expect(getFocusedNodeId(container)).toBe('cherry')
  })
})
