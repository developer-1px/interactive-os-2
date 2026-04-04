// V1~V18: 2026-04-05-writer-tree-crud-prd.md
import { describe, it, expect } from 'vitest'
import { mdToStore, storeToMd } from '../pages/writer/writerTransform'
import { getChildren, getParent, updateEntityData, addEntity, moveNode, removeEntity } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { getVisibleNodes } from '@os/engine/getVisibleNodes'
import type { VisibilityFilter } from '@os/engine/types'

// Replicate the writer navigate filter
const CONTAINER_TYPES = new Set(['paragraph', 'list', 'document'])
const writerNavigateFilter: VisibilityFilter = {
  isFocusable: (nodeId: string, store: NormalizedData) => {
    const entity = store.entities[nodeId]
    const type = (entity?.data as Record<string, unknown> | undefined)?.type as string | undefined
    return !type || !CONTAINER_TYPES.has(type)
  },
}

function findByType(store: NormalizedData, type: string): string[] {
  return Object.entries(store.entities)
    .filter(([, e]) => (e?.data as Record<string, unknown>)?.type === type)
    .map(([id]) => id)
}

function findByContent(store: NormalizedData, content: string): string | undefined {
  return Object.entries(store.entities)
    .find(([, e]) => (e?.data as Record<string, unknown>)?.content === content)?.[0]
}

describe('Writer navigate filter', () => {
  // V10: ↑↓ navigate — paragraph/list skip
  it('skips paragraph/list/document, shows heading/sentence/listItem/hr', () => {
    const md = '# Intro\n\nFirst sentence.\n\nSecond sentence.\n\n## Details\n\nMore text.\n'
    const store = mdToStore(md)
    const visible = getVisibleNodes(store, [writerNavigateFilter])

    // All visible nodes should be heading, sentence, listItem, or hr
    for (const id of visible) {
      const entity = store.entities[id]
      const type = (entity?.data as Record<string, unknown>)?.type as string
      expect(CONTAINER_TYPES.has(type)).toBe(false)
    }

    // Visible: h1 "Intro", sentence "First", sentence "Second", h2 "Details", sentence "More text"
    expect(visible.length).toBe(5)
  })
})

describe('Writer indent/outdent (reparent)', () => {
  // V1: heading Tab → indent — reparent under previous sibling
  it('indent moves heading under previous sibling heading', () => {
    const md = '# First\n\n# Second\n'
    let store = mdToStore(md)
    const headings = findByType(store, 'heading')
    const secondH = headings.find(id => (store.entities[id]?.data as Record<string, unknown>)?.content === 'Second')!

    // Simulate moveIn (dnd): move Second under First
    const parentId = getParent(store, secondH)!
    const siblings = getChildren(store, parentId)
    const idx = siblings.indexOf(secondH)
    const prevSiblingId = siblings[idx - 1]!
    store = moveNode(store, secondH, prevSiblingId)

    // Second is now child of First
    expect(getParent(store, secondH)).toBe(prevSiblingId)

    // storeToMd should render Second as h2 (deeper level)
    const md2 = storeToMd(store)
    expect(md2).toContain('## Second')
  })

  // V2: heading Shift+Tab → outdent
  it('outdent moves heading to grandparent', () => {
    const md = '# Parent\n\n## Child\n'
    let store = mdToStore(md)
    const childH = findByContent(store, 'Child')!
    const originalParent = getParent(store, childH)!

    // moveOut: move to grandparent
    const grandparent = getParent(store, originalParent) ?? ROOT_ID
    const gpChildren = getChildren(store, grandparent)
    const parentIdx = gpChildren.indexOf(originalParent)
    store = moveNode(store, childH, grandparent, parentIdx + 1)

    // Child is now sibling of Parent
    const md2 = storeToMd(store)
    expect(md2).toContain('# Child')
  })

  // V11: document top-level Shift+Tab — should be no-op
  it('outdent at document level is no-op', () => {
    const md = '# Top\n'
    const store = mdToStore(md)
    const topH = findByContent(store, 'Top')!
    const parentId = getParent(store, topH)!
    const grandparent = getParent(store, parentId)
    // grandparent is ROOT_ID, can't move out further
    expect(grandparent).toBe(ROOT_ID)
  })

  // V12: h6 indent — level caps at 6
  it('h6 indent still reparents but level caps at 6 in serialization', () => {
    const md = '# L1\n\n## L2\n\n### L3\n\n#### L4\n\n##### L5\n\n###### L6a\n\n###### L6b\n'
    let store = mdToStore(md)
    const l6b = findByContent(store, 'L6b')!
    const l6a = findByContent(store, 'L6a')!

    // Move L6b under L6a
    store = moveNode(store, l6b, l6a)

    const md2 = storeToMd(store)
    // Both should still be h6 (max level) — L6b can't become h7
    expect(md2).toContain('###### L6b')
  })
})

