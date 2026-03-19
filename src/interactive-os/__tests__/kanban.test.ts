import { describe, it, expect, vi } from 'vitest'
import { createStore } from '../core/createStore'
import { createCommandEngine } from '../core/createCommandEngine'
import type { Plugin, Middleware } from '../core/types'
import { ROOT_ID } from '../core/types'
import { core, focusCommands, expandCommands, FOCUS_ID, SELECTION_ID } from '../plugins/core'
import { dnd } from '../plugins/dnd'
import { history } from '../plugins/history'
import { kanban } from '../behaviors/kanban'
import { createBehaviorContext } from '../behaviors/createBehaviorContext'

function extractMiddlewares(plugins: Plugin[]): Middleware[] {
  return plugins.map((p) => p.middleware).filter(Boolean) as Middleware[]
}

/**
 * Store structure:
 *   __root__ → [col-a, col-b, col-c]
 *   col-a → [a1, a2, a3]
 *   col-b → [b1]
 *   col-c → [c1, c2]
 */
function setup(focusedId = 'a1') {
  const store = createStore({
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

  const onChange = vi.fn()
  const plugins = [core(), dnd(), history()]
  const engine = createCommandEngine(store, extractMiddlewares(plugins), onChange)
  // Pre-expand all columns so cards are visible
  engine.dispatch(expandCommands.expand('col-a'))
  engine.dispatch(expandCommands.expand('col-b'))
  engine.dispatch(expandCommands.expand('col-c'))
  engine.dispatch(focusCommands.setFocus(focusedId))
  return { engine, onChange }
}

function getFocused(engine: ReturnType<typeof createCommandEngine>): string {
  return (engine.getStore().entities[FOCUS_ID]?.focusedId as string) ?? ''
}

function getSelected(engine: ReturnType<typeof createCommandEngine>): string[] {
  return (engine.getStore().entities[SELECTION_ID]?.selectedIds as string[]) ?? []
}

function pressKey(engine: ReturnType<typeof createCommandEngine>, key: string) {
  const ctx = createBehaviorContext(engine)
  const handler = kanban.keyMap[key]
  if (!handler) return
  const cmd = handler(ctx)
  if (cmd) engine.dispatch(cmd)
}

// ─────────────────────────────────────────────
// Task 2: Navigation Tests
// ─────────────────────────────────────────────

describe('kanban behavior — vertical navigation', () => {
  it('ArrowDown moves to next card in same column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowDown')
    expect(getFocused(engine)).toBe('a2')
  })

  it('ArrowDown at last card in column stays put', () => {
    const { engine } = setup('a3')
    pressKey(engine, 'ArrowDown')
    expect(getFocused(engine)).toBe('a3')
  })

  it('ArrowUp moves to previous card in same column', () => {
    const { engine } = setup('a2')
    pressKey(engine, 'ArrowUp')
    expect(getFocused(engine)).toBe('a1')
  })

  it('ArrowUp at first card in column stays put', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowUp')
    expect(getFocused(engine)).toBe('a1')
  })
})

describe('kanban behavior — horizontal navigation', () => {
  it('ArrowRight moves to same-index card in next column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('b1') // index 0 in col-b
  })

  it('ArrowRight clamps to last card when target column is shorter', () => {
    const { engine } = setup('a3')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('b1') // col-b has only 1 card, clamp to last
  })

  it('ArrowLeft moves to same-index card in previous column', () => {
    const { engine } = setup('b1')
    pressKey(engine, 'ArrowLeft')
    expect(getFocused(engine)).toBe('a1') // index 0 in col-a
  })

  it('ArrowRight at last column stays put', () => {
    const { engine } = setup('c1')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('c1')
  })

  it('ArrowLeft at first column stays put', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'ArrowLeft')
    expect(getFocused(engine)).toBe('a1')
  })
})

describe('kanban behavior — empty column', () => {
  function setupWithEmpty(focusedId = 'a1') {
    const store = createStore({
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
    const onChange = vi.fn()
    const plugins = [core(), dnd(), history()]
    const engine = createCommandEngine(store, extractMiddlewares(plugins), onChange)
    engine.dispatch(expandCommands.expand('col-a'))
    engine.dispatch(expandCommands.expand('col-empty'))
    engine.dispatch(expandCommands.expand('col-c'))
    engine.dispatch(focusCommands.setFocus(focusedId))
    return { engine, onChange }
  }

  it('ArrowRight into empty column focuses column header', () => {
    const { engine } = setupWithEmpty('a1')
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('col-empty')
  })

  it('ArrowRight from empty column header focuses card in next column', () => {
    const { engine } = setupWithEmpty('a1')
    engine.dispatch(focusCommands.setFocus('col-empty'))
    pressKey(engine, 'ArrowRight')
    expect(getFocused(engine)).toBe('c1')
  })
})

describe('kanban behavior — column header navigation', () => {
  it('ArrowDown from column header focuses first card', () => {
    const { engine } = setup('a1')
    engine.dispatch(focusCommands.setFocus('col-a'))
    pressKey(engine, 'ArrowDown')
    expect(getFocused(engine)).toBe('a1')
  })
})

describe('kanban behavior — Home/End', () => {
  it('Home focuses first card in current column', () => {
    const { engine } = setup('a3')
    pressKey(engine, 'Home')
    expect(getFocused(engine)).toBe('a1')
  })

  it('End focuses last card in current column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'End')
    expect(getFocused(engine)).toBe('a3')
  })

  it('Mod+Home focuses first card in first column', () => {
    const { engine } = setup('c2')
    pressKey(engine, 'Mod+Home')
    expect(getFocused(engine)).toBe('a1')
  })

  it('Mod+End focuses last card in last column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Mod+End')
    expect(getFocused(engine)).toBe('c2')
  })
})

