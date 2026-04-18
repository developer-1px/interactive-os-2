---
id: 1-projects/chat/prds/md-writer-plan
title: MD Writer Implementation Plan
created: 2026-04-04
updated: 2026-04-08
summary: '**For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.'
legacy:
  status: active
  kind: plan
  topics: [1-projects]
  relates: []
  supersedes: []
---
# MD Writer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MD 파일 기반 구조적 글쓰기 도구 — 트리로 구조 편집, viewer로 산문 프리뷰, 파일 양방향 동기화

**Architecture:** writerSchema(Zod 3종 노드) → writerTransform(MD↔NormalizedData remark 변환) → writerStore(상태) → PageWriter(TreeGrid+프리뷰 2뷰) + writerFilePlugin(Vite 미들웨어 파일 I/O). CMS 패턴(useEngine+plugins)을 그대로 따름.

**Tech Stack:** Zod, remark/unified (이미 설치됨 via react-markdown), Vite plugin middleware, TreeGrid ui component

---

## File Structure

| 파일 | 책임 |
|------|------|
| Create: `src/pages/writer/writerSchema.ts` | Zod 노드 스키마 3종 (document, heading, paragraph) + childRules |
| Create: `src/pages/writer/writerTransform.ts` | MD string ↔ NormalizedData 양방향 변환 |
| Create: `src/pages/writer/writerStore.ts` | 모듈 레벨 상태 + useSyncExternalStore hook |
| Create: `src/pages/writer/PageWriter.tsx` | 라우트 진입점 — 트리 편집 + 산문 프리뷰 |
| Create: `src/pages/writer/WriterPreview.tsx` | 산문 프리뷰 컴포넌트 (DFS → 연속 텍스트) |
| Create: `vite-plugin-writer.ts` | Vite 미들웨어 — /api/writer/list, read, write |
| Modify: `src/router.tsx` | /writer 라우트 추가 |
| Modify: `vite.config.ts` | writerPlugin() 추가 |
| Create: `src/__tests__/writer-transform.test.ts` | MD↔트리 변환 단위 테스트 |
| Create: `src/__tests__/route-writer.screen.test.tsx` | 화면 수준 통합 테스트 |

---

### Task 1: writerSchema — Zod 노드 스키마

**Files:**
- Create: `src/pages/writer/writerSchema.ts`
- Create: `src/__tests__/writer-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/writer-schema.test.ts
import { describe, it, expect } from 'vitest'
import { nodeSchemas, childRules } from '../pages/writer/writerSchema'

describe('writerSchema', () => {
  it('defines document, heading, paragraph node types', () => {
    expect(nodeSchemas.document).toBeDefined()
    expect(nodeSchemas.heading).toBeDefined()
    expect(nodeSchemas.paragraph).toBeDefined()
  })

  it('heading validates level 1-6 and content string', () => {
    const valid = nodeSchemas.heading.safeParse({ type: 'heading', level: 2, content: 'Hello' })
    expect(valid.success).toBe(true)

    const invalid = nodeSchemas.heading.safeParse({ type: 'heading', level: 7, content: 'Hello' })
    expect(invalid.success).toBe(false)
  })

  it('paragraph validates content string', () => {
    const valid = nodeSchemas.paragraph.safeParse({ type: 'paragraph', content: 'Some text' })
    expect(valid.success).toBe(true)
  })

  it('childRules allows heading and paragraph under document', () => {
    const headingData = { type: 'heading', level: 1, content: 'Title' }
    const paragraphData = { type: 'paragraph', content: 'Text' }
    expect(childRules.document.safeParse([headingData, paragraphData]).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/writer-schema.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/pages/writer/writerSchema.ts
// ② 2026-04-04-md-writer-prd.md
import { z } from 'zod'

export const nodeSchemas = {
  document: z.object({
    type: z.literal('document'),
    path: z.string().optional(),
  }),
  heading: z.object({
    type: z.literal('heading'),
    level: z.number().int().min(1).max(6),
    content: z.string().describe('Heading'),
  }),
  paragraph: z.object({
    type: z.literal('paragraph'),
    content: z.string().describe('Content'),
  }),
}

export type DocumentData = z.infer<typeof nodeSchemas.document>
export type HeadingData = z.infer<typeof nodeSchemas.heading>
export type ParagraphData = z.infer<typeof nodeSchemas.paragraph>
export type WriterNodeData = DocumentData | HeadingData | ParagraphData

export const childRules = {
  document: z.array(z.discriminatedUnion('type', [nodeSchemas.heading, nodeSchemas.paragraph])),
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/__tests__/writer-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/writer/writerSchema.ts src/__tests__/writer-schema.test.ts
git commit -m "feat: writerSchema — Zod node types for MD writer (document, heading, paragraph)"
```

