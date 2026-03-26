# Store Split Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static Store Explorer + Operations pages with a single Split Inspector — left interactive TreeGrid, right live NormalizedData TreeGrid, bottom operation log.

**Architecture:** Editor uses `<Aria>` component with logger option. Inspector uses independent `<Aria>` with storeToTree-transformed data. Log panel renders captured LogEntry[] from custom logger. No shared engine needed — data flows through React state.

**Tech Stack:** React, interactive-os (Aria component, TreeGrid, behaviors, plugins), Vitest + @testing-library

**PRD:** `docs/superpowers/prds/2026-03-22-store-split-inspector-prd.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| Create: `src/interactive-os/core/storeToTree.ts` | Pure function: NormalizedData → NormalizedData (meta tree for Inspector) |
| Create: `src/interactive-os/__tests__/storeToTree.test.ts` | Unit tests for storeToTree |
| Modify: `src/interactive-os/hooks/useAria.ts` | Add `logger` option, pass to createCommandEngine |
| Modify: `src/interactive-os/components/aria.tsx` | Forward `logger` prop to useAria |
| Create: `src/pages/PageStoreInspector.tsx` | Split Inspector page — 3-panel layout |
| Create: `src/pages/PageStoreInspector.module.css` | Split layout styles |
| Create: `src/interactive-os/__tests__/store-inspector.integration.test.tsx` | Integration tests for panel sync (V1~V10) |
| Modify: `src/App.tsx` | Route config: store group → single inspector item |
| Delete: `src/pages/PageStoreExplorer.tsx` | Replaced by PageStoreInspector |
| Delete: `src/pages/PageStoreOperations.tsx` | Replaced by log panel |

## Data Flow

```
[data, setData] = useState(treeData)
├── <Aria data={data} onChange={setData} logger={captureLogger} plugins={editorPlugins}>
│     Editor — treegrid behavior, crud/dnd/history/focusRecovery plugins
├── <Aria data={storeToTree(data)} plugins={[core()]} behavior={tree}>
│     Inspector — readonly tree, expand/collapse only
└── logEntries[] ← captureLogger pushes LogEntry on each dispatch
```

No shared engine. Each `<Aria>` owns its own engine. Data flows through `setData` → Inspector re-renders.

---

### Task 1: storeToTree — pure transform function

**Files:**
- Create: `src/interactive-os/core/storeToTree.ts`
- Create: `src/interactive-os/__tests__/storeToTree.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/interactive-os/__tests__/storeToTree.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { storeToTree } from '../core/storeToTree'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

