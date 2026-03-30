# Birdseye Improve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** birdseye를 "파일시스템 칸반"에서 "아키텍처 조망 도구"로 전환. 3 features + 2 minor.

**Architecture:** F1은 서버에 folder-deps API를 추가하고 클라이언트에서 위상 정렬. F2는 ui/ 완성품 Treemap 컴포넌트. F3은 기존 handleQuickOpenSelect 수정. 부수는 1줄 수정 + CSS.

**Tech Stack:** React, NormalizedData store, vite-plugin-fs (서버), CSS Modules, vitest

---

### Task 1: 서버 folder-deps API + 클라이언트 topoSortDirs (F1 핵심)

**Files:**
- Modify: `vite-plugin-fs.ts:392` (서버 — 새 엔드포인트)
- Modify: `src/pages/viewer/fsClient.ts` (클라이언트 — 새 fetch 함수)
- Modify: `src/pages/birdseye/birdseyeTransform.ts` (위상 정렬 함수 + buildKanbanStore 수정)
- Test: `src/__tests__/birdseye/birdseyeTransform.test.ts`

- [ ] **Step 1: 서버 `/api/fs/folder-deps` 엔드포인트 추가**

`vite-plugin-fs.ts`에서 `/api/fs/dep-counts` 블록 뒤에 추가. forwardCache에서 폴더 단위로 집계.

```typescript
// vite-plugin-fs.ts — /api/fs/dep-counts 블록 뒤에 추가
if (url.pathname === '/api/fs/folder-deps') {
  const root = url.searchParams.get('root') ?? path.resolve('.')
  const folder = url.searchParams.get('folder')
  if (!folder) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'folder param required' }))
    return
  }
  if (!forwardCache || !reverseCache || cacheProjectRoot !== root) {
    buildCaches(root)
  }
  // 폴더의 직접 자식 디렉토리 목록
  const folderPath = path.resolve(folder)
  const childDirs = new Set<string>()
  for (const [file] of forwardCache!) {
    if (file.startsWith(folderPath + '/')) {
      const rel = file.slice(folderPath.length + 1)
      const firstDir = rel.split('/')[0]
      if (rel.includes('/')) childDirs.add(firstDir)
    }
  }
  // 디렉토리 간 의존 방향 집계: { from: dirName, to: dirName }[]
  const edges: { from: string; to: string }[] = []
  const edgeSet = new Set<string>()
  for (const [file, deps] of forwardCache!) {
    if (!file.startsWith(folderPath + '/')) continue
    const fileRel = file.slice(folderPath.length + 1)
    const fileDir = fileRel.split('/')[0]
    if (!fileRel.includes('/')) continue // 루트 파일 제외
    for (const dep of deps) {
      if (!dep.startsWith(folderPath + '/')) continue
      const depRel = dep.slice(folderPath.length + 1)
      const depDir = depRel.split('/')[0]
      if (!depRel.includes('/')) continue
      if (fileDir === depDir) continue // 같은 폴더 내 의존 제외
      const key = `${fileDir}->${depDir}`
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({ from: fileDir, to: depDir })
      }
    }
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ dirs: [...childDirs], edges }))
  return
}
```

- [ ] **Step 2: 클라이언트 fetchFolderDeps 추가**

```typescript
// src/pages/viewer/fsClient.ts 에 추가
export interface FolderDeps {
  dirs: string[]
  edges: { from: string; to: string }[]
}

export async function fetchFolderDeps(root: string, folder: string): Promise<FolderDeps> {
  const res = await fetch(`/api/fs/folder-deps?root=${encodeURIComponent(root)}&folder=${encodeURIComponent(folder)}`)
  return res.json()
}
```

- [ ] **Step 3: topoSortDirs 위상 정렬 함수 작성 — 테스트 먼저**