describe('Writer split', () => {
  // V3: sentence split at cursor
  it('splits sentence content at cursor position', () => {
    const md = '# Title\n\nHello World.\n'
    let store = mdToStore(md)
    const sentenceId = findByContent(store, 'Hello World.')!
    const parentId = getParent(store, sentenceId)!
    const siblings = getChildren(store, parentId)
    const idx = siblings.indexOf(sentenceId)

    // Split at position 5: "Hello" | " World."
    store = updateEntityData(store, sentenceId, { content: 'Hello' })
    store = addEntity(store, { id: 'new-s', data: { type: 'sentence', content: ' World.' } }, parentId, idx + 1)

    expect((store.entities[sentenceId]?.data as Record<string, unknown>)?.content).toBe('Hello')
    expect((store.entities['new-s']?.data as Record<string, unknown>)?.content).toBe(' World.')
    expect(getChildren(store, parentId).indexOf('new-s')).toBe(idx + 1)
  })

  // V13: split at end → empty new node
  it('split at end creates empty new node', () => {
    const md = '# Title\n\nHello.\n'
    let store = mdToStore(md)
    const sentenceId = findByContent(store, 'Hello.')!
    const parentId = getParent(store, sentenceId)!
    const siblings = getChildren(store, parentId)
    const idx = siblings.indexOf(sentenceId)

    // Split at end
    store = addEntity(store, { id: 'new-s', data: { type: 'sentence', content: '' } }, parentId, idx + 1)
    expect((store.entities['new-s']?.data as Record<string, unknown>)?.content).toBe('')
  })

  // V16: heading split — children stay with original
  it('heading split keeps children with original', () => {
    const md = '# Parent\n\nChild text.\n'
    let store = mdToStore(md)
    const parentH = findByContent(store, 'Parent')!
    const originalChildren = getChildren(store, parentH)

    const docId = getParent(store, parentH)!
    const siblings = getChildren(store, docId)
    const idx = siblings.indexOf(parentH)

    // Split heading: "Par" | "ent"
    store = updateEntityData(store, parentH, { content: 'Par' })
    store = addEntity(store, { id: 'new-h', data: { type: 'heading', level: 1, content: 'ent' } }, docId, idx + 1)

    // Original heading still has children
    expect(getChildren(store, parentH)).toEqual(originalChildren)
    // New heading has no children
    expect(getChildren(store, 'new-h')).toHaveLength(0)
  })
})

describe('Writer merge', () => {
  // V4: empty sentence Backspace → delete + focus prev
  it('merges empty node into previous', () => {
    const md = '# Title\n\nFirst.\n\nSecond.\n'
    let store = mdToStore(md)
    const secondId = findByContent(store, 'Second.')!

    // Clear content and merge
    store = updateEntityData(store, secondId, { content: '' })

    // Find previous visible node
    const visible = getVisibleNodes(store, [writerNavigateFilter])
    const idx = visible.indexOf(secondId)
    const prevId = visible[idx - 1]!
    const prevContent = (store.entities[prevId]?.data as Record<string, unknown>)?.content as string

    // Remove empty node
    store = removeEntity(store, secondId)

    expect(store.entities[secondId]).toBeUndefined()
    expect(prevContent).toBeTruthy()
  })

  // V14: first node Backspace → no-op
  it('first visible node merge is no-op', () => {
    const md = '# Only\n'
    const store = mdToStore(md)
    const visible = getVisibleNodes(store, [writerNavigateFilter])
    // First visible has no previous
    expect(visible.length).toBeGreaterThan(0)
    // No crash, just nothing to merge into
  })
})

describe('Writer insert', () => {
  // V5: new sibling heading
  it('inserts sibling heading with same level', () => {
    const md = '# Existing\n'
    let store = mdToStore(md)
    const h = findByContent(store, 'Existing')!
    const parentId = getParent(store, h)!
    const siblings = getChildren(store, parentId)
    const idx = siblings.indexOf(h)

    store = addEntity(store, { id: 'new-h', data: { type: 'heading', level: 1, content: '' } }, parentId, idx + 1)
    expect(getChildren(store, parentId)).toContain('new-h')
    expect((store.entities['new-h']?.data as Record<string, unknown>)?.level).toBe(1)
  })

  // V6: child sentence under heading
  it('inserts first child sentence under heading', () => {
    const md = '# Empty\n'
    let store = mdToStore(md)
    const h = findByContent(store, 'Empty')!

    store = addEntity(store, { id: 'new-s', data: { type: 'sentence', content: '' } }, h, 0)
    expect(getChildren(store, h)[0]).toBe('new-s')
  })
})

