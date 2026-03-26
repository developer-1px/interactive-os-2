# Spatial Cross-Boundary + Sticky Cursor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** spatial nav의 방향키가 그룹 경계를 넘어 인접 그룹으로 이동하고, sticky cursor로 가역적 동선을 보장한다.

**Architecture:** `useSpatialNav` hook에 cross-boundary fallback과 sticky cursor(`useRef<Map>`)를 추가. 기존 `findNearest`는 그대로 유지하고, 결과가 null일 때 인접 그룹 탐색으로 확장. CmsCanvas의 Enter/Escape/클릭 핸들러에서 cursor clear 콜백을 호출.

**Tech Stack:** React hooks, TypeScript, vitest + @testing-library/react + userEvent

**PRD:** `docs/superpowers/prds/2026-03-22-spatial-cross-boundary-prd.md`

---

### Task 1: `findAdjacentGroup` 순수 함수 + 단위 테스트

순수 함수라서 jsdom 제약 없이 테스트 가능. cross-boundary의 핵심 알고리즘.

**Files:**
- Modify: `src/interactive-os/hooks/useSpatialNav.ts` (함수 추가 + export)
- Test: `src/__tests__/hooks/use-spatial-nav.test.ts` (기존 findNearest 테스트 옆에 추가)

- [ ] **Step 1: `findAdjacentGroup` 테스트 작성**

테스트 레이아웃 — 2개 그룹(sec1, sec2)이 세로 배치, 각각 자식 보유:

```typescript
describe('findAdjacentGroup', () => {
  // Layout:
  //   sec1: [0,0,300,200]     children: a[0,0,100,100], b[120,0,100,100]
  //   sec2: [0,220,300,200]   children: c[0,220,100,100], d[120,220,100,100]
  const rect = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON() {} }) as DOMRect

  const groupRects = new Map([
    ['sec1', rect(0, 0, 300, 200)],
    ['sec2', rect(0, 220, 300, 200)],
  ])
  const siblings = ['sec1', 'sec2']

  it('ArrowDown from sec1 → sec2', () => {
    expect(findAdjacentGroup('sec1', 'ArrowDown', siblings, groupRects)).toBe('sec2')
  })

  it('ArrowUp from sec2 → sec1', () => {
    expect(findAdjacentGroup('sec2', 'ArrowUp', siblings, groupRects)).toBe('sec1')
  })

  it('ArrowDown from sec2 → null (no group below)', () => {
    expect(findAdjacentGroup('sec2', 'ArrowDown', siblings, groupRects)).toBeNull()
  })

  it('ArrowRight from sec1 → null (no group to the right)', () => {
    expect(findAdjacentGroup('sec1', 'ArrowRight', siblings, groupRects)).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npx vitest run src/__tests__/hooks/use-spatial-nav.test.ts`
Expected: FAIL — `findAdjacentGroup` is not exported

- [ ] **Step 3: `findAdjacentGroup` 구현**

`useSpatialNav.ts`에 추가:

```typescript
export function findAdjacentGroup(
  currentGroupId: string,
  dir: Direction,
  siblingGroupIds: string[],
  groupRects: Map<string, DOMRect>,
): string | null {
  const fromRect = groupRects.get(currentGroupId)
  if (!fromRect) return null

  const from = center(fromRect)
  let bestId: string | null = null
  let bestScore = Infinity

  for (const id of siblingGroupIds) {
    if (id === currentGroupId) continue
    const rect = groupRects.get(id)
    if (!rect) continue
    const c = center(rect)

    const inDirection =
      dir === 'ArrowRight' ? c.x > from.x + 1 :
      dir === 'ArrowLeft'  ? c.x < from.x - 1 :
      dir === 'ArrowDown'  ? c.y > from.y + 1 :
      /* ArrowUp */          c.y < from.y - 1

    if (!inDirection) continue

    const dx = Math.abs(c.x - from.x)
    const dy = Math.abs(c.y - from.y)
    const score =
      (dir === 'ArrowLeft' || dir === 'ArrowRight')
        ? dx + dy * 2
        : dy + dx * 2

    if (score < bestScore) {
      bestScore = score
      bestId = id
    }
  }

  return bestId
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npx vitest run src/__tests__/hooks/use-spatial-nav.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/__tests__/hooks/use-spatial-nav.test.ts src/interactive-os/hooks/useSpatialNav.ts
git commit -m "feat: add findAdjacentGroup for cross-boundary spatial nav"
```