```typescript
// src/__tests__/birdseye/birdseyeTransform.test.ts 에 추가
describe('topoSortDirs', () => {
  it('sorts directories by dependency order (depended-on first)', () => {
    // edges: ui→primitives, primitives→pattern, pattern→axis, axis→engine, engine→store
    const edges = [
      { from: 'ui', to: 'primitives' },
      { from: 'primitives', to: 'pattern' },
      { from: 'pattern', to: 'axis' },
      { from: 'axis', to: 'engine' },
      { from: 'engine', to: 'store' },
    ]
    const dirs = ['axis', 'engine', 'pattern', 'primitives', 'store', 'ui']
    const result = topoSortDirs(dirs, edges)
    expect(result).toEqual(['store', 'engine', 'axis', 'pattern', 'primitives', 'ui'])
  })

  it('handles cycles gracefully (falls back to alphabetical for cycle members)', () => {
    const edges = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'a' }, // cycle
      { from: 'c', to: 'a' },
    ]
    const dirs = ['a', 'b', 'c']
    const result = topoSortDirs(dirs, edges)
    // a,b are in a cycle — their relative order is alphabetical. c depends on a so comes after.
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('returns alphabetical when no edges', () => {
    const result = topoSortDirs(['z', 'a', 'm'], [])
    expect(result).toEqual(['a', 'm', 'z'])
  })
})
```

- [ ] **Step 4: topoSortDirs 구현**

```typescript
// src/pages/birdseye/birdseyeTransform.ts 에 추가 (export)
/** 폴더 간 의존 그래프에서 위상 정렬. 의존되는 폴더(기반)가 앞에 온다. */
export function topoSortDirs(dirs: string[], edges: { from: string; to: string }[]): string[] {
  const inDegree = new Map<string, number>()
  const graph = new Map<string, string[]>()
  for (const d of dirs) {
    inDegree.set(d, 0)
    graph.set(d, [])
  }
  for (const { from, to } of edges) {
    if (!graph.has(to) || !inDegree.has(from)) continue
    graph.get(to)!.push(from) // to → from (to가 기반, from이 소비)
    inDegree.set(from, (inDegree.get(from) ?? 0) + 1)
  }
  // Kahn's algorithm
  const queue = dirs.filter(d => inDegree.get(d) === 0).sort()
  const result: string[] = []
  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)
    for (const neighbor of graph.get(node) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, deg)
      if (deg === 0) {
        // 삽입 정렬로 알파벳 순서 유지
        const idx = queue.findIndex(q => q.localeCompare(neighbor) > 0)
        queue.splice(idx === -1 ? queue.length : idx, 0, neighbor)
      }
    }
  }
  // 사이클에 갇힌 노드는 알파벳순으로 추가
  const remaining = dirs.filter(d => !result.includes(d)).sort()
  return [...result, ...remaining]
}
```

- [ ] **Step 5: 테스트 실행**

Run: `pnpm test -- src/__tests__/birdseye/birdseyeTransform.test.ts`
Expected: topoSortDirs 3개 테스트 PASS

- [ ] **Step 6: buildKanbanStore에 topoSort fallback 통합**

`birdseyeTransform.ts`의 `KanbanBuildOptions`에 `folderEdges` 필드를 추가하고, `columnOrder`가 없을 때 `topoSortDirs`를 사용.

```typescript
// KanbanBuildOptions에 추가
export interface KanbanBuildOptions {
  columnOrder?: string[]
  depCounts?: Record<string, { imports: number; importedBy: number }>
  extFilter?: string
  /** 폴더 간 의존 edge 목록 — columnOrder가 없을 때 위상 정렬에 사용 */
  folderEdges?: { from: string; to: string }[]
}
```

`buildKanbanStore` 216행의 `sortDirs` 호출 부분을 수정:

```typescript
// 기존: const sortedTopDirs = sortDirs(fsStore, topDirs, options?.columnOrder)
// 변경:
let columnOrder = options?.columnOrder
if (!columnOrder && options?.folderEdges) {
  const dirNames = topDirs.map(id => getEntityData<FsEntityData>(fsStore, id)?.name).filter(Boolean) as string[]
  columnOrder = topoSortDirs(dirNames, options.folderEdges)
}
const sortedTopDirs = sortDirs(fsStore, topDirs, columnOrder)
```

- [ ] **Step 7: BirdseyeLayout.tsx에서 folderDeps fetch + 전달**

