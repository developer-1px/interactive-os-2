# Visual CMS 키보드 네비게이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 임의의 HTML에 적용 가능한 보편적 키보드 네비게이션 — DOM 위치 기반 방향 이동 + 무제한 깊이 탐색 + 선택

**Architecture:** 단일 spatial behavior + useSpatialNav hook으로 전체 페이지 제어. 현재 4개 분리된 `<Aria>` + listbox를 하나의 unified store + spatial로 통합. 전체 페이지 항상 렌더링, 포커스 링만 이동. `useAria` 직접 사용 + 커스텀 렌더링 (모든 깊이 항상 표시).

**Tech Stack:** React, interactive-os (spatial behavior, useSpatialNav, core plugin, spatial plugin), Vitest + @testing-library/react

**PRD:** `docs/superpowers/specs/2026-03-19-visual-cms-keyboard-nav-prd.md`

**핵심 렌더링 전략:** `<Aria.Node>`는 expanded 상태에 따라 자식 렌더링을 gate하므로 사용하지 않는다. 대신 `useAria` 직접 호출 + 전체 store tree를 재귀적으로 렌더링하는 커스텀 `CmsNodeRenderer` 사용. 모든 깊이의 노드가 항상 DOM에 존재하고, `useSpatialNav`는 현재 `__spatial_parent__`의 자식만 rect를 수집한다.

---

### Task 1: OS Layer — `extendSelectionTo(targetId)` on BehaviorContext

spatial nav에서 Shift+Arrow 시 DOM 위치 기반으로 찾은 target까지 범위 선택이 필요하다. 현재 `extendSelection`은 `'next'|'prev'|'first'|'last'`만 받는다. target ID를 직접 받는 메서드 추가.

**핵심:** `extendSelectionTo`는 `visibleNodes()`가 아닌, 현재 spatial parent의 children 순서로 range를 계산해야 한다. spatial 컨텍스트에서 `visibleNodes()`는 전체 tree를 walk하므로 다른 깊이 노드가 포함되어 잘못된 range가 만들어진다.

**Files:**
- Modify: `src/interactive-os/behaviors/createBehaviorContext.ts`
- Modify: `src/interactive-os/behaviors/types.ts` (BehaviorContext interface)
- Test: `src/interactive-os/__tests__/extended-selection.test.tsx`

- [ ] **Step 1: BehaviorContext interface에 `extendSelectionTo` 추가**

`src/interactive-os/behaviors/types.ts`의 BehaviorContext interface에:

```ts
extendSelectionTo(targetId: string, navigableIds?: string[]): Command
```

`navigableIds`는 optional — 제공되면 그 순서로 range를 계산, 미제공 시 `visibleNodes()` fallback.

- [ ] **Step 2: 실패 테스트 작성**

`src/interactive-os/__tests__/extended-selection.test.tsx`에 추가:

```ts
import { createBehaviorContext } from '../behaviors/createBehaviorContext'
import { createCommandEngine } from '../core/createCommandEngine'

describe('extendSelectionTo — target ID with custom navigable set', () => {
  it('selects range from anchor to target within provided navigableIds', () => {
    const store = fixtureStore() // a,b,c,d,e
    const engine = createCommandEngine(store, [])
    engine.dispatch(focusCommands.setFocus('b'))

    const ctx = createBehaviorContext(engine)
    // navigableIds = ['a','b','c','d','e'], target = 'd'
    // anchor defaults to focused ('b'), range: b,c,d
    const cmd = ctx.extendSelectionTo('d', ['a', 'b', 'c', 'd', 'e'])
    engine.dispatch(cmd)

    const result = engine.getStore()
    const selected = (result.entities['__selection__']?.selectedIds as string[]) ?? []
    expect(selected).toEqual(['b', 'c', 'd'])
  })

  it('skips nodes not in navigableIds for range calculation', () => {
    const store = fixtureStore() // a,b,c,d,e
    const engine = createCommandEngine(store, [])
    engine.dispatch(focusCommands.setFocus('a'))

    const ctx = createBehaviorContext(engine)
    // Only [a, c, e] are navigable (spatial depth siblings)
    const cmd = ctx.extendSelectionTo('e', ['a', 'c', 'e'])
    engine.dispatch(cmd)

    const result = engine.getStore()
    const selected = (result.entities['__selection__']?.selectedIds as string[]) ?? []
    expect(selected).toEqual(['a', 'c', 'e'])
  })
})
```

