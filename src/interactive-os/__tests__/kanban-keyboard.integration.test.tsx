/**
 * Integration test: Kanban keyboard interactions
 *
 * Tests column-aware navigation, selection, CRUD, DnD, and undo
 * via userEvent keyboard simulation — no engine.dispatch() calls.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Kanban } from '../ui/Kanban'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'
import { core } from '../plugins/core'
import { dnd } from '../plugins/dnd'
import { history } from '../plugins/history'
import { crud } from '../plugins/crud'
import { spatialReachable } from '../plugins/focusRecovery'

/**
 * Store structure:
 *   __root__ → [col-a, col-b, col-c]
 *   col-a → [a1, a2, a3]
 *   col-b → [b1]
 *   col-c → [c1, c2]
 */
function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      'col-a': { id: 'col-a', data: { title: 'A' } },
      'col-b': { id: 'col-b', data: { title: 'B' } },
      'col-c': { id: 'col-c', data: { title: 'C' } },
      'a1': { id: 'a1', data: { title: 'A1' } },
      'a2': { id: 'a2', data: { title: 'A2' } },
      'a3': { id: 'a3', data: { title: 'A3' } },
      'b1': { id: 'b1', data: { title: 'B1' } },
      'c1': { id: 'c1', data: { title: 'C1' } },
      'c2': { id: 'c2', data: { title: 'C2' } },
    },
    relationships: {
      [ROOT_ID]: ['col-a', 'col-b', 'col-c'],
      'col-a': ['a1', 'a2', 'a3'],
      'col-b': ['b1'],
      'col-c': ['c1', 'c2'],
    },
  })
}

function fixtureWithEmptyColumn(): NormalizedData {
  return createStore({
    entities: {
      'col-a': { id: 'col-a', data: { title: 'A' } },
      'col-empty': { id: 'col-empty', data: { title: 'Empty' } },
      'col-c': { id: 'col-c', data: { title: 'C' } },
      'a1': { id: 'a1', data: { title: 'A1' } },
      'c1': { id: 'c1', data: { title: 'C1' } },
    },
    relationships: {
      [ROOT_ID]: ['col-a', 'col-empty', 'col-c'],
      'col-a': ['a1'],
      'col-empty': [],
      'col-c': ['c1'],
    },
  })
}

const plugins = [core(), dnd(), history(), crud({ isReachable: spatialReachable })]

function renderKanban(data: NormalizedData, onChange?: (d: NormalizedData) => void) {
  return render(
    <Kanban data={data} plugins={plugins} onChange={onChange} aria-label="Board" />,
  )
}

function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"][data-node-id]')
  return focused?.getAttribute('data-node-id') ?? null
}

function getNodeElement(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getSelectedNodeIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[aria-selected="true"]'))
    .map((el) => el.getAttribute('data-node-id')!)
    .filter(Boolean)
}

function getAllCardIds(container: HTMLElement, columnIndex: number): string[] {
  const board = container.querySelector('[data-aria-container]')
  if (!board) return []
  const columnWrapper = board.children[columnIndex]
  if (!columnWrapper) return []
  // First [data-node-id] is column header, rest are cards
  return Array.from(columnWrapper.querySelectorAll('[data-node-id]'))
    .slice(1)
    .map((el) => el.getAttribute('data-node-id')!)
}

async function focusAndPress(user: ReturnType<typeof userEvent.setup>, container: HTMLElement, nodeId: string, keys: string) {
  const el = getNodeElement(container, nodeId)!
  el.focus()
  await user.keyboard(keys)
}

// ─────────────────────────────────────────────