```typescript
// BirdseyeLayout.tsx — 상단 import에 추가
import { fetchFolderDeps } from '../viewer/fsClient'
import type { FolderDeps } from '../viewer/fsClient'

// state 추가 (depCounts 근처)
const [folderDeps, setFolderDeps] = useState<FolderDeps | null>(null)

// selectedFolderId가 변경될 때 fetch (useEffect — _meta.yaml fetch 근처)
useEffect(() => {
  if (!selectedFolderId) return
  fetchFolderDeps(DEFAULT_ROOT, selectedFolderId)
    .then(setFolderDeps)
    .catch(() => setFolderDeps(null))
}, [selectedFolderId])

// kanbanStore 빌드 시 전달 (기존 useMemo 수정)
const kanbanStore = useMemo(
  () => (fsStore && selectedFolderId ? buildKanbanStore(fsStore, selectedFolderId, {
    ...kanbanOptions,
    depCounts: depCounts ?? undefined,
    extFilter: extFilter ?? undefined,
    folderEdges: kanbanOptions.columnOrder ? undefined : folderDeps?.edges,
  }) : null),
  [fsStore, selectedFolderId, kanbanOptions, depCounts, extFilter, folderDeps],
)
```

- [ ] **Step 8: 커밋**

```bash
git add vite-plugin-fs.ts src/pages/viewer/fsClient.ts src/pages/birdseye/birdseyeTransform.ts src/pages/birdseye/BirdseyeLayout.tsx src/__tests__/birdseye/birdseyeTransform.test.ts
git commit -m "feat: birdseye topological column ordering — import graph 기반 자동 의존순서 배치"
```

---

### Task 2: Treemap UI 완성품 (F2)

**Files:**
- Create: `src/interactive-os/ui/Treemap.tsx`
- Create: `src/interactive-os/ui/Treemap.module.css`
- Modify: `src/pages/birdseye/BirdseyeLayout.tsx` (treemap 토글 통합)
- Modify: `src/pages/birdseye/BirdseyeLayout.module.css` (treemap 영역 스타일)

- [ ] **Step 1: Treemap 컴포넌트 작성**

squarified treemap 알고리즘으로 LOC 비례 블록을 렌더링하는 UI 완성품.

