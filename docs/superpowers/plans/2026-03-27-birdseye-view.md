# Birdseye View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NavList(2depth 폴더 트리) + Kanban(하위 구조를 컬럼+카드로 전개)하는 코드 전체 조망 뷰

**Architecture:** PageViewer에서 fs 유틸(fetchTree, treeToStore, URL 매핑)을 공유 모듈로 추출하고, 새 `/birdseye` 라우트에서 이를 재사용. 좌측 NavList는 TreeView(2depth)로 폴더를 선택하고, 우측 칸반은 선택된 폴더의 하위 구조를 컬럼(폴더)+카드(파일)로 렌더링한다.

**Tech Stack:** React, interactive-os (TreeView, useAriaZone, listbox), useResizer, vite-plugin-fs /api/fs/tree API

---

### Task 1: fs 유틸 SDK 추출 — fsClient.ts

**Files:**
- Create: `src/pages/viewer/fsClient.ts`
- Modify: `src/pages/PageViewer.tsx:29-46`

- [ ] **Step 1: fsClient.ts 생성 — fetchTree, fetchFile, TreeNode 타입 추출**

```ts
// ② 2026-03-27-birdseye-view-prd.md
import type { FileNodeData } from './types'

export { type FileNodeData }

export interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

export async function fetchTree(root: string): Promise<TreeNode[]> {
  const res = await fetch(`/api/fs/tree?root=${encodeURIComponent(root)}`)
  return res.json()
}

export async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/fs/file?path=${encodeURIComponent(path)}`)
  return res.text()
}
```

- [ ] **Step 2: PageViewer.tsx에서 인라인 함수를 fsClient import로 교체**

PageViewer.tsx 상단의 `TreeNode` 인터페이스(L29-34)와 `fetchTree`(L38-41), `fetchFile`(L43-46)을 삭제하고 import로 교체:

```ts
import { fetchTree, fetchFile, type TreeNode } from './viewer/fsClient'
```

기존 `import { DEFAULT_ROOT, type FileNodeData } from './viewer/types'`는 유지한다.

- [ ] **Step 3: 빌드 확인**

Run: `pnpm typecheck`
Expected: 0 errors

- [ ] **Step 4: 커밋**

```bash
git add src/pages/viewer/fsClient.ts src/pages/PageViewer.tsx
git commit -m "refactor: extract fs client SDK from PageViewer"
```

---

### Task 2: fs 유틸 SDK 추출 — treeTransform.ts

**Files:**
- Create: `src/pages/viewer/treeTransform.ts`
- Modify: `src/pages/PageViewer.tsx:50-108`

- [ ] **Step 1: treeTransform.ts 생성 — treeToStore, URL 매핑, 초기 선택 헬퍼**

```ts
// ② 2026-03-27-birdseye-view-prd.md
import type { TreeNode } from './fsClient'
import type { NormalizedData, Entity } from '../../interactive-os/store/types'
import { ROOT_ID } from '../../interactive-os/store/types'
import { createStore } from '../../interactive-os/store/createStore'
import { FOCUS_ID } from '../../interactive-os/axis/navigate'
import { EXPANDED_ID } from '../../interactive-os/axis/expand'