- [ ] **Step 3: 테스트 실행, 실패 확인**

Run: `npx vitest run src/interactive-os/__tests__/extended-selection.test.tsx`
Expected: FAIL — `extendSelectionTo` not defined

- [ ] **Step 4: `extendSelectionTo` 구현**

`src/interactive-os/behaviors/createBehaviorContext.ts`에 추가:

```ts
extendSelectionTo(targetId: string, navigableIds?: string[]): Command {
  const nodeList = navigableIds ?? visibleNodes()
  const anchorId = (store.entities[SELECTION_ANCHOR_ID]?.anchorId as string) ?? focusedId

  const anchorIdx = nodeList.indexOf(anchorId)
  const targetIdx = nodeList.indexOf(targetId)
  if (targetIdx === -1) return focusCommands.setFocus(focusedId)

  const start = Math.min(anchorIdx, targetIdx)
  const end = Math.max(anchorIdx, targetIdx)
  const rangeIds = nodeList.slice(start, end + 1)

  const commands: Command[] = []
  if (!store.entities[SELECTION_ANCHOR_ID]) {
    commands.push(selectionCommands.setAnchor(focusedId))
  }
  commands.push(focusCommands.setFocus(targetId))
  commands.push(selectionCommands.selectRange(rangeIds))
  return createBatchCommand(commands)
},
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/interactive-os/__tests__/extended-selection.test.tsx`
Expected: ALL PASS

- [ ] **Step 6: 전체 테스트 회귀 확인**

Run: `npx vitest run`

- [ ] **Step 7: 커밋**

```bash
git add src/interactive-os/behaviors/createBehaviorContext.ts src/interactive-os/behaviors/types.ts src/interactive-os/__tests__/extended-selection.test.tsx
git commit -m "feat: add extendSelectionTo(targetId, navigableIds?) to BehaviorContext"
```

---

### Task 2: OS Layer — spatial behavior keyMap 확장

spatial behavior에 Space, Home, End 추가. Shift+Arrow는 useSpatialNav에서 처리 (Task 3).

**Files:**
- Modify: `src/interactive-os/behaviors/spatial.ts`
- Test: `src/interactive-os/__tests__/behaviors/spatial.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/interactive-os/__tests__/behaviors/spatial.test.ts`에 추가:

```ts
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../../components/aria'
import { spatial } from '../../behaviors/spatial'
import { createStore } from '../../core/createStore'
import { ROOT_ID } from '../../core/types'
import { core } from '../../plugins/core'

function spatialFixture() {
  return createStore({
    entities: {
      sec1: { id: 'sec1', data: { label: 'Section 1' } },
      sec2: { id: 'sec2', data: { label: 'Section 2' } },
      sec3: { id: 'sec3', data: { label: 'Section 3' } },
      // sec1 children
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
    },
    relationships: {
      [ROOT_ID]: ['sec1', 'sec2', 'sec3'],
      sec1: ['a', 'b', 'c'],
    },
  })
}

describe('spatial behavior — Space, Home, End', () => {
  it('Space toggles selection on focused node', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={spatial} data={spatialFixture()} plugins={[core()]}>
        <Aria.Node render={(node, state) => (
          <span data-focused={state.focused} data-selected={state.selected}>
            {(node as { data: { label: string } }).data.label}
          </span>
        )} />
      </Aria>
    )

    const first = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    first.focus()
    await user.keyboard(' ')

    expect(container.querySelector('[data-node-id="sec1"]')?.getAttribute('aria-selected')).toBe('true')
  })

  it('Home focuses first sibling in current spatial depth', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={spatial} data={spatialFixture()} plugins={[core()]}>
        <Aria.Node render={(node, state) => (
          <span>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )

    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    // Move to sec3
    await user.keyboard('{ArrowDown}{ArrowDown}')
    // Home → back to sec1
    await user.keyboard('{Home}')

    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('sec1')
  })

  it('End focuses last sibling in current spatial depth', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Aria behavior={spatial} data={spatialFixture()} plugins={[core()]}>
        <Aria.Node render={(node, state) => (
          <span>{(node as { data: { label: string } }).data.label}</span>
        )} />
      </Aria>
    )

    const sec1 = container.querySelector('[data-node-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{End}')

    const focused = container.querySelector('[tabindex="0"][data-node-id]')
    expect(focused?.getAttribute('data-node-id')).toBe('sec3')
  })
})
```