```typescript
// src/interactive-os/ui/Treemap.tsx
import { useMemo, useCallback } from 'react'
import styles from './Treemap.module.css'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getEntity } from '../store/createStore'

interface TreemapProps {
  data: NormalizedData
  width: number
  height: number
  onActivate?: (nodeId: string) => void
  'aria-label'?: string
}

interface Rect { x: number; y: number; w: number; h: number }

/** Squarified treemap layout */
function squarify(items: { id: string; value: number }[], bounds: Rect): (Rect & { id: string })[] {
  if (items.length === 0) return []
  const total = items.sorted.reduce((s, i) => s + i.value, 0)
  // ... squarify 알고리즘 (slice-and-dice fallback)
  // items를 value 내림차순 정렬 후, bounds 영역을 재귀 분할
  const sorted = [...items].sort((a, b) => b.value - a.value)
  return layoutStrip(sorted, bounds, total)
}

function layoutStrip(items: { id: string; value: number }[], bounds: Rect, total: number): (Rect & { id: string })[] {
  if (items.length === 0 || total === 0) return []
  if (items.length === 1) {
    return [{ ...bounds, id: items[0].id }]
  }

  const { x, y, w, h } = bounds
  const vertical = w >= h

  // 첫 번째 아이템의 비율로 스트립 분할
  let stripSum = 0
  let splitIdx = 1
  const targetRatio = 1 // 정사각형에 가까울수록 좋음

  for (let i = 0; i < items.length - 1; i++) {
    stripSum += items[i].value
    const stripRatio = vertical
      ? (w * stripSum / total) / h
      : w / (h * stripSum / total)
    const nextStripSum = stripSum + items[i + 1].value
    const nextRatio = vertical
      ? (w * nextStripSum / total) / h
      : w / (h * nextStripSum / total)

    if (Math.abs(stripRatio - targetRatio) <= Math.abs(nextRatio - targetRatio)) {
      splitIdx = i + 1
      break
    }
    splitIdx = i + 2
  }

  const strip = items.slice(0, splitIdx)
  const rest = items.slice(splitIdx)
  const stripTotal = strip.reduce((s, i) => s + i.value, 0)
  const fraction = stripTotal / total

  const rects: (Rect & { id: string })[] = []

  if (vertical) {
    const stripW = w * fraction
    let cy = y
    for (const item of strip) {
      const itemH = h * (item.value / stripTotal)
      rects.push({ id: item.id, x, y: cy, w: stripW, h: itemH })
      cy += itemH
    }
    if (rest.length > 0) {
      rects.push(...layoutStrip(rest, { x: x + stripW, y, w: w - stripW, h }, total - stripTotal))
    }
  } else {
    const stripH = h * fraction
    let cx = x
    for (const item of strip) {
      const itemW = w * (item.value / stripTotal)
      rects.push({ id: item.id, x: cx, y, w: itemW, h: stripH })
      cx += itemW
    }
    if (rest.length > 0) {
      rects.push(...layoutStrip(rest, { x, y: y + stripH, w, h: h - stripH }, total - stripTotal))
    }
  }

  return rects
}

export function Treemap({ data, width, height, onActivate, 'aria-label': ariaLabel }: TreemapProps) {
  const columns = getChildren(data, ROOT_ID)

  // 컬럼별 카드를 flat하게 모아서 treemap 입력 생성
  const items = useMemo(() => {
    const result: { id: string; value: number; title: string; ext?: string; colTitle: string }[] = []
    for (const colId of columns) {
      const colEntity = getEntity(data, colId)
      const colTitle = (colEntity?.data as Record<string, unknown>)?.title as string ?? ''
      const cards = getChildren(data, colId)
      for (const cardId of cards) {
        const card = getEntity(data, cardId)
        const cardData = card?.data as Record<string, unknown> | undefined
        const loc = cardData?.loc as number | undefined
        result.push({
          id: cardId,
          value: loc ?? 1,
          title: cardData?.title as string ?? '',
          ext: cardData?.ext as string | undefined,
          colTitle,
        })
      }
    }
    return result
  }, [data, columns])

  const rects = useMemo(() => squarify(items, { x: 0, y: 0, w: width, h: height }), [items, width, height])

  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items])

  const handleClick = useCallback((id: string) => { onActivate?.(id) }, [onActivate])

  return (
    <div className={styles.treemap} style={{ width, height, position: 'relative' }} aria-label={ariaLabel} role="group">
      {rects.map(r => {
        const item = itemMap.get(r.id)
        const showLabel = r.w > 60 && r.h > 24
        return (
          <button
            key={r.id}
            className={styles.block}
            data-ext={item?.ext}
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
            title={`${item?.colTitle} > ${item?.title} (${item?.value}L)`}
            onClick={() => handleClick(r.id)}
          >
            {showLabel && <span className={styles.blockLabel}>{item?.title}</span>}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Treemap CSS (토큰 사용, /design-implement)**

```css
/* src/interactive-os/ui/Treemap.module.css */
.treemap {
  position: relative;
  overflow: hidden;
  border-radius: var(--shape-sm-radius);
}

.block {
  position: absolute;
  border: 1px solid var(--surface-border);
  background: var(--surface-default);
  cursor: pointer;
  overflow: hidden;
  padding: var(--space-xs);
  display: flex;
  align-items: flex-end;
  transition: background var(--motion-duration-fast) var(--motion-easing-default);
}

.block:hover {
  background: var(--surface-hover);
}

.block[data-ext="ts"] { --_bar: var(--tone-info-base); }
.block[data-ext="tsx"] { --_bar: var(--tone-success-base); }
.block[data-ext="css"] { --_bar: var(--tone-warning-base); }
.block[data-ext="md"] { --_bar: var(--tone-neutral-base); }

.block::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: var(--space-xs);
  background: var(--_bar, var(--tone-neutral-subtle));
}