---

### Task 2: `useSpatialNav` 반환값 변경 — sticky cursor + cross-boundary 통합

hook의 반환 타입을 변경하고, 방향키 핸들러에 cross-boundary fallback을 추가.

**Files:**
- Modify: `src/interactive-os/hooks/useSpatialNav.ts`
- Modify: `src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts` (구조 테스트 업데이트)

**테스트 파일 역할:**
- `src/__tests__/hooks/use-spatial-nav.test.ts` — `findNearest`, `findAdjacentGroup` 순수 함수 단위 테스트
- `src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts` — `useSpatialNav` hook 구조/반환값 테스트

**핵심 설계:**
- `useSpatialNav`의 반환 타입을 `{ keyMap, clearCursorsAtDepth }` 객체로 변경 (`saveCursor`는 내부 전용, 외부 노출 불필요)
- sticky cursor = `useRef<Map<string, string>>(new Map())` — hook 내부
- cross-boundary fallback: makeHandler 안에서 ① 현재 그룹 findNearest → ② null이면 findAdjacentGroup → ③ sticky cursor 복원 or 인접 자식 findNearest or 첫 자식
- cross-boundary 시 `spatialCommands.enterChild(adjacentGroupId)` + `focusCommands.setFocus(targetId)` 배치 커맨드 반환
- 그룹 rect 수집: `useLayoutEffect`에서 현재 allowed뿐 아니라 형제 그룹 rect도 수집

- [ ] **Step 1: `useSpatialNav` 반환 타입 변경 + 호출부 수정**

`useSpatialNav`를 `{ keyMap, saveCursor, clearCursorsAtDepth }` 객체 반환으로 변경:

```typescript
interface SpatialNavResult {
  keyMap: Record<string, (ctx: BehaviorContext) => Command | void>
  clearCursorsAtDepth: (parentId: string) => void
}
```

CmsCanvas.tsx 호출부도 동시에 수정:

```typescript
// Before:
const spatialKeyMap = useSpatialNav('[data-cms-root]', store, 'cms')
const mergedKeyMap = useMemo(() => ({ ...spatialKeyMap, ...cmsKeyMap }), [spatialKeyMap])

// After:
const spatialNav = useSpatialNav('[data-cms-root]', store, 'cms')
const mergedKeyMap = useMemo(() => ({ ...spatialNav.keyMap, ...cmsKeyMap }), [spatialNav.keyMap])
```

기존 `use-spatial-nav.test.ts`(hook 구조 테스트)도 `.keyMap`으로 접근하도록 수정.

- [ ] **Step 2: 테스트 실행 → 통과 확인 (구조 변경만, 동작 변경 없음)**

Run: `npx vitest run src/__tests__/hooks/use-spatial-nav.test.ts src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts`
Expected: PASS

- [ ] **Step 3: sticky cursor ref + saveCursor/clearCursorsAtDepth 콜백 구현**

`useSpatialNav` 내부에 추가:

```typescript
const stickyCursorRef = useRef<Map<string, string>>(new Map())
// storeRef로 최신 store를 항상 참조 — clearCursorsAtDepth가 render-time closure에 갇히지 않도록
const storeRef = useRef(store)
storeRef.current = store

const clearCursorsAtDepth = useCallback((parentId: string) => {
  // parentId의 형제 그룹 전체의 cursor를 삭제
  // parentId의 부모를 찾아서, 그 부모의 children 전체를 삭제
  const s = storeRef.current
  const grandparent = getParent(s, parentId) ?? ROOT_ID
  const siblings = getChildren(s, grandparent)
  for (const sib of siblings) {
    stickyCursorRef.current.delete(sib)
  }
}, []) // storeRef 사용으로 store 의존성 제거
```

- [ ] **Step 4: 그룹 rect 수집 확장**

`useLayoutEffect`에서 현재 allowed 외에 형제 그룹 rect도 수집:

```typescript
// 현재 spatialParent의 부모 = grandparent
// grandparent의 children = 형제 그룹 목록
const grandparentId = getParent(store, spatialParentId) ?? ROOT_ID
const siblingGroups = grandparentId !== ROOT_ID || spatialParentId !== ROOT_ID
  ? getChildren(store, grandparentId)
  : []

// 기존 allowed rect 수집 후, 형제 그룹 rect도 수집
const groupNext = new Map<string, DOMRect>()
for (const gid of siblingGroups) {
  const el = container.querySelector<HTMLElement>(`[${attrName}="${gid}"]`)
  if (el) groupNext.set(gid, el.getBoundingClientRect())
}
groupRectsRef.current = groupNext
siblingGroupIdsRef.current = siblingGroups
```

- [ ] **Step 5: cross-boundary fallback을 makeHandler에 통합**

```typescript
const makeHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
  // Step 1: 현재 그룹 내 findNearest
  const targetId = findNearest(ctx.focused, dir, rectsRef.current)
  if (targetId) return focusCommands.setFocus(targetId)

  // Step 2: 인접 그룹 탐색
  if (spatialParentId === ROOT_ID) return // ROOT에서는 cross-boundary 없음
  const adjacentId = findAdjacentGroup(
    spatialParentId, dir, siblingGroupIdsRef.current, groupRectsRef.current
  )
  if (!adjacentId) return

  // Step 3: sticky cursor 복원 or findNearest or 첫 자식
  // 떠나기 전 현재 위치 보관 — spatialParentId는 render-time 값이므로
  // "이동 전" 그룹 ID가 정확히 캡처됨 (의도적)
  stickyCursorRef.current.set(spatialParentId, ctx.focused)

  const sticky = stickyCursorRef.current.get(adjacentId)
  // sticky cursor 대상이 store에 존재하는지 확인
  if (sticky && store.entities[sticky]) {
    return createBatchCommand([
      spatialCommands.enterChild(adjacentId),
      focusCommands.setFocus(sticky),
    ])
  }

  // findNearest in adjacent group children
  const adjChildren = getChildren(store, adjacentId)
  // 인접 그룹 자식들의 rect 수집 (on-demand)
  const container = document.querySelector(containerSelector)
  if (container && adjChildren.length > 0) {
    const adjRects = new Map<string, DOMRect>()
    for (const cid of adjChildren) {
      const el = container.querySelector<HTMLElement>(`[${attrName}="${cid}"]`)
      if (el) adjRects.set(cid, el.getBoundingClientRect())
    }
    const nearestInAdj = findNearest(ctx.focused, dir, adjRects)
    if (nearestInAdj) {
      return createBatchCommand([
        spatialCommands.enterChild(adjacentId),
        focusCommands.setFocus(nearestInAdj),
      ])
    }
  }

  // Fallback: 첫 자식
  if (adjChildren.length > 0) {
    return createBatchCommand([
      spatialCommands.enterChild(adjacentId),
      focusCommands.setFocus(adjChildren[0]),
    ])
  }
}
```

**주의:**
- `Shift+Arrow` 핸들러는 cross-boundary를 추가하지 않음 (PRD N1 금지).
- Home/End는 `spatial` behavior 레이어에서 처리되며 `useSpatialNav`와 무관. 현재 구현이 이미 `getChildren(depthParentId)` 범위 내에서만 동작하므로 cross-boundary 영향 없음.

- [ ] **Step 6: 테스트 실행**

Run: `npx vitest run src/__tests__/hooks/use-spatial-nav.test.ts src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts`
Expected: PASS (기존 테스트 + 새 테스트 모두)

- [ ] **Step 7: 커밋**

```bash
git add src/interactive-os/hooks/useSpatialNav.ts src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts src/pages/cms/CmsCanvas.tsx
git commit -m "feat: add cross-boundary fallback + sticky cursor to useSpatialNav"
```

---

### Task 3: CmsCanvas Enter/Escape/클릭 핸들러에 sticky cursor clear 추가

**Files:**
- Modify: `src/pages/cms/CmsCanvas.tsx`

- [ ] **Step 1: Enter 핸들러에 clearCursorsAtDepth 추가**

CmsCanvas의 `cmsKeyMap`은 모듈 레벨 상수이므로, `spatialNav` hook 결과에 접근할 수 없다. `cmsKeyMap`을 컴포넌트 내부의 `useMemo`로 옮기거나, Enter/Escape를 별도 keyMap 오버라이드로 분리한다.

**방법:** `cmsKeyMap`의 Enter/Escape를 컴포넌트 내부 `useMemo`에서 `spatialNav.clearCursorsAtDepth`를 클로저로 캡처하는 방식으로 재구성.