---

### Task 2: writerTransform — MD ↔ NormalizedData 변환

**Files:**
- Create: `src/pages/writer/writerTransform.ts`
- Create: `src/__tests__/writer-transform.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/writer-transform.test.ts
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
    expect(children).toHaveLength(2)

    const h1 = getEntity(store, children[0])
    expect(h1?.data).toMatchObject({ type: 'heading', level: 1, content: 'Title' })

    const p = getEntity(store, children[1])
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
    expect(h1Children).toHaveLength(2) // h2 + paragraph under h2

    const h2 = getEntity(store, h1Children[0])
    expect(h2?.data).toMatchObject({ type: 'heading', level: 2, content: 'Section' })
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/__tests__/writer-transform.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// src/pages/writer/writerTransform.ts
// ② 2026-04-04-md-writer-prd.md
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import type { Root, Heading, Paragraph, Content } from 'mdast'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'

let counter = 0
function nextId() { return `w${++counter}` }

/** Reset id counter — for test isolation */
export function resetIdCounter() { counter = 0 }

/**
 * MD string → NormalizedData.
 * Heading depth determines tree nesting: h1 owns h2, h2 owns h3, etc.
 * Paragraphs attach to their nearest preceding heading (or document root).
 */
export function mdToStore(md: string, filePath?: string): NormalizedData {
  resetIdCounter()
  const tree = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).parse(md)

  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  // Extract frontmatter for round-trip preservation
  let frontmatter: string | undefined
  const contentNodes: Content[] = []
  for (const node of tree.children) {
    if (node.type === 'yaml') {
      frontmatter = (node as { value: string }).value
    } else {
      contentNodes.push(node)
    }
  }

  // Create document root
  const docId = nextId()
  entities[docId] = {
    id: docId,
    data: { type: 'document', path: filePath, frontmatter },
  }
  relationships[ROOT_ID] = [docId]
  relationships[docId] = []

  // Stack tracks the current heading ancestry: [{ id, level }]
  // Document root is level 0
  const stack: { id: string; level: number }[] = [{ id: docId, level: 0 }]

  function currentParent() { return stack[stack.length - 1] }

  function addChild(parentId: string, childId: string) {
    if (!relationships[parentId]) relationships[parentId] = []
    relationships[parentId].push(childId)
  }

  function textContent(node: Heading | Paragraph): string {
    return node.children
      .map(c => 'value' in c ? c.value : '')
      .join('')
  }

  for (const node of contentNodes) {
    if (node.type === 'heading') {
      const level = (node as Heading).depth
      const id = nextId()
      entities[id] = {
        id,
        data: { type: 'heading', level, content: textContent(node as Heading) },
      }
      relationships[id] = []

      // Pop stack until we find a parent with lower level
      while (stack.length > 1 && currentParent().level >= level) {
        stack.pop()
      }

      addChild(currentParent().id, id)
      stack.push({ id, level })

    } else if (node.type === 'paragraph') {
      const id = nextId()
      entities[id] = {
        id,
        data: { type: 'paragraph', content: textContent(node as Paragraph) },
      }

      addChild(currentParent().id, id)
    }
    // Other node types (list, code, etc.) — skip in v1
  }

  return createStore({ entities, relationships })
}

/**
 * NormalizedData → MD string.
 * DFS traversal: heading nodes emit `#` prefix, paragraphs emit text.
 */
