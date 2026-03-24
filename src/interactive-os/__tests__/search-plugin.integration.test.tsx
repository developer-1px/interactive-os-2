// ② 2026-03-25-search-plugin-prd.md
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { createCommandEngine } from '../engine/createCommandEngine'
import { core } from '../plugins/core'
import { search, searchCommands, SEARCH_ID, matchesSearchFilter } from '../plugins/search'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/listbox'
import type { NormalizedData } from '../store/types'

function fixtureStore() {
  return createStore({
    entities: {
      'node-1': { id: 'node-1', data: { name: 'Hero Section', description: 'Main landing area' } },
      'node-2': { id: 'node-2', data: { name: 'Footer', description: 'Bottom area' } },
      'node-3': { id: 'node-3', data: { cells: ['apple', 'banana', 'cherry'] } },
    },
    relationships: { [ROOT_ID]: ['node-1', 'node-2', 'node-3'] },
  })
}

function createEngine(store = fixtureStore()) {
  const corePlugin = core()
  const searchPlugin = search()
  const middlewares = [corePlugin, searchPlugin]
    .map((p) => p.middleware)
    .filter((m): m is NonNullable<typeof m> => m != null)
  return createCommandEngine(store, middlewares, () => {}, { logger: false })
}

// ── searchCommands unit tests ─────────────────────────────────────────────

describe('searchCommands.setFilter', () => {
  // V1: 2026-03-25-search-plugin-prd.md
  it('sets filterText and active=true', () => {
    const engine = createEngine()
    engine.dispatch(searchCommands.setFilter('hero'))
    const searchEntity = engine.getStore().entities[SEARCH_ID]
    expect(searchEntity?.filterText).toBe('hero')
    expect(searchEntity?.active).toBe(true)
  })

  // V2: 2026-03-25-search-plugin-prd.md
  it('updates filterText on subsequent calls', () => {
    const engine = createEngine()
    engine.dispatch(searchCommands.setFilter('hero'))
    engine.dispatch(searchCommands.setFilter('footer'))
    const searchEntity = engine.getStore().entities[SEARCH_ID]
    expect(searchEntity?.filterText).toBe('footer')
    expect(searchEntity?.active).toBe(true)
  })
})

describe('searchCommands.clearFilter', () => {
  // V3: 2026-03-25-search-plugin-prd.md
  it('sets filterText="" and active=false', () => {
    const engine = createEngine()
    engine.dispatch(searchCommands.setFilter('hero'))
    engine.dispatch(searchCommands.clearFilter())
    const searchEntity = engine.getStore().entities[SEARCH_ID]
    expect(searchEntity?.filterText).toBe('')
    expect(searchEntity?.active).toBe(false)
  })
})

describe('searchCommands.activateSearch', () => {
  // V4: 2026-03-25-search-plugin-prd.md
  it('sets active=true with empty filterText when no prior filter', () => {
    const engine = createEngine()
    engine.dispatch(searchCommands.activateSearch())
    const searchEntity = engine.getStore().entities[SEARCH_ID]
    expect(searchEntity?.active).toBe(true)
    expect(searchEntity?.filterText).toBe('')
  })

  // V5: 2026-03-25-search-plugin-prd.md
  it('preserves existing filterText when already set', () => {
    const engine = createEngine()
    engine.dispatch(searchCommands.setFilter('hero'))
    engine.dispatch(searchCommands.activateSearch())
    const searchEntity = engine.getStore().entities[SEARCH_ID]
    expect(searchEntity?.active).toBe(true)
    expect(searchEntity?.filterText).toBe('hero')
  })
})

// ── matchesSearchFilter unit tests ───────────────────────────────────────

describe('matchesSearchFilter', () => {
  // V6: 2026-03-25-search-plugin-prd.md
  it('returns true when filterText is empty string', () => {
    const entity = { id: 'node-1', data: { name: 'Hero' } }
    expect(matchesSearchFilter(entity, '')).toBe(true)
  })

  // V7: 2026-03-25-search-plugin-prd.md
  it('returns false for undefined entity', () => {
    expect(matchesSearchFilter(undefined, 'hero')).toBe(false)
  })

  // V8: 2026-03-25-search-plugin-prd.md
  it('returns true when filterText matches a string field value', () => {
    const entity = { id: 'node-1', data: { name: 'Hero Section' } }
    expect(matchesSearchFilter(entity, 'hero')).toBe(true)
  })

  // V9: 2026-03-25-search-plugin-prd.md
  it('returns false when filterText does not match any field', () => {
    const entity = { id: 'node-2', data: { name: 'Footer', description: 'Bottom area' } }
    expect(matchesSearchFilter(entity, 'hero')).toBe(false)
  })

  // V10: 2026-03-25-search-plugin-prd.md
  it('is case-insensitive', () => {
    const entity = { id: 'node-1', data: { name: 'Hero Section' } }
    expect(matchesSearchFilter(entity, 'HERO')).toBe(true)
    expect(matchesSearchFilter(entity, 'Hero')).toBe(true)
    expect(matchesSearchFilter(entity, 'section')).toBe(true)
  })

  // V11: 2026-03-25-search-plugin-prd.md
  it('matches inside array values (e.g., cells field)', () => {
    const entity = { id: 'node-3', data: { cells: ['apple', 'banana', 'cherry'] } }
    expect(matchesSearchFilter(entity, 'banana')).toBe(true)
    expect(matchesSearchFilter(entity, 'grape')).toBe(false)
  })

  // V12: 2026-03-25-search-plugin-prd.md
  it('returns false for entity with no data field', () => {
    const entity = { id: 'meta-entity' }
    expect(matchesSearchFilter(entity, 'anything')).toBe(false)
  })
})

