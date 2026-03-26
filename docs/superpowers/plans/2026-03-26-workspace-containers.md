# Workspace Containers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build TabGroup, SplitPane, Workspace container UI components with keyboard-driven pane/tab management, and integrate into Agent/Viewer pages.

**Architecture:** Three layers: workspaceStore (commands + plugin + serialization) → TabGroup/SplitPane (UI components) → Workspace (orchestrator + keyMap). Store schema uses normalized tree with split/tabgroup/tab entity types. SplitPane uses ratio-based sizing (not useResizer which is px-based). TabGroup uses a view-local sub-store for tablist focus (AriaZone pattern) with workspace store holding persistent activeTabId.

**Tech Stack:** React, interactive-os engine (useAria, plugins, commands), CSS modules, vitest + @testing-library/react + userEvent

**PRD:** `docs/superpowers/prds/2026-03-26-workspace-containers-prd.md`

**Descoped (follow-up PRD):**
- V4/V5 — Cmd+Option+Arrow pane navigation requires focused-pane tracking + Aria Zone per pane
- Chord keyboard shortcuts (Cmd+K Cmd+\) — requires keyMap infrastructure change

---

### Task 1: workspaceStore — Commands + Plugin

**Files:**
- Create: `src/interactive-os/plugins/workspaceStore.ts`
- Test: `src/interactive-os/__tests__/workspace-store.test.ts`

This is the foundation. All workspace operations are pure Command functions on NormalizedData.

**Store schema reference:**
```
split entity:    { id, data: { type: 'split', direction: 'horizontal'|'vertical', sizes: number[] } }
tabgroup entity: { id, data: { type: 'tabgroup', activeTabId: string } }
tab entity:      { id, data: { type: 'tab', label: string, contentType: string, contentRef: string } }
```

- [ ] **Step 1: Write tests for createWorkspace + setActiveTab + resize**

```ts
// src/interactive-os/__tests__/workspace-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  createWorkspace, workspaceCommands, serializeWorkspace, deserializeWorkspace, resetUidCounter,
} from '../plugins/workspaceStore'
import { getChildren, getEntityData } from '../store/createStore'
import { ROOT_ID } from '../store/types'

beforeEach(() => { resetUidCounter() })

describe('workspaceStore', () => {
  describe('createWorkspace', () => {
    it('creates store with one tabgroup under root', () => {
      const store = createWorkspace()
      const rootChildren = getChildren(store, ROOT_ID)
      expect(rootChildren).toHaveLength(1)
      const tg = getEntityData(store, rootChildren[0])
      expect(tg).toMatchObject({ type: 'tabgroup' })
    })
  })

  describe('setActiveTab', () => {
    it('updates tabgroup activeTabId and undoes', () => {
      let store = createWorkspace()
      const tgId = getChildren(store, ROOT_ID)[0]
      store = workspaceCommands.addTab(tgId, {
        id: 'tab-1', data: { type: 'tab', label: 'A', contentType: 'file', contentRef: 'a.ts' },
      }).execute(store)
      store = workspaceCommands.addTab(tgId, {
        id: 'tab-2', data: { type: 'tab', label: 'B', contentType: 'file', contentRef: 'b.ts' },
      }).execute(store)

      const cmd = workspaceCommands.setActiveTab(tgId, 'tab-1')
      const result = cmd.execute(store)
      expect(getEntityData(result, tgId)).toMatchObject({ activeTabId: 'tab-1' })

      const undone = cmd.undo(result)
      expect(getEntityData(undone, tgId)).toMatchObject({ activeTabId: 'tab-2' })
    })
  })

  describe('resize', () => {
    it('updates split sizes and undoes', () => {
      let store = createWorkspace()
      const tgId = getChildren(store, ROOT_ID)[0]
      store = workspaceCommands.splitPane(tgId, 'horizontal').execute(store)
      const splitId = getChildren(store, ROOT_ID)[0]

      const cmd = workspaceCommands.resize(splitId, [0.3, 0.7])
      const result = cmd.execute(store)
      expect(getEntityData(result, splitId)).toMatchObject({ sizes: [0.3, 0.7] })

      const undone = cmd.undo(result)
      expect(getEntityData(undone, splitId)).toMatchObject({ sizes: [0.5, 0.5] })
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/interactive-os/__tests__/workspace-store.test.ts`

- [ ] **Step 3: Implement createWorkspace, setActiveTab, resize, types**