export function storeToMd(store: NormalizedData): string {
  const lines: string[] = []

  // Find document root
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
```

- [ ] **Step 4: Install missing remark packages**

Run: `pnpm add remark-frontmatter`

Note: `unified`, `remark-parse`, `remark-stringify` are already available via react-markdown. Check if they need explicit install:
Run: `pnpm add unified remark-parse remark-stringify remark-frontmatter`

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- src/__tests__/writer-transform.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/writer/writerTransform.ts src/__tests__/writer-transform.test.ts package.json pnpm-lock.yaml
git commit -m "feat: writerTransform — MD ↔ NormalizedData bidirectional conversion"
```

---

### Task 3: writerStore — 모듈 레벨 상태

**Files:**
- Create: `src/pages/writer/writerStore.ts`

- [ ] **Step 1: Write the implementation**

Follow cmsState.ts pattern exactly:

```typescript
// src/pages/writer/writerStore.ts
// ② 2026-04-04-md-writer-prd.md
import { useSyncExternalStore } from 'react'
import type { NormalizedData } from '@os/store/types'
import { createStore } from '@os/store/createStore'

const emptyStore = createStore()

let _data: NormalizedData = emptyStore
let _filePath: string | undefined
let _dirty = false
const _listeners = new Set<() => void>()

function notify() { _listeners.forEach(fn => fn()) }

export const writerState = {
  getData: () => _data,
  setData: (next: NormalizedData) => { _data = next; _dirty = true; notify() },
  getFilePath: () => _filePath,
  setFilePath: (p: string | undefined) => { _filePath = p },
  isDirty: () => _dirty,
  markClean: () => { _dirty = false; notify() },
  subscribe: (fn: () => void) => { _listeners.add(fn); return () => { _listeners.delete(fn) } },
  reset: () => { _data = emptyStore; _filePath = undefined; _dirty = false; notify() },
}

export function useWriterData(): [NormalizedData, (d: NormalizedData) => void] {
  const data = useSyncExternalStore(writerState.subscribe, writerState.getData)
  return [data, writerState.setData]
}

export function useWriterDirty(): boolean {
  return useSyncExternalStore(writerState.subscribe, writerState.isDirty)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/writer/writerStore.ts
git commit -m "feat: writerStore — module-level state with useSyncExternalStore"
```

---

### Task 4: writerFilePlugin — Vite 미들웨어

**Files:**
- Create: `vite-plugin-writer.ts`
- Modify: `vite.config.ts`

- [ ] **Step 1: Write the Vite plugin**

Follow vite-plugin-fs.ts pattern:

```typescript
// vite-plugin-writer.ts
// ② 2026-04-04-md-writer-prd.md
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const DOCS_DIR = path.resolve(process.cwd(), 'docs')

export default function writerPlugin(): Plugin {
  return {
    name: 'writer-file-io',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        if (!url.pathname.startsWith('/api/writer/')) return next()

        // GET /api/writer/list?dir=relative/path
        if (req.method === 'GET' && url.pathname === '/api/writer/list') {
          const dir = url.searchParams.get('dir') || ''
          const targetDir = path.resolve(DOCS_DIR, dir)

          if (!targetDir.startsWith(DOCS_DIR)) {
            res.writeHead(403)
            res.end(JSON.stringify({ error: 'Path traversal denied' }))
            return
          }

          try {
            const entries = fs.readdirSync(targetDir, { withFileTypes: true })
            const files = entries
              .filter(e => e.isFile() && e.name.endsWith('.md'))
              .map(e => ({ name: e.name, path: path.join(dir, e.name) }))
            const dirs = entries
              .filter(e => e.isDirectory() && !e.name.startsWith('.'))
              .map(e => ({ name: e.name, path: path.join(dir, e.name) }))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ files, dirs }))
          } catch {
            res.writeHead(404)
            res.end(JSON.stringify({ error: 'Directory not found' }))
          }
          return
        }

        // GET /api/writer/read?file=relative/path.md
        if (req.method === 'GET' && url.pathname === '/api/writer/read') {
          const file = url.searchParams.get('file')
          if (!file) { res.writeHead(400); res.end('Missing file param'); return }

          const filePath = path.resolve(DOCS_DIR, file)
          if (!filePath.startsWith(DOCS_DIR)) {
            res.writeHead(403)
            res.end(JSON.stringify({ error: 'Path traversal denied' }))
            return
          }

          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            res.writeHead(200, { 'Content-Type': 'text/plain' })
            res.end(content)
          } catch {
            res.writeHead(404)
            res.end(JSON.stringify({ error: 'File not found' }))
          }
          return
        }

        // POST /api/writer/write { file, content }
        if (req.method === 'POST' && url.pathname === '/api/writer/write') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { file, content } = JSON.parse(body) as { file: string; content: string }
              const filePath = path.resolve(DOCS_DIR, file)
              if (!filePath.startsWith(DOCS_DIR)) {
                res.writeHead(403)
                res.end(JSON.stringify({ error: 'Path traversal denied' }))
                return
              }

              // Ensure parent directory exists
              fs.mkdirSync(path.dirname(filePath), { recursive: true })
              fs.writeFileSync(filePath, content, 'utf-8')
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.writeHead(500)
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }

        next()
      })
    },
  }
}
```

- [ ] **Step 2: Register plugin in vite.config.ts**

Add to imports:
```typescript
import writerPlugin from './vite-plugin-writer'
```

Add to plugins array:
```typescript
plugins: [
  // ... existing plugins
  writerPlugin(),
]
```

- [ ] **Step 3: Commit**

```bash
git add vite-plugin-writer.ts vite.config.ts
git commit -m "feat: writerFilePlugin — Vite middleware for MD file read/write/list"
```

---

### Task 5: PageWriter — 트리 편집 뷰 + 산문 프리뷰

**Files:**
- Create: `src/pages/writer/WriterPreview.tsx`
- Create: `src/pages/writer/PageWriter.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 1: Create WriterPreview component**

```typescript
// src/pages/writer/WriterPreview.tsx
// ② 2026-04-04-md-writer-prd.md
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { ax } from '@styles/ax'

interface WriterPreviewProps {
  data: NormalizedData
}

export default function WriterPreview({ data }: WriterPreviewProps) {
  const docIds = data.relationships[ROOT_ID] ?? []
  if (docIds.length === 0) return <div className={ax({ padding: 'lg', text: 'secondary' })}>Empty document</div>

  const docId = docIds[0]

  function renderNode(nodeId: string): React.ReactNode {
    const entity = data.entities[nodeId]
    if (!entity?.data) return null
    const d = entity.data as Record<string, unknown>

    if (d.type === 'heading') {
      const Tag = `h${d.level}` as keyof JSX.IntrinsicElements
      return (
        <Tag key={nodeId}>
          {d.content as string}
        </Tag>
      )
    }

    if (d.type === 'paragraph') {
      return <p key={nodeId}>{d.content as string}</p>
    }

    // Recurse for containers
    const children = data.relationships[nodeId] ?? []
    return children.map(childId => renderNode(childId))
  }

  const children = data.relationships[docId] ?? []

  return (
    <article className={ax({ padding: 'lg' })}>
      {children.map(childId => renderNode(childId))}
    </article>
  )
}
```

- [ ] **Step 2: Create PageWriter component**

```typescript
// src/pages/writer/PageWriter.tsx
// ② 2026-04-04-md-writer-prd.md
import { useCallback, useMemo, useState } from 'react'
import { useWriterData, useWriterDirty, writerState } from './writerStore'
import { mdToStore, storeToMd } from './writerTransform'
import WriterPreview from './WriterPreview'
import { TreeGrid } from '@os/ui/TreeGrid'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { dnd } from '@os/plugins/dnd'
import { rename } from '@os/plugins/rename'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { ax } from '@styles/ax'
import type { Plugin } from '@os/plugins/types'

const writerPlugins: Plugin[] = [
  crud(),
  dnd(),
  history(),
  rename(),
]

export default function PageWriter() {
  const [data, setData] = useWriterData()
  const dirty = useWriterDirty()
  const [view, setView] = useState<'tree' | 'preview'>('tree')

  const handleOpen = useCallback(async () => {
    const file = prompt('File path (relative to docs/):')
    if (!file) return
    try {
      const res = await fetch(`/api/writer/read?file=${encodeURIComponent(file)}`)
      if (!res.ok) throw new Error(await res.text())
      const md = await res.text()
      const store = mdToStore(md, file)
      writerState.setFilePath(file)
      setData(store)
      writerState.markClean()
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [setData])

  const handleNew = useCallback(() => {
    const store = mdToStore('')
    writerState.setFilePath(undefined)
    setData(store)
    writerState.markClean()
  }, [setData])

  const handleSave = useCallback(async () => {
    let filePath = writerState.getFilePath()
    if (!filePath) {
      const name = prompt('Save as (relative to docs/):')
      if (!name) return
      filePath = name.endsWith('.md') ? name : `${name}.md`
      writerState.setFilePath(filePath)
    }
    const md = storeToMd(data)
    try {
      const res = await fetch('/api/writer/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filePath, content: md }),
      })
      if (!res.ok) throw new Error(await res.text())
      writerState.markClean()
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }, [data])

  const writerKeyMap = useMemo(() => ({
    'Mod+S': (e?: Event) => {
      e?.preventDefault?.()
      handleSave()
      return { type: 'writer:save' } as const
    },
  }), [handleSave])

  return (
    <AriaRoute keyMap={writerKeyMap} label="Writer">
      <div className={ax({ layout: 'stack', gap: 'none', flex: 1 })}>
        {/* Toolbar */}
        <div className={ax({ layout: 'bar', gap: 'sm', padding: 'sm', surface: 'raised' })}>
          <button onClick={handleNew} className={ax({ controlSize: 'sm', surface: 'ghost' })}>New</button>
          <button onClick={handleOpen} className={ax({ controlSize: 'sm', surface: 'ghost' })}>Open</button>
          <button onClick={handleSave} disabled={!dirty} className={ax({ controlSize: 'sm', surface: 'ghost' })}>
            Save{dirty ? ' *' : ''}
          </button>
          <div className={ax({ flex: 1 })} />
          <button
            onClick={() => setView(v => v === 'tree' ? 'preview' : 'tree')}
            className={ax({ controlSize: 'sm', surface: 'ghost' })}
          >
            {view === 'tree' ? 'Preview' : 'Edit'}
          </button>
        </div>

        {/* Content */}
        {view === 'tree' ? (
          <div className={ax({ flex: 1, overflow: 'auto' })}>
            <TreeGrid
              data={data}
              plugins={writerPlugins}
              onChange={setData}
              enableEditing
              aria-label="Document structure"
            />
          </div>
        ) : (
          <div className={ax({ flex: 1, overflow: 'auto' })}>
            <WriterPreview data={data} />
          </div>
        )}
      </div>
    </AriaRoute>
  )
}
```

- [ ] **Step 3: Add route to router.tsx**

Add after the existing routes (before the catch-all):
```typescript
{ path: '/writer', lazy: () => import('./pages/writer/PageWriter').then(m => ({ Component: m.default })) },
```

- [ ] **Step 4: Verify dev server runs**

Run: `pnpm dev`
Navigate to `http://localhost:5173/writer`
Expected: Page renders with toolbar (New, Open, Save, Preview buttons)

- [ ] **Step 5: Commit**

```bash
git add src/pages/writer/WriterPreview.tsx src/pages/writer/PageWriter.tsx src/router.tsx
git commit -m "feat: PageWriter — tree editing view + prose preview + file I/O"
```

---

### Task 6: Screen test — 화면 통합 테스트

**Files:**
- Create: `src/__tests__/route-writer.screen.test.tsx`

- [ ] **Step 1: Write screen test**

```typescript
// src/__tests__/route-writer.screen.test.tsx
// V2: 2026-04-04-md-writer-prd.md
// V4: 2026-04-04-md-writer-prd.md
// V8: 2026-04-04-md-writer-prd.md
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageWriter from '../pages/writer/PageWriter'
import { writerState } from '../pages/writer/writerStore'
import { mdToStore } from '../pages/writer/writerTransform'

describe('PageWriter screen', () => {
  beforeEach(() => {
    writerState.reset()
  })

  it('renders empty state with toolbar', () => {
    render(<PageWriter />)
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })

  it('loads MD and displays tree structure', () => {
    const store = mdToStore('# Title\n\nParagraph text.\n')
    writerState.setData(store)

    render(<PageWriter />)
    // TreeGrid should show the heading node
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('toggles between tree and preview', async () => {
    const store = mdToStore('# Hello\n\nWorld.\n')
    writerState.setData(store)

    render(<PageWriter />)
    const user = userEvent.setup()

    // Initially in tree view
    expect(screen.getByText('Preview')).toBeInTheDocument()

    // Switch to preview
    await user.click(screen.getByText('Preview'))
    expect(screen.getByText('Edit')).toBeInTheDocument()
    // Preview should render heading as h1
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Hello')

    // Switch back to tree
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `pnpm test -- src/__tests__/route-writer.screen.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/route-writer.screen.test.tsx
git commit -m "test: PageWriter screen tests — empty state, tree load, view toggle"
```

#kind/plan #topic/chat