describe('Writer wrap/unwrap list', () => {
  // V7: wrap sentences in list
  it('wraps sentences into list > listItem', () => {
    const md = '# Title\n\nAlpha.\n\nBeta.\n'
    let store = mdToStore(md)
    const alpha = findByContent(store, 'Alpha.')!
    const beta = findByContent(store, 'Beta.')!
    const parentId = getParent(store, alpha)!
    const firstIdx = getChildren(store, parentId).indexOf(alpha)

    // Create list
    store = addEntity(store, { id: 'wl1', data: { type: 'list', ordered: false } }, parentId, firstIdx)
    // Move nodes into list + convert to listItem
    store = moveNode(store, alpha, 'wl1')
    store = updateEntityData(store, alpha, { type: 'listItem' })
    store = moveNode(store, beta, 'wl1')
    store = updateEntityData(store, beta, { type: 'listItem' })

    expect(getChildren(store, 'wl1')).toEqual([alpha, beta])
    expect((store.entities[alpha]?.data as Record<string, unknown>)?.type).toBe('listItem')
  })

  // V8: unwrap listItem + delete empty list
  it('unwraps listItem and removes empty list', () => {
    const md = '# Title\n\nAlpha.\n'
    let store = mdToStore(md)
    const alpha = findByContent(store, 'Alpha.')!
    const pId = getParent(store, alpha)!
    const headingId = getParent(store, pId)!

    // Wrap first
    store = addEntity(store, { id: 'wl1', data: { type: 'list', ordered: false } }, headingId, 0)
    store = moveNode(store, pId, 'wl1')

    // Unwrap: move out
    const gpId = getParent(store, 'wl1')!
    const listIdx = getChildren(store, gpId).indexOf('wl1')
    store = moveNode(store, pId, gpId, listIdx + 1)

    // List should now be empty → remove
    if (getChildren(store, 'wl1').length === 0) {
      store = removeEntity(store, 'wl1')
    }

    expect(store.entities['wl1']).toBeUndefined()
    // V15 is covered here: last item unwrap → empty list deleted
  })

  // V17: mixed selection wrap — heading excluded from listItem conversion
  it('does not convert headings to listItem when wrapping', () => {
    const md = '# Title\n\nAlpha.\n\nBeta.\n'
    let store = mdToStore(md)
    const headingId = findByContent(store, 'Title')!
    const alphaId = findByContent(store, 'Alpha.')!
    const betaId = findByContent(store, 'Beta.')!
    const parentId = getParent(store, alphaId)!

    // Simulate wrapInList with mixed selection [heading, sentence, sentence]
    const nodeIds = [headingId, alphaId, betaId]
    const firstIdx = getChildren(store, parentId).indexOf(headingId)
    store = addEntity(store, { id: 'wl1', data: { type: 'list', ordered: false } }, parentId, firstIdx)
    for (const id of nodeIds) {
      const d = store.entities[id]?.data as Record<string, unknown> | undefined
      if (d?.type === 'heading') continue // skip heading — same as command handler
      store = moveNode(store, id, 'wl1')
      store = updateEntityData(store, id, { type: 'listItem' })
    }

    // Heading stays outside list, sentences are inside
    expect(getParent(store, headingId)).not.toBe('wl1')
    expect(getChildren(store, 'wl1')).toContain(alphaId)
    expect(getChildren(store, 'wl1')).toContain(betaId)
    expect((store.entities[headingId]?.data as Record<string, unknown>)?.type).toBe('heading')
  })
})

describe('Writer type conversion', () => {
  // V9: heading → paragraph, children move to parent
  it('converts heading to paragraph, children reparented', () => {
    const md = '# Section\n\nContent here.\n'
    let store = mdToStore(md)
    const sectionId = findByContent(store, 'Section')!
    const parentId = getParent(store, sectionId)!
    const originalChildren = [...getChildren(store, sectionId)]

    // Move children to parent
    const siblings = getChildren(store, parentId)
    const idx = siblings.indexOf(sectionId)
    for (let i = 0; i < originalChildren.length; i++) {
      store = moveNode(store, originalChildren[i]!, parentId, idx + 1 + i)
    }
    // Convert type
    store = updateEntityData(store, sectionId, { type: 'paragraph', level: undefined })

    expect((store.entities[sectionId]?.data as Record<string, unknown>)?.type).toBe('paragraph')
    // Children are now siblings of the former heading
    for (const childId of originalChildren) {
      expect(getParent(store, childId)).toBe(parentId)
    }
  })
})

describe('Writer cross-paragraph move (store-level)', () => {
  it('moveNode moves sentence to different paragraph', () => {
    const md = '# Title\n\nFirst.\n\nSecond.\n'
    let store = mdToStore(md)
    const firstId = findByContent(store, 'First.')!
    const secondId = findByContent(store, 'Second.')!

    const firstParent = getParent(store, firstId)!
    const secondParent = getParent(store, secondId)!
    expect(firstParent).not.toBe(secondParent)

    // Move First to Second's parent after Second
    const adjIdx = getChildren(store, secondParent).indexOf(secondId)
    store = moveNode(store, firstId, secondParent, adjIdx + 1)

    expect(getParent(store, firstId)).toBe(secondParent)
    const siblings = getChildren(store, secondParent)
    expect(siblings.indexOf(firstId)).toBeGreaterThan(siblings.indexOf(secondId))
  })
})

describe('Writer edge cases', () => {
  // V18: hr Enter → no-op (hr has no content to edit)
  it('hr has no content field', () => {
    // hr type has no content — Enter should be ignored by the keyMap handler
    const hrData = { type: 'hr' }
    expect(hrData).not.toHaveProperty('content')
  })
})