- [ ] **Step 2: 테스트 실행, 실패 확인**

Run: `npx vitest run src/interactive-os/__tests__/behaviors/spatial.test.ts`
Expected: FAIL — Space/Home/End not in spatial keyMap

- [ ] **Step 3: spatial.ts keyMap에 추가**

`src/interactive-os/behaviors/spatial.ts`:

```ts
export const spatial: AriaBehavior = {
  role: 'group',
  childRole: 'group',
  keyMap: {
    Enter: (ctx) => { /* ... existing ... */ },
    Escape: (ctx) => { /* ... existing ... */ },
    F2: (ctx) => renameCommands.startRename(ctx.focused),
    Space: (ctx) => ctx.toggleSelect(),
    Home: (ctx) => {
      const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
      const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
      const siblings = ctx.getChildren(depthParentId)
      if (siblings.length > 0) return focusCommands.setFocus(siblings[0])
    },
    End: (ctx) => {
      const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
      const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
      const siblings = ctx.getChildren(depthParentId)
      if (siblings.length > 0) return focusCommands.setFocus(siblings[siblings.length - 1])
    },
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
  activateOnClick: true,
  ariaAttributes: (_node, state) => ({
    'aria-level': String(state.level ?? 1),
  }),
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/interactive-os/__tests__/behaviors/spatial.test.ts`

- [ ] **Step 5: 전체 테스트 회귀 확인**

Run: `npx vitest run`

- [ ] **Step 6: 커밋**

```bash
git add src/interactive-os/behaviors/spatial.ts src/interactive-os/__tests__/behaviors/spatial.test.ts
git commit -m "feat: spatial behavior — add Space, Home, End keyMap"
```

---

### Task 3: OS Layer — useSpatialNav에 Shift+Arrow 핸들러 추가

useSpatialNav가 Shift+Arrow 키맵도 반환하도록 확장. findNearest로 target 찾고, 현재 depth의 children 목록을 `extendSelectionTo`에 전달하여 올바른 범위 선택.

**Files:**
- Modify: `src/interactive-os/hooks/use-spatial-nav.ts`
- Test: `src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from 'vitest'
import { useSpatialNav } from '../../hooks/use-spatial-nav'

describe('useSpatialNav keyMap', () => {
  it('returns Shift+Arrow handlers alongside regular Arrow handlers', () => {
    // useSpatialNav returns an object — verify Shift keys are present
    // Note: need to call in a React context, so use renderHook
    // For now, verify the type signature includes Shift keys
  })
})
```

실제 통합 테스트는 Task 5의 PageVisualCms 테스트에서 검증 (DOM 렌더링 필요).

- [ ] **Step 2: useSpatialNav에 Shift+Arrow 핸들러 추가**

`src/interactive-os/hooks/use-spatial-nav.ts`:

