# Axis Showcase Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 11개 공유 축을 각각 최소 pattern으로 래핑한 인터랙티브 데모 페이지를 `/axis/{name}` 라우트로 제공하는 독립 Axis 레이어 생성

**Architecture:** Plugin 페이지 패턴을 복제 — 각 축 페이지는 `composePattern(minimal-meta, 해당축)` 하나와 독립 store로 구성. `<Aria>` + `<Aria.Item>` (Grid는 `<Aria.Cell>`)로 렌더링. ActivityBar에 Store → Engine → **Axis** → Navigation 순서로 삽입.

**Tech Stack:** React, interactive-os (composePattern, Aria components, core plugin), lucide-react (Axe icon)

**PRD:** `docs/superpowers/specs/2026-03-20-axis-showcase-prd.md`

---

### Task 1: Axis 데모 데이터 모듈

축 페이지들이 공유하는 데모 데이터를 생성한다. 기존 shared-list-data.ts, shared-tree-data.ts, shared-grid-data.ts 패턴을 따른다.

**Files:**
- Create: `src/pages/axis/axis-demo-data.ts`

- [ ] **Step 1: flat list 데모 데이터 작성**

7개 아이템 flat list (navV, navH, navVhUniform, selectToggle, selectExtended, activate, activateFollowFocus, focusTrap이 공유):

```ts
import { createStore } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'

export const axisListData = createStore({
  entities: {
    a1: { id: 'a1', data: { label: 'Navigate' } },
    a2: { id: 'a2', data: { label: 'Select' } },
    a3: { id: 'a3', data: { label: 'Activate' } },
    a4: { id: 'a4', data: { label: 'Expand' } },
    a5: { id: 'a5', data: { label: 'Collapse' } },
    a6: { id: 'a6', data: { label: 'Focus' } },
    a7: { id: 'a7', data: { label: 'Escape' } },
  },
  relationships: {
    [ROOT_ID]: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'],
  },
})
```

- [ ] **Step 2: tree 데모 데이터 작성 (depthArrow, depthEnterEsc 공유)**

같은 파일에 추가. 부모 3 + 자식 각 2~3:

```ts
export const axisTreeData = createStore({
  entities: {
    folder1: { id: 'folder1', data: { label: 'Documents' } },
    folder2: { id: 'folder2', data: { label: 'Projects' } },
    folder3: { id: 'folder3', data: { label: 'Archive' } },
    doc1: { id: 'doc1', data: { label: 'README.md' } },
    doc2: { id: 'doc2', data: { label: 'notes.txt' } },
    proj1: { id: 'proj1', data: { label: 'app.tsx' } },
    proj2: { id: 'proj2', data: { label: 'index.ts' } },
    proj3: { id: 'proj3', data: { label: 'utils.ts' } },
    arc1: { id: 'arc1', data: { label: 'backup.zip' } },
    arc2: { id: 'arc2', data: { label: 'old-config.json' } },
  },
  relationships: {
    [ROOT_ID]: ['folder1', 'folder2', 'folder3'],
    folder1: ['doc1', 'doc2'],
    folder2: ['proj1', 'proj2', 'proj3'],
    folder3: ['arc1', 'arc2'],
  },
})
```

- [ ] **Step 3: grid 데모 데이터 작성 (navGrid 전용)**

같은 파일에 추가. 3열 × 4행:

```ts
export const axisGridColumns = [
  { key: 'action', header: 'Action' },
  { key: 'key', header: 'Key' },
  { key: 'axis', header: 'Axis' },
]

export const axisGridData = createStore({
  entities: {
    'r1': { id: 'r1', data: { cells: ['Move up', '↑', 'navV'] } },
    'r2': { id: 'r2', data: { cells: ['Move down', '↓', 'navV'] } },
    'r3': { id: 'r3', data: { cells: ['Move left', '←', 'navH'] } },
    'r4': { id: 'r4', data: { cells: ['Move right', '→', 'navH'] } },
  },
  relationships: {
    [ROOT_ID]: ['r1', 'r2', 'r3', 'r4'],
  },
})
```

