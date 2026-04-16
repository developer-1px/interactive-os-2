import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { FOCUS_ID } from '@os/core'
import { SELECTION_ID } from '@os/axis/select'
import type { NormalizedData } from '@os/store/types'

// ── Content loading ──

export interface MetaEntry {
  label: string
  description?: string
  order: string[]
}

const metaModules = import.meta.glob<{ default: string }>('/contents/**/_meta.yaml', {
  query: '?raw',
  eager: true,
})

const mdModules = import.meta.glob<{ default: string }>('/contents/**/*.md', {
  query: '?raw',
  eager: true,
})

const docModules = import.meta.glob<{ default: string }>('/docs/**/*.md', {
  query: '?raw',
  eager: true,
})

function parseMeta(raw: string): MetaEntry {
  const lines = raw.split('\n')
  let label = ''
  let description = ''
  const order: string[] = []
  let inOrder = false

  for (const line of lines) {
    if (line.startsWith('label:')) {
      label = line.slice(6).trim()
    } else if (line.startsWith('description:')) {
      description = line.slice(12).trim()
    } else if (line.match(/^order:\s*$/)) {
      inOrder = true
    } else if (line.match(/^order:\s*\[/)) {
      const items = line.slice(line.indexOf('[') + 1, line.lastIndexOf(']'))
      order.push(...items.split(',').map(s => s.trim()).filter(Boolean))
    } else if (inOrder) {
      const m = line.match(/^\s+-\s+(.+)/)
      if (m) order.push(m[1].trim())
      else if (!line.match(/^\s*$/) && !line.startsWith('#')) inOrder = false
    }
  }

  return { label, description, order }
}

// ── Book structure ──

export interface BookPage {
  id: string
  title: string
  chapter: string
  chapterIndex: number
  pageIndex: number
  content: string
  depth: number
}

export interface Chapter {
  id: string
  label: string
  pages: BookPage[]
}

export function buildBook(): { chapters: Chapter[]; pages: BookPage[] } {
  const rootMeta = metaModules['/contents/_meta.yaml']
  if (!rootMeta) return { chapters: [], pages: [] }

  const rootOrder = parseMeta(rootMeta.default).order
  const chapters: Chapter[] = []
  const allPages: BookPage[] = []

  for (const section of rootOrder) {
    const introPath = `/contents/${section}.md`
    const introMod = mdModules[introPath]
    const metaPath = `/contents/${section}/_meta.yaml`
    const metaMod = metaModules[metaPath]

    const chapterIndex = chapters.length
    const chapterLabel = metaMod
      ? parseMeta(metaMod.default).label
      : section.charAt(0).toUpperCase() + section.slice(1)

    const chapterPages: BookPage[] = []

    if (introMod) {
      chapterPages.push({
        id: `${section}`,
        title: chapterLabel,
        chapter: chapterLabel,
        chapterIndex,
        pageIndex: allPages.length + chapterPages.length,
        content: introMod.default,
        depth: 0,
      })
    }

    if (metaMod) {
      const meta = parseMeta(metaMod.default)
      for (const sub of meta.order) {
        const mdPath = `/contents/${section}/${sub}.md`
        const md = mdModules[mdPath]
        if (md) {
          chapterPages.push({
            id: `${section}/${sub}`,
            title: sub,
            chapter: chapterLabel,
            chapterIndex,
            pageIndex: allPages.length + chapterPages.length,
            content: md.default,
            depth: 1,
          })
        }
      }
    }

    if (chapterPages.length > 0) {
      chapters.push({ id: section, label: chapterLabel, pages: chapterPages })
      allPages.push(...chapterPages)
    }
  }

  // ── docs/ chapters (no _meta.yaml — directory-based) ──
  const DOCS_ORDER = ['0-inbox', '1-projects', '2-areas', '3-resources', '4-archive', '5-backlogs']
  const DOCS_LABELS: Record<string, string> = {
    '0-inbox': 'Inbox',
    '1-projects': 'Projects',
    '2-areas': 'Areas',
    '3-resources': 'Resources',
    '4-archive': 'Archive',
    '5-backlogs': 'Backlogs',
  }

  // Collect root-level docs
  const rootDocs: string[] = []
  for (const path of Object.keys(docModules).sort()) {
    const rel = path.replace('/docs/', '')
    if (!rel.includes('/')) rootDocs.push(path)
  }
  if (rootDocs.length > 0) {
    const chapterIndex = chapters.length
    const chapterPages: BookPage[] = []
    for (const fullPath of rootDocs) {
      const filename = fullPath.replace('/docs/', '').replace('.md', '')
      chapterPages.push({
        id: `docs/${filename}`,
        title: filename,
        chapter: 'Docs',
        chapterIndex,
        pageIndex: allPages.length + chapterPages.length,
        content: docModules[fullPath].default,
        depth: 0,
      })
    }
    chapters.push({ id: 'docs', label: 'Docs', pages: chapterPages })
    allPages.push(...chapterPages)
  }

  // Collect docs subdirectories
  for (const dir of DOCS_ORDER) {
    const prefix = `/docs/${dir}/`
    const files = Object.keys(docModules)
      .filter(p => p.startsWith(prefix))
      .sort()
    if (files.length === 0) continue

    const chapterIndex = chapters.length
    const chapterLabel = DOCS_LABELS[dir] ?? dir
    const chapterPages: BookPage[] = []

    for (const fullPath of files) {
      const rel = fullPath.slice(prefix.length).replace('.md', '')
      const title = rel.split('/').pop() ?? rel
      chapterPages.push({
        id: `docs/${dir}/${rel}`,
        title,
        chapter: chapterLabel,
        chapterIndex,
        pageIndex: allPages.length + chapterPages.length,
        content: docModules[fullPath].default,
        depth: rel.includes('/') ? 1 : 0,
      })
    }

    chapters.push({ id: `docs/${dir}`, label: chapterLabel, pages: chapterPages })
    allPages.push(...chapterPages)
  }

  return { chapters, pages: allPages }
}

// ── TOC store builder ──

export function buildTocStore(chapters: Chapter[], currentPageId: string): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const chapter of chapters) {
    const groupId = `group:${chapter.id}`
    entities[groupId] = { id: groupId, data: { label: chapter.label, type: 'group' } }
    relationships[ROOT_ID].push(groupId)

    const childIds: string[] = []
    for (const page of chapter.pages) {
      entities[page.id] = {
        id: page.id,
        data: { label: page.title, pageIndex: page.pageIndex, depth: page.depth },
      }
      childIds.push(page.id)
    }
    relationships[groupId] = childIds
  }

  entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: currentPageId } as never
  entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: [currentPageId] } as never

  return createStore({ entities, relationships })
}
