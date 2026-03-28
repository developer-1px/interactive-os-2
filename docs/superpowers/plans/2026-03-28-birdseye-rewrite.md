# Birdseye Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/birdseye` 라우트를 OS UI 완성품(NavList + Kanban + SplitPane) 기반으로 전면 재작성하여, 프로젝트 파일시스템을 칸반 2D 조감도로 시각화한다.

**Architecture:** `fetchTree` → `treeToStore` (기존 인프라 재사용) → 2개 NormalizedData 변환: NavList용(그룹+항목)과 Kanban용(컬럼+카드). SplitPane이 좌측 NavList와 우측 Kanban을 분할. NavList에서 폴더 선택 시 Kanban 데이터가 재생성된다.

**Tech Stack:** React, interactive-os UI components (NavList, Kanban, SplitPane), existing fsClient/treeTransform

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/pages/birdseye/birdseyeTransform.ts` | fs store → NavList store + Kanban store 변환 함수 |
| Modify | `src/interactive-os/ui/Kanban.tsx` | `onActivate` prop 추가 (useAria에 전달) |
| Rewrite | `src/pages/birdseye/BirdseyeLayout.tsx` | SplitPane + NavList + Kanban 조립 |
| Rewrite | `src/pages/birdseye/BirdseyeLayout.module.css` | 최소 스타일 (헤더, Kanban 오버라이드) |
| Delete | `src/pages/birdseye/BirdseyeSidebar.tsx` | NavList로 대체 |
| Delete | `src/pages/birdseye/BirdseyeBoard.tsx` | Kanban으로 대체 |
| Create | `src/__tests__/birdseye/birdseyeTransform.test.ts` | 변환 함수 unit 테스트 |

---

### Task 1: Kanban onActivate prop 추가

**Files:**
- Modify: `src/interactive-os/ui/Kanban.tsx`

`useAria`는 이미 `onActivate`를 지원한다. Kanban 컴포넌트가 이를 노출하지 않을 뿐이다. prop 추가 + pass-through만 하면 된다.

- [ ] **Step 1: KanbanProps에 onActivate 추가하고 useAria에 전달**

```tsx
// src/interactive-os/ui/Kanban.tsx — 변경 부분만

interface KanbanProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void    // ← 추가
  'aria-label'?: string
}

