// ② 2026-04-04-md-writer-prd.md
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'

let counter = 0
function nextId() { return `w${++counter}` }

/** Reset id counter — for test isolation */
export function resetIdCounter() { counter = 0 }

interface ParsedBlock {
  type: 'heading' | 'paragraph'
  level?: number
  content: string
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/

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

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraphLines.join('\n') })
      paragraphLines = []
    }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(HEADING_RE)

    if (headingMatch) {
      flushParagraph()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      })
    } else if (line.trim() === '') {
      flushParagraph()
    } else {
      paragraphLines.push(line)
    }
  }
  flushParagraph()

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
        data: { type: 'heading' as const, level, content: block.content },
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
        data: { type: 'paragraph' as const, content: block.content },
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
      lines.push(data.content as string)
      lines.push('')
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
