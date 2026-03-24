import { describe, it, expect } from 'vitest'
import { ROOT_ID } from '../interactive-os/store/types'
import { collectSections } from '../pages/cms/collectSections'
import { getRootAncestor, getTabItemAncestor } from '../pages/cms/collectSections'
import type { NormalizedData } from '../interactive-os/store/types'

function makeStore(entities: Record<string, { type: string }>, relationships: Record<string, string[]>): NormalizedData {
  const ents: NormalizedData['entities'] = {}
  for (const [id, data] of Object.entries(entities)) {
    ents[id] = { id, data }
  }
  return { entities: ents, relationships }
}

describe('collectSections', () => {
  it('collects root-level sections in order', () => {
    const store = makeStore(
      { a: { type: 'section' }, b: { type: 'section' } },
      { [ROOT_ID]: ['a', 'b'] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['a', 'b'])
  })

  it('collects sections inside tab-group (DFS through tab-item → tab-panel)', () => {
    const store = makeStore(
      {
        s1: { type: 'section' },
        tg: { type: 'tab-group' },
        t1: { type: 'tab-item' },
        p1: { type: 'tab-panel' },
        ts1: { type: 'section' },
        t2: { type: 'tab-item' },
        p2: { type: 'tab-panel' },
        ts2: { type: 'section' },
        s2: { type: 'section' },
      },
      {
        [ROOT_ID]: ['s1', 'tg', 's2'],
        tg: ['t1', 't2'],
        t1: ['p1'], p1: ['ts1'],
        t2: ['p2'], p2: ['ts2'],
      },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['s1', 'ts1', 'ts2', 's2'])
  })

  it('returns same as getChildren when no containers exist', () => {
    const store = makeStore(
      { a: { type: 'section' }, b: { type: 'section' }, c: { type: 'section' } },
      { [ROOT_ID]: ['a', 'b', 'c'] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['a', 'b', 'c'])
  })

  it('handles empty tab-panel (no sections inside)', () => {
    const store = makeStore(
      { tg: { type: 'tab-group' }, t1: { type: 'tab-item' }, p1: { type: 'tab-panel' } },
      { [ROOT_ID]: ['tg'], tg: ['t1'], t1: ['p1'], p1: [] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual([])
  })

  it('handles nested containers (future-proofing)', () => {
    const store = makeStore(
      {
        outer: { type: 'accordion' },
        inner: { type: 'accordion-panel' },
        s1: { type: 'section' },
      },
      { [ROOT_ID]: ['outer'], outer: ['inner'], inner: ['s1'] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['s1'])
  })
})

describe('getRootAncestor', () => {
  it('returns self for root-level section', () => {
    const store = makeStore(
      { s1: { type: 'section' } },
      { [ROOT_ID]: ['s1'] },
    )
    expect(getRootAncestor(store, 's1')).toBe('s1')
  })

  it('returns tab-group for section inside tab', () => {
    const store = makeStore(
      {
        tg: { type: 'tab-group' },
        t1: { type: 'tab-item' },
        p1: { type: 'tab-panel' },
        s1: { type: 'section' },
      },
      { [ROOT_ID]: ['tg'], tg: ['t1'], t1: ['p1'], p1: ['s1'] },
    )
    expect(getRootAncestor(store, 's1')).toBe('tg')
  })
})

describe('getTabItemAncestor', () => {
  it('returns tab-item ancestor for section inside tab', () => {
    const store = makeStore(
      {
        tg: { type: 'tab-group' },
        t1: { type: 'tab-item' },
        p1: { type: 'tab-panel' },
        s1: { type: 'section' },
      },
      { [ROOT_ID]: ['tg'], tg: ['t1'], t1: ['p1'], p1: ['s1'] },
    )
    expect(getTabItemAncestor(store, 's1')).toBe('t1')
  })

  it('returns undefined for root-level section', () => {
    const store = makeStore(
      { s1: { type: 'section' } },
      { [ROOT_ID]: ['s1'] },
    )
    expect(getTabItemAncestor(store, 's1')).toBeUndefined()
  })
})