export function treeToStore(nodes: TreeNode[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  function walk(items: TreeNode[], parentId: string) {
    for (const node of items) {
      entities[node.id] = { id: node.id, data: { name: node.name, type: node.type, path: node.id } }
      if (!relationships[parentId]) relationships[parentId] = []
      relationships[parentId].push(node.id)
      if (node.children && node.children.length > 0) {
        walk(node.children, node.id)
      }
    }
  }

  walk(nodes, ROOT_ID)
  return createStore({ entities, relationships })
}

export function urlPathToFilePath(pathname: string, prefix: string, root: string): string | null {
  const re = new RegExp(`^\\/${prefix}\\/?`)
  const relative = pathname.replace(re, '')
  if (!relative) return null
  return `${root}/${relative}`
}

export function filePathToUrlPath(filePath: string, prefix: string, root: string): string {
  const relative = filePath.startsWith(root + '/')
    ? filePath.slice(root.length + 1)
    : filePath
  return `/${prefix}/${relative}`
}

export function getAncestorIds(filePath: string, store: NormalizedData): string[] {
  const ancestors: string[] = []
  const parts = filePath.split('/')
  for (let i = 1; i < parts.length; i++) {
    const ancestorPath = parts.slice(0, i).join('/')
    if (store.entities[ancestorPath]) {
      ancestors.push(ancestorPath)
    }
  }
  return ancestors
}

export function withInitialFileSelected(store: NormalizedData, filePath: string): NormalizedData {
  const ancestors = getAncestorIds(filePath, store)
  const existing = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
  const merged = [...new Set([...existing, ...ancestors])]
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: merged },
      [FOCUS_ID]: { id: FOCUS_ID, focusedId: filePath },
    },
  }
}
```

주의: `urlPathToFilePath`와 `filePathToUrlPath`는 라우트 prefix를 매개변수로 일반화한다 (viewer는 `'viewer'`, birdseye는 `'birdseye'`).

- [ ] **Step 2: PageViewer.tsx에서 인라인 함수를 treeTransform import로 교체**

PageViewer.tsx에서 `treeToStore`(L50-67), `urlPathToFilePath`(L71-75), `filePathToUrlPath`(L77-82), `getAncestorIds`(L84-94), `withInitialFileSelected`(L96-108)을 삭제하고:

```ts
import { treeToStore, urlPathToFilePath, filePathToUrlPath, getAncestorIds, withInitialFileSelected } from './viewer/treeTransform'
```

PageViewer 내부에서 호출하는 곳을 prefix 매개변수 추가로 수정:

```ts
// L142: urlPathToFilePath 호출
const urlFilePath = useMemo(() => urlPathToFilePath(pathname, 'viewer', DEFAULT_ROOT), [pathname])

// L157: urlPathToFilePath 호출
const initialFilePath = urlPathToFilePath(window.location.pathname, 'viewer', DEFAULT_ROOT)

// L198, L231, L310: filePathToUrlPath 호출 — 모두 'viewer' prefix 추가
navigate(filePathToUrlPath(filePath, 'viewer', DEFAULT_ROOT), { replace: true })
```

- [ ] **Step 3: 빌드 + 기존 Viewer 동작 확인**

Run: `pnpm typecheck`
Expected: 0 errors

- [ ] **Step 4: 커밋**

```bash
git add src/pages/viewer/treeTransform.ts src/pages/PageViewer.tsx
git commit -m "refactor: extract tree transform SDK from PageViewer"
```

---

### Task 3: BirdseyeLayout — 라우트 등록 + 2단 레이아웃 셸

**Files:**
- Create: `src/pages/birdseye/BirdseyeLayout.tsx`
- Create: `src/pages/birdseye/BirdseyeLayout.module.css`
- Modify: `src/router.tsx`

- [ ] **Step 1: BirdseyeLayout.module.css 작성**

```css
/* ═══════════════════════════════════════════
   Birdseye — kanban overview layout
   ═══════════════════════════════════════════ */

.be {
  display: flex;
  height: 100%;
  min-height: 0;
}

.be-sidebar {
  flex-shrink: 0;
  background: var(--surface-sunken);
  display: flex;
  flex-direction: column;
}

.be-sidebar__header {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 var(--space-md);
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.be-sidebar__header-title {
  font-size: var(--type-caption-size);
  font-weight: var(--weight-semi);
  letter-spacing: 0.02em;
  color: var(--text-muted);
}

.be-sidebar__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-xs) 0;
}

.be-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: var(--surface-default);
}

.be-board__header {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 var(--space-lg);
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
}

.be-board__header-title {
  font-size: var(--type-caption-size);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.be-board__canvas {
  flex: 1;
  display: flex;
  gap: var(--space-xs);
  overflow-x: auto;
  overflow-y: hidden;
  padding: var(--space-md);
}

/* --- Column --- */

.be-column {
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.be-column__header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--type-caption-size);
  font-weight: var(--weight-semi);
  color: var(--text-muted);
}