- [ ] **Step 4: 빌드 확인**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/pages/axis/axis-demo-data.ts
git commit -m "feat(axis): add shared demo data for axis showcase pages"
```

---

### Task 2: Navigation 축 페이지 4개 (navV, navH, navVhUniform, navGrid)

가장 기본적인 4개 nav 축 페이지를 생성한다. 각 페이지는 composePattern으로 최소 behavior를 만들고 `<Aria>` + `<Aria.Item>`으로 렌더링한다.

**Files:**
- Create: `src/pages/axis/PageNavV.tsx`
- Create: `src/pages/axis/PageNavH.tsx`
- Create: `src/pages/axis/PageNavVhUniform.tsx`
- Create: `src/pages/axis/PageNavGrid.tsx`

- [ ] **Step 1: PageNavV.tsx 작성**

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { navV } from '../../interactive-os/axes/nav-v'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: () => ({}),
  },
  navV,
)

const plugins = [core(), focusRecovery()]

export default function PageNavV() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navV</h2>
        <p className="page-desc">
          Vertical navigation axis — Arrow Up/Down move focus between siblings, Home/End jump to first/last.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>↓</kbd> <span className="key-hint">next</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navV axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About navV</h3>
        <p className="page-desc">
          The <code>navV</code> axis binds 4 keys: <code>ArrowDown</code> → focusNext,
          <code>ArrowUp</code> → focusPrev, <code>Home</code> → focusFirst,
          <code>End</code> → focusLast. Other keys (←→, Space, Enter) are intentionally unbound — try them to see nothing happens.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: PageNavH.tsx 작성**

navH는 factory function: `navH()`. orientation: horizontal. 가로 배치를 위해 flex-direction: row 스타일 추가.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { navH } from '../../interactive-os/axes/nav-h'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    ariaAttributes: () => ({}),
  },
  navH(),
)

const plugins = [core(), focusRecovery()]

export default function PageNavH() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navH</h2>
        <p className="page-desc">
          Horizontal navigation axis — Arrow Left/Right move focus, Home/End jump to first/last.
        </p>
      </div>
      <div className="page-keys">
        <kbd>←</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>→</kbd> <span className="key-hint">next</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navH axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About navH</h3>
        <p className="page-desc">
          The <code>navH</code> axis is a factory function accepting <code>{'{'}wrap?: boolean{'}'}</code>.
          It binds <code>ArrowRight</code> → focusNext, <code>ArrowLeft</code> → focusPrev,
          <code>Home</code> → focusFirst, <code>End</code> → focusLast.
          Up/Down keys are intentionally unbound.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: PageNavVhUniform.tsx 작성**

navVhUniform은 factory: `navVhUniform({ wrap: true })`. 4방향 모두 prev/next.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { navVhUniform } from '../../interactive-os/axes/nav-vh-uniform'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: () => ({}),
  },
  navVhUniform({ wrap: true }),
)

const plugins = [core(), focusRecovery()]

export default function PageNavVhUniform() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navVhUniform</h2>
        <p className="page-desc">
          Uniform 4-direction navigation — all arrow keys map to prev/next with wrapping.
          Used in radiogroup and toolbar patterns.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>↓</kbd> <span className="key-hint">next</span>{' '}
        <kbd>←</kbd> <span className="key-hint">previous</span>{' '}
        <kbd>→</kbd> <span className="key-hint">next</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navVhUniform axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About navVhUniform</h3>
        <p className="page-desc">
          The <code>navVhUniform</code> axis treats all 4 arrow keys identically:
          ↓/→ = focusNext, ↑/← = focusPrev. The <code>wrap</code> option enables circular navigation.
          Home/End are not bound — only arrow keys.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: PageNavGrid.tsx 작성**

navGrid는 factory: `navGrid()`. `<Aria.Cell>` 사용. Grid UI 컴포넌트 대신 직접 `<Aria>` + `<Aria.Item>` + `<Aria.Cell>` 사용 (최소 구성).

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { navGrid } from '../../interactive-os/axes/nav-grid'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisGridData, axisGridColumns } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'grid',
    childRole: 'row',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    colCount: 3,
    ariaAttributes: () => ({}),
  },
  navGrid(),
)

const plugins = [core(), focusRecovery()]

export default function PageNavGrid() {
  const [data, setData] = useState<NormalizedData>(axisGridData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">navGrid</h2>
        <p className="page-desc">
          2D grid navigation — Arrow keys move between rows and columns,
          Home/End jump within row, Cmd+Home/End jump to first/last row.
        </p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">row nav</span>{' '}
        <kbd>←→</kbd> <span className="key-hint">col nav</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first col</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last col</span>{' '}
        <kbd>⌘Home</kbd> <span className="key-hint">first row</span>{' '}
        <kbd>⌘End</kbd> <span className="key-hint">last row</span>
      </div>
      <div className="card">
        <table className="grid-table" role="presentation">
          <thead>
            <tr>
              {axisGridColumns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
        </table>
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="navGrid axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const cells = (node.data as Record<string, unknown>)?.cells as string[]
            const cls = [
              'grid-row',
              state.focused && 'grid-row--focused',
            ].filter(Boolean).join(' ')
            return (
              <div className={cls}>
                {cells?.map((cell, i) => (
                  <Aria.Cell key={i} index={i}>
                    <span>{cell}</span>
                  </Aria.Cell>
                ))}
              </div>
            )
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About navGrid</h3>
        <p className="page-desc">
          The <code>navGrid</code> axis adds 2D awareness: ↑↓ move between rows,
          ←→ move between columns via <code>grid.focusNextCol/focusPrevCol</code>.
          Requires <code>colCount</code> in pattern metadata. Space/Enter are unbound.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 빌드 확인**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/pages/axis/PageNavV.tsx src/pages/axis/PageNavH.tsx src/pages/axis/PageNavVhUniform.tsx src/pages/axis/PageNavGrid.tsx
git commit -m "feat(axis): add nav axis showcase pages (navV, navH, navVhUniform, navGrid)"
```