```ts
import type { BehaviorContext } from '../behaviors/types'

// ... existing findNearest, center functions ...

export function useSpatialNav(
  containerSelector: string,
  store: NormalizedData,
): Record<string, (ctx: BehaviorContext) => Command | void> {
  const rectsRef = useRef<Map<string, DOMRect>>(new Map())
  const allowedIdsRef = useRef<string[]>([])

  useLayoutEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    const spatialParentId = getSpatialParentId(store)
    const allowed = getChildren(store, spatialParentId)
    allowedIdsRef.current = allowed
    const allowedSet = new Set(allowed)

    const elements = container.querySelectorAll<HTMLElement>('[data-node-id]')
    const next = new Map<string, DOMRect>()
    elements.forEach((el) => {
      const id = el.dataset.nodeId
      if (id && allowedSet.has(id)) {
        next.set(id, el.getBoundingClientRect())
      }
    })
    rectsRef.current = next
  })

  const makeHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
    const targetId = findNearest(ctx.focused, dir, rectsRef.current)
    if (targetId) return focusCommands.setFocus(targetId)
  }

  const makeShiftHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
    const targetId = findNearest(ctx.focused, dir, rectsRef.current)
    if (targetId) return ctx.extendSelectionTo(targetId, allowedIdsRef.current)
  }

  return {
    ArrowUp: makeHandler('ArrowUp'),
    ArrowDown: makeHandler('ArrowDown'),
    ArrowLeft: makeHandler('ArrowLeft'),
    ArrowRight: makeHandler('ArrowRight'),
    'Shift+ArrowUp': makeShiftHandler('ArrowUp'),
    'Shift+ArrowDown': makeShiftHandler('ArrowDown'),
    'Shift+ArrowLeft': makeShiftHandler('ArrowLeft'),
    'Shift+ArrowRight': makeShiftHandler('ArrowRight'),
  }
}
```

핵심: `allowedIdsRef`에 현재 depth의 children 순서를 저장하고, `extendSelectionTo(targetId, allowedIds)`로 전달하여 올바른 범위 계산.

- [ ] **Step 3: 전체 테스트 회귀 확인**

Run: `npx vitest run`

- [ ] **Step 4: 커밋**

```bash
git add src/interactive-os/hooks/use-spatial-nav.ts src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts
git commit -m "feat: useSpatialNav — add Shift+Arrow range selection with spatial-scoped navigableIds"
```

---

### Task 4: Unified CMS Store + Old Code Cleanup

4개 분리된 store를 하나의 계층적 store로 통합. Hero/Footer 포함 모든 섹션을 store로.

**Files:**
- Modify: `src/pages/PageVisualCms.tsx`
- Modify: `src/__tests__/visual-cms.test.tsx`

- [ ] **Step 1: 통합 store 구조 정의 테스트**

`src/__tests__/visual-cms.test.tsx`에 추가 (기존 테스트는 유지):

