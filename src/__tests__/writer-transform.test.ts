import { describe, it, expect } from 'vitest'
import { mdToStore, storeToMd } from '../pages/writer/writerTransform'
import { getChildren, getEntity } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

describe('mdToStore', () => {
  it('parses heading + paragraph into tree', () => {
    const md = '# Title\n\nSome paragraph text.\n'
    const store = mdToStore(md)

    const docIds = getChildren(store, ROOT_ID)
    expect(docIds).toHaveLength(1)
    const docId = docIds[0]
    const doc = getEntity(store, docId)
    expect(doc?.data?.type).toBe('document')

    const children = getChildren(store, docId)
    expect(children).toHaveLength(1) // h1 only at doc level

    const h1Id = children[0]
    const h1 = getEntity(store, h1Id)
    expect(h1?.data).toMatchObject({ type: 'heading', level: 1, content: 'Title' })

    // paragraph is child of h1 (heading owns following content)
    const h1Children = getChildren(store, h1Id)
    expect(h1Children).toHaveLength(1)
    const p = getEntity(store, h1Children[0])
    expect(p?.data).toMatchObject({ type: 'paragraph', content: 'Some paragraph text.' })
  })

  it('nests headings by level', () => {
    const md = '# Chapter\n\n## Section\n\nText here.\n'
    const store = mdToStore(md)

    const docId = getChildren(store, ROOT_ID)[0]
    const topChildren = getChildren(store, docId)
    expect(topChildren).toHaveLength(1) // only h1

    const h1Id = topChildren[0]
    const h1Children = getChildren(store, h1Id)
    expect(h1Children).toHaveLength(1) // h2

    const h2Id = h1Children[0]
    const h2 = getEntity(store, h2Id)
    expect(h2?.data).toMatchObject({ type: 'heading', level: 2, content: 'Section' })

    const h2Children = getChildren(store, h2Id)
    expect(h2Children).toHaveLength(1) // paragraph under h2
  })

  it('handles empty markdown', () => {
    const store = mdToStore('')
    const docIds = getChildren(store, ROOT_ID)
    expect(docIds).toHaveLength(1)
    const children = getChildren(store, docIds[0])
    expect(children).toHaveLength(0)
  })

  it('preserves frontmatter round-trip', () => {
    const md = '---\ntitle: Hello\n---\n\n# Title\n\nContent.\n'
    const store = mdToStore(md)
    const result = storeToMd(store)
    expect(result).toContain('---\ntitle: Hello\n---')
    expect(result).toContain('# Title')
  })
})

describe('storeToMd', () => {
  it('serializes tree back to markdown', () => {
    const md = '# Title\n\nSome text.\n\n## Subtitle\n\nMore text.\n'
    const store = mdToStore(md)
    const result = storeToMd(store)
    expect(result).toContain('# Title')
    expect(result).toContain('Some text.')
    expect(result).toContain('## Subtitle')
    expect(result).toContain('More text.')
  })

  it('round-trips heading levels', () => {
    const md = '# H1\n\n## H2\n\n### H3\n\nParagraph.\n'
    const store = mdToStore(md)
    const result = storeToMd(store)
    expect(result).toContain('# H1')
    expect(result).toContain('## H2')
    expect(result).toContain('### H3')
    expect(result).toContain('Paragraph.')
  })
})
