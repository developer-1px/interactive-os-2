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

    // paragraph is child of h1, sentence is child of paragraph
    const h1Children = getChildren(store, h1Id)
    expect(h1Children).toHaveLength(1)
    const p = getEntity(store, h1Children[0])
    expect(p?.data).toMatchObject({ type: 'paragraph' })

    const sentences = getChildren(store, h1Children[0])
    expect(sentences).toHaveLength(1)
    const s = getEntity(store, sentences[0])
    expect(s?.data).toMatchObject({ type: 'sentence', content: 'Some paragraph text.' })
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

describe('mdToStore — lists', () => {
  it('parses unordered list', () => {
    const store = mdToStore('# Title\n\n- Alpha\n- Beta\n')
    const docId = getChildren(store, ROOT_ID)[0]
    const h1Id = getChildren(store, docId)[0]
    const h1Children = getChildren(store, h1Id)
    expect(h1Children).toHaveLength(1)
    const list = getEntity(store, h1Children[0])
    expect(list?.data).toMatchObject({ type: 'list', ordered: false })
    const items = getChildren(store, h1Children[0])
    expect(items).toHaveLength(2)
    expect(getEntity(store, items[0])?.data).toMatchObject({ type: 'listItem', content: 'Alpha' })
    expect(getEntity(store, items[1])?.data).toMatchObject({ type: 'listItem', content: 'Beta' })
  })

  it('parses ordered list', () => {
    const store = mdToStore('1. First\n2. Second\n')
    const docId = getChildren(store, ROOT_ID)[0]
    const children = getChildren(store, docId)
    expect(children).toHaveLength(1)
    const list = getEntity(store, children[0])
    expect(list?.data).toMatchObject({ type: 'list', ordered: true })
  })

  it('parses horizontal rule', () => {
    const store = mdToStore('# Title\n\n---\n\nText.\n')
    const docId = getChildren(store, ROOT_ID)[0]
    const h1Id = getChildren(store, docId)[0]
    const h1Children = getChildren(store, h1Id)
    expect(h1Children).toHaveLength(2)
    expect(getEntity(store, h1Children[0])?.data).toMatchObject({ type: 'hr' })
    expect(getEntity(store, h1Children[1])?.data).toMatchObject({ type: 'paragraph' })
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

  it('round-trips unordered list', () => {
    const md = '- Alpha\n- Beta\n'
    const store = mdToStore(md)
    const result = storeToMd(store)
    expect(result).toContain('- Alpha')
    expect(result).toContain('- Beta')
  })

  it('round-trips ordered list', () => {
    const md = '1. First\n2. Second\n'
    const store = mdToStore(md)
    const result = storeToMd(store)
    expect(result).toContain('1. First')
    expect(result).toContain('2. Second')
  })

  it('round-trips horizontal rule', () => {
    const md = '# Title\n\n---\n\nText.\n'
    const store = mdToStore(md)
    const result = storeToMd(store)
    expect(result).toContain('---')
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