```ts
import { cmsStore } from '../pages/PageVisualCms'
import { getChildren } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

describe('unified CMS store', () => {
  it('has 6 sections as ROOT children', () => {
    const children = getChildren(cmsStore, ROOT_ID)
    expect(children).toEqual(['hero', 'stats', 'features', 'workflow', 'patterns', 'footer'])
  })

  it('hero has title, subtitle, cta as children', () => {
    const children = getChildren(cmsStore, 'hero')
    expect(children).toEqual(['hero-title', 'hero-subtitle', 'hero-cta'])
  })

  it('stats has 4 stat items', () => {
    expect(getChildren(cmsStore, 'stats')).toHaveLength(4)
  })

  it('features has 4 cards, each with nested fields', () => {
    const cards = getChildren(cmsStore, 'features')
    expect(cards).toHaveLength(4)
    const firstCardChildren = getChildren(cmsStore, cards[0])
    expect(firstCardChildren.length).toBeGreaterThanOrEqual(3) // icon, title, desc
  })

  it('footer has brand and links children', () => {
    const children = getChildren(cmsStore, 'footer')
    expect(children.length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: 테스트 실행, 실패 확인**

Run: `npx vitest run src/__tests__/visual-cms.test.tsx`
Expected: FAIL — `cmsStore` not exported

- [ ] **Step 3: 통합 store 구현 + export**

`src/pages/PageVisualCms.tsx`에서:
1. 4개 분리된 store (`statsStore`, `featuresStore`, `stepsStore`, `patternsStore`) 삭제
2. 단일 `cmsStore` 생성하여 export
3. Hero, Footer의 모든 요소도 entity로 포함

```ts
export const cmsStore = createStore({
  entities: {
    // Hero
    hero: { id: 'hero', data: { type: 'section', variant: 'hero' } },
    'hero-title': { id: 'hero-title', data: { type: 'text', value: 'Headless ARIA Engine' } },
    'hero-subtitle': { id: 'hero-subtitle', data: { type: 'text', value: 'Build fully accessible UI with...' } },
    'hero-cta': { id: 'hero-cta', data: { type: 'cta', primary: 'Get Started', secondary: 'View on GitHub' } },
    // Stats
    stats: { id: 'stats', data: { type: 'section', variant: 'stats' } },
    'stat-patterns': { id: 'stat-patterns', data: { type: 'stat', value: '14', label: 'APG Patterns' } },
    'stat-tests': { id: 'stat-tests', data: { type: 'stat', value: '365+', label: 'Tests' } },
    'stat-modules': { id: 'stat-modules', data: { type: 'stat', value: '42', label: 'Modules' } },
    'stat-deps': { id: 'stat-deps', data: { type: 'stat', value: '0', label: 'Runtime Deps' } },
    // Features
    features: { id: 'features', data: { type: 'section', variant: 'cards' } },
    'card-store': { id: 'card-store', data: { type: 'card', title: 'Normalized Store', desc: '...', icon: 'database' } },
    'card-store-icon': { id: 'card-store-icon', data: { type: 'icon', value: 'database' } },
    'card-store-title': { id: 'card-store-title', data: { type: 'text', value: 'Normalized Store', role: 'title' } },
    'card-store-desc': { id: 'card-store-desc', data: { type: 'text', value: 'Tree data as flat entities...', role: 'body' } },
    // ... (engine, aria, keyboard cards similarly)
    // Workflow
    workflow: { id: 'workflow', data: { type: 'section', variant: 'steps' } },
    // ... step-1..4
    // Patterns
    patterns: { id: 'patterns', data: { type: 'section', variant: 'patterns' } },
    // ... pat-treegrid, pat-listbox, ...14 patterns
    // Footer
    footer: { id: 'footer', data: { type: 'section', variant: 'footer' } },
    'footer-brand': { id: 'footer-brand', data: { type: 'brand', name: 'interactive-os', license: 'MIT' } },
    'footer-links': { id: 'footer-links', data: { type: 'links' } },
    'footer-link-docs': { id: 'footer-link-docs', data: { type: 'link', label: 'Documentation', href: '#docs' } },
    'footer-link-github': { id: 'footer-link-github', data: { type: 'link', label: 'GitHub', href: '#github' } },
    'footer-link-npm': { id: 'footer-link-npm', data: { type: 'link', label: 'npm', href: '#npm' } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'stats', 'features', 'workflow', 'patterns', 'footer'],
    hero: ['hero-title', 'hero-subtitle', 'hero-cta'],
    stats: ['stat-patterns', 'stat-tests', 'stat-modules', 'stat-deps'],
    features: ['card-store', 'card-engine', 'card-aria', 'card-keyboard'],
    'card-store': ['card-store-icon', 'card-store-title', 'card-store-desc'],
    // ... other card children
    workflow: ['step-1', 'step-2', 'step-3', 'step-4'],
    patterns: ['pat-treegrid', 'pat-listbox', 'pat-tabs', 'pat-combobox', 'pat-grid', 'pat-menu', 'pat-dialog', 'pat-accordion', 'pat-treeview', 'pat-toolbar', 'pat-disclosure', 'pat-switch', 'pat-radiogroup', 'pat-alertdialog'],
    footer: ['footer-brand', 'footer-links'],
    'footer-links': ['footer-link-docs', 'footer-link-github', 'footer-link-npm'],
  },
})
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/__tests__/visual-cms.test.tsx`

- [ ] **Step 5: 커밋**

```bash
git add src/pages/PageVisualCms.tsx src/__tests__/visual-cms.test.tsx
git commit -m "feat: Visual CMS — unified hierarchical store with all sections"
```

---

### Task 5: Page 재구조화 — `useAria` + 커스텀 렌더링 + spatial

분리된 4개 `<Aria>` + listbox → `useAria` 직접 사용 + spatial behavior + useSpatialNav. 전체 페이지 항상 렌더링, 포커스 링만 이동.

**렌더링 전략:** `<Aria.Node>` 사용하지 않음. `<Aria.Node>`는 expanded 상태에 따라 자식 렌더링을 gate하기 때문 (`aria.tsx:95`). 대신 `useAria`로 엔진 접근 + 커스텀 `CmsNodeRenderer`가 전체 tree를 항상 렌더링. 각 요소에 `getNodeProps(id)`로 포커스/선택/키보드 props 적용.

**Files:**
- Modify: `src/pages/PageVisualCms.tsx` (대폭 재구조화)
- Modify: `src/pages/PageVisualCms.css` (선택 상태 CSS 추가)
- Test: `src/__tests__/visual-cms.test.tsx`

- [ ] **Step 1: 통합 테스트 작성 — 핵심 네비게이션**

```ts
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PageVisualCms from '../pages/PageVisualCms'

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-node-id]')?.getAttribute('data-node-id') ?? ''
}