```typescript
// CmsCanvas 컴포넌트 내부
const spatialNav = useSpatialNav('[data-cms-root]', store, 'cms')

const mergedKeyMap = useMemo(() => ({
  ...spatialNav.keyMap,
  ...cmsKeyMap, // Delete, Mod+ArrowUp/Down, Mod+D 등은 그대로
  Enter: (ctx: BehaviorContext) => {
    const children = ctx.getChildren(ctx.focused)
    if (children.length === 0) {
      const entity = ctx.getEntity(ctx.focused)
      const data = (entity?.data ?? {}) as Record<string, unknown>
      const fields = getEditableFields(data)
      if (fields.length === 0) return
      return renameCommands.startRename(ctx.focused)
    }
    spatialNav.clearCursorsAtDepth(ctx.focused) // ← 진입 그룹 cursor 리셋
    return createBatchCommand([
      spatialCommands.enterChild(ctx.focused),
      focusCommands.setFocus(children[0]),
    ])
  },
  Escape: (ctx: BehaviorContext) => {
    const spatialParent = ctx.getEntity('__spatial_parent__')
    const parentId = spatialParent?.parentId as string | undefined
    if (!parentId || parentId === ROOT_ID) return undefined
    spatialNav.clearCursorsAtDepth(parentId) // ← 해당 깊이 모든 cursor 리셋
    return createBatchCommand([
      spatialCommands.exitToParent(),
      focusCommands.setFocus(parentId),
    ])
  },
}), [spatialNav])
```

- [ ] **Step 2: 클릭 핸들러에 clearCursorsAtDepth 추가**

```typescript
const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
  e.stopPropagation()
  const s = aria.getStore()
  const parentId = getParent(s, nodeId) ?? ROOT_ID
  const currentSpatialParent = getSpatialParentId(s)

  spatialNav.clearCursorsAtDepth(parentId) // ← 클릭 대상 그룹 cursor 리셋

  if (parentId !== currentSpatialParent) {
    // ... 기존 로직 유지
  }
  aria.dispatch(focusCommands.setFocus(nodeId))
}, [aria, spatialNav])
```

- [ ] **Step 3: `cmsKeyMap`에서 Enter/Escape 제거**

모듈 레벨 `cmsKeyMap`에서 Enter, Escape를 제거 (이제 컴포넌트 내부 `useMemo`에서 처리):

```typescript
const cmsKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  Delete: (ctx) => { /* ... 기존 유지 ... */ },
  'Mod+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Mod+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
  'Mod+D': (ctx) => { /* ... 기존 유지 ... */ },
}
```

- [ ] **Step 4: 타입 체크 + 기존 테스트 통과 확인**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/pages/cms/CmsCanvas.tsx
git commit -m "feat: add sticky cursor clear to CMS Enter/Escape/click handlers"
```

---

### Task 4: 통합 테스트 — cross-boundary + sticky cursor

CMS 통합 테스트로 PRD 검증 시나리오 T1~T13 중 jsdom에서 가능한 것을 검증.

**핵심 제약:** jsdom은 `getBoundingClientRect()`가 모두 `{x:0,y:0,w:0,h:0}`을 반환. 따라서 `findNearest`와 `findAdjacentGroup`은 항상 null을 반환한다. 통합 테스트에서는 **rect를 mock**해야 한다.

**방법:** `useSpatialNav` 내부의 `useLayoutEffect`에서 DOM 쿼리하는 부분을, 테스트에서 `Element.prototype.getBoundingClientRect`를 스텁하여 원하는 레이아웃 제공.

**Files:**
- Create: `src/__tests__/spatial-cross-boundary.test.tsx`

- [ ] **Step 1: 테스트 fixture 설계**

3개 섹션(sec1, sec2, sec3)이 세로 배치. 각 섹션에 2개 자식.

```
sec1 [0, 0, 400, 200]
  a [0, 0, 180, 200]    b [200, 0, 180, 200]
sec2 [0, 220, 400, 200]
  c [0, 220, 180, 200]   d [200, 220, 180, 200]
sec3 [0, 440, 400, 200]
  e [0, 440, 180, 200]   f [200, 440, 180, 200]