// ─────────────────────────────────────────────
// Task 3: Cross-Column Move + CRUD Tests
// ─────────────────────────────────────────────

describe('kanban behavior — cross-column move', () => {
  it('Alt+ArrowRight moves card to next column at same index', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Alt+ArrowRight')
    // card a1 should now be in col-b at index 0
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards[0]).toBe('a1')
    expect(getFocused(engine)).toBe('a1') // focus follows
  })

  it('Alt+ArrowLeft moves card to previous column at same index', () => {
    const { engine } = setup('b1')
    pressKey(engine, 'Alt+ArrowLeft')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards[0]).toBe('b1') // inserted at index 0
    expect(getFocused(engine)).toBe('b1')
  })

  it('Alt+ArrowRight at last column does nothing', () => {
    const { engine } = setup('c1')
    const storeBefore = engine.getStore()
    pressKey(engine, 'Alt+ArrowRight')
    expect(engine.getStore().relationships).toEqual(storeBefore.relationships)
  })

  it('Alt+ArrowRight preserves index (reversible motion)', () => {
    const { engine } = setup('a2') // index 1 in col-a
    pressKey(engine, 'Alt+ArrowRight') // move to col-b at index 1
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards[1]).toBe('a2')
    // Move back
    pressKey(engine, 'Alt+ArrowLeft')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards[1]).toBe('a2') // back at original index
  })

  it('Alt+ArrowRight clamps index when target column is shorter', () => {
    const { engine } = setup('a3') // index 2 in col-a (3 cards)
    pressKey(engine, 'Alt+ArrowRight') // col-b has 1 card, clamp to end
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards).toContain('a3')
    expect(colBCards.indexOf('a3')).toBe(colBCards.length - 1) // at end
  })
})

describe('kanban behavior — within-column reorder', () => {
  it('Alt+ArrowDown reorders card down within column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Alt+ArrowDown')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards).toEqual(['a2', 'a1', 'a3'])
  })

  it('Alt+ArrowUp reorders card up within column', () => {
    const { engine } = setup('a2')
    pressKey(engine, 'Alt+ArrowUp')
    const colACards = engine.getStore().relationships['col-a'] ?? []
    expect(colACards).toEqual(['a2', 'a1', 'a3'])
  })
})

describe('kanban behavior — batch move', () => {
  it('Alt+ArrowRight moves all selected cards to next column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Space') // select a1
    engine.dispatch(focusCommands.setFocus('a2'))
    pressKey(engine, 'Space') // select a2
    pressKey(engine, 'Alt+ArrowRight')
    const colBCards = engine.getStore().relationships['col-b'] ?? []
    expect(colBCards).toContain('a1')
    expect(colBCards).toContain('a2')
  })
})

describe('kanban behavior — selection', () => {
  it('Mod+A selects all cards in current column', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Mod+A')
    const selected = getSelected(engine)
    expect(selected).toEqual(['a1', 'a2', 'a3'])
  })

  it('Escape clears selection', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Space') // select a1
    pressKey(engine, 'Escape')
    const selected = getSelected(engine)
    expect(selected).toEqual([])
  })
})

describe('kanban behavior — create card', () => {
  it('N creates new card after focused card', () => {
    const { engine } = setup('a1')
    const cardsBefore = engine.getStore().relationships['col-a']?.length ?? 0
    pressKey(engine, 'N')
    const cardsAfter = engine.getStore().relationships['col-a']?.length ?? 0
    expect(cardsAfter).toBe(cardsBefore + 1)
  })

  it('N on column header creates first card in empty column', () => {
    const store = createStore({
      entities: {
        'col-a': { id: 'col-a', data: { title: 'A' } },
        'col-empty': { id: 'col-empty', data: { title: 'Empty' } },
        'a1': { id: 'a1', data: { title: 'A1' } },
      },
      relationships: {
        [ROOT_ID]: ['col-a', 'col-empty'],
        'col-a': ['a1'],
        'col-empty': [],
      },
    })
    const plugins = [core(), dnd(), history()]
    const engine = createCommandEngine(store, extractMiddlewares(plugins), vi.fn())
    engine.dispatch(expandCommands.expand('col-a'))
    engine.dispatch(expandCommands.expand('col-empty'))
    engine.dispatch(focusCommands.setFocus('col-empty'))
    pressKey(engine, 'N')
    const emptyCards = engine.getStore().relationships['col-empty'] ?? []
    expect(emptyCards.length).toBe(1)
  })
})

describe('kanban behavior — undo cross-column move', () => {
  it('Mod+Z undoes cross-column move', () => {
    const { engine } = setup('a1')
    pressKey(engine, 'Alt+ArrowRight') // move a1 to col-b
    expect(engine.getStore().relationships['col-b']).toContain('a1')

    pressKey(engine, 'Mod+Z')
    expect(engine.getStore().relationships['col-a']).toContain('a1')
    expect(engine.getStore().relationships['col-b']).not.toContain('a1')
  })
})