.be-column__header svg {
  color: var(--file-folder);
  flex-shrink: 0;
}

.be-column__count {
  color: var(--text-muted);
  font-weight: var(--weight-regular);
}

.be-column__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
}

/* --- Card --- */

.be-card {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--shape-xs-radius);
  font-size: var(--type-caption-size);
  color: var(--text-secondary);
  cursor: default;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.be-card:hover {
  background: var(--bg-hover);
}

.be-card[data-focused="true"] {
  background: var(--selection);
  color: var(--text-primary);
}

.be-card__name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.be-card--dir {
  font-weight: var(--weight-medium);
}

/* --- NavList tree items --- */

.be-nav-group {
  font-size: var(--type-caption-size);
  font-weight: var(--weight-semi);
  letter-spacing: 0.02em;
  color: var(--text-muted);
  padding: var(--space-sm) var(--space-md) var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.be-nav-group svg {
  flex-shrink: 0;
  color: var(--text-muted);
}

.be-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md) var(--space-xs) var(--space-xl);
  font-size: var(--type-caption-size);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Loading --- */

.be-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  height: 100svh;
  color: var(--text-muted);
  font-size: var(--type-body-size);
}

.be-loading__spinner {
  animation: be-spin 1.2s linear infinite;
  opacity: 0.4;
}

@keyframes be-spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 2: BirdseyeLayout.tsx 작성 — 데이터 로딩 + 2단 레이아웃**