Create `src/interactive-os/plugins/workspaceStore.ts` with:
- Types: `SplitData`, `TabGroupData`, `TabData`
- `uid()` helper with `resetUidCounter()`
- `createWorkspace()` — returns store with one tabgroup under ROOT
- `workspaceCommands.setActiveTab(tgId, tabId)` — updates `entity.data.activeTabId`, captures prev for undo
- `workspaceCommands.resize(splitId, sizes)` — updates `entity.data.sizes`, captures prev for undo

Uses: `createStore`, `updateEntityData` from `../store/createStore`

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Write tests for addTab + removeTab (including E1 cascade)**

Add tests:
- `addTab` — adds tab to tabgroup, sets it active, undo removes it
- `removeTab` — removes tab, activates adjacent
- `removeTab` E1 (V7) — removing last tab removes the tabgroup and collapses parent split

- [ ] **Step 6: Implement addTab + removeTab**

- `addTab(tgId, tab)` — `createBatchCommand([create-tab, setActiveTab])`
- `removeTab(tabId)` — snapshot-based undo. Find parent tabgroup, remove tab, activate adjacent. If tabgroup empty → delegate to `closePaneInternal()`
- `closePaneInternal(store, paneId)` — helper. Remove pane. If parent split has 1 child left → reparent survivor to grandparent, remove split (E2 collapse)

- [ ] **Step 7: Run tests — expect PASS**

- [ ] **Step 8: Write tests for splitPane + closePane (including E4 minSize guard)**

Tests:
- `splitPane` (V3) — wraps pane in split with new tabgroup, sizes [0.5, 0.5]
- `splitPane` undo — restores original structure
- `splitPane` E4 (V10) — refuses split when pane is too small (no-op)
- `closePane` (V8) — removes pane, collapses parent split

- [ ] **Step 9: Implement splitPane + closePane**

- `splitPane(paneId, direction)` — snapshot-based undo. Create split entity at pane's position, moveNode pane under split, create new empty tabgroup under split. **E4 guard:** count nesting depth or check if container element would be below min threshold (configurable, default 3 levels deep)
- `closePane(paneId)` — snapshot-based undo, delegates to `closePaneInternal`

- [ ] **Step 10: Run tests — expect PASS**

- [ ] **Step 11: Write tests for serialization (V6, V13/E9)**

- Round-trip: createWorkspace → addTab → splitPane → serialize → deserialize → verify structure
- Invalid JSON → returns fresh createWorkspace()

- [ ] **Step 12: Implement serialization**

- `serializeWorkspace(store)` — filter out meta-entities (`__focus__` etc), JSON.stringify
- `deserializeWorkspace(json)` — try/catch parse, validate entities/relationships exist, fallback to createWorkspace()

- [ ] **Step 13: Run all tests — expect ALL PASS**

- [ ] **Step 14: Implement workspace plugin**

```ts
import { focusRecovery } from './focusRecovery'

export function workspace() {
  return definePlugin({
    name: 'workspace',
    requires: [focusRecovery()],
    commands: {
      setActiveTab: workspaceCommands.setActiveTab,
      resize: workspaceCommands.resize,
      addTab: workspaceCommands.addTab,
      removeTab: workspaceCommands.removeTab,
      splitPane: workspaceCommands.splitPane,
      closePane: workspaceCommands.closePane,
    },
  })
}
```

- [ ] **Step 15: Commit**

```bash
git add src/interactive-os/plugins/workspaceStore.ts src/interactive-os/__tests__/workspace-store.test.ts
git commit -m "feat: workspaceStore — commands, plugin, serialization for workspace containers"
```

---

### Task 2: TabGroup UI Component

**Files:**
- Create: `src/interactive-os/ui/TabGroup.tsx`
- Create: `src/interactive-os/ui/TabGroup.module.css`
- Test: `src/interactive-os/__tests__/tabgroup.integration.test.tsx`

TabGroup = TabList header + tabpanel content area. Uses existing `tabs` pattern via `useTabList` for the header. Panel rendered via render prop.

**Design note — sub-store pattern:** TabGroup creates a view-local sub-store (tabs as ROOT children) for `useTabList`. This is the AriaZone pattern: tablist's internal focus state (`__focus__`) is view-local, while workspace store holds persistent data (activeTabId). The `onActivate` callback bridges them — when user navigates tabs, `onActivate` fires `workspaceCommands.setActiveTab` on the workspace store. The sub-store re-derives from workspace data on each render via `useMemo`.

- [ ] **Step 1: Write integration test — tab rendering + switching (V14)**

Test: render TabGroup with 2 tabs, verify active panel shows. ArrowRight → panel switches.