---

### Task 3: Depth 축 페이지 2개 (depthArrow, depthEnterEsc)

계층 탐색 축. depthArrow는 tree 데이터 + expandable, depthEnterEsc는 spatial 스타일.

**Files:**
- Create: `src/pages/axis/PageDepthArrow.tsx`
- Create: `src/pages/axis/PageDepthEnterEsc.tsx`

- [ ] **Step 1: PageDepthArrow.tsx 작성**

depthArrow는 static export. tree 데이터 사용. expandable: true 필수.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { depthArrow } from '../../interactive-os/axes/depth-arrow'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisTreeData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'tree',
    childRole: 'treeitem',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    expandable: true,
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      if (state.level !== undefined) {
        attrs['aria-level'] = String(state.level)
      }
      return attrs
    },
  },
  depthArrow,
)

const plugins = [core(), focusRecovery()]

export default function PageDepthArrow() {
  const [data, setData] = useState<NormalizedData>(axisTreeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">depthArrow</h2>
        <p className="page-desc">
          Arrow-key depth traversal — Right expands or enters child, Left collapses or exits to parent.
          Used in tree and treegrid patterns.
        </p>
      </div>
      <div className="page-keys">
        <kbd>→</kbd> <span className="key-hint">expand / enter child</span>{' '}
        <kbd>←</kbd> <span className="key-hint">collapse / exit to parent</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="depthArrow axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const indent = ((state.level ?? 1) - 1) * 20
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return (
              <div className={cls} style={{ paddingLeft: indent }}>
                {state.expanded !== undefined && (
                  <span style={{ display: 'inline-block', width: 16, opacity: 0.5 }}>
                    {state.expanded ? '▾' : '▸'}
                  </span>
                )}
                {d?.label as string}
              </div>
            )
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About depthArrow</h3>
        <p className="page-desc">
          The <code>depthArrow</code> axis binds only ← and →. Right: if collapsed, expand; if expanded, focus first child.
          Left: if expanded, collapse; if collapsed, focus parent. Up/Down navigation is intentionally absent — that's navV's job.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: PageDepthEnterEsc.tsx 작성**

depthEnterEsc는 spatial plugin에 의존 (spatialCommands). spatial plugin import 필요. tree 데이터 사용.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { depthEnterEsc } from '../../interactive-os/axes/depth-enter-esc'
import { core } from '../../interactive-os/plugins/core'
import { spatial } from '../../interactive-os/plugins/spatial'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisTreeData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'group',
    childRole: 'group',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    expandable: true,
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  depthEnterEsc,
)

const plugins = [core(), spatial(), focusRecovery()]

export default function PageDepthEnterEsc() {
  const [data, setData] = useState<NormalizedData>(axisTreeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">depthEnterEsc</h2>
        <p className="page-desc">
          Enter/Escape depth traversal — Enter dives into children (Figma-style), Escape returns to parent.
          Used in spatial navigation patterns.
        </p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">enter child scope</span>{' '}
        <kbd>Esc</kbd> <span className="key-hint">exit to parent scope</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="depthEnterEsc axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About depthEnterEsc</h3>
        <p className="page-desc">
          The <code>depthEnterEsc</code> axis binds Enter and Escape.
          Enter: if the focused node has children, set spatial parent and focus first child; if leaf, start rename.
          Escape: return to parent scope. Arrow keys are unbound — combine with navV or spatial nav for full navigation.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/pages/axis/PageDepthArrow.tsx src/pages/axis/PageDepthEnterEsc.tsx
git commit -m "feat(axis): add depth axis showcase pages (depthArrow, depthEnterEsc)"
```

---

### Task 4: Selection 축 페이지 2개 (selectToggle, selectExtended)

**Files:**
- Create: `src/pages/axis/PageSelectToggle.tsx`
- Create: `src/pages/axis/PageSelectExtended.tsx`

- [ ] **Step 1: PageSelectToggle.tsx 작성**

selectToggle은 Space 하나만. selectionMode: 'multiple'.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { selectToggle } from '../../interactive-os/axes/select-toggle'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    selectionMode: 'multiple',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  selectToggle,
)

const plugins = [core(), focusRecovery()]

export default function PageSelectToggle() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">selectToggle</h2>
        <p className="page-desc">
          Space toggles selection on the focused item. Arrow keys are unbound — focus stays on the same item.
          Click an item first to focus it, then press Space.
        </p>
      </div>
      <div className="page-keys">
        <kbd>Space</kbd> <span className="key-hint">toggle selection</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="selectToggle axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About selectToggle</h3>
        <p className="page-desc">
          The <code>selectToggle</code> axis binds only <code>Space</code> → toggleSelect.
          This is the most minimal selection axis. No navigation — combine with navV or navH for movement.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: PageSelectExtended.tsx 작성**

selectExtended는 Shift+Arrow/Home/End. selectionMode: 'multiple'. **주의**: nav 축 없으므로 Shift+↑↓만 동작하고 일반 ↑↓는 안 됨. 이것이 "축 분리"의 핵심 체험.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { selectExtended } from '../../interactive-os/axes/select-extended'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { Entity, NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    selectionMode: 'multiple',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  selectExtended,
)

const plugins = [core(), focusRecovery()]

export default function PageSelectExtended() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">selectExtended</h2>
        <p className="page-desc">
          Shift+Arrow extends selection range. Plain arrows do nothing — this axis only handles Shift combos.
          Click an item first, then Shift+↓ to extend.
        </p>
      </div>
      <div className="page-keys">
        <kbd>Shift+↑</kbd> <span className="key-hint">extend up</span>{' '}
        <kbd>Shift+↓</kbd> <span className="key-hint">extend down</span>{' '}
        <kbd>Shift+Home</kbd> <span className="key-hint">extend to first</span>{' '}
        <kbd>Shift+End</kbd> <span className="key-hint">extend to last</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="selectExtended axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About selectExtended</h3>
        <p className="page-desc">
          The <code>selectExtended</code> axis binds 4 Shift combos:
          <code>Shift+↓</code> → extendSelection('next'),
          <code>Shift+↑</code> → extendSelection('prev'),
          <code>Shift+Home</code> → extendSelection('first'),
          <code>Shift+End</code> → extendSelection('last').
          Plain arrows are unbound — that's navV's job.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/pages/axis/PageSelectToggle.tsx src/pages/axis/PageSelectExtended.tsx
git commit -m "feat(axis): add selection axis showcase pages (selectToggle, selectExtended)"
```

---

### Task 5: Activation + Trap 축 페이지 3개 (activate, activateFollowFocus, focusTrap)

**Files:**
- Create: `src/pages/axis/PageActivate.tsx`
- Create: `src/pages/axis/PageActivateFollowFocus.tsx`
- Create: `src/pages/axis/PageFocusTrap.tsx`

- [ ] **Step 1: PageActivate.tsx 작성**

activate는 Enter/Space → activate(). onActivate 콜백으로 시각 피드백.

```tsx
import { useState, useCallback } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { activate } from '../../interactive-os/axes/activate'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    activateOnClick: true,
    ariaAttributes: () => ({}),
  },
  activate,
)

const plugins = [core(), focusRecovery()]

export default function PageActivate() {
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [lastActivated, setLastActivated] = useState<string | null>(null)

  const handleActivate = useCallback((nodeId: string) => {
    setLastActivated(nodeId)
  }, [])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">activate</h2>
        <p className="page-desc">
          Enter or Space activates the focused item. Arrow keys are unbound.
          Click an item first, then press Enter or Space.
        </p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">activate</span>
      </div>
      {lastActivated && (
        <div className="page-keys" style={{ opacity: 0.7 }}>
          Last activated: <strong>{lastActivated}</strong>
        </div>
      )}
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          onActivate={handleActivate}
          aria-label="activate axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About activate</h3>
        <p className="page-desc">
          The <code>activate</code> axis binds <code>Enter</code> and <code>Space</code> to <code>ctx.activate()</code>.
          The component receives activation via <code>onActivate</code> callback. No navigation, no selection — purely activation.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: PageActivateFollowFocus.tsx 작성**

activateFollowFocus는 activate와 동일한 keyMap이지만 metadata에 `followFocus: true`. 포커스 이동 시 자동 활성화.

```tsx
import { useState, useCallback } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { activateFollowFocus } from '../../interactive-os/axes/activate-follow-focus'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    followFocus: true,
    activateOnClick: true,
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  activateFollowFocus,
)

const plugins = [core(), focusRecovery()]

export default function PageActivateFollowFocus() {
  const [data, setData] = useState<NormalizedData>(axisListData)
  const [lastActivated, setLastActivated] = useState<string | null>(null)

  const handleActivate = useCallback((nodeId: string) => {
    setLastActivated(nodeId)
  }, [])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">activateFollowFocus</h2>
        <p className="page-desc">
          Same keys as activate (Enter/Space), but paired with <code>followFocus: true</code> metadata.
          Focus movement automatically triggers activation — used in tabs pattern.
        </p>
      </div>
      <div className="page-keys">
        <kbd>Enter</kbd> <span className="key-hint">activate</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">activate</span>{' '}
        <span className="key-hint" style={{ opacity: 0.7 }}>+ followFocus: auto-activate on focus move</span>
      </div>
      {lastActivated && (
        <div className="page-keys" style={{ opacity: 0.7 }}>
          Last activated: <strong>{lastActivated}</strong>
        </div>
      )}
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          onActivate={handleActivate}
          aria-label="activateFollowFocus axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
              state.selected && !state.focused && 'list-item--selected',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About activateFollowFocus</h3>
        <p className="page-desc">
          The <code>activateFollowFocus</code> axis has the same keyMap as <code>activate</code>.
          The difference is in the metadata: <code>followFocus: true</code> tells the framework to fire
          <code>onActivate</code> whenever focus moves — not just on explicit Enter/Space.
          Click different items to see auto-activation.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: PageFocusTrap.tsx 작성**

focusTrap은 Escape → collapse(). dialog 스타일.

```tsx
import { useState } from 'react'
import { Aria } from '../../interactive-os/components/aria'
import { composePattern } from '../../interactive-os/axes/compose-pattern'
import { focusTrap } from '../../interactive-os/axes/focus-trap'
import { core } from '../../interactive-os/plugins/core'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { NodeState } from '../../interactive-os/behaviors/types'
import { axisListData } from './axis-demo-data'

const behavior = composePattern(
  {
    role: 'dialog',
    childRole: 'group',
    focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
    ariaAttributes: () => ({}),
  },
  focusTrap,
)

const plugins = [core(), focusRecovery()]

export default function PageFocusTrap() {
  const [data, setData] = useState<NormalizedData>(axisListData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">focusTrap</h2>
        <p className="page-desc">
          Escape collapses/dismisses — the exit mechanism for modal patterns.
          Used in dialog and alertdialog behaviors.
        </p>
      </div>
      <div className="page-keys">
        <kbd>Esc</kbd> <span className="key-hint">escape / collapse</span>
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={plugins}
          onChange={setData}
          aria-label="focusTrap axis demo"
        >
          <Aria.Item render={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = [
              'list-item',
              state.focused && 'list-item--focused',
            ].filter(Boolean).join(' ')
            return <div className={cls}>{d?.label as string}</div>
          }} />
        </Aria>
      </div>
      <div className="page-section">
        <h3 className="page-section-title">About focusTrap</h3>
        <p className="page-desc">
          The <code>focusTrap</code> axis binds only <code>Escape</code> → <code>ctx.collapse()</code>.
          This is the simplest axis — one key, one action. All other keys are unbound.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 빌드 확인**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/pages/axis/PageActivate.tsx src/pages/axis/PageActivateFollowFocus.tsx src/pages/axis/PageFocusTrap.tsx
git commit -m "feat(axis): add activation and trap axis showcase pages (activate, activateFollowFocus, focusTrap)"
```

---

### Task 6: App.tsx에 Axis 라우트 그룹 + ActivityBar 등록

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Axis 페이지 import 추가**

App.tsx 상단 import 블록에 추가:

```tsx
import PageNavV from './pages/axis/PageNavV'
import PageNavH from './pages/axis/PageNavH'
import PageNavVhUniform from './pages/axis/PageNavVhUniform'
import PageNavGrid from './pages/axis/PageNavGrid'
import PageDepthArrow from './pages/axis/PageDepthArrow'
import PageDepthEnterEsc from './pages/axis/PageDepthEnterEsc'
import PageSelectToggle from './pages/axis/PageSelectToggle'
import PageSelectExtended from './pages/axis/PageSelectExtended'
import PageActivate from './pages/axis/PageActivate'
import PageActivateFollowFocus from './pages/axis/PageActivateFollowFocus'
import PageFocusTrap from './pages/axis/PageFocusTrap'
```

lucide-react import에 `Axe` 추가:

```tsx
import { Database, Cog, Compass, Puzzle, Layers, Eye, Map, Box, Sun, Moon, Presentation, Axe } from 'lucide-react'
```

- [ ] **Step 2: routeConfig에 axis 그룹 삽입**

`engine` 다음, `navigation` 이전에 삽입:

```tsx
{
  id: 'axis',
  label: 'Axis',
  icon: Axe,
  basePath: '/axis/nav-v',
  items: [
    { path: 'nav-v', label: 'navV', status: 'ready', component: PageNavV },
    { path: 'nav-h', label: 'navH', status: 'ready', component: PageNavH },
    { path: 'nav-vh-uniform', label: 'navVhUniform', status: 'ready', component: PageNavVhUniform },
    { path: 'nav-grid', label: 'navGrid', status: 'ready', component: PageNavGrid },
    { path: 'depth-arrow', label: 'depthArrow', status: 'ready', component: PageDepthArrow },
    { path: 'depth-enter-esc', label: 'depthEnterEsc', status: 'ready', component: PageDepthEnterEsc },
    { path: 'select-toggle', label: 'selectToggle', status: 'ready', component: PageSelectToggle },
    { path: 'select-extended', label: 'selectExtended', status: 'ready', component: PageSelectExtended },
    { path: 'activate', label: 'activate', status: 'ready', component: PageActivate },
    { path: 'activate-follow-focus', label: 'activateFollowFocus', status: 'ready', component: PageActivateFollowFocus },
    { path: 'focus-trap', label: 'focusTrap', status: 'ready', component: PageFocusTrap },
  ],
},
```

- [ ] **Step 3: 빌드 확인**

Run: `pnpm tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 개발 서버에서 수동 검증**

Run: `pnpm dev`

검증 항목:
1. ActivityBar에 Axe 아이콘 표시 (Store → Engine → Axis → Navigation 순서)
2. Axis 클릭 시 `/axis/nav-v` 페이지 렌더링
3. Sidebar에 11개 축 목록 표시
4. 각 축 페이지 클릭 시 렌더링 + 키보드 동작

- [ ] **Step 5: 커밋**

```bash
git add src/App.tsx
git commit -m "feat(axis): register Axis route group in App.tsx with 11 axis pages"
```

---

### Task 7: 기존 테스트 regression 확인 + PROGRESS.md 업데이트

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: 전체 테스트 실행**

Run: `pnpm test --run`
Expected: 기존 468+ 테스트 전부 통과. 축 코드 변경 없으므로 regression 없음.

- [ ] **Step 2: 빌드 확인**

Run: `pnpm build`
Expected: 빌드 성공

- [ ] **Step 3: PROGRESS.md 업데이트**

⑧ App Shell 섹션에 추가:

```markdown
- [x] Axis Showcase — /axis/{name}, 11개 공유 축 각각 최소 pattern 래핑 인터랙티브 데모, ActivityBar Axis 레이어
```

- [ ] **Step 4: 커밋**

```bash
git add docs/PROGRESS.md
git commit -m "docs: PROGRESS.md — Axis Showcase 완료 기록"
```