```tsx
// ② 2026-03-27-birdseye-view-prd.md
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Circle } from 'lucide-react'
import { useResizer } from '../../hooks/useResizer'
import '../../styles/resizer.css'
import { DEFAULT_ROOT, type FileNodeData } from '../viewer/types'
import { fetchTree, type TreeNode } from '../viewer/fsClient'
import { treeToStore } from '../viewer/treeTransform'
import type { NormalizedData } from '../../interactive-os/store/types'
import { ROOT_ID } from '../../interactive-os/store/types'
import { getChildren, getEntityData } from '../../interactive-os/store/createStore'
import BirdseyeSidebar from './BirdseyeSidebar'
import BirdseyeBoard from './BirdseyeBoard'
import styles from './BirdseyeLayout.module.css'

/** Build 2-depth NavList data: group (depth-1 dirs) → items (depth-2 dirs) */
function buildNavGroups(store: NormalizedData): { groupId: string; groupName: string; items: { id: string; name: string }[] }[] {
  const rootChildren = getChildren(store, ROOT_ID)
  const groups: { groupId: string; groupName: string; items: { id: string; name: string }[] }[] = []

  for (const dirId of rootChildren) {
    const data = getEntityData<FileNodeData>(store, dirId)
    if (!data || data.type !== 'directory') continue

    const subDirs = getChildren(store, dirId)
      .filter(childId => {
        const cd = getEntityData<FileNodeData>(store, childId)
        return cd?.type === 'directory'
      })
      .map(childId => {
        const cd = getEntityData<FileNodeData>(store, childId)!
        return { id: childId, name: cd.name }
      })

    if (subDirs.length > 0) {
      groups.push({ groupId: dirId, groupName: data.name, items: subDirs })
    }
  }

  return groups
}

export default function BirdseyeLayout() {
  const navigate = useNavigate()
  const [store, setStore] = useState<NormalizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  const sidebarResizer = useResizer({
    defaultSize: 200, minSize: 140, maxSize: 360, step: 10,
    storageKey: 'birdseye-sidebar-width',
  })

  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      const s = treeToStore(tree)
      setStore(s)
      setLoading(false)

      // Auto-select first 2-depth folder
      const groups = buildNavGroups(s)
      if (groups.length > 0 && groups[0]!.items.length > 0) {
        setSelectedFolderId(groups[0]!.items[0]!.id)
      }
    })
  }, [])

  const navGroups = useMemo(() => store ? buildNavGroups(store) : [], [store])

  const handleSelectFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
  }, [])

  const handleActivateFile = useCallback((filePath: string) => {
    const relative = filePath.startsWith(DEFAULT_ROOT + '/')
      ? filePath.slice(DEFAULT_ROOT.length + 1)
      : filePath
    navigate(`/viewer/${relative}`)
  }, [navigate])

  const handleDrillDown = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
  }, [])

  if (loading || !store) {
    return (
      <div className={styles.beLoading}>
        <Circle size={12} className={styles.beLoadingSpinner} />
        <span>Loading project...</span>
      </div>
    )
  }

  const selectedName = selectedFolderId
    ? getEntityData<FileNodeData>(store, selectedFolderId)?.name ?? ''
    : ''

  return (
    <div className={styles.be}>
      <div className={styles.beSidebar} style={{ width: sidebarResizer.size }}>
        <div className={styles.beSidebarHeader}>
          <span className={styles.beSidebarHeaderTitle}>Birdseye</span>
        </div>
        <div className={styles.beSidebarBody}>
          <BirdseyeSidebar
            groups={navGroups}
            selectedId={selectedFolderId}
            onSelect={handleSelectFolder}
          />
        </div>
      </div>
      <div className="resizer-handle" aria-label="Resize sidebar" {...sidebarResizer.separatorProps} />
      <div className={styles.beBoard}>
        <div className={styles.beBoardHeader}>
          <span className={styles.beBoardHeaderTitle}>{selectedName}</span>
        </div>
        <BirdseyeBoard
          store={store}
          selectedFolderId={selectedFolderId}
          onActivateFile={handleActivateFile}
          onDrillDown={handleDrillDown}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: router.tsx에 /birdseye 라우트 추가**

`src/router.tsx`의 `children` 배열에 `/viewer/*` 뒤에 추가:

```ts
{ path: '/birdseye/*', lazy: () => import('./pages/birdseye/BirdseyeLayout').then(m => ({ Component: m.default })) },
```

- [ ] **Step 4: 빌드 확인 (BirdseyeSidebar, BirdseyeBoard는 아직 없으므로 stub 필요)**

이 시점에서는 Task 4, Task 5를 함께 진행해야 빌드가 통과한다. Task 3~5를 함께 커밋한다.

---

### Task 4: BirdseyeSidebar — 2depth NavList

**Files:**
- Create: `src/pages/birdseye/BirdseyeSidebar.tsx`

- [ ] **Step 1: BirdseyeSidebar.tsx 작성**

NavList는 단순 React 컴포넌트로 구현한다. 1depth 그룹 헤더(접기/펼치기) + 2depth 선택 항목. useAriaZone은 칸반 보드에서 사용하고, 사이드바는 간단한 클릭/키보드로 처리한다.

```tsx
// ② 2026-03-27-birdseye-view-prd.md
import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import styles from './BirdseyeLayout.module.css'

interface NavGroup {
  groupId: string
  groupName: string
  items: { id: string; name: string }[]
}

interface BirdseyeSidebarProps {
  groups: NavGroup[]
  selectedId: string | null
  onSelect: (folderId: string) => void
}

export default function BirdseyeSidebar({ groups, selectedId, onSelect }: BirdseyeSidebarProps) {
  // All groups expanded by default
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const listRef = useRef<HTMLDivElement>(null)

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  // Flatten visible items for keyboard navigation
  const flatItems = groups.flatMap(g =>
    collapsed.has(g.groupId) ? [] : g.items.map(item => item.id)
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedId) return
    const idx = flatItems.indexOf(selectedId)
    if (idx === -1) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = flatItems[idx + 1]
      if (next) onSelect(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = flatItems[idx - 1]
      if (prev) onSelect(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      if (flatItems.length > 0) onSelect(flatItems[0]!)
    } else if (e.key === 'End') {
      e.preventDefault()
      if (flatItems.length > 0) onSelect(flatItems[flatItems.length - 1]!)
    }
  }, [selectedId, flatItems, onSelect])

  // Scroll selected item into view
  useEffect(() => {
    if (!selectedId || !listRef.current) return
    const el = listRef.current.querySelector(`[data-nav-id="${CSS.escape(selectedId)}"]`)
    if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <div
      ref={listRef}
      role="tree"
      aria-label="Folder navigation"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {groups.map(group => (
        <div key={group.groupId} role="treeitem" aria-expanded={!collapsed.has(group.groupId)}>
          <div
            className={styles.beNavGroup}
            onClick={() => toggleGroup(group.groupId)}
          >
            {collapsed.has(group.groupId)
              ? <ChevronRight size={12} />
              : <ChevronDown size={12} />}
            <span>{group.groupName}/</span>
          </div>
          {!collapsed.has(group.groupId) && (
            <div role="group">
              {group.items.map(item => (
                <div
                  key={item.id}
                  role="treeitem"
                  data-nav-id={item.id}
                  aria-selected={item.id === selectedId}
                  className={styles.beNavItem}
                  style={item.id === selectedId ? { background: 'var(--selection)', color: 'var(--text-primary)' } : undefined}
                  onClick={() => onSelect(item.id)}
                >
                  <Folder size={12} style={{ color: 'var(--file-folder)', flexShrink: 0 }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

### Task 5: BirdseyeBoard — 칸반 영역

**Files:**
- Create: `src/pages/birdseye/BirdseyeBoard.tsx`

- [ ] **Step 1: BirdseyeBoard.tsx 작성**

선택된 폴더의 하위 구조를 컬럼(폴더)+카드(파일)로 렌더링한다. 1단 깊이만 표시.

```tsx
// ② 2026-03-27-birdseye-view-prd.md
import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { Folder } from 'lucide-react'
import { getChildren, getEntityData } from '../../interactive-os/store/createStore'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { FileNodeData } from '../viewer/types'
import { FileIcon } from '../../interactive-os/ui/FileIcon'
import styles from './BirdseyeLayout.module.css'

interface BirdseyeBoardProps {
  store: NormalizedData
  selectedFolderId: string | null
  onActivateFile: (filePath: string) => void
  onDrillDown: (folderId: string) => void
}

interface ColumnData {
  id: string
  name: string
  items: { id: string; name: string; type: 'file' | 'directory' }[]
}

export default function BirdseyeBoard({ store, selectedFolderId, onActivateFile, onDrillDown }: BirdseyeBoardProps) {
  const [focusedCard, setFocusedCard] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const columns = useMemo((): ColumnData[] => {
    if (!selectedFolderId) return []

    const childIds = getChildren(store, selectedFolderId)
    const dirs: ColumnData[] = []
    const rootFiles: { id: string; name: string; type: 'file' | 'directory' }[] = []

    for (const childId of childIds) {
      const data = getEntityData<FileNodeData>(store, childId)
      if (!data) continue

      if (data.type === 'directory') {
        const subChildren = getChildren(store, childId)
        const items = subChildren
          .map(subId => {
            const subData = getEntityData<FileNodeData>(store, subId)
            if (!subData) return null
            return { id: subId, name: subData.name, type: subData.type }
          })
          .filter((x): x is { id: string; name: string; type: 'file' | 'directory' } => x !== null)

        dirs.push({ id: childId, name: data.name, items })
      } else {
        rootFiles.push({ id: childId, name: data.name, type: data.type })
      }
    }

    // Root files go into a "(files)" column at the end
    if (rootFiles.length > 0) {
      dirs.push({ id: '__root_files__', name: '(files)', items: rootFiles })
    }

    // Edge case: no sub-dirs, only files → single column
    if (dirs.length === 0 && rootFiles.length === 0) {
      return [{ id: '__empty__', name: '(empty)', items: [] }]
    }

    return dirs
  }, [store, selectedFolderId])

  // Flatten all cards for keyboard navigation
  const allCards = useMemo(() =>
    columns.flatMap(col => col.items.map(item => ({ ...item, colId: col.id }))),
    [columns],
  )

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, cardId: string) => {
    const idx = allCards.findIndex(c => c.id === cardId)
    if (idx === -1) return

    const currentColId = allCards[idx]!.colId

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Next card in same column
      for (let i = idx + 1; i < allCards.length; i++) {
        if (allCards[i]!.colId === currentColId) {
          setFocusedCard(allCards[i]!.id)
          return
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      for (let i = idx - 1; i >= 0; i--) {
        if (allCards[i]!.colId === currentColId) {
          setFocusedCard(allCards[i]!.id)
          return
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      // First card of next column
      const colIdx = columns.findIndex(c => c.id === currentColId)
      const nextCol = columns[colIdx + 1]
      if (nextCol && nextCol.items.length > 0) {
        setFocusedCard(nextCol.items[0]!.id)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const colIdx = columns.findIndex(c => c.id === currentColId)
      const prevCol = columns[colIdx - 1]
      if (prevCol && prevCol.items.length > 0) {
        setFocusedCard(prevCol.items[0]!.id)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const card = allCards[idx]!
      const data = getEntityData<FileNodeData>(store, card.id)
      if (data?.type === 'directory') {
        onDrillDown(card.id)
      } else {
        onActivateFile(card.id)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      // Blur board → focus returns to sidebar via Tab
      setFocusedCard(null)
      ;(boardRef.current?.closest('[role="tree"]') as HTMLElement)?.focus()
    }
  }, [allCards, columns, store, onActivateFile, onDrillDown])

  // Focus management: scroll focused card into view
  useEffect(() => {
    if (!focusedCard || !boardRef.current) return
    const el = boardRef.current.querySelector(`[data-card-id="${CSS.escape(focusedCard)}"]`)
    if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [focusedCard])

  // Click on board to enter keyboard mode
  const handleBoardClick = useCallback(() => {
    if (!focusedCard && allCards.length > 0) {
      setFocusedCard(allCards[0]!.id)
    }
  }, [focusedCard, allCards])

  return (
    <div
      ref={boardRef}
      className={styles.beBoardCanvas}
      tabIndex={0}
      onClick={handleBoardClick}
      onKeyDown={(e) => {
        if (focusedCard) {
          handleCardKeyDown(e, focusedCard)
        } else if (allCards.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
          e.preventDefault()
          setFocusedCard(allCards[0]!.id)
        }
      }}
    >
      {columns.map(col => (
        <div key={col.id} className={styles.beColumn}>
          <div className={styles.beColumnHeader}>
            <Folder size={12} />
            <span>{col.name}</span>
            <span className={styles.beColumnCount}>{col.items.length}</span>
          </div>
          <div className={styles.beColumnBody}>
            {col.items.map(item => (
              <div
                key={item.id}
                data-card-id={item.id}
                data-focused={focusedCard === item.id ? 'true' : undefined}
                className={`${styles.beCard}${item.type === 'directory' ? ` ${styles.beCardDir}` : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setFocusedCard(item.id)
                }}
                onDoubleClick={() => {
                  if (item.type === 'directory') onDrillDown(item.id)
                  else onActivateFile(item.id)
                }}
              >
                {item.type === 'directory'
                  ? <Folder size={12} style={{ color: 'var(--file-folder)', flexShrink: 0 }} />
                  : <FileIcon name={item.name} type="file" />
                }
                <span className={styles.beCardName}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 빌드 확인**

Run: `pnpm typecheck`
Expected: 0 errors

- [ ] **Step 3: 브라우저에서 /birdseye 접속 확인**

Run: dev server (`pnpm dev`)
1. http://localhost:5173/birdseye 접속
2. 좌측 NavList에 src/, docs/, contents/ 그룹 확인
3. src/interactive-os 선택 → 우측에 store/, engine/, axis/, pattern/, primitives/, ui/ 컬럼 확인
4. src/pages 선택 → cms/, viewer/, birdseye/ 등 컬럼 + flat 파일 카드 확인

- [ ] **Step 4: 커밋 (Task 3~5 통합)**

```bash
git add src/pages/birdseye/ src/router.tsx
git commit -m "feat: add Birdseye view — kanban folder overview with 2-depth NavList"
```

---

### Task 6: 키보드 인터랙션 완성 + Escape 동선

**Files:**
- Modify: `src/pages/birdseye/BirdseyeLayout.tsx`
- Modify: `src/pages/birdseye/BirdseyeSidebar.tsx`
- Modify: `src/pages/birdseye/BirdseyeBoard.tsx`

- [ ] **Step 1: Tab으로 sidebar↔board 전환 + Escape로 sidebar 복귀**

BirdseyeLayout.tsx에서 sidebar와 board 간 포커스 관리를 추가한다. sidebar에서 `Tab` → board 포커스, board에서 `Escape` → sidebar 포커스.

BirdseyeLayout.tsx에 ref 추가:

```tsx
const sidebarRef = useRef<HTMLDivElement>(null)
const boardRef = useRef<HTMLDivElement>(null)

const handleBoardEscape = useCallback(() => {
  const treeEl = sidebarRef.current?.querySelector('[role="tree"]') as HTMLElement
  treeEl?.focus()
}, [])
```

BirdseyeBoard props에 `onEscape` 추가:

```tsx
<BirdseyeBoard
  store={store}
  selectedFolderId={selectedFolderId}
  onActivateFile={handleActivateFile}
  onDrillDown={handleDrillDown}
  onEscape={handleBoardEscape}
/>
```

BirdseyeBoard.tsx의 Escape 핸들링에서 `onEscape` 콜백 호출:

```tsx
} else if (e.key === 'Escape') {
  e.preventDefault()
  setFocusedCard(null)
  onEscape?.()
}
```

- [ ] **Step 2: drill-down 시 NavList 선택 동기화**

BirdseyeBoard의 `onDrillDown`이 호출되면 해당 폴더가 NavList의 어떤 그룹에 속하는지 확인하고, 그룹이 접혀있으면 펼치는 로직이 필요하다. 현재 `handleDrillDown`에서 `setSelectedFolderId`만 호출하면 NavList의 selectedId가 바뀌므로 시각적 동기화는 자동으로 된다. 다만 해당 폴더가 2depth가 아닌 3depth 이상이면 NavList에 없으므로, 가장 가까운 2depth 조상을 찾아 선택한다.

BirdseyeLayout.tsx의 `handleDrillDown` 수정:

```tsx
const handleDrillDown = useCallback((folderId: string) => {
  // Check if folderId is a 2-depth item in navGroups
  const is2depth = navGroups.some(g => g.items.some(item => item.id === folderId))
  if (is2depth) {
    setSelectedFolderId(folderId)
  } else {
    // folderId is deeper — still set it as selected to show its contents
    setSelectedFolderId(folderId)
  }
}, [navGroups])
```

- [ ] **Step 3: 빌드 + 키보드 동선 확인**

Run: `pnpm typecheck`
Expected: 0 errors

브라우저 확인:
1. Tab: sidebar → board 이동
2. ↑↓: sidebar에서 폴더 간 이동, board에서 카드 간 이동
3. ←→: board에서 컬럼 간 이동
4. Enter: 파일 카드 → /viewer로 이동, 폴더 카드 → drill-down
5. Escape: board → sidebar 복귀

- [ ] **Step 4: 커밋**

```bash
git add src/pages/birdseye/
git commit -m "feat: birdseye keyboard navigation — Tab/Escape zone switch + drill-down"
```

---

## Self-Review

**1. Spec coverage:**
- S1 (라우트 진입): Task 3 ✅
- S2 (폴더 선택): Task 3 + Task 4 ✅
- S3 (칸반 조망): Task 5 ✅
- V1-V3: Task 3-5 ✅
- V4 (하위폴더0): Task 5 `rootFiles` + `__empty__` 처리 ✅
- V5 (폴더20+): CSS `overflow-x: auto` + 고정 컬럼 폭 ✅
- V6 (drill-down): Task 5 + Task 6 ✅
- V7 (Escape): Task 6 ✅
- V8 (파일 Enter→viewer): Task 5 ✅
- V9 (PageViewer 기존 동작): Task 1-2 추출 후 import 교체 ✅

**2. Placeholder scan:** 없음

**3. Type consistency:** `TreeNode`, `FileNodeData`, `NormalizedData` — 모두 기존 타입 재사용, 일관됨