// ── integration tests ─────────────────────────────────────────────────────

function fixtureData() {
  return createStore({
    entities: {
      'item-hero': { id: 'item-hero', data: { label: 'Hero Section' } },
      'item-about': { id: 'item-about', data: { label: 'About Page' } },
      'item-hero-sub': { id: 'item-hero-sub', data: { label: 'Hero Subtitle' } },
    },
    relationships: { [ROOT_ID]: ['item-hero', 'item-about', 'item-hero-sub'] },
  })
}

function SearchableList() {
  const [data, setData] = useState<NormalizedData>(fixtureData())
  return (
    <Aria behavior={listbox()} data={data} plugins={[core(), search()]} onChange={setData} aria-label="Test">
      <Aria.Search placeholder="Search..." />
      <Aria.Item render={(props, node) => (
        <div {...props} data-testid={`item-${(node.data as { label?: string })?.label}`}>
          <Aria.SearchHighlight>
            <span>{(node.data as { label?: string })?.label as string}</span>
          </Aria.SearchHighlight>
        </div>
      )} />
    </Aria>
  )
}

function focusFirstOption() {
  const option = document.querySelector<HTMLElement>('[role="option"]')
  option?.focus()
}

describe('Aria.Search integration', () => {
  // V1: Ctrl+F on collection → search input gets focus
  it('Ctrl+F on collection → search input focused', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    expect(document.activeElement).toBe(input)
  })

  // V2: type "hero" → only Hero Section and Hero Subtitle visible (2 items), About Page hidden
  it('typing "hero" filters to matching items only', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    await act(async () => { fireEvent.change(input, { target: { value: 'hero' } }) })
    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(2)
    expect(screen.queryByTestId('item-About Page')).toBeNull()
  })

  // V3: Escape from search input → filter cleared, all 3 items visible, collection has focus
  it('Escape from search input → clears filter and focuses collection', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    await act(async () => { fireEvent.change(input, { target: { value: 'hero' } }) })
    await user.keyboard('{Escape}')
    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(3)
    // After escape, focus should be on a collection item (not the search input)
    expect(document.activeElement).not.toBe(screen.getByPlaceholderText('Search...'))
  })

  // V4: type "hero" → <mark> elements contain "Hero" text
  it('typing "hero" highlights matching text with <mark>', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    await act(async () => { fireEvent.change(input, { target: { value: 'hero' } }) })
    const marks = document.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThan(0)
    for (const mark of marks) {
      expect(mark.textContent?.toLowerCase()).toContain('hero')
    }
  })

  // V5: type "hero" → ArrowDown navigates within filtered items only
  it('ArrowDown navigates only within filtered items', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    await act(async () => { fireEvent.change(input, { target: { value: 'hero' } }) })
    // Press Enter to move focus to collection, then navigate
    await user.keyboard('{Enter}')
    const focused = document.activeElement
    expect(focused?.getAttribute('role')).toBe('option')
    // Navigate down — should still be within hero items
    await user.keyboard('{ArrowDown}')
    const newFocused = document.activeElement
    const label = newFocused?.textContent ?? ''
    expect(label.toLowerCase()).toContain('hero')
  })

  // V6: type "hero" then clear input → all 3 items visible
  it('clearing the search input shows all items', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    await act(async () => { fireEvent.change(input, { target: { value: 'hero' } }) })
    await act(async () => { fireEvent.change(input, { target: { value: '' } }) })
    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(3)
  })

  // V8: type "zzz" → 0 items visible
  it('no matching query shows 0 items', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    await act(async () => { fireEvent.change(input, { target: { value: 'zzz' } }) })
    const items = screen.queryAllByRole('option')
    expect(items).toHaveLength(0)
  })

  // V10: no filterText → no <mark> elements
  it('no filterText → no mark elements', () => {
    render(<SearchableList />)
    const marks = document.querySelectorAll('mark')
    expect(marks).toHaveLength(0)
  })

  // V11: type "HERO" (uppercase) → matches Hero Section (case-insensitive)
  it('uppercase query matches case-insensitively', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    const input = screen.getByPlaceholderText('Search...')
    await act(async () => { fireEvent.change(input, { target: { value: 'HERO' } }) })
    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(2)
  })

  // Enter from search input → collection first item gets focus
  it('Enter from search input → first collection item focused', async () => {
    const user = userEvent.setup()
    render(<SearchableList />)
    focusFirstOption()
    await user.keyboard('{Control>}f{/Control}')
    await user.keyboard('{Enter}')
    const focused = document.activeElement
    expect(focused?.getAttribute('role')).toBe('option')
  })
})
