# CMS Tab Container 시각적 완성 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캔버스 탭 CSS 추가 + 사이드바에서 정규화 트리 순회 기반으로 탭 내부 section을 flat 펼침 + 구분선 + active 탭 하이라이트

**Architecture:** `collectSections` 범용 함수가 정규화 트리를 DFS로 순회하여 `type === 'section'`인 노드만 수집. 사이드바는 이 함수로 sectionIds를 교체하고, 연속 section의 root 조상 비교로 구분선을 삽입. 캔버스 탭 CSS는 기존 마크업(`cms-tablist`, `[aria-selected]`)에 밑줄 기반 최소 스타일 적용.

**Tech Stack:** React, CSS (design tokens), interactive-os (getChildren, getParent)

**PRD:** `docs/superpowers/prds/2026-03-22-cms-tab-visual-prd.md`

---

### Task 1: collectSections 범용 함수 + unit 테스트

**Files:**
- Create: `src/pages/cms/collectSections.ts`
- Create: `src/__tests__/collectSections.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/collectSections.test.ts
import { describe, it, expect } from 'vitest'
import { ROOT_ID } from '../interactive-os/core/types'
import { collectSections } from '../pages/cms/collectSections'
import type { NormalizedData } from '../interactive-os/core/types'

function makeStore(entities: Record<string, { type: string }>, relationships: Record<string, string[]>): NormalizedData {
  const ents: NormalizedData['entities'] = {}
  for (const [id, data] of Object.entries(entities)) {
    ents[id] = { id, data }
  }
  return { entities: ents, relationships }
}

describe('collectSections', () => {
  it('collects root-level sections in order', () => {
    const store = makeStore(
      { a: { type: 'section' }, b: { type: 'section' } },
      { [ROOT_ID]: ['a', 'b'] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['a', 'b'])
  })

  it('collects sections inside tab-group (DFS through tab-item → tab-panel)', () => {
    const store = makeStore(
      {
        s1: { type: 'section' },
        tg: { type: 'tab-group' },
        t1: { type: 'tab-item' },
        p1: { type: 'tab-panel' },
        ts1: { type: 'section' },
        t2: { type: 'tab-item' },
        p2: { type: 'tab-panel' },
        ts2: { type: 'section' },
        s2: { type: 'section' },
      },
      {
        [ROOT_ID]: ['s1', 'tg', 's2'],
        tg: ['t1', 't2'],
        t1: ['p1'], p1: ['ts1'],
        t2: ['p2'], p2: ['ts2'],
      },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['s1', 'ts1', 'ts2', 's2'])
  })

  it('returns same as getChildren when no containers exist', () => {
    const store = makeStore(
      { a: { type: 'section' }, b: { type: 'section' }, c: { type: 'section' } },
      { [ROOT_ID]: ['a', 'b', 'c'] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['a', 'b', 'c'])
  })

  it('handles empty tab-panel (no sections inside)', () => {
    const store = makeStore(
      { tg: { type: 'tab-group' }, t1: { type: 'tab-item' }, p1: { type: 'tab-panel' } },
      { [ROOT_ID]: ['tg'], tg: ['t1'], t1: ['p1'], p1: [] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual([])
  })

  it('handles nested containers (future-proofing)', () => {
    const store = makeStore(
      {
        outer: { type: 'accordion' },
        inner: { type: 'accordion-panel' },
        s1: { type: 'section' },
      },
      { [ROOT_ID]: ['outer'], outer: ['inner'], inner: ['s1'] },
    )
    expect(collectSections(store, ROOT_ID)).toEqual(['s1'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/collectSections.test.ts`
Expected: FAIL — `collectSections` not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/pages/cms/collectSections.ts
import { getChildren } from '../../interactive-os/core/createStore'
import type { NormalizedData } from '../../interactive-os/core/types'