.blockLabel {
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-leading);
  color: var(--type-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [ ] **Step 3: BirdseyeLayout에 treemap 토글 통합**

```typescript
// BirdseyeLayout.tsx — state 추가
const [viewMode, setViewMode] = useState<'kanban' | 'treemap'>('kanban')

// boardHeader legend 영역에 토글 추가
<button
  className={styles.viewToggle}
  onClick={() => setViewMode(v => v === 'kanban' ? 'treemap' : 'kanban')}
  title={viewMode === 'kanban' ? 'Treemap 모드' : 'Kanban 모드'}
>
  {viewMode === 'kanban' ? '▦' : '☰'}
</button>

// boardBody 영역을 viewMode에 따라 분기
{viewMode === 'kanban' ? (
  <div className={styles.boardBody}>
    <Kanban ... />
  </div>
) : (
  <div className={styles.boardBody} ref={treemapContainerRef}>
    <Treemap
      data={kanbanStore}
      width={treemapWidth}
      height={treemapHeight}
      onActivate={(cardId) => {
        setViewMode('kanban')
        setFocusedCardId(cardId)
      }}
      aria-label={`${selectedName} treemap`}
    />
  </div>
)}
```

treemap 컨테이너 크기를 측정하기 위한 ResizeObserver:

```typescript
const treemapContainerRef = useRef<HTMLDivElement>(null)
const [treemapSize, setTreemapSize] = useState({ width: 800, height: 600 })

useEffect(() => {
  const el = treemapContainerRef.current
  if (!el || viewMode !== 'treemap') return
  const ro = new ResizeObserver(([entry]) => {
    setTreemapSize({ width: entry.contentRect.width, height: entry.contentRect.height })
  })
  ro.observe(el)
  return () => ro.disconnect()
}, [viewMode])
```

- [ ] **Step 4: 커밋**

```bash
git add src/interactive-os/ui/Treemap.tsx src/interactive-os/ui/Treemap.module.css src/pages/birdseye/BirdseyeLayout.tsx src/pages/birdseye/BirdseyeLayout.module.css
git commit -m "feat: birdseye treemap zoom-out mode — LOC 비례 블록으로 전체 조망"
```

---

### Task 3: QuickOpen-to-Kanban Bridge + 부수 개선 (F3 + Minor)

**Files:**
- Modify: `src/pages/birdseye/BirdseyeLayout.tsx`
- Modify: `src/interactive-os/ui/Kanban.module.css` (hub 강조)

- [ ] **Step 1: QuickOpen 브릿지 — handleQuickOpenSelect 수정**

```typescript
// BirdseyeLayout.tsx — 기존 handleQuickOpenSelect를 교체
const handleQuickOpenSelect = useCallback((filePath: string) => {
  // 파일의 부모 폴더를 찾아서 칸반 이동
  const parts = filePath.split('/')
  parts.pop() // 파일명 제거
  while (parts.length > 0) {
    const dirPath = parts.join('/')
    if (fsStore?.entities[dirPath]) {
      selectFolder(dirPath)
      // 폴더 전환 후 해당 카드에 포커스 (다음 렌더 사이클에서)
      requestAnimationFrame(() => {
        const cardEl = document.querySelector(`[data-source="${CSS.escape(filePath)}"]`) as HTMLElement | null
        if (cardEl) {
          cardEl.focus()
          cardEl.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }
      })
      return
    }
    parts.pop()
  }
  // fallback: 폴더를 못 찾으면 기존 동작 (코드만 표시)
  const name = filePath.split('/').pop() ?? ''
  setViewerFilename(name)
  const token = ++fetchRef.current
  fetchFile(filePath).then((content) => {
    if (fetchRef.current === token) setViewerCode(content)
  })
}, [fsStore, selectFolder])
```

- [ ] **Step 2: 히스토리 push — replace 제거**

```typescript
// BirdseyeLayout.tsx:217 — 기존:
// setSearchParams({ folder: relative }, { replace: true })
// 변경:
setSearchParams({ folder: relative })
```

`{ replace: true }` 제거 한 줄. 이제 각 폴더 이동이 브라우저 히스토리에 push되어 뒤로가기로 복귀 가능.

- [ ] **Step 3: Hub 카드 시각 강조 — CSS 강화**

```css
/* Kanban.module.css — 기존 .card[data-hub] 스타일 강화 */
.board[data-compact] .card[data-hub] {
  border-inline-start-width: var(--space-xs);
  border-inline-start-color: var(--tone-info-base);
  background: color-mix(in srgb, var(--tone-info-base) 6%, var(--surface-default));
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/pages/birdseye/BirdseyeLayout.tsx src/interactive-os/ui/Kanban.module.css
git commit -m "feat: birdseye QuickOpen→Kanban bridge + 히스토리 push + hub 강조"
```

---

## 의존 관계

```
Task 1 (F1 topoSort) ──→ Task 2 (F2 treemap) — treemap도 정렬된 kanbanStore 사용
Task 3 (F3 + minor) ──→ 독립
```

Task 1과 Task 3은 병렬 가능. Task 2는 Task 1 이후.