export function Kanban({
  data,
  plugins = [],
  onChange,
  onActivate,                               // ← 추가
  'aria-label': ariaLabel,
}: KanbanProps) {
  const aria = useAria({ behavior: kanbanBehavior, data, plugins, onChange, onActivate })  // ← onActivate 전달
  // ... 나머지 동일
```

- [ ] **Step 2: typecheck 확인**

```bash
pnpm typecheck
```

Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add src/interactive-os/ui/Kanban.tsx
git commit -m "feat(Kanban): expose onActivate prop via useAria pass-through"
```

---

### Task 2: birdseyeTransform — 변환 함수

**Files:**
- Create: `src/pages/birdseye/birdseyeTransform.ts`
- Create: `src/__tests__/birdseye/birdseyeTransform.test.ts`

fs store(전체 트리)에서 NavList용 store와 Kanban용 store를 생성하는 순수 함수 2개.

- [ ] **Step 1: 테스트 파일 작성**

```ts
// src/__tests__/birdseye/birdseyeTransform.test.ts
import { describe, it, expect } from 'vitest'
import { buildNavStore, buildKanbanStore } from '../../pages/birdseye/birdseyeTransform'
import { createStore, getChildren, getEntityData } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'

/**
 * Test fixture: minimal fs tree store
 *
 * ROOT
 *   ├── src/                 (directory)
 *   │   ├── pages/           (directory)
 *   │   │   ├── Home.tsx     (file)
 *   │   │   └── About.tsx    (file)
 *   │   ├── utils/           (directory)
 *   │   │   └── math.ts      (file)
 *   │   └── index.ts         (file, root-level in src)
 *   └── docs/                (directory)
 *       ├── guide/           (directory)
 *       │   └── intro.md     (file)
 *       └── README.md        (file, root-level in docs)
 */
function createFixture() {
  return createStore({
    entities: {
      'src':              { id: 'src',              data: { name: 'src',        type: 'directory', path: 'src' } },
      'src/pages':        { id: 'src/pages',        data: { name: 'pages',      type: 'directory', path: 'src/pages' } },
      'src/pages/Home':   { id: 'src/pages/Home',   data: { name: 'Home.tsx',   type: 'file',      path: 'src/pages/Home.tsx' } },
      'src/pages/About':  { id: 'src/pages/About',  data: { name: 'About.tsx',  type: 'file',      path: 'src/pages/About.tsx' } },
      'src/utils':        { id: 'src/utils',        data: { name: 'utils',      type: 'directory', path: 'src/utils' } },
      'src/utils/math':   { id: 'src/utils/math',   data: { name: 'math.ts',    type: 'file',      path: 'src/utils/math.ts' } },
      'src/index':        { id: 'src/index',        data: { name: 'index.ts',   type: 'file',      path: 'src/index.ts' } },
      'docs':             { id: 'docs',             data: { name: 'docs',       type: 'directory', path: 'docs' } },
      'docs/guide':       { id: 'docs/guide',       data: { name: 'guide',      type: 'directory', path: 'docs/guide' } },
      'docs/guide/intro': { id: 'docs/guide/intro', data: { name: 'intro.md',   type: 'file',      path: 'docs/guide/intro.md' } },
      'docs/readme':      { id: 'docs/readme',      data: { name: 'README.md',  type: 'file',      path: 'docs/README.md' } },
    },
    relationships: {
      [ROOT_ID]:     ['src', 'docs'],
      'src':         ['src/pages', 'src/utils', 'src/index'],
      'src/pages':   ['src/pages/Home', 'src/pages/About'],
      'src/utils':   ['src/utils/math'],
      'docs':        ['docs/guide', 'docs/readme'],
      'docs/guide':  ['docs/guide/intro'],
    },
  })
}

describe('buildNavStore', () => {
  it('루트 디렉토리를 그룹으로, 2depth 디렉토리를 항목으로 생성한다', () => {
    const fsStore = createFixture()
    const navStore = buildNavStore(fsStore)

    const rootChildren = getChildren(navStore, ROOT_ID)
    // 2 groups: src, docs
    expect(rootChildren).toHaveLength(2)

    // src group
    const srcGroup = getEntityData<{ type: string; label: string }>(navStore, rootChildren[0]!)
    expect(srcGroup?.type).toBe('group')
    expect(srcGroup?.label).toBe('src')

    // src group items = 2depth directories only (pages, utils), not files
    const srcItems = getChildren(navStore, rootChildren[0]!)
    expect(srcItems).toHaveLength(2)
    const pagesItem = getEntityData<{ label: string }>(navStore, srcItems[0]!)
    expect(pagesItem?.label).toBe('pages')

    // docs group
    const docsGroup = getEntityData<{ type: string; label: string }>(navStore, rootChildren[1]!)
    expect(docsGroup?.type).toBe('group')
    expect(docsGroup?.label).toBe('docs')

    const docsItems = getChildren(navStore, rootChildren[1]!)
    expect(docsItems).toHaveLength(1)  // only guide/, not README.md
  })
})

describe('buildKanbanStore', () => {
  it('선택 폴더의 하위 디렉토리를 컬럼으로, 파일을 카드로 생성한다', () => {
    const fsStore = createFixture()
    const kanbanStore = buildKanbanStore(fsStore, 'src')

    const columns = getChildren(kanbanStore, ROOT_ID)
    // 2 dir columns (pages, utils) + 1 files column
    expect(columns).toHaveLength(3)

    // pages column
    const pagesCol = getEntityData<{ title: string }>(kanbanStore, columns[0]!)
    expect(pagesCol?.title).toBe('pages')
    const pagesCards = getChildren(kanbanStore, columns[0]!)
    expect(pagesCards).toHaveLength(2)  // Home.tsx, About.tsx

    // utils column
    const utilsCol = getEntityData<{ title: string }>(kanbanStore, columns[1]!)
    expect(utilsCol?.title).toBe('utils')

    // (files) column for index.ts
    const filesCol = getEntityData<{ title: string }>(kanbanStore, columns[2]!)
    expect(filesCol?.title).toBe('(files)')
    const filesCards = getChildren(kanbanStore, columns[2]!)
    expect(filesCards).toHaveLength(1)  // index.ts
  })

  it('하위 디렉토리가 없으면 단일 (files) 컬럼만 생성한다', () => {
    const fsStore = createFixture()
    const kanbanStore = buildKanbanStore(fsStore, 'src/pages')

    const columns = getChildren(kanbanStore, ROOT_ID)
    expect(columns).toHaveLength(1)

    const col = getEntityData<{ title: string }>(kanbanStore, columns[0]!)
    expect(col?.title).toBe('(files)')
    const cards = getChildren(kanbanStore, columns[0]!)
    expect(cards).toHaveLength(2)
  })

  it('카드 데이터에 원본 id와 type을 보존한다', () => {
    const fsStore = createFixture()
    const kanbanStore = buildKanbanStore(fsStore, 'src')

    const columns = getChildren(kanbanStore, ROOT_ID)
    const pagesCards = getChildren(kanbanStore, columns[0]!)
    const card = getEntityData<{ title: string; sourceId: string; sourceType: string }>(kanbanStore, pagesCards[0]!)
    expect(card?.sourceId).toBe('src/pages/Home')
    expect(card?.sourceType).toBe('file')
  })

  it('폴더 카드도 컬럼 내 항목으로 표시된다 (drill-down 대상)', () => {
    const fsStore = createFixture()
    const kanbanStore = buildKanbanStore(fsStore, 'docs')

    const columns = getChildren(kanbanStore, ROOT_ID)
    // guide/ is a column. README.md goes to (files) column.
    const guideCol = getEntityData<{ title: string }>(kanbanStore, columns[0]!)
    expect(guideCol?.title).toBe('guide')

    const filesCol = getEntityData<{ title: string }>(kanbanStore, columns[1]!)
    expect(filesCol?.title).toBe('(files)')
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
pnpm test -- src/__tests__/birdseye/birdseyeTransform.test.ts
```

Expected: FAIL — `birdseyeTransform` 모듈 없음

- [ ] **Step 3: 변환 함수 구현**

```ts
// src/pages/birdseye/birdseyeTransform.ts
import type { NormalizedData, Entity } from '../../interactive-os/store/types'
import { ROOT_ID } from '../../interactive-os/store/types'
import { createStore, getChildren, getEntityData } from '../../interactive-os/store/createStore'

interface FileNodeData {
  name: string
  type: 'file' | 'directory'
  path: string
}

/**
 * fs store → NavList용 NormalizedData
 *
 * 구조: ROOT → groups(루트 디렉토리) → items(2depth 디렉토리)
 * 파일은 제외 — NavList는 디렉토리만 보여준다
 */
export function buildNavStore(fsStore: NormalizedData): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  const rootDirs = getChildren(fsStore, ROOT_ID)

  for (const dirId of rootDirs) {
    const data = getEntityData<FileNodeData>(fsStore, dirId)
    if (!data || data.type !== 'directory') continue

    const groupId = `group:${dirId}`
    entities[groupId] = { id: groupId, data: { type: 'group', label: data.name } }
    relationships[ROOT_ID].push(groupId)
    relationships[groupId] = []

    const subDirs = getChildren(fsStore, dirId)
    for (const subId of subDirs) {
      const subData = getEntityData<FileNodeData>(fsStore, subId)
      if (!subData || subData.type !== 'directory') continue

      entities[subId] = { id: subId, data: { label: subData.name, sourceId: subId } }
      relationships[groupId].push(subId)
    }
  }

  return createStore({ entities, relationships })
}

/**
 * fs store + 선택된 폴더 → Kanban용 NormalizedData
 *
 * 구조: ROOT → columns(하위 디렉토리) → cards(파일/폴더)
 * 선택 폴더 직하 파일은 "(files)" 컬럼으로 모인다.
 */
export function buildKanbanStore(fsStore: NormalizedData, folderId: string): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  const children = getChildren(fsStore, folderId)
  const dirs: string[] = []
  const files: string[] = []

  for (const childId of children) {
    const data = getEntityData<FileNodeData>(fsStore, childId)
    if (!data) continue
    if (data.type === 'directory') dirs.push(childId)
    else files.push(childId)
  }

  // 하위 디렉토리 → 컬럼
  for (const dirId of dirs) {
    const dirData = getEntityData<FileNodeData>(fsStore, dirId)!
    const colId = `col:${dirId}`
    entities[colId] = { id: colId, data: { title: dirData.name, sourceId: dirId } }
    relationships[ROOT_ID].push(colId)
    relationships[colId] = []

    const subChildren = getChildren(fsStore, dirId)
    for (const subId of subChildren) {
      const subData = getEntityData<FileNodeData>(fsStore, subId)
      if (!subData) continue
      const cardId = `card:${subId}`
      entities[cardId] = {
        id: cardId,
        data: { title: subData.name, sourceId: subId, sourceType: subData.type },
      }
      relationships[colId].push(cardId)
    }
  }

  // 루트 파일 → (files) 컬럼
  if (files.length > 0 || dirs.length === 0) {
    const filesColId = `col:__files__`
    entities[filesColId] = { id: filesColId, data: { title: '(files)', sourceId: null } }
    relationships[ROOT_ID].push(filesColId)
    relationships[filesColId] = []

    for (const fileId of files) {
      const fileData = getEntityData<FileNodeData>(fsStore, fileId)!
      const cardId = `card:${fileId}`
      entities[cardId] = {
        id: cardId,
        data: { title: fileData.name, sourceId: fileId, sourceType: fileData.type },
      }
      relationships[filesColId].push(cardId)
    }
  }

  return createStore({ entities, relationships })
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
pnpm test -- src/__tests__/birdseye/birdseyeTransform.test.ts
```

Expected: PASS (모든 테스트)

- [ ] **Step 5: 커밋**

```bash
git add src/pages/birdseye/birdseyeTransform.ts src/__tests__/birdseye/birdseyeTransform.test.ts
git commit -m "feat(birdseye): add birdseyeTransform — fs store to NavList/Kanban stores"
```

---

### Task 3: BirdseyeLayout 전면 재작성

**Files:**
- Rewrite: `src/pages/birdseye/BirdseyeLayout.tsx`
- Delete: `src/pages/birdseye/BirdseyeSidebar.tsx`
- Delete: `src/pages/birdseye/BirdseyeBoard.tsx`

OS UI 완성품으로 조립: SplitPane(좌우 분할) + NavList(좌: 폴더 선택) + Kanban(우: 칸반 조감도).

- [ ] **Step 1: BirdseyeSidebar.tsx, BirdseyeBoard.tsx 삭제**

```bash
git rm src/pages/birdseye/BirdseyeSidebar.tsx src/pages/birdseye/BirdseyeBoard.tsx
```

- [ ] **Step 2: BirdseyeLayout.tsx 전면 재작성**

```tsx
// src/pages/birdseye/BirdseyeLayout.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SplitPane } from '../../interactive-os/ui/SplitPane'
import { NavList } from '../../interactive-os/ui/NavList'
import { Kanban } from '../../interactive-os/ui/Kanban'
import type { NormalizedData } from '../../interactive-os/store/types'
import { getEntityData } from '../../interactive-os/store/createStore'
import { DEFAULT_ROOT } from '../viewer/types'
import { fetchTree } from '../viewer/fsClient'
import { treeToStore } from '../viewer/treeTransform'
import { buildNavStore, buildKanbanStore } from './birdseyeTransform'
import styles from './BirdseyeLayout.module.css'

/** 첫 번째 NavList 항목의 sourceId를 찾는다 (초기 선택용) */
function findFirstItemSourceId(navStore: NormalizedData): string | null {
  const { entities, relationships } = navStore
  const rootChildren = relationships['__ROOT__'] ?? []

  for (const groupId of rootChildren) {
    const groupChildren = relationships[groupId] ?? []
    if (groupChildren.length > 0) {
      return groupChildren[0]!
    }
  }
  return rootChildren[0] ?? null
}

export default function BirdseyeLayout() {
  const navigate = useNavigate()
  const [fsStore, setFsStore] = useState<NormalizedData | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [sizes, setSizes] = useState([0.18, 0.82])

  // fs tree 로드
  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      const store = treeToStore(tree)
      setFsStore(store)

      const navStore = buildNavStore(store)
      const firstId = findFirstItemSourceId(navStore)
      if (firstId) setSelectedFolderId(firstId)
    })
  }, [])

  // NavList store
  const navStore = useMemo(() => fsStore ? buildNavStore(fsStore) : null, [fsStore])

  // Kanban store (선택 폴더 기준)
  const kanbanStore = useMemo(
    () => fsStore && selectedFolderId ? buildKanbanStore(fsStore, selectedFolderId) : null,
    [fsStore, selectedFolderId],
  )

  // NavList 항목 선택 → 폴더 변경
  const handleNavActivate = useCallback((nodeId: string) => {
    // NavList 항목의 id는 fs store의 폴더 id와 동일
    setSelectedFolderId(nodeId)
  }, [])

  // Kanban 카드 활성화 → 파일은 Viewer로, 폴더는 drill-down
  const handleKanbanActivate = useCallback((cardId: string) => {
    if (!fsStore) return
    // cardId는 "card:원본id" 형태 — 원본 데이터에서 sourceId, sourceType 참조
    const kanban = kanbanStore
    if (!kanban) return
    const cardData = getEntityData<{ sourceId: string; sourceType: string }>(kanban, cardId)
    if (!cardData) return

    if (cardData.sourceType === 'directory') {
      // drill-down: NavList 선택 변경
      setSelectedFolderId(cardData.sourceId)
    } else {
      // 파일: Viewer로 이동
      const relative = cardData.sourceId.startsWith(DEFAULT_ROOT + '/')
        ? cardData.sourceId.slice(DEFAULT_ROOT.length + 1)
        : cardData.sourceId
      navigate(`/viewer/${relative}`)
    }
  }, [fsStore, kanbanStore, navigate])

  // 선택된 폴더 이름
  const selectedName = useMemo(() => {
    if (!fsStore || !selectedFolderId) return ''
    const data = getEntityData<{ name: string }>(fsStore, selectedFolderId)
    return data?.name ?? ''
  }, [fsStore, selectedFolderId])

  if (!fsStore || !navStore) {
    return <div className={styles.loading}>Loading project...</div>
  }

  return (
    <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.12}>
      {/* 좌: NavList (폴더 네비게이션) */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Birdseye</div>
        <div className={styles.sidebarBody}>
          <NavList
            data={navStore}
            onActivate={handleNavActivate}
            initialFocus={selectedFolderId ?? undefined}
            aria-label="Folder navigation"
          />
        </div>
      </div>

      {/* 우: Kanban (칸반 조감도) */}
      <div className={styles.board}>
        <div className={styles.boardHeader}>{selectedName}</div>
        {kanbanStore && (
          <div className={styles.boardBody}>
            <Kanban
              key={selectedFolderId}
              data={kanbanStore}
              onActivate={handleKanbanActivate}
              aria-label={`${selectedName} contents`}
            />
          </div>
        )}
      </div>
    </SplitPane>
  )
}
```

- [ ] **Step 3: typecheck 확인**

```bash
pnpm typecheck
```

Expected: 에러 0

- [ ] **Step 4: 커밋**

```bash
git add src/pages/birdseye/
git commit -m "feat(birdseye): rewrite layout with SplitPane + NavList + Kanban"
```

---

### Task 4: CSS 재작성

**Files:**
- Rewrite: `src/pages/birdseye/BirdseyeLayout.module.css`

대부분의 스타일은 OS 컴포넌트가 소유. 여기는 레이아웃 뼈대와 최소 오버라이드만.

- [ ] **Step 1: CSS 재작성**

> **주의:** 이 task는 `/design-implement` 스킬을 사용하여 구현한다. 아래 코드는 구조 가이드이며, 실제 작성 시 DESIGN.md 번들 규칙을 따른다.

```css
/* BirdseyeLayout.module.css */

/* --- sidebar --- */

.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-sunken);
}

.sidebarHeader {
  display: flex;
  align-items: center;
  height: var(--size-header);
  padding: 0 var(--space-md);
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--type-caption-size);
  font-weight: var(--weight-semi);
  letter-spacing: 0.02em;
  color: var(--text-muted);
}

.sidebarBody {
  flex: 1;
  overflow: hidden auto;
  padding: var(--space-xs) 0;
}

/* --- board --- */

.board {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  background: var(--surface-default);
}

.boardHeader {
  display: flex;
  align-items: center;
  height: var(--size-header);
  padding: 0 var(--space-lg);
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--type-caption-size);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.boardBody {
  flex: 1;
  overflow: auto;
}

/* --- loading --- */

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: var(--type-body-size);
}
```

- [ ] **Step 2: lint:css 확인**

```bash
pnpm lint:css
```

Expected: 에러 0

- [ ] **Step 3: 커밋**

```bash
git add src/pages/birdseye/BirdseyeLayout.module.css
git commit -m "style(birdseye): rewrite CSS — minimal layout for OS component assembly"
```

---

### Task 5: 통합 검증 + 초기 선택 수정

**Files:**
- 없음 (검증만)

- [ ] **Step 1: 전체 빌드 검증**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: 모두 통과

- [ ] **Step 2: 브라우저 시각 확인**

`http://localhost:5173/birdseye` 접속. 스크린샷 촬영.

확인 사항:
- 좌측에 NavList가 그룹(src/, docs/ 등) + 항목(2depth 폴더)으로 렌더링되는가
- 우측에 Kanban 컬럼(하위 폴더) + 카드(파일)가 2D 칸반으로 배치되는가
- NavList에서 다른 폴더 선택 시 칸반이 갱신되는가
- 파일 카드 Enter/더블클릭 → /viewer/로 이동하는가
- 폴더 카드 Enter/더블클릭 → drill-down (칸반 갱신)되는가
- SplitPane 리사이즈가 동작하는가

- [ ] **Step 3: 시각 문제 수정 (있으면)**

CSS 조정 필요 시 `/design-implement` 스킬 사용.

- [ ] **Step 4: 커밋 (수정 있으면)**

```bash
git add -A
git commit -m "fix(birdseye): visual adjustments after integration verification"
```