- [ ] **Step 2: Run test — expect FAIL (module not found)**

- [ ] **Step 3: Create TabGroup.module.css**

Use design tokens only (F6). Tab bar: sunken bg, border-bottom. Tabs: flex row, gap-xs. Close button: opacity 0 → 1 on hover/selected. Tab panel: flex 1, overflow auto.

- [ ] **Step 4: Create TabGroup.tsx**

```tsx
// ② 2026-03-26-workspace-containers-prd.md
import { useMemo, useCallback } from 'react'
import { useTabList } from './useTabList'
import { workspaceCommands } from '../plugins/workspaceStore'
import type { TabGroupData, TabData } from '../plugins/workspaceStore'
import { createStore, getChildren, getEntityData } from '../store/createStore'
import { ROOT_ID } from '../store/types'
// ...

export function TabGroup({ data, tabgroupId, onChange, renderPanel, keyMap, 'aria-label': ariaLabel }: TabGroupProps) {
  const tabIds = getChildren(data, tabgroupId)
  const tgData = getEntityData<TabGroupData>(data, tabgroupId)
  const activeTabId = tgData?.activeTabId ?? tabIds[0] ?? ''

  // View-local sub-store for useTabList (tabs as ROOT children)
  const tabStore = useMemo(() => {
    const entities = Object.fromEntries(tabIds.map(id => [id, data.entities[id]]).filter(([, e]) => e))
    return createStore({ entities, relationships: { [ROOT_ID]: tabIds } })
  }, [data, tabIds])

  // Close keyMap: Delete + Cmd+W → workspace:remove-tab
  const closeKeyMap = useMemo(() => ({
    'Delete': (ctx) => workspaceCommands.removeTab(ctx.focused),
    'Meta+w': (ctx) => workspaceCommands.removeTab(ctx.focused),
    ...keyMap,
  }), [keyMap])

  // onActivate bridges sub-store focus → workspace store activeTabId
  const handleActivate = useCallback((nodeId: string) => {
    onChange?.(workspaceCommands.setActiveTab(tabgroupId, nodeId).execute(data))
  }, [onChange, tabgroupId, data])

  // Close button: stopPropagation to prevent tab activation (F11 PRD)
  const handleClose = useCallback((e, tabId) => {
    e.preventDefault(); e.stopPropagation()
    onChange?.(workspaceCommands.removeTab(tabId).execute(data))
  }, [onChange, data])

  const tl = useTabList({ data: tabStore, keyMap: closeKeyMap, onActivate: handleActivate, initialFocus: activeTabId, 'aria-label': ariaLabel })
  const activeTab = data.entities[activeTabId]

  return (
    <div className={styles.tabGroup}>
      {tabIds.length > 0 && (
        <div {...tl.rootProps} className={styles.tabBar}>
          {tabIds.map(id => {
            const tabData = data.entities[id]?.data as TabData
            return (
              <div key={id} {...tl.getItemProps(id)} className={styles.tab}>
                <span>{tabData?.label ?? id}</span>
                <button className={styles.tabClose} onClick={e => handleClose(e, id)}
                  aria-label={`Close ${tabData?.label ?? id}`} tabIndex={-1}>
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <div className={styles.tabPanel} role="tabpanel" aria-labelledby={activeTabId}>
        {activeTab ? renderPanel(activeTab) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test — expect PASS**

- [ ] **Step 6: Add tests for tab close — Delete key (V2) + close button (V17)**

- Delete key: focus tab, press Delete → onChange called, tab removed from store
- Close button: click close → tab removed, tab activation NOT fired (bubbling blocked)

- [ ] **Step 7: Run tests, fix if needed, commit**

```bash
git add src/interactive-os/ui/TabGroup.tsx src/interactive-os/ui/TabGroup.module.css src/interactive-os/__tests__/tabgroup.integration.test.tsx
git commit -m "feat: TabGroup UI component — tablist header + tabpanel with close support"
```

---

### Task 3: SplitPane UI Component

**Files:**
- Create: `src/interactive-os/ui/SplitPane.tsx`
- Create: `src/interactive-os/ui/SplitPane.module.css`
- Test: `src/interactive-os/__tests__/splitpane.integration.test.tsx`

SplitPane renders children side by side with a resizable separator. **Does NOT use useResizer** — useResizer is px-based with own state; SplitPane needs ratio-based sizing owned by workspace store. Separator implements ARIA separator role directly.

- [ ] **Step 1: Write integration test — rendering + ARIA attributes (V16)**

```tsx
describe('SplitPane', () => {
  it('renders children with separator between them', () => {
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 0.5]} onResize={() => {}}>
        <div data-testid="left">Left</div>
        <div data-testid="right">Right</div>
      </SplitPane>
    )
    expect(screen.getByTestId('left')).toBeDefined()
    expect(screen.getByTestId('right')).toBeDefined()
    expect(screen.getByRole('separator')).toBeDefined()
  })

  it('separator has correct ARIA attributes', () => {
    render(
      <SplitPane direction="horizontal" sizes={[0.4, 0.6]} onResize={() => {}}>
        <div>A</div><div>B</div>
      </SplitPane>
    )
    const sep = screen.getByRole('separator')
    expect(sep).toHaveAttribute('aria-orientation', 'vertical')
    expect(sep).toHaveAttribute('aria-valuenow', '40')
    expect(sep).toHaveAttribute('aria-valuemin')
    expect(sep).toHaveAttribute('aria-valuemax')
  })

  it('keyboard Arrow adjusts sizes', async () => {
    const onResize = vi.fn()
    render(
      <SplitPane direction="horizontal" sizes={[0.5, 0.5]} onResize={onResize}>
        <div>A</div><div>B</div>
      </SplitPane>
    )
    screen.getByRole('separator').focus()
    await userEvent.setup().keyboard('{ArrowRight}')
    expect(onResize).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Number), expect.any(Number)]))
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create SplitPane.module.css**