```

- [ ] **Step 2: 테스트 작성 — T1 (cross-boundary ↓)**

```typescript
it('T1: ↓ at group boundary crosses to adjacent group', async () => {
  // sec1 > b에서 ↓ → sec1 내 findNearest null → sec2로 cross → c or d
  const { user, container } = setup()
  focusNode(container, 'b')
  await user.keyboard('{ArrowDown}')
  // spatialParent가 sec2로 전환되고, sec2의 자식에 포커스
  const focused = getFocused(container)
  expect(['c', 'd']).toContain(focused)
})
```

- [ ] **Step 3: 테스트 작성 — T2 (sticky cursor 복원)**

```typescript
it('T2: ↑ after cross-boundary restores sticky cursor', async () => {
  const { user, container } = setup()
  focusNode(container, 'b') // sec1 > b
  await user.keyboard('{ArrowDown}') // → sec2
  await user.keyboard('{ArrowUp}')   // → sec1, sticky cursor = b
  expect(getFocused(container)).toBe('b')
})
```

- [ ] **Step 4: 테스트 작성 — T4 (마지막 그룹에서 ↓ → 무시)**

```typescript
it('T4: ↓ at last group does nothing', async () => {
  const { user, container } = setup()
  focusNode(container, 'e') // sec3 > e
  await user.keyboard('{ArrowDown}')
  expect(getFocused(container)).toBe('e') // 변경 없음
})
```

- [ ] **Step 5: 테스트 작성 — T6 (Escape 후 sticky cursor 리셋)**

```typescript
it('T6: Escape clears sticky cursors at that depth', async () => {
  const { user, container } = setup()
  // Enter sec1 → b에서 ↓ → sec2로 cross (sticky = {sec1: b})
  // Escape → depth 0, sticky cursors 전부 삭제
  // Enter sec1 → 첫 자식(a)에 포커스 (sticky 없으므로)
  focusNode(container, 'sec1')
  await user.keyboard('{Enter}')     // sec1 진입, a 포커스
  await user.keyboard('{ArrowRight}') // b 포커스
  await user.keyboard('{ArrowDown}')  // sec2 cross
  await user.keyboard('{Escape}')     // depth 0 복귀
  await user.keyboard('{Enter}')      // sec2 재진입 → 첫 자식(sticky 삭제됨)
  expect(getFocused(container)).toBe('c') // sticky가 리셋되어 첫 자식
})
```

- [ ] **Step 6: 테스트 작성 — T9 (기존 그룹 내 이동 변경 없음)**

```typescript
it('T9: intra-group arrow nav unchanged', async () => {
  const { user, container } = setup()
  focusNode(container, 'a') // sec1 > a
  await user.keyboard('{ArrowRight}')
  expect(getFocused(container)).toBe('b')
})
```

- [ ] **Step 7: 테스트 작성 — T3 (연속 cross-boundary)**

```typescript
it('T3: consecutive ↓ crosses multiple groups', async () => {
  const { user, container } = setup()
  focusNode(container, 'a') // sec1 > a
  await user.keyboard('{ArrowDown}') // → sec2
  const mid = getFocused(container)
  expect(['c', 'd']).toContain(mid)
  await user.keyboard('{ArrowDown}') // → sec3
  const last = getFocused(container)
  expect(['e', 'f']).toContain(last)
})
```

- [ ] **Step 8: 테스트 작성 — T5 (cross-boundary 후 Enter)**

```typescript
it('T5: Enter after cross-boundary enters child + clears sticky', async () => {
  // sec1 > b에서 ↓ → sec2 > c. Enter → c의 자식(없으면 skip).
  // 이 fixture에서 sec2 자식(c,d)은 leaf이므로 Enter는 rename 시도.
  // sticky cursor가 clear되는지를 검증하기 위해 다시 Escape → Enter로 재진입.
})
```

> Note: T5는 fixture에 자식 있는 노드가 필요. fixture 확장이 필요하면 별도 설계.

- [ ] **Step 9: 테스트 작성 — T7 (클릭 후 sticky cursor 리셋)**

```typescript
it('T7: click after cross-boundary resets sticky cursor', async () => {
  const { user, container } = setup()
  focusNode(container, 'b') // sec1 > b
  await user.keyboard('{ArrowDown}') // → sec2 (sticky: {sec1: b})
  // 클릭으로 sec1 > a 직접 이동
  const nodeA = container.querySelector('[data-cms-id="a"]') as HTMLElement
  await user.click(nodeA)
  // sec1 sticky cursor가 리셋됨, 이제 cross-boundary로 돌아오면 nearest 사용
})
```

- [ ] **Step 10: 테스트 작성 — T8 (삭제된 sticky cursor fallback)**

```typescript
it('T8: deleted sticky node falls back to findNearest', async () => {
  const { user, container } = setup()
  focusNode(container, 'b') // sec1 > b
  await user.keyboard('{ArrowDown}') // → sec2 (sticky: {sec1: b})
  // b를 삭제 (Delete 키)
  // ↑로 sec1 복귀 → b가 없으므로 findNearest fallback
  // → sec1의 남은 자식(a)에 포커스
})
```

- [ ] **Step 11: 테스트 작성 — T10 (ROOT에서 cross-boundary 없음)**

```typescript
it('T10: ↓ at ROOT depth 0 boundary does nothing', async () => {
  const { user, container } = setup()
  // depth 0 (ROOT level) — sec3에서 ↓
  focusNode(container, 'sec3')
  await user.keyboard('{ArrowDown}')
  expect(getFocused(container)).toBe('sec3')
})
```

- [ ] **Step 12: 테스트 작성 — T11 (Shift+Arrow는 cross-boundary 안 함)**

```typescript
it('T11: Shift+Arrow does not cross boundary', async () => {
  const { user, container } = setup()
  focusNode(container, 'b') // sec1의 마지막
  await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
  expect(getFocused(container)).toBe('b') // 변경 없음
})
```

- [ ] **Step 13: 테스트 작성 — T12, T13 (depth 2 cross-boundary)**

depth 2 테스트를 위해 fixture에 sec1 > card-1(children: x, y), sec1 > card-2(children: z) 같은 중첩 구조 추가.

```typescript
it('T12: depth 2 cross-boundary between sibling containers', async () => {
  // card-1 > y에서 ↓ → card-2 > z
  const { user, container } = setupNested()
  enterDepth(user, container, 'card-1') // Enter card-1
  focusNode(container, 'y')
  await user.keyboard('{ArrowDown}')
  expect(getFocused(container)).toBe('z')
})