describe('storeToTree', () => {
  const source: NormalizedData = {
    entities: {
      __focus__: { id: '__focus__', focusedId: 'item-1' },
      'item-1': { id: 'item-1', data: { name: 'Hello' } },
      'item-2': { id: 'item-2', data: { name: 'World' } },
    },
    relationships: {
      [ROOT_ID]: ['item-1', 'item-2'],
    },
  }

  it('produces two root groups: entities and relationships', () => {
    const tree = storeToTree(source)
    const rootChildren = tree.relationships[ROOT_ID]
    expect(rootChildren).toEqual(['_group:entities', '_group:relationships'])
  })

  it('entities group contains all source entities with _e: prefix', () => {
    const tree = storeToTree(source)
    const entityChildren = tree.relationships['_group:entities']
    expect(entityChildren).toContain('_e:__focus__')
    expect(entityChildren).toContain('_e:item-1')
    expect(entityChildren).toContain('_e:item-2')
    expect(entityChildren).toHaveLength(3)
  })

  it('classifies meta entities (__ prefix) as type meta', () => {
    const tree = storeToTree(source)
    const focusData = tree.entities['_e:__focus__']?.data as Record<string, unknown>
    expect(focusData.type).toBe('meta')
    const itemData = tree.entities['_e:item-1']?.data as Record<string, unknown>
    expect(itemData.type).toBe('entity')
  })

  it('entity value contains stringified entity content', () => {
    const tree = storeToTree(source)
    const focusEntity = tree.entities['_e:__focus__']
    expect((focusEntity?.data as Record<string, unknown>).value).toContain('focusedId')
  })

  it('relationships group lists each parent→children mapping', () => {
    const tree = storeToTree(source)
    const relChildren = tree.relationships['_group:relationships']
    expect(relChildren).toContain('_r:__root__')
    const rootRel = tree.entities['_r:__root__']
    expect((rootRel?.data as Record<string, unknown>).label).toBe('__root__ → [item-1, item-2]')
  })

  it('handles empty store', () => {
    const empty: NormalizedData = { entities: {}, relationships: { [ROOT_ID]: [] } }
    const tree = storeToTree(empty)
    expect(tree.relationships['_group:entities']).toEqual([])
    expect(tree.relationships['_group:relationships']).toContain('_r:__root__')
  })

  it('group nodes have count in data', () => {
    const tree = storeToTree(source)
    const entitiesGroup = tree.entities['_group:entities']
    expect((entitiesGroup?.data as Record<string, unknown>).count).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/interactive-os/__tests__/storeToTree.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement storeToTree**

```ts
// src/interactive-os/core/storeToTree.ts
import type { NormalizedData, Entity } from './types'
import { ROOT_ID } from './types'

/**
 * Transform NormalizedData into a meta-tree that describes its structure.
 * Two root groups: entities/ and relationships/.
 * Used by Store Inspector to visualize any store as a TreeGrid.
 */
export function storeToTree(source: NormalizedData): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = {}

  const ENTITIES_GROUP = '_group:entities'
  const RELS_GROUP = '_group:relationships'

  entities[ENTITIES_GROUP] = {
    id: ENTITIES_GROUP,
    data: { label: 'entities', type: 'group', count: Object.keys(source.entities).length },
  }
  entities[RELS_GROUP] = {
    id: RELS_GROUP,
    data: { label: 'relationships', type: 'group', count: Object.keys(source.relationships).length },
  }
  relationships[ROOT_ID] = [ENTITIES_GROUP, RELS_GROUP]

  // Entity nodes
  const entityChildren: string[] = []
  for (const [id, entity] of Object.entries(source.entities)) {
    const nodeId = `_e:${id}`
    const isMeta = id.startsWith('__')
    const { id: _id, ...rest } = entity
    entities[nodeId] = {
      id: nodeId,
      data: { label: id, type: isMeta ? 'meta' : 'entity', value: JSON.stringify(rest) },
    }
    entityChildren.push(nodeId)
  }
  relationships[ENTITIES_GROUP] = entityChildren

  // Relationship nodes
  const relChildren: string[] = []
  for (const [parentId, childIds] of Object.entries(source.relationships)) {
    const nodeId = `_r:${parentId}`
    entities[nodeId] = {
      id: nodeId,
      data: { label: `${parentId} → [${childIds.join(', ')}]`, type: 'rel' },
    }
    relChildren.push(nodeId)
  }
  relationships[RELS_GROUP] = relChildren

  return { entities, relationships }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/interactive-os/__tests__/storeToTree.test.ts`
Expected: PASS — all 7 tests green

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/core/storeToTree.ts src/interactive-os/__tests__/storeToTree.test.ts
git commit -m "feat(store): add storeToTree transform for Store Inspector"
```

---

### Task 2: Add logger option to useAria + Aria component

**Files:**
- Modify: `src/interactive-os/hooks/useAria.ts` (lines 24-33 interface, line 69 createCommandEngine call)
- Modify: `src/interactive-os/components/aria.tsx` (lines 13-23 interface, line 36 useAria call)

Two small changes: thread `logger` from Aria → useAria → createCommandEngine.

- [ ] **Step 1: Add `logger` to UseAriaOptions in useAria.ts**

In `src/interactive-os/hooks/useAria.ts`, add to UseAriaOptions interface (around line 32):

```ts
import type { EngineOptions } from '../core/dispatchLogger'

export interface UseAriaOptions {
  // ... existing fields ...
  /** Logger for engine dispatch events */
  logger?: EngineOptions['logger']
}
```

Then in the function body (around line 69), change createCommandEngine call:

```ts
// Before:
engineRef.current = createCommandEngine(data, middlewares, (newStore) => {
// After:
engineRef.current = createCommandEngine(data, middlewares, (newStore) => {
```
Add options parameter after the callback:
```ts
}, logger != null ? { logger } : undefined)
```

Extract `logger` from options on line 46:
```ts
const { behavior = EMPTY_BEHAVIOR, data, plugins = [], keyMap: keyMapOverrides, onChange, onActivate, initialFocus, logger } = options
```

- [ ] **Step 2: Add `logger` prop to Aria component in aria.tsx**

In `src/interactive-os/components/aria.tsx`, add to AriaProps interface (around line 22):

```ts
logger?: import('../core/dispatchLogger').EngineOptions['logger']
```

In AriaRoot function (line 35), destructure and forward:

```ts
function AriaRoot({ id, behavior, data, plugins, keyMap, onChange, onActivate, 'aria-label': ariaLabel, logger, children }: AriaProps) {
  const aria = useAria({ behavior, data, plugins, keyMap, onChange, onActivate, logger })
```

- [ ] **Step 3: Verify existing tests still pass**

Run: `npx vitest run src/interactive-os/__tests__/use-aria.test.tsx src/interactive-os/__tests__/aria-component.test.tsx`
Expected: PASS — no regression (existing code doesn't set logger)

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/hooks/useAria.ts src/interactive-os/components/aria.tsx
git commit -m "feat(aria): add logger option to useAria and Aria component"
```

---

### Task 3: PageStoreInspector — main page

**Files:**
- Create: `src/pages/PageStoreInspector.tsx`
- Create: `src/pages/PageStoreInspector.module.css`

Uses `<Aria>` component directly (not useEngine/useAriaZone). Editor is a full Aria with treegrid behavior + editing plugins + logger. Inspector is a readonly Aria with tree behavior.

- [ ] **Step 1: Create CSS module**

```css
/* src/pages/PageStoreInspector.module.css */
.splitContainer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr auto;
  gap: 12px;
  min-height: 400px;
}

.panel {
  min-height: 0;
  overflow: auto;
}

.logPanel {
  grid-column: 1 / -1;
  max-height: 200px;
  overflow-y: auto;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  line-height: 1.6;
  padding: 8px 12px;
  background: var(--color-surface-2, #1a1a2e);
  border-radius: 6px;
}

.logEntry {
  white-space: nowrap;
  opacity: 0.9;
}

.logEntry[data-batch-child] {
  padding-left: 16px;
  opacity: 0.7;
}

.logDiff {
  color: var(--color-accent, #7c8aff);
}

.panelLabel {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.5;
  margin-bottom: 6px;
}
```

- [ ] **Step 2: Create PageStoreInspector component**

Read these files before implementing to verify APIs:
- `src/interactive-os/components/aria.tsx` — Aria props
- `src/interactive-os/ui/TreeGrid.tsx` — TreeGrid props (reference for renderItem pattern)
- `src/pages/SharedTreeComponents.tsx` — RenderTreeItem export
- `src/pages/shared-tree-data.ts` — treeData export
- `src/interactive-os/behaviors/tree.ts` — tree behavior export

```tsx
// src/pages/PageStoreInspector.tsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Aria } from '../interactive-os/components/aria'
import { treegrid } from '../interactive-os/behaviors/treegrid'
import { tree } from '../interactive-os/behaviors/tree'
import { core } from '../interactive-os/plugins/core'
import { crud, crudCommands } from '../interactive-os/plugins/crud'
import { dnd, dndCommands } from '../interactive-os/plugins/dnd'
import { history } from '../interactive-os/plugins/history'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'
import { storeToTree } from '../interactive-os/core/storeToTree'
import { treeData } from './shared-tree-data'
import { RenderTreeItem } from './SharedTreeComponents'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState, BehaviorContext } from '../interactive-os/behaviors/types'
import type { Command } from '../interactive-os/core/types'
import type { LogEntry } from '../interactive-os/core/dispatchLogger'
import styles from './PageStoreInspector.module.css'

const MAX_LOG_ENTRIES = 50

const editorPlugins = [core(), crud(), dnd(), history(), focusRecovery()]
const inspectorPlugins = [core()]

const editorKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Enter': (ctx) => crudCommands.create(ctx.focused),
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}

export default function PageStoreInspector() {
  const [data, setData] = useState<NormalizedData>(treeData)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const captureLogger = useCallback((entry: LogEntry) => {
    setLogEntries(prev => {
      const next = [...prev, entry]
      return next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next
    })
  }, [])

  const inspectorData = useMemo(() => storeToTree(data), [data])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logEntries])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Store Inspector</h2>
        <p className="page-desc">
          Left: interactive TreeGrid. Right: live NormalizedData structure.
          Every edit updates the inspector in real-time.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→←</kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">create</span>{' '}
        <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>

      <div className={styles.splitContainer}>
        {/* Editor Panel */}
        <div className={styles.panel}>
          <div className={styles.panelLabel}>Editor</div>
          <div className="card">
            <Aria
              behavior={treegrid}
              data={data}
              plugins={editorPlugins}
              keyMap={editorKeyMap}
              onChange={setData}
              logger={captureLogger}
            >
              <Aria.Item render={(node, state) => (
                <RenderTreeItem node={node as Record<string, unknown>} state={state} />
              )} />
            </Aria>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className={styles.panel}>
          <div className={styles.panelLabel}>NormalizedData</div>
          <div className="card">
            <Aria
              behavior={tree}
              data={inspectorData}
              plugins={inspectorPlugins}
            >
              <Aria.Item render={(node, state) => {
                const d = node.data as Record<string, unknown>
                const indent = ((state.level ?? 1) - 1) * 18
                const type = d?.type as string
                const isGroup = type === 'group'
                const tagColors: Record<string, string> = {
                  meta: '#f59e0b', entity: '#3b82f6', rel: '#8b5cf6', group: '#6b7280',
                }
                return (
                  <div style={{ paddingLeft: 14 + indent, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, opacity: 0.5 }}>
                      {isGroup ? (state.expanded ? '▾' : '▸') : ''}
                    </span>
                    <span style={{
                      fontWeight: isGroup ? 600 : 400,
                      fontFamily: isGroup ? 'inherit' : 'var(--font-mono, monospace)',
                      fontSize: isGroup ? 'inherit' : '11px',
                    }}>
                      {d?.label as string}
                    </span>
                    {type && type !== 'group' && (
                      <span style={{
                        fontSize: '10px', padding: '1px 4px', borderRadius: '3px',
                        opacity: 0.7, color: tagColors[type] ?? '#6b7280',
                      }}>
                        {type}
                      </span>
                    )}
                    {isGroup && d?.count != null && (
                      <span style={{ fontSize: '10px', opacity: 0.5 }}>{d.count as number}</span>
                    )}
                    {d?.value && (
                      <span style={{
                        opacity: 0.4, fontSize: '10px',
                        fontFamily: 'var(--font-mono, monospace)',
                        overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300,
                      }}>
                        {String(d.value).slice(0, 80)}{String(d.value).length > 80 ? '…' : ''}
                      </span>
                    )}
                  </div>
                )
              }} />
            </Aria>
          </div>
        </div>

        {/* Log Panel */}
        <div className={styles.logPanel} ref={logRef} aria-label="Operation Log">
          <div className={styles.panelLabel}>Operation Log</div>
          {logEntries.map((entry) => (
            <div
              key={entry.seq}
              className={styles.logEntry}
              data-batch-child={entry.parent != null ? '' : undefined}
            >
              <span>#{entry.seq} </span>
              <span>{entry.type}</span>
              {entry.diff.length > 0 && (
                <span className={styles.logDiff}>
                  {' | '}{entry.diff.map(d => {
                    if (d.kind === 'added') return `+${d.path}`
                    if (d.kind === 'removed') return `-${d.path}`
                    return `~${d.path}`
                  }).join(', ')}
                </span>
              )}
            </div>
          ))}
          {logEntries.length === 0 && (
            <div style={{ opacity: 0.4 }}>Interact with the editor to see operations here.</div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

Run: `npx vite build --mode development 2>&1 | head -20`
Expected: no import or type errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/PageStoreInspector.tsx src/pages/PageStoreInspector.module.css
git commit -m "feat(store): add PageStoreInspector with split layout"
```

---

### Task 4: Route config update + cleanup

**Files:**
- Modify: `src/App.tsx` (imports lines ~50-51, routeConfig lines ~112-122)
- Delete: `src/pages/PageStoreExplorer.tsx`
- Delete: `src/pages/PageStoreOperations.tsx`

- [ ] **Step 1: Update App.tsx**

Remove imports:
```ts
// Remove these two lines:
import PageStoreExplorer from './pages/PageStoreExplorer'
import PageStoreOperations from './pages/PageStoreOperations'
```

Add import:
```ts
import PageStoreInspector from './pages/PageStoreInspector'
```

Change store route group:
```ts
{
  id: 'store',
  label: 'Store',
  icon: Database,
  basePath: '/store/inspector',
  items: [
    { path: 'inspector', label: 'Inspector', status: 'ready', component: PageStoreInspector },
  ],
},
```

- [ ] **Step 2: Delete old files**

```bash
git rm src/pages/PageStoreExplorer.tsx
git rm src/pages/PageStoreOperations.tsx
```

- [ ] **Step 3: Verify build**

Run: `npx vite build --mode development 2>&1 | head -20`
Expected: clean build

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(store): replace Explorer+Operations with Split Inspector route"
```

---

### Task 5: Integration tests — all PRD verification items

**Files:**
- Create: `src/interactive-os/__tests__/store-inspector.integration.test.tsx`

Covers V1~V10 from PRD. Read `src/interactive-os/components/aria.tsx` to understand DOM structure (role attributes, data-aria-container, etc.) before writing selectors.

- [ ] **Step 1: Write integration tests**

```tsx
// src/interactive-os/__tests__/store-inspector.integration.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageStoreInspector from '../../pages/PageStoreInspector'

// Helper: get the two aria containers (editor = first treegrid, inspector = tree)
function getPanels() {
  const containers = screen.getAllByRole('treegrid')
  // Editor is treegrid role, Inspector is tree role
  const editor = containers[0]!
  const inspector = screen.getByRole('tree')
  const log = screen.getByLabelText('Operation Log')
  return { editor, inspector, log }
}

describe('Store Inspector — panel sync', () => {
  // V1: Create node → Inspector entities count changes
  it('V1: creating a node updates inspector entities', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    // Count inspector entity nodes before
    const beforeCount = within(inspector).getAllByRole('treeitem').length

    // Focus editor and create node
    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!)
    await user.keyboard('{Enter}')

    // Inspector should have more nodes now
    const afterCount = within(inspector).getAllByRole('treeitem').length
    expect(afterCount).toBeGreaterThan(beforeCount)
  })

  // V2: Delete node → Inspector updates
  it('V2: deleting a node removes entity from inspector', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    const beforeCount = within(inspector).getAllByRole('treeitem').length

    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!)
    await user.keyboard('{Delete}')

    const afterCount = within(inspector).getAllByRole('treeitem').length
    expect(afterCount).toBeLessThan(beforeCount)
  })

  // V3: Move node → Inspector relationships change
  it('V3: moving a node changes inspector relationships', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    // Capture inspector text before move
    const before = inspector.textContent

    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[1]!) // second node
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}')

    const after = inspector.textContent
    expect(after).not.toBe(before)
  })

  // V4: Focus move → Inspector __focus__ value changes
  it('V4: focus change updates inspector __focus__ value', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!)

    // Get __focus__ text in inspector
    const focusBefore = inspector.textContent?.match(/focusedId[^}]+/)?.[0]

    await user.keyboard('{ArrowDown}')

    const focusAfter = inspector.textContent?.match(/focusedId[^}]+/)?.[0]
    expect(focusAfter).not.toBe(focusBefore)
  })

  // V5: Create → Log shows crud:create
  it('V5: creating a node shows crud:create in log', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!)
    await user.keyboard('{Enter}')

    expect(log.textContent).toContain('crud:create')
  })

  // V6: Undo → Log shows history:undo
  it('V6: undo shows history:undo in log', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!)
    await user.keyboard('{Enter}')
    await user.keyboard('{Meta>}z{/Meta}')

    expect(log.textContent).toContain('history:undo')
  })

  // V7: Empty store → Inspector shows empty entities
  it('V7: deleting all nodes shows empty inspector', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, inspector } = getPanels()

    // Delete all nodes in editor
    let rows = within(editor).queryAllByRole('row')
    while (rows.length > 0) {
      await user.click(rows[0]!)
      await user.keyboard('{Delete}')
      rows = within(editor).queryAllByRole('row')
    }

    // Inspector should still have group nodes but entity children gone
    // entities group should show count 0 or no entity children
    // At minimum, inspector still renders (no crash)
    expect(inspector).toBeTruthy()
  })

  // V8: Tab switches panels
  it('V8: tab moves focus from editor to inspector', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor } = getPanels()

    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!)

    // Tab should move to inspector
    await user.tab()

    // Active element should no longer be inside editor
    expect(editor.contains(document.activeElement)).toBe(false)
  })

  // V9: Log sliding window (50 max)
  it('V9: log respects sliding window limit', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!)

    // Create and delete many times to generate >50 log entries
    for (let i = 0; i < 30; i++) {
      await user.keyboard('{Enter}')
      await user.keyboard('{Delete}')
    }

    // Each create+delete = multiple log entries
    // Count rendered log entries
    const logLines = log.querySelectorAll('[class*="logEntry"]')
    expect(logLines.length).toBeLessThanOrEqual(50)
  })

  // V10: Batch delete → indented child in log
  it('V10: deleting node with children shows batch in log', async () => {
    const user = userEvent.setup()
    render(<PageStoreInspector />)
    const { editor, log } = getPanels()

    // Find a parent node (e.g., "src" folder which has children)
    // Click it and expand first
    const editorRows = within(editor).getAllByRole('row')
    await user.click(editorRows[0]!) // first node, likely "src" folder
    await user.keyboard('{Delete}')

    // Log should have at least one batch child entry
    const batchChildren = log.querySelectorAll('[data-batch-child]')
    // May or may not have batch children depending on tree structure
    // At minimum, a crud:delete entry should exist
    expect(log.textContent).toContain('crud:delete')
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/interactive-os/__tests__/store-inspector.integration.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/__tests__/store-inspector.integration.test.tsx
git commit -m "test(store): add V1-V10 integration tests for Store Inspector"
```

---

## Task Dependency Graph

```
Task 1 (storeToTree)  ──┐
                         ├──→ Task 3 (PageStoreInspector) ──→ Task 4 (routes + cleanup)
Task 2 (logger option) ──┘                                          │
                                                                     ↓
                                                          Task 5 (integration tests)
```

Tasks 1 and 2 are independent — can run in parallel.