```css
.splitPane { display: flex; height: 100%; overflow: hidden; }
.splitPaneVertical { flex-direction: column; }
.pane { overflow: hidden; min-width: 0; min-height: 0; }
.separator {
  flex-shrink: 0;
  background: var(--color-border-default);
  transition: background var(--motion-instant);
}
.separator:hover, .separator:focus-visible {
  background: var(--color-border-focus);
}
.separatorH { width: var(--space-2xs); cursor: col-resize; }
.separatorV { height: var(--space-2xs); cursor: row-resize; }
```

- [ ] **Step 4: Create SplitPane.tsx**

Ratio-based separator with:
- ARIA: `role="separator"`, `aria-orientation` (perpendicular to split direction), `aria-valuenow` (0-100), `aria-valuemin`, `aria-valuemax`, `tabIndex={0}`
- Pointer drag: `onPointerDown` → capture, track delta, convert px delta to ratio delta using `getBoundingClientRect()`, call `onResize(newSizes)` on pointerup
- Keyboard: Arrow keys → step (±0.02), Home/End → min/max ratio
- Double-click: reset to equal ratios
- `minRatio` prop (default 0.1) — clamp all ratio changes

Single child: render without separator. Zero/one child: passthrough.

- [ ] **Step 5: Run tests, fix, commit**

```bash
git add src/interactive-os/ui/SplitPane.tsx src/interactive-os/ui/SplitPane.module.css src/interactive-os/__tests__/splitpane.integration.test.tsx
git commit -m "feat: SplitPane UI component — ratio-based resizable split container"
```

---

### Task 4: Workspace Orchestrator Component

**Files:**
- Create: `src/interactive-os/ui/Workspace.tsx`
- Create: `src/interactive-os/ui/Workspace.module.css`
- Test: `src/interactive-os/__tests__/workspace.integration.test.tsx`

Workspace recursively renders the workspace tree: split → SplitPane, tabgroup → TabGroup. Provides workspace-level keyMap via plain `onKeyDown` handler (not Aria — no ARIA widget behavior needed for structural shortcuts).

- [ ] **Step 1: Write integration test**

Tests:
- Single tabgroup with tab → renders tab + panel (V1)
- Split with two tabgroups → renders both + separator
- Empty workspace → empty state (V9)

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Create Workspace.module.css**

```css
.workspace { height: 100%; display: flex; flex-direction: column; }
.empty { display: flex; align-items: center; justify-content: center; height: 100%; gap: var(--gap-sm); color: var(--color-fg-dim); }
```

- [ ] **Step 4: Create Workspace.tsx**