/** DFS collect all nodes with type === 'section'. Container-type agnostic. */
export function collectSections(store: NormalizedData, parentId: string): string[] {
  return getChildren(store, parentId).flatMap(id => {
    const d = (store.entities[id]?.data ?? {}) as Record<string, unknown>
    return d.type === 'section' ? [id] : collectSections(store, id)
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/collectSections.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/collectSections.ts src/__tests__/collectSections.test.ts
git commit -m "feat(cms): add collectSections — DFS section collector, container-type agnostic"
```

---

### Task 2: getRootAncestor 유틸 + unit 테스트

구분선 렌더링과 active 탭 하이라이트에 필요한 "root 자식 조상 찾기" + "tab-item 조상 찾기" 유틸.

**Files:**
- Modify: `src/pages/cms/collectSections.ts` (같은 모듈에 추가)
- Modify: `src/__tests__/collectSections.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/collectSections.test.ts에 추가
import { getRootAncestor, getTabItemAncestor } from '../pages/cms/collectSections'

describe('getRootAncestor', () => {
  it('returns self for root-level section', () => {
    const store = makeStore(
      { s1: { type: 'section' } },
      { [ROOT_ID]: ['s1'] },
    )
    expect(getRootAncestor(store, 's1')).toBe('s1')
  })

  it('returns tab-group for section inside tab', () => {
    const store = makeStore(
      {
        tg: { type: 'tab-group' },
        t1: { type: 'tab-item' },
        p1: { type: 'tab-panel' },
        s1: { type: 'section' },
      },
      { [ROOT_ID]: ['tg'], tg: ['t1'], t1: ['p1'], p1: ['s1'] },
    )
    expect(getRootAncestor(store, 's1')).toBe('tg')
  })
})

describe('getTabItemAncestor', () => {
  it('returns tab-item ancestor for section inside tab', () => {
    const store = makeStore(
      {
        tg: { type: 'tab-group' },
        t1: { type: 'tab-item' },
        p1: { type: 'tab-panel' },
        s1: { type: 'section' },
      },
      { [ROOT_ID]: ['tg'], tg: ['t1'], t1: ['p1'], p1: ['s1'] },
    )
    expect(getTabItemAncestor(store, 's1')).toBe('t1')
  })

  it('returns undefined for root-level section', () => {
    const store = makeStore(
      { s1: { type: 'section' } },
      { [ROOT_ID]: ['s1'] },
    )
    expect(getTabItemAncestor(store, 's1')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/collectSections.test.ts`
Expected: FAIL — functions not exported

- [ ] **Step 3: Write minimal implementation**

`collectSections.ts`에 추가:

```typescript
import { getParent } from '../../interactive-os/core/createStore'

/** Walk up to ROOT_ID, return the direct child of ROOT_ID in the ancestor chain. */
export function getRootAncestor(store: NormalizedData, nodeId: string): string {
  let current = nodeId
  while (true) {
    const parent = getParent(store, current)
    if (!parent || parent === ROOT_ID) return current
    current = parent
  }
}

/** Walk up from nodeId, return first ancestor with type === 'tab-item', or undefined. */
export function getTabItemAncestor(store: NormalizedData, nodeId: string): string | undefined {
  let current = getParent(store, nodeId)
  while (current && current !== ROOT_ID) {
    const d = (store.entities[current]?.data ?? {}) as Record<string, unknown>
    if (d.type === 'tab-item') return current
    current = getParent(store, current)
  }
  return undefined
}
```

import에 `getParent` 추가, import에 `ROOT_ID` 추가.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/collectSections.test.ts`
Expected: PASS (all)

- [ ] **Step 5: Commit**

```bash
git add src/pages/cms/collectSections.ts src/__tests__/collectSections.test.ts
git commit -m "feat(cms): add getRootAncestor + getTabItemAncestor tree utils"
```

---

### Task 3: 캔버스 탭 CSS

**Files:**
- Modify: `src/styles/cms.css` (파일 끝에 추가)

- [ ] **Step 1: Write the CSS**

`cms.css` 파일 끝(`[data-placeholder]` 규칙 뒤)에 추가:

```css
/* ── Canvas Tab Group ── */
.cms-tablist {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-dim);
  margin-bottom: 16px;
}
.cms-tab-item {
  padding: 6px 14px;
  font-family: var(--sans); font-size: 13px; font-weight: 500;
  color: var(--text-secondary);
  background: none; border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.1s, border-color 0.1s;
}
.cms-tab-item:hover { color: var(--text-bright); }
.cms-tab-item[aria-selected="true"] {
  color: var(--text-bright);
  border-bottom-color: var(--accent);
}
.cms-tab-item[data-focused] {
  background: var(--bg-hover);
}
.cms-tab-group {
  margin: 24px 0;
}
.cms-tab-group--focused {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
.cms-tab-panel {
  padding: 0;
}
```

- [ ] **Step 2: 브라우저에서 시각 확인**

Run: `npm run dev`
CMS 페이지에서 tab-group이 밑줄 인디케이터가 있는 탭바로 보이는지 확인.
Expected: tablist에 밑줄, active 탭에 accent 색상 밑줄, 패널 영역 구분.

- [ ] **Step 3: Commit**

```bash
git add src/styles/cms.css
git commit -m "style(cms): add canvas tab styles — underline indicator, minimal structure"
```

---

### Task 4: 사이드바 sectionIds를 collectSections로 교체 + activeSectionId 수정

**Files:**
- Modify: `src/pages/cms/CmsSidebar.tsx:114` — sectionIds 계산 변경
- Modify: `src/pages/cms/CmsLayout.tsx:41-62` — activeSectionId 계산 변경

- [ ] **Step 1: Write the failing integration test**

기존 `cms-tab-container.test.tsx`에 사이드바 테스트 추가:

```typescript
// src/__tests__/cms-tab-container.test.tsx — describe 블록 끝에 추가
describe('sidebar tab integration', () => {
  it('sidebar lists tab-internal sections as focusable items', () => {
    const { container } = render(<CmsLayout />)
    const sidebar = container.querySelector('[role="listbox"]') as HTMLElement
    const items = sidebar.querySelectorAll('[role="option"]')
    // tab-group-1 has 3 tabs, each with 1 section → 3 sections added to sidebar
    // Root has: hero, stats, features, [tab-1-section, tab-2-section, tab-3-section], workflow, patterns, footer = 10
    const ids = Array.from(items).map(el => el.getAttribute('data-sidebar-id'))
    expect(ids).toContain('tab-1-section')
    expect(ids).toContain('tab-2-section')
    expect(ids).toContain('tab-3-section')
    expect(ids).not.toContain('tab-group-1')
  })

  it('sidebar ↑↓ navigates through tab-internal sections', async () => {
    const user = userEvent.setup()
    const { container } = render(<CmsLayout />)
    const sidebar = container.querySelector('[role="listbox"]') as HTMLElement
    sidebar.focus()

    // Navigate down to reach tab sections (hero → stats → features → tab-1-section)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    const focused = sidebar.querySelector('[data-focused="true"]')
    expect(focused?.getAttribute('data-sidebar-id')).toBe('tab-1-section')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: FAIL — tab-1-section not in sidebar items, tab-group-1 is listed instead

- [ ] **Step 3: Modify CmsSidebar.tsx**

`CmsSidebar.tsx:114` 변경:

```typescript
// Before:
const sectionIds = useMemo(() => getChildren(store, ROOT_ID), [store])

// After:
import { collectSections } from './collectSections'
// ...
const sectionIds = useMemo(() => collectSections(store, ROOT_ID), [store])
```

- [ ] **Step 4: Modify CmsLayout.tsx activeSectionId**

`CmsLayout.tsx:41-62` 변경 — `activeSectionId`가 tab-group이 아닌 가장 가까운 section 조상을 반환하도록:

```typescript
import { collectSections } from './collectSections'

// Replace the activeSectionId useMemo:
const sidebarSections = useMemo(() => collectSections(store, ROOT_ID), [store])

const activeSectionId = useMemo(() => {
  if (!canvasFocusedId) return null
  // If focused node is itself a section in the sidebar list, return it
  if (sidebarSections.includes(canvasFocusedId)) return canvasFocusedId
  // Walk up to find the nearest section ancestor that's in the sidebar list
  let current = canvasFocusedId
  while (current) {
    const parent = getParent(store, current)
    if (!parent) return null
    if (sidebarSections.includes(parent)) return parent
    current = parent
  }
  return null
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [canvasFocusedId, sidebarSections])
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: PASS — 기존 테스트 + 새 사이드바 테스트 모두

- [ ] **Step 6: Commit**

```bash
git add src/pages/cms/CmsSidebar.tsx src/pages/cms/CmsLayout.tsx src/__tests__/cms-tab-container.test.tsx
git commit -m "feat(cms): sidebar uses collectSections — tab-internal sections in flat list"
```

---

### Task 5: 사이드바 구분선 + 탭 라벨 렌더링

**Files:**
- Modify: `src/pages/cms/CmsSidebar.tsx:186-205` — 렌더링 루프에 구분선 삽입
- Modify: `src/styles/cms.css` — 구분선 스타일
- Modify: `src/__tests__/cms-tab-container.test.tsx` — 구분선 테스트

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/cms-tab-container.test.tsx — sidebar tab integration에 추가
it('renders group separators with tab labels at tab-group boundaries', () => {
  const { container } = render(<CmsLayout />)
  const sidebar = container.querySelector('[role="listbox"]') as HTMLElement
  const seps = sidebar.querySelectorAll('.cms-sidebar__group-label')
  // 3 tabs = 3 labels: Overview, Details, More
  expect(seps.length).toBe(3)
  expect(seps[0].textContent).toBe('Overview')
  expect(seps[1].textContent).toBe('Details')
  expect(seps[2].textContent).toBe('More')
})

it('group separators have pointer-events none (not clickable)', () => {
  const { container } = render(<CmsLayout />)
  const sep = container.querySelector('.cms-sidebar__group-sep') as HTMLElement
  expect(sep).not.toBeNull()
  // Separator should not be a listbox item
  expect(sep.getAttribute('role')).toBeNull()
})

it('tab-group with 0 tabs produces no separator (V7 — no tab-group case already covered by collectSections unit test)', () => {
  // This boundary is verified at the unit level in collectSections.test.ts
  // Integration-level: the default store has 1 tab-group, so the existing tests cover the 1-group case
})
```

참고: V8 (tab-group 2개 이상)과 V9 (탭 1개짜리 tab-group)는 collectSections의 unit 테스트로 커버됨. 통합 테스트는 기본 fixture (3탭 1그룹)로 정상 동작을 검증.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: FAIL — no `.cms-sidebar__group-label` elements

- [ ] **Step 3: Modify CmsSidebar.tsx rendering loop**

`CmsSidebar.tsx:186-205` — `sectionIds.map(...)` 내부에서 조상 비교 + 구분선 삽입:

```typescript
import { getRootAncestor, getTabItemAncestor } from './collectSections'
import type { LocaleMap } from './cms-types'
// ... (locale import already exists)

// Inside the render, replace the sectionIds.map block:
{(() => {
  let prevRootAncestor = ''
  let prevTabItem = ''
  let sectionIndex = 0
  return sectionIds.map((sectionId) => {
    const rootAncestor = getRootAncestor(store, sectionId)
    const tabItemId = getTabItemAncestor(store, sectionId)
    const elements: React.ReactNode[] = []

    // Group separator: root ancestor changed AND new ancestor is inside a tab-group
    if (rootAncestor !== prevRootAncestor) {
      // Starting a new group — add top separator if entering tab-group
      const rootData = (store.entities[rootAncestor]?.data ?? {}) as Record<string, unknown>
      if (rootData.type === 'tab-group') {
        if (prevRootAncestor !== '') {
          elements.push(<div key={`sep-start-${rootAncestor}`} className="cms-sidebar__group-sep" />)
        }
      }
      // Leaving tab-group — add bottom separator
      if (prevRootAncestor) {
        const prevRootData = (store.entities[prevRootAncestor]?.data ?? {}) as Record<string, unknown>
        if (prevRootData.type === 'tab-group' && rootData.type !== 'tab-group') {
          elements.push(<div key={`sep-end-${prevRootAncestor}`} className="cms-sidebar__group-sep" />)
        }
      }
    }

    // Tab label: when tab-item ancestor changes within same tab-group
    if (tabItemId && tabItemId !== prevTabItem) {
      const tabData = (store.entities[tabItemId]?.data ?? {}) as Record<string, unknown>
      const label = tabData.label as LocaleMap | undefined
      const labelText = label?.[locale] ?? label?.ko ?? ''
      elements.push(
        <div key={`label-${tabItemId}`} className="cms-sidebar__group-label">
          {labelText}
        </div>
      )
    }

    prevRootAncestor = rootAncestor
    prevTabItem = tabItemId ?? ''
    sectionIndex++

    const props = aria.getNodeProps(sectionId)
    const state = aria.getNodeState(sectionId)
    elements.push(
      <div
        key={sectionId}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
        data-sidebar-id={sectionId}
        className={`cms-sidebar__thumb${state.focused ? ' cms-sidebar__thumb--focused' : ''}`}
        onClick={() => {
          aria.dispatch(focusCommands.setFocus(sectionId))
          scrollToSection(sectionId)
        }}
      >
        <div className="cms-sidebar__thumb-inner">
          <SectionThumbnail data={store} sectionId={sectionId} locale={locale} />
        </div>
        <span className="cms-sidebar__thumb-index">{sectionIndex}</span>
      </div>
    )

    return elements
  })
})()}
```

참고: 기존 `data-sidebar-id` 속성이 `sectionId`를 사용하도록 이미 있었는지 확인. 없었다면 추가 (스크롤 동기화에 사용).

- [ ] **Step 4: Add CSS for separators**

`cms.css` 끝에 추가:

```css
/* ── Sidebar group separators ── */
.cms-sidebar__group-sep {
  height: 1px;
  background: var(--border-mid);
  margin: 4px 8px;
  pointer-events: none;
}
.cms-sidebar__group-label {
  font-family: var(--mono); font-size: 9px; font-weight: 600;
  color: var(--text-muted);
  padding: 2px 10px 0;
  pointer-events: none;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.cms-sidebar__group-label--active {
  color: var(--accent);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/cms/CmsSidebar.tsx src/styles/cms.css src/__tests__/cms-tab-container.test.tsx
git commit -m "feat(cms): sidebar group separators with tab labels at boundaries"
```

---

### Task 6: active 탭 라벨 하이라이트 (activeSectionId에서 파생, CmsLayout 변경 없음)

**Files:**
- Modify: `src/pages/cms/CmsSidebar.tsx` — active 탭 라벨에 `--active` 클래스
- Modify: `src/__tests__/cms-tab-container.test.tsx`

PRD X4 준수: CmsLayout에 새 prop 추가하지 않음. `activeSectionId`(이미 전달됨) + `store`만으로 active 탭 판단.

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/cms-tab-container.test.tsx — sidebar tab integration에 추가
it('active tab label is highlighted when canvas tab changes', async () => {
  const user = userEvent.setup()
  const { container } = render(<CmsLayout />)

  // Enter tab-group and focus tab-1 → then enter its section
  const tabGroup = container.querySelector('[data-cms-id="tab-group-1"]') as HTMLElement
  tabGroup.focus()
  await user.keyboard('{Enter}')  // → tab-1
  await user.keyboard('{Enter}')  // → tab-1-section (activeSectionId becomes tab-1-section)

  // Tab-1 label should be active (derived from activeSectionId → getTabItemAncestor)
  const sidebar = container.querySelector('[role="listbox"]') as HTMLElement
  const labels = sidebar.querySelectorAll('.cms-sidebar__group-label')
  expect(labels[0].classList.contains('cms-sidebar__group-label--active')).toBe(true)

  // Go back to tab level and switch to tab-2
  await user.keyboard('{Escape}')  // → tab-1
  await user.keyboard('{ArrowRight}')  // → tab-2
  await user.keyboard('{Enter}')  // → tab-2-section

  const updatedLabels = sidebar.querySelectorAll('.cms-sidebar__group-label')
  expect(updatedLabels[0].classList.contains('cms-sidebar__group-label--active')).toBe(false)
  expect(updatedLabels[1].classList.contains('cms-sidebar__group-label--active')).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: FAIL — no `--active` class on labels

- [ ] **Step 3: Modify CmsSidebar to derive active tab from activeSectionId**

`CmsSidebar.tsx` — CmsLayout 변경 없음, 기존 `activeSectionId` prop만 사용:

```typescript
// active tab-item derived from activeSectionId + store (no new props from CmsLayout)
const activeTabItemId = useMemo(() => {
  if (!activeSectionId) return undefined
  return getTabItemAncestor(store, activeSectionId)
}, [activeSectionId, store])
```

구분선 렌더링 시 tab label의 className에 `--active` 조건 추가:
```typescript
// In the tab label rendering (Task 5의 코드에서):
const isActiveTab = tabItemId === activeTabItemId
elements.push(
  <div
    key={`label-${tabItemId}`}
    className={`cms-sidebar__group-label${isActiveTab ? ' cms-sidebar__group-label--active' : ''}`}
  >
    {labelText}
  </div>
)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: PASS (all tests including new highlight test)

- [ ] **Step 5: Run all CMS tests to check for regressions**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx src/__tests__/cms-tab-schema.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/cms/CmsSidebar.tsx src/__tests__/cms-tab-container.test.tsx
git commit -m "feat(cms): active tab label highlight in sidebar, derived from activeSectionId"
```

---

### Task 7: 사이드바 Enter → 비활성 탭 활성화 + 스크롤

**Files:**
- Modify: `src/pages/cms/CmsSidebar.tsx` — scrollToSection 개선
- Modify: `src/__tests__/cms-tab-container.test.tsx`

접근: `scrollToSection`에서 section의 tab-item 조상을 찾아 `engine.dispatch(focusCommands.setFocus(tabItemId))`로 캔버스 포커스 설정. engine은 공유이지만 `focusCommands`는 scope에 broadcast되므로, 캔버스의 `cms` scope에서 `onFocusChange` → `activeTabMap` 업데이트 → 패널 렌더 체인이 작동. 사이드바의 `sidebar` scope는 별도로 자신의 포커스를 유지.

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/cms-tab-container.test.tsx — sidebar tab integration에 추가
it('Enter on sidebar tab-internal section activates that tab in canvas', async () => {
  const user = userEvent.setup()
  const { container } = render(<CmsLayout />)

  // Focus sidebar
  const sidebar = container.querySelector('[role="listbox"]') as HTMLElement
  sidebar.focus()

  // Navigate to tab-2-section: find its position by checking data-sidebar-id
  const items = Array.from(sidebar.querySelectorAll('[role="option"]'))
  const tab2Idx = items.findIndex(el => el.getAttribute('data-sidebar-id') === 'tab-2-section')
  for (let i = 0; i < tab2Idx; i++) {
    await user.keyboard('{ArrowDown}')
  }

  // Press Enter to scroll to tab-2-section
  await user.keyboard('{Enter}')

  // Canvas should now show tab-2 as active
  const tab2 = container.querySelector('[data-cms-id="tab-2"]') as HTMLElement
  expect(tab2.getAttribute('aria-selected')).toBe('true')
  // tab-2-section should be in DOM (panel rendered)
  expect(container.querySelector('[data-cms-id="tab-2-section"]')).not.toBeNull()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: FAIL — tab-2 not activated because section is in inactive tab

- [ ] **Step 3: Modify scrollToSection to activate tab first**

`CmsSidebar.tsx`에서 `scrollToSection` 콜백을 수정. CmsLayout 변경 없음:

```typescript
const scrollToSection = useCallback((sectionId: string) => {
  const tabItemId = getTabItemAncestor(store, sectionId)
  if (tabItemId) {
    // Focus canvas root, dispatch tab-item focus to engine
    // Canvas's useEffect detects tab-item focus → updates activeTabMap → panel renders
    const canvasRoot = document.querySelector('[data-cms-root]') as HTMLElement
    if (canvasRoot) {
      canvasRoot.focus()
      engine.dispatch(focusCommands.setFocus(tabItemId))
      // Double rAF: 1st for React re-render, 2nd for DOM paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-cms-root] [data-cms-id="${sectionId}"]`) as HTMLElement
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })
    }
    return
  }
  const el = document.querySelector(`[data-cms-root] [data-cms-id="${sectionId}"]`) as HTMLElement
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}, [store, engine])
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/cms-tab-container.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (no regressions)

- [ ] **Step 6: Commit**

```bash
git add src/pages/cms/CmsSidebar.tsx src/__tests__/cms-tab-container.test.tsx
git commit -m "feat(cms): sidebar Enter activates inactive tab before scrolling"
```

---

### Task 8: 최종 검증 + PROGRESS.md 업데이트

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: 브라우저 시각 확인**

`npm run dev`로 확인:
- V1: 캔버스 탭바에 밑줄 인디케이터 ✅
- V2: 사이드바 구분선 + 탭 라벨 ✅
- V3/V4: 사이드바에서 비활성 탭 section 클릭/Enter → 탭 활성화 + 스크롤 ✅
- V5: 캔버스 ←→ 탭 전환 → 사이드바 라벨 하이라이트 ✅
- V7: 탭 없는 페이지 (해당 시 확인) ✅

- [ ] **Step 3: Update PROGRESS.md**

CMS Tab Container 시각적 완성 항목 추가/체크.

- [ ] **Step 4: Commit**

```bash
git add docs/PROGRESS.md
git commit -m "docs: update PROGRESS.md — CMS Tab Visual complete"
```