function getSelected(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[aria-selected="true"][data-node-id]'))
    .map(el => el.getAttribute('data-node-id')!)
}

describe('Visual CMS spatial navigation', () => {
  it('initial focus is first section (hero)', async () => {
    const { container } = render(<PageVisualCms />)
    expect(getFocused(container as HTMLElement)).toBe('hero')
  })

  it('ArrowDown moves to next section', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container as HTMLElement)).toBe('stats')
  })

  it('Enter drills into section, Escape returns', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const stats = (container as HTMLElement).querySelector('[data-node-id="stats"]') as HTMLElement
    stats.focus()

    await user.keyboard('{Enter}')
    // Now inside stats — first child focused
    expect(getFocused(container as HTMLElement)).toBe('stat-patterns')

    await user.keyboard('{Escape}')
    // Back to section level — stats focused
    expect(getFocused(container as HTMLElement)).toBe('stats')
  })

  it('Space toggles selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()

    await user.keyboard(' ')
    expect(getSelected(container as HTMLElement)).toContain('hero')

    await user.keyboard(' ')
    expect(getSelected(container as HTMLElement)).not.toContain('hero')
  })

  it('Home/End move to first/last sibling', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()

    await user.keyboard('{End}')
    expect(getFocused(container as HTMLElement)).toBe('footer')

    await user.keyboard('{Home}')
    expect(getFocused(container as HTMLElement)).toBe('hero')
  })

  it('Tab exits widget (browser native)', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()

    await user.keyboard('{Tab}')
    // Focus should no longer be on any data-node-id element
    const focused = getFocused(container as HTMLElement)
    // Tab should move away from the widget
    expect(document.activeElement?.getAttribute('data-node-id')).toBeNull()
  })

  it('no wrapping at boundaries', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()

    await user.keyboard('{ArrowUp}')
    // Still on hero — no wrap
    expect(getFocused(container as HTMLElement)).toBe('hero')
  })
})
```

- [ ] **Step 2: 테스트 실행, 실패 확인**

Run: `npx vitest run src/__tests__/visual-cms.test.tsx`
Expected: FAIL — PageVisualCms still uses old listbox structure

- [ ] **Step 3: PageVisualCms 재구조화**

핵심 구조:

```tsx
import { useState } from 'react'
import { useAria } from '../interactive-os/hooks/useAria'
import { spatial } from '../interactive-os/behaviors/spatial'
import { useSpatialNav } from '../interactive-os/hooks/use-spatial-nav'
import { core } from '../interactive-os/plugins/core'
import { getChildren } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Entity } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