```tsx
// ② 2026-03-26-workspace-containers-prd.md

export function Workspace({ data, onChange, renderPanel, 'aria-label': ariaLabel }: WorkspaceProps) {
  // Workspace-level shortcuts via plain onKeyDown (no ARIA widget needed)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey && e.key === '\\' && !e.shiftKey) {
      e.preventDefault()
      const pane = findActivePane(data)
      if (pane) onChange(workspaceCommands.splitPane(pane, 'horizontal').execute(data))
    }
    if (e.metaKey && e.shiftKey && e.key === '\\') {
      e.preventDefault()
      const pane = findActivePane(data)
      if (pane) onChange(workspaceCommands.splitPane(pane, 'vertical').execute(data))
    }
  }, [data, onChange])

  // Recursive WorkspaceNode renders split→SplitPane, tabgroup→TabGroup
  return (
    <div className={styles.workspace} onKeyDown={handleKeyDown}>
      {rootChildren.length === 0
        ? <div className={styles.empty}>No open tabs</div>
        : rootChildren.map(id => <WorkspaceNode key={id} ... />)
      }
    </div>
  )
}

// WorkspaceNode: reads entity.data.type, renders SplitPane or TabGroup
function WorkspaceNode({ nodeId, data, onChange, renderPanel }) {
  const nodeType = (data.entities[nodeId]?.data as any)?.type
  if (nodeType === 'split') {
    return <SplitPane direction={...} sizes={...} onResize={...}>
      {childIds.map(id => <WorkspaceNode ... />)}
    </SplitPane>
  }
  if (nodeType === 'tabgroup') {
    return tabIds.length === 0
      ? <div className={styles.empty}>No open tabs</div>
      : <TabGroup data={data} tabgroupId={nodeId} onChange={onChange} renderPanel={renderPanel} />
  }
  return null
}

// findActivePane: walk tree, return first tabgroup (simplified — focused pane tracking is V4/V5, descoped)
```

- [ ] **Step 5: Run tests, fix, commit**

```bash
git add src/interactive-os/ui/Workspace.tsx src/interactive-os/ui/Workspace.module.css src/interactive-os/__tests__/workspace.integration.test.tsx
git commit -m "feat: Workspace orchestrator — recursive split/tabgroup rendering with structural shortcuts"
```

---

### Task 5: PageViewer Integration

**Files:**
- Modify: `src/pages/PageViewer.tsx`
- Modify: `src/pages/PageViewer.module.css`

Replace single-file view with Workspace-based layout. Tree sidebar stays.

- [ ] **Step 1: Add workspace state to PageViewer**

```tsx
const [workspaceStore, setWorkspaceStore] = useState(() => createWorkspace())
```

- [ ] **Step 2: Refactor file selection to add tabs**

`selectFile` → check if tab exists for path, if yes activate it, if no `workspaceCommands.addTab()`

- [ ] **Step 3: Implement renderPanel**

```tsx
const renderPanel = (tab: Entity) => {
  const { contentType, contentRef } = tab.data as TabData
  if (contentType === 'file') return <FilePanel path={contentRef} />
  if (contentType === 'mermaid') return <ExportDiagram filePath={contentRef} />
  return null
}
```

Extract FilePanel from existing inline code (fetchFile + CodeBlock/MarkdownViewer).

- [ ] **Step 4: Remove graphResizer (SplitPane replaces it), keep treeResizer**

- [ ] **Step 5: Test manually + verify existing keyboard tests still pass**

Run: `pnpm vitest run src/interactive-os/__tests__/viewer-keyboard.test.tsx`
Run: `pnpm dev` → navigate to `/viewer/`

- [ ] **Step 6: Commit**

```bash
git add src/pages/PageViewer.tsx src/pages/PageViewer.module.css
git commit -m "feat: PageViewer — integrate Workspace for tabbed multi-file viewing"
```

---

### Task 6: PageAgentViewer Integration

**Files:**
- Modify: `src/pages/PageAgentViewer.tsx`
- Modify: `src/pages/PageAgentViewer.module.css`

Replace modal-based file viewing with Workspace tabs. Sessions sidebar stays.

- [ ] **Step 1: Add workspace state, replace FileViewerModal with Workspace**

Active sessions → tabs with `contentType: 'timeline'`. File clicks → tabs with `contentType: 'file'`.

- [ ] **Step 2: Implement renderPanel**

```tsx
const renderPanel = (tab: Entity) => {
  const { contentType, contentRef } = tab.data as TabData
  if (contentType === 'timeline') return <TimelineColumn sessionId={contentRef} ... />
  if (contentType === 'file') return <FilePanel path={contentRef} />
  return null
}
```

- [ ] **Step 3: Remove FileViewerModal usage, remove ResizableColumn (Workspace replaces it)**

- [ ] **Step 4: Test manually**

Run: `pnpm dev` → navigate to `/agent/`

- [ ] **Step 5: Commit**

```bash
git add src/pages/PageAgentViewer.tsx src/pages/PageAgentViewer.module.css
git commit -m "feat: PageAgentViewer — integrate Workspace, replace modal with tabs"
```