describe('Kanban keyboard integration', () => {
  describe('vertical navigation', () => {
    it('ArrowDown moves to next card in same column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{ArrowDown}')
      expect(getFocusedNodeId(container)).toBe('a2')
    })

    it('ArrowDown at last card stays put', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a3', '{ArrowDown}')
      expect(getFocusedNodeId(container)).toBe('a3')
    })

    it('ArrowUp moves to previous card in same column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a2', '{ArrowUp}')
      expect(getFocusedNodeId(container)).toBe('a1')
    })
  })

  describe('horizontal navigation', () => {
    it('ArrowRight moves to same-index card in next column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{ArrowRight}')
      expect(getFocusedNodeId(container)).toBe('b1')
    })

    it('ArrowRight clamps to last card when target column is shorter', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a3', '{ArrowRight}')
      expect(getFocusedNodeId(container)).toBe('b1')
    })

    it('ArrowLeft moves to same-index card in previous column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'b1', '{ArrowLeft}')
      expect(getFocusedNodeId(container)).toBe('a1')
    })

    it('ArrowRight at last column stays put', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'c1', '{ArrowRight}')
      expect(getFocusedNodeId(container)).toBe('c1')
    })
  })

  describe('home/end', () => {
    it('Home focuses first card in current column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a3', '{Home}')
      expect(getFocusedNodeId(container)).toBe('a1')
    })

    it('End focuses last card in current column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{End}')
      expect(getFocusedNodeId(container)).toBe('a3')
    })

    it('Mod+Home focuses first card in first column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'c2', '{Control>}{Home}{/Control}')
      expect(getFocusedNodeId(container)).toBe('a1')
    })

    it('Mod+End focuses last card in last column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{Control>}{End}{/Control}')
      expect(getFocusedNodeId(container)).toBe('c2')
    })
  })

  describe('empty column', () => {
    it('ArrowRight into empty column focuses column header', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureWithEmptyColumn())

      await focusAndPress(user, container, 'a1', '{ArrowRight}')
      expect(getFocusedNodeId(container)).toBe('col-empty')
    })

    it('ArrowRight from empty column header reaches next column card', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureWithEmptyColumn())

      // Navigate: a1 → col-empty → c1
      await focusAndPress(user, container, 'a1', '{ArrowRight}')
      expect(getFocusedNodeId(container)).toBe('col-empty')
      await user.keyboard('{ArrowRight}')
      expect(getFocusedNodeId(container)).toBe('c1')
    })
  })

  describe('selection', () => {
    it('Space toggles selection on focused card', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{ }')
      expect(getSelectedNodeIds(container)).toContain('a1')
    })

    it('Mod+A selects all cards in current column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{Control>}a{/Control}')
      const selected = getSelectedNodeIds(container)
      expect(selected).toContain('a1')
      expect(selected).toContain('a2')
      expect(selected).toContain('a3')
    })

    it('Escape clears selection', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{ }')
      expect(getSelectedNodeIds(container)).toContain('a1')

      await user.keyboard('{Escape}')
      expect(getSelectedNodeIds(container)).toHaveLength(0)
    })
  })

  describe('crud', () => {
    it('N creates a new card after focused card', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const { container } = renderKanban(fixtureData(), onChange)

      const cardsBefore = getAllCardIds(container, 0).length
      await focusAndPress(user, container, 'a1', 'N')

      const cardsAfter = getAllCardIds(container, 0).length
      expect(cardsAfter).toBe(cardsBefore + 1)
    })

    it('Delete removes focused card', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      const cardsBefore = getAllCardIds(container, 0).length
      await focusAndPress(user, container, 'a2', '{Delete}')

      const cardsAfter = getAllCardIds(container, 0).length
      expect(cardsAfter).toBe(cardsBefore - 1)
      // a2 should no longer exist
      expect(getNodeElement(container, 'a2')).toBeNull()
    })
  })

  describe('dnd', () => {
    it('Alt+ArrowDown reorders card down within column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{Alt>}{ArrowDown}{/Alt}')
      const cards = getAllCardIds(container, 0)
      expect(cards).toEqual(['a2', 'a1', 'a3'])
    })

    it('Alt+ArrowRight moves card to next column', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a1', '{Alt>}{ArrowRight}{/Alt}')

      // a1 should now be in col-b (column index 1)
      const colBCards = getAllCardIds(container, 1)
      expect(colBCards).toContain('a1')
      // focus should follow
      expect(getFocusedNodeId(container)).toBe('a1')
    })

    it('Alt+ArrowRight then Alt+ArrowLeft is reversible', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      await focusAndPress(user, container, 'a2', '{Alt>}{ArrowRight}{/Alt}')
      expect(getAllCardIds(container, 1)).toContain('a2')

      // Re-focus the moved element (DOM element was re-rendered in new column)
      await focusAndPress(user, container, 'a2', '{Alt>}{ArrowLeft}{/Alt}')
      const colACards = getAllCardIds(container, 0)
      expect(colACards).toContain('a2')
    })
  })

  describe('history', () => {
    it('Mod+Z undoes cross-column move', async () => {
      const user = userEvent.setup()
      const { container } = renderKanban(fixtureData())

      // Move a1 to col-b
      await focusAndPress(user, container, 'a1', '{Alt>}{ArrowRight}{/Alt}')
      expect(getAllCardIds(container, 1)).toContain('a1')

      // Undo — re-focus the moved element first
      await focusAndPress(user, container, 'a1', '{Control>}z{/Control}')
      expect(getAllCardIds(container, 0)).toContain('a1')
      expect(getAllCardIds(container, 1)).not.toContain('a1')
    })
  })
})
