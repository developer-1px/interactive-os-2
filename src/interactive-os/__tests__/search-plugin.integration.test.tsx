// ② 2026-03-25-search-plugin-prd.md
import { describe, it, expect } from 'vitest'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import { createCommandEngine } from '../engine/createCommandEngine'
import { core } from '../plugins/core'
import { search, searchCommands, SEARCH_ID, matchesSearchFilter } from '../plugins/search'

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