export default function PageVisualCms() {
  const [data, setData] = useState<NormalizedData>(cmsStore)
  const spatialKeyMap = useSpatialNav('[data-cms-root]', data)
  const aria = useAria({
    behavior: spatial,
    data,
    plugins: [core()],
    keyMap: spatialKeyMap,
    onChange: setData,
  })

  // 재귀 렌더러 — 모든 깊이 항상 렌더링
  function renderNode(id: string): React.ReactNode {
    const entity = aria.getStore().entities[id]
    if (!entity) return null
    const state = aria.getNodeState(id)
    const props = aria.getNodeProps(id)
    const children = getChildren(aria.getStore(), id)

    return (
      <div key={id} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        <NodeContent entity={entity} state={state} />
        {children.map(childId => renderNode(childId))}
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label="Visual CMS"
      data-cms-root
      className="cms-landing"
      {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
    >
      {getChildren(aria.getStore(), ROOT_ID).map(id => renderNode(id))}
    </div>
  )
}

// node type별 렌더링 분기
function NodeContent({ entity, state }: { entity: Entity; state: NodeState }) {
  const d = entity.data as Record<string, string>
  const focusedClass = state.focused ? ' cms-node--focused' : ''
  const selectedClass = state.selected ? ' cms-node--selected' : ''

  switch (d.variant || d.type) {
    case 'hero':
      return <section className={`cms-hero${focusedClass}${selectedClass}`}>...</section>
    case 'stat':
      return <div className={`cms-stat${focusedClass}${selectedClass}`}>...</div>
    case 'card':
      return <div className={`cms-feature-card${focusedClass}${selectedClass}`}>...</div>
    // ... 각 타입별 렌더링
    default:
      return <div className={`cms-node${focusedClass}${selectedClass}`}>{d.value || d.label || entity.id}</div>
  }
}
```

**삭제:** 기존 `statsStore`, `featuresStore`, `stepsStore`, `patternsStore`, 기존 `Stats()`, `Features()`, `HowItWorks()`, `Patterns()` 컴포넌트에서 `<Aria>` + `listbox` 래퍼 제거.

- [ ] **Step 4: Click-to-depth 구현**

`aria.getNodeProps(id)`의 `onClick` 핸들러를 커스터마이즈. 클릭한 노드의 부모를 `__spatial_parent__`로 설정하여 해당 깊이로 자동 전환:

```tsx
// renderNode 내에서 onClick 오버라이드
const handleClick = (e: React.MouseEvent) => {
  e.stopPropagation()
  const parentId = getParent(aria.getStore(), id)
  if (parentId && parentId !== getSpatialParentId(aria.getStore())) {
    // 깊이 전환: spatial parent를 이 노드의 부모로 설정
    aria.dispatch(spatialCommands.enterChild(parentId === ROOT_ID ? ROOT_ID : parentId))
  }
  aria.dispatch(focusCommands.setFocus(id))
}
```

- [ ] **Step 5: CSS — 선택 상태 + 포커스 구분**

`src/pages/PageVisualCms.css`에 추가:

```css
/* 포커스 상태 — border */
.cms-node--focused {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* 선택 상태 — background, 포커스와 독립 */
.cms-node--selected {
  background: var(--accent-dim);
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npx vitest run src/__tests__/visual-cms.test.tsx`

- [ ] **Step 7: 전체 테스트 회귀 확인**

Run: `npx vitest run`

- [ ] **Step 8: 커밋**

```bash
git add src/pages/PageVisualCms.tsx src/pages/PageVisualCms.css src/__tests__/visual-cms.test.tsx
git commit -m "feat: Visual CMS — unified spatial navigation with useAria + custom rendering"
```

---

### Task 6: 통합 검증 — PRD 테스트 커버리지

PRD의 보편 규칙 테스트(T1~T14) + 적용 예시 테스트(E1~E7)을 완전히 커버.

**Files:**
- Modify: `src/__tests__/visual-cms.test.tsx`

- [ ] **Step 1: PRD 보편 규칙 테스트 (T1~T14)**

```ts
describe('PRD — universal rules', () => {
  // T1: 가로 배치 → ← → 이동
  it('T1: horizontal layout navigates with ← →', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    // Enter stats (horizontal), ArrowRight → next stat
    const stats = (container as HTMLElement).querySelector('[data-node-id="stats"]') as HTMLElement
    stats.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowRight}')
    expect(getFocused(container as HTMLElement)).toBe('stat-tests')
  })

  // T2: 가로 배치에서 ↑↓ 무시
  it('T2: horizontal layout ignores ↑↓', async () => {
    // Stats 진입 후 ↑↓ → 변화 없음
  })

  // T3: 그리드 배치 4방향
  it('T3: grid layout navigates 4 directions', async () => {
    // Features 진입 후 ← → ↑ ↓ 전부 동작
  })

  // T4: Enter 깊이 진입
  it('T4: Enter drills into children', async () => { /* ... */ })

  // T5: Escape 깊이 복귀
  it('T5: Escape returns to parent depth', async () => { /* ... */ })

  // T6: Space 선택 토글
  it('T6: Space toggles selection', async () => { /* ... */ })

  // T7: Shift+방향키 범위 선택
  it('T7: Shift+Arrow extends selection', async () => {
    // Enter features, Shift+ArrowRight → 범위 선택
  })

  // T8: Tab 위젯 밖
  it('T8: Tab exits widget', async () => { /* ... */ })

  // T9: 래핑 없음
  it('T9: no wrapping at boundaries', async () => { /* ... */ })

  // T10: 불완전 그리드 행 ↓
  it('T10: incomplete grid row ↓ moves to nearest', async () => {
    // Patterns auto-fill grid — ↓ from position with no element directly below
  })

  // T11: 리사이즈 후 재계산
  it('T11: navigation works after resize', async () => {
    // Resize → next keypress uses updated DOM positions
    // Note: jsdom doesn't support real layout, so this tests that
    // useSpatialNav recollects rects on store change
  })

  // T12: 자식 없는 요소에서 Enter 무시
  it('T12: Enter on leaf node is ignored', async () => {
    // Enter stats, focus a stat item, Enter → no depth change
  })

  // T13: Home/End
  it('T13: Home/End jump to first/last sibling', async () => { /* ... */ })

  // T14: 클릭으로 깊이 점프
  it('T14: click jumps to correct depth + focuses', async () => {
    // Click on a card inside features → spatial parent becomes 'features', card focused
  })
})
```

- [ ] **Step 2: PRD 적용 예시 테스트 (E1~E7)**

```ts
describe('PRD — landing page examples', () => {
  // E1: Features 2열 그리드 → →
  it('E1: Features grid ArrowRight', async () => { /* ... */ })
  // E2: Features ↓
  it('E2: Features grid ArrowDown', async () => { /* ... */ })
  // E3: Stats → →
  it('E3: Stats ArrowRight', async () => { /* ... */ })
  // E4: Hero ↓
  it('E4: Hero ArrowDown through title/subtitle/cta', async () => { /* ... */ })
  // E5: Footer → →
  it('E5: Footer ArrowRight', async () => { /* ... */ })
  // E6: Patterns 4방향
  it('E6: Patterns 4-direction navigation', async () => { /* ... */ })
  // E7: card 내부 필드 이동
  it('E7: card depth — navigate through icon/title/desc', async () => { /* ... */ })
})
```

- [ ] **Step 3: 전체 테스트 통과 확인**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: 커밋**

```bash
git add src/__tests__/visual-cms.test.tsx
git commit -m "test: Visual CMS — comprehensive PRD coverage (T1-T14, E1-E7)"
```