it('T13: depth 2 sticky cursor restore', async () => {
  const { user, container } = setupNested()
  enterDepth(user, container, 'card-1')
  focusNode(container, 'y')
  await user.keyboard('{ArrowDown}') // → card-2 > z
  await user.keyboard('{ArrowUp}')   // → card-1 > y (sticky)
  expect(getFocused(container)).toBe('y')
})
```

- [ ] **Step 14: Home/End 회귀 테스트 (N2 검증)**

```typescript
it('N2: Home/End does not cross boundary', async () => {
  const { user, container } = setup()
  focusNode(container, 'b') // sec1 마지막 자식
  await user.keyboard('{End}')
  expect(getFocused(container)).toBe('b') // sec1의 마지막 = b, 변경 없음
  await user.keyboard('{Home}')
  expect(getFocused(container)).toBe('a') // sec1의 첫 번째
})
```

- [ ] **Step 15: 테스트 실행 → 통과 확인**

Run: `npx vitest run src/__tests__/spatial-cross-boundary.test.tsx`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add src/__tests__/spatial-cross-boundary.test.tsx
git commit -m "test: cross-boundary spatial nav + sticky cursor integration tests"
```

---

### Task 5: 전체 검증 + 기존 테스트 회귀 확인

- [ ] **Step 1: TypeScript 에러 확인**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: ESLint 확인**

Run: `npx eslint src/interactive-os/hooks/useSpatialNav.ts src/pages/cms/CmsCanvas.tsx`
Expected: 0 errors

- [ ] **Step 3: 전체 테스트 실행**

Run: `npx vitest run`
Expected: All tests PASS. 특히 기존 CMS 테스트(inline edit, detail panel), spatial behavior 테스트가 깨지지 않아야 함.

- [ ] **Step 4: 기존 테스트 회귀 확인 리스트**

- `src/__tests__/hooks/use-spatial-nav.test.ts` — findNearest 순수함수 테스트
- `src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts` — hook 구조 테스트
- `src/interactive-os/__tests__/behaviors/spatial.test.tsx` — Space, Home, End
- `src/__tests__/cms-inline-edit.test.tsx` — Enter/Escape/F2 인라인 편집
- `src/__tests__/cms-detail-panel.test.tsx` — CMS 디테일 패널
