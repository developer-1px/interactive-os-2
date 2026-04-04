// ② 2026-04-04-writer-chat-prd.md
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'

let counter = 0
function nextId() { return `w${++counter}` }

/** Reset id counter — for test isolation */
export function resetIdCounter() { counter = 0 }

interface ParsedBlock {
  type: 'heading' | 'paragraph' | 'list' | 'hr'
  level?: number
  content: string
  line: number
  ordered?: boolean
  items?: { content: string; line: number }[]
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/
const UL_RE = /^[-*+]\s+(.+)$/
const OL_RE = /^\d+\.\s+(.+)$/
const HR_RE = /^(---+|\*\*\*+|___+)\s*$/

/** Split text into sentences. Handles Korean (마침표) and English (period + space). */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end
  const parts = text.split(/(?<=[.!?。])\s+/)
  return parts.filter(s => s.length > 0)
}

/** Simple MD parser: extracts headings (# lines) and paragraphs (non-empty text blocks). */
function parseMd(md: string): { frontmatter?: string; blocks: ParsedBlock[] } {
  const lines = md.split('\n')
  let frontmatter: string | undefined
  let startIdx = 0

  // Extract YAML frontmatter
  if (lines[0]?.trim() === '---') {
    const endIdx = lines.indexOf('---', 1)
    if (endIdx > 0) {
      frontmatter = lines.slice(1, endIdx).join('\n')
      startIdx = endIdx + 1
    }
  }

  const blocks: ParsedBlock[] = []
  let paragraphLines: string[] = []
  let paragraphStart = -1
  let listItems: { content: string; line: number }[] = []
  let listOrdered = false
  let listStart = -1

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraphLines.join('\n'), line: paragraphStart + 1 })
      paragraphLines = []
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', content: '', ordered: listOrdered, items: [...listItems], line: listStart + 1 })
      listItems = []
    }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(HEADING_RE)
    const ulMatch = line.match(UL_RE)
    const olMatch = line.match(OL_RE)
    const hrMatch = line.match(HR_RE)

    if (hrMatch) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'hr', content: '', line: i + 1 })
    } else if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
        line: i + 1,
      })
    } else if (ulMatch || olMatch) {
      flushParagraph()
      const isOrdered = !!olMatch
      const content = ulMatch ? ulMatch[1] : olMatch![1]
      if (listItems.length > 0 && listOrdered !== isOrdered) {
        flushList()
      }
      if (listItems.length === 0) {
        listStart = i
        listOrdered = isOrdered
      }
      listItems.push({ content, line: i + 1 })
    } else if (line.trim() === '') {
      flushParagraph()
      flushList()
    } else {
      flushList()
      if (paragraphLines.length === 0) paragraphStart = i
      paragraphLines.push(line)
    }
  }
  flushParagraph()
  flushList()

  return { frontmatter, blocks }
}

/**
 * MD string → NormalizedData.
 * Heading depth determines tree nesting: h1 owns h2, h2 owns h3, etc.
 * Paragraphs attach to their nearest preceding heading (or document root).
 */
export function mdToStore(md: string, filePath?: string): NormalizedData {
  resetIdCounter()
  const { frontmatter, blocks } = parseMd(md)

  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  // Create document root
  const docId = nextId()
  entities[docId] = {
    id: docId,
    data: { type: 'document' as const, path: filePath, frontmatter },
  }
  relationships[ROOT_ID] = [docId]
  relationships[docId] = []

  // Stack tracks the current heading ancestry: [{ id, level }]
  const stack: { id: string; level: number }[] = [{ id: docId, level: 0 }]

  function currentParent() { return stack[stack.length - 1] }

  function addChild(parentId: string, childId: string) {
    if (!relationships[parentId]) relationships[parentId] = []
    relationships[parentId].push(childId)
  }

  for (const block of blocks) {
    if (block.type === 'heading') {
      const level = block.level!
      const id = nextId()
      entities[id] = {
        id,
        data: { type: 'heading' as const, level, content: block.content, line: block.line },
      }
      relationships[id] = []

      // Pop stack until we find a parent with lower level
      while (stack.length > 1 && currentParent().level >= level) {
        stack.pop()
      }

      addChild(currentParent().id, id)
      stack.push({ id, level })

    } else if (block.type === 'paragraph') {
      const id = nextId()
      entities[id] = {
        id,
        data: { type: 'paragraph' as const, line: block.line },
      }
      relationships[id] = []
      addChild(currentParent().id, id)

      const sentences = splitSentences(block.content)
      for (const s of sentences) {
        const sid = nextId()
        entities[sid] = { id: sid, data: { type: 'sentence' as const, content: s } }
        addChild(id, sid)
      }
    } else if (block.type === 'list') {
      const id = nextId()
      entities[id] = {
        id,
        data: { type: 'list' as const, ordered: !!block.ordered, line: block.line },
      }
      relationships[id] = []
      addChild(currentParent().id, id)

      for (const item of block.items ?? []) {
        const itemId = nextId()
        entities[itemId] = {
          id: itemId,
          data: { type: 'listItem' as const, content: item.content, line: item.line },
        }
        addChild(id, itemId)
      }
    } else if (block.type === 'hr') {
      const id = nextId()
      entities[id] = {
        id,
        data: { type: 'hr' as const, line: block.line },
      }
      addChild(currentParent().id, id)
    }
  }

  return createStore({ entities, relationships })
}

/**
 * NormalizedData → MD string.
 * DFS traversal: heading nodes emit `#` prefix, paragraphs emit text.
 */
export function storeToMd(store: NormalizedData): string {
  const lines: string[] = []

  const docIds = store.relationships[ROOT_ID] ?? []
  if (docIds.length === 0) return ''
  const docId = docIds[0]
  const docData = store.entities[docId]?.data as Record<string, unknown> | undefined

  // Restore frontmatter
  if (docData?.frontmatter) {
    lines.push(`---\n${docData.frontmatter}\n---`)
    lines.push('')
  }

  function walk(nodeId: string) {
    const entity = store.entities[nodeId]
    if (!entity?.data) return

    const data = entity.data as Record<string, unknown>

    if (data.type === 'heading') {
      const prefix = '#'.repeat(data.level as number)
      lines.push(`${prefix} ${data.content}`)
      lines.push('')
    } else if (data.type === 'paragraph') {
      const children = store.relationships[nodeId] ?? []
      const parts = children.map(cid => {
        const child = store.entities[cid]?.data as Record<string, unknown> | undefined
        return (child?.type === 'sentence' ? child.content as string : '')
      }).filter(Boolean)
      lines.push(parts.join(' '))
      lines.push('')
      return
    } else if (data.type === 'list') {
      const children = store.relationships[nodeId] ?? []
      const ordered = data.ordered as boolean
      children.forEach((cid, idx) => {
        const child = store.entities[cid]?.data as Record<string, unknown> | undefined
        if (child?.type === 'listItem') {
          const prefix = ordered ? `${idx + 1}. ` : '- '
          lines.push(`${prefix}${child.content}`)
        }
      })
      lines.push('')
      return
    } else if (data.type === 'hr') {
      lines.push('---')
      lines.push('')
      return
    }

    const children = store.relationships[nodeId] ?? []
    for (const childId of children) {
      walk(childId)
    }
  }

  const docChildren = store.relationships[docId] ?? []
  for (const childId of docChildren) {
    walk(childId)
  }

  return lines.join('\n')
}