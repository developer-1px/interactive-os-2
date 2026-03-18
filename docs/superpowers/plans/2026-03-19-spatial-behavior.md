# Spatial Behavior Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TV리모컨식 공간 네비게이션 + Figma식 깊이 탐색을 지원하는 spatial behavior를 구현하고, Visual CMS 페이지를 리빌드한다.

**Architecture:** 기존 AriaBehavior 인터페이스를 준수하되, DOM 위치 기반 네비게이션은 별도 React hook(`useSpatialNav`)으로 분리한다. 깊이 탐색 상태(`__spatial_parent__`)는 새 plugin이 관리하고, behavior는 Enter/Esc로 레벨 전환한다. AriaNode 렌더링은 `__spatial_parent__`의 직계 자식만 표시한다.

**Tech Stack:** React 19, TypeScript, Vitest, interactive-os (normalized store + command engine + plugin)

**Key Design Decision:** BehaviorContext는 DOM 접근이 없으므로, 공간 네비게이션(화살표 → 가장 가까운 이웃)은 `useSpatialNav` hook이 `keyMap` prop으로 주입한다. behavior 자체는 깊이 탐색(Enter/Esc) + ARIA 속성만 담당.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/interactive-os/plugins/spatial.ts` | `__spatial_parent__` 상태 관리 (enterChild, exitToParent 커맨드) |
| Create | `src/interactive-os/behaviors/spatial.ts` | AriaBehavior 정의 (role, depth keyMap, ARIA attributes) |
| Create | `src/interactive-os/hooks/use-spatial-nav.ts` | DOM getBoundingClientRect 기반 이웃 탐색 + keyMap 생성 |
| Create | `src/__tests__/plugins/spatial.test.ts` | spatial plugin 단위 테스트 |
| Create | `src/__tests__/behaviors/spatial.test.ts` | spatial behavior 단위 테스트 |
| Create | `src/__tests__/hooks/use-spatial-nav.test.ts` | useSpatialNav hook 테스트 |
| Modify | `src/interactive-os/components/aria.tsx` | AriaNode가 `__spatial_parent__` 인식하여 해당 레벨만 렌더링 |
| Modify | `src/pages/PageVisualCms.tsx` | tree → spatial behavior 전환, 홈페이지 렌더링 UI |
| Modify | `src/pages/PageVisualCms.css` | 홈페이지 스타일 (hero, cards, tabs, footer 레이아웃) |

---

## Chunk 1: Spatial Plugin

### Task 1: spatial plugin — state management

`__spatial_parent__` 엔티티로 현재 깊이 레벨을 추적한다. 초기값은 ROOT_ID.

**Files:**
- Create: `src/interactive-os/plugins/spatial.ts`
- Create: `src/__tests__/plugins/spatial.test.ts`

- [ ] **Step 1: Write failing tests for spatial commands**

```typescript
// src/__tests__/plugins/spatial.test.ts
import { describe, it, expect } from 'vitest'
import { createStore } from '../../interactive-os/core/createStore'
import { createCommandEngine } from '../../interactive-os/core/createCommandEngine'
import { ROOT_ID } from '../../interactive-os/core/types'
import { spatial, spatialCommands, SPATIAL_PARENT_ID } from '../../interactive-os/plugins/spatial'

function createTestEngine() {
  const store = createStore({
    entities: {
      a: { id: 'a' },
      b: { id: 'b' },
      'a-1': { id: 'a-1' },
      'a-2': { id: 'a-2' },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b'],
      a: ['a-1', 'a-2'],
    },
  })
  const plugin = spatial()
  return createCommandEngine(store, plugin.middleware ? [plugin.middleware] : [])
}

describe('spatial plugin', () => {
  it('initializes with ROOT_ID as spatial parent', () => {
    const engine = createTestEngine()
    const parent = engine.getStore().entities[SPATIAL_PARENT_ID]
    expect(parent).toBeUndefined() // ROOT_ID is implicit default
  })

  it('enterChild sets spatial parent to given node', () => {
    const engine = createTestEngine()
    engine.dispatch(spatialCommands.enterChild('a'))
    const parent = engine.getStore().entities[SPATIAL_PARENT_ID]
    expect(parent?.parentId).toBe('a')
  })

  it('exitToParent restores spatial parent to grandparent', () => {
    const engine = createTestEngine()
    engine.dispatch(spatialCommands.enterChild('a'))
    engine.dispatch(spatialCommands.exitToParent())
    const parent = engine.getStore().entities[SPATIAL_PARENT_ID]
    expect(parent).toBeUndefined() // back to ROOT_ID (implicit)
  })

  it('enterChild is undoable', () => {
    const engine = createTestEngine()
    engine.dispatch(spatialCommands.enterChild('a'))
    expect(engine.getStore().entities[SPATIAL_PARENT_ID]?.parentId).toBe('a')
    // undo via command's undo method
    const store = spatialCommands.enterChild('a').undo(engine.getStore())
    // Store-level undo test — full undo tested via history plugin
  })

  it('exitToParent at ROOT_ID does nothing', () => {
    const engine = createTestEngine()
    engine.dispatch(spatialCommands.exitToParent())
    const parent = engine.getStore().entities[SPATIAL_PARENT_ID]
    expect(parent).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/plugins/spatial.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement spatial plugin**

```typescript
// src/interactive-os/plugins/spatial.ts
import type { NormalizedData, Command, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import { getParent } from '../core/normalized-store'

export const SPATIAL_PARENT_ID = '__spatial_parent__'

function getSpatialParentId(store: NormalizedData): string {
  return (store.entities[SPATIAL_PARENT_ID]?.parentId as string) ?? ROOT_ID
}

export const spatialCommands = {
  enterChild(nodeId: string): Command {
    let previousParentId: string | undefined
    return {
      type: 'spatial:enterChild',
      payload: { nodeId },
      execute(store) {
        previousParentId = getSpatialParentId(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: nodeId },
          },
        }
      },
      undo(store) {
        if (previousParentId === undefined || previousParentId === ROOT_ID) {
          const { [SPATIAL_PARENT_ID]: _removed, ...rest } = store.entities
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: previousParentId },
          },
        }
      },
    }
  },

  exitToParent(): Command {
    let previousParentId: string | undefined
    let grandparentId: string | undefined
    return {
      type: 'spatial:exitToParent',
      payload: {},
      execute(store) {
        previousParentId = getSpatialParentId(store)
        if (previousParentId === ROOT_ID) return store
        grandparentId = getParent(store, previousParentId) ?? ROOT_ID
        if (grandparentId === ROOT_ID) {
          const { [SPATIAL_PARENT_ID]: _removed, ...rest } = store.entities
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: grandparentId },
          },
        }
      },
      undo(store) {
        if (previousParentId === undefined || previousParentId === ROOT_ID) {
          const { [SPATIAL_PARENT_ID]: _removed, ...rest } = store.entities
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: previousParentId },
          },
        }
      },
    }
  },
}

export function spatial(): Plugin {
  return { name: 'spatial' }
}

export { getSpatialParentId }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/plugins/spatial.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/plugins/spatial.ts src/__tests__/plugins/spatial.test.ts
git commit -m "feat: add spatial plugin — __spatial_parent__ state management"
```

---

## Chunk 2: Spatial Behavior

### Task 2: spatial behavior — AriaBehavior definition

깊이 탐색(Enter/Esc) + ARIA 속성. 공간 네비게이션은 keyMap prop으로 외부 주입.

**Files:**
- Create: `src/interactive-os/behaviors/spatial.ts`
- Create: `src/__tests__/behaviors/spatial.test.ts`

- [ ] **Step 1: Write failing tests for spatial behavior**

```typescript
// src/__tests__/behaviors/spatial.test.ts
import { describe, it, expect } from 'vitest'
import { spatial } from '../../interactive-os/behaviors/spatial'

describe('spatial behavior', () => {
  it('has role "group" and childRole "group"', () => {
    expect(spatial.role).toBe('group')
    expect(spatial.childRole).toBe('group')
  })

  it('uses roving-tabindex with both orientation', () => {
    expect(spatial.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'both',
    })
  })

  it('has Enter and Escape in keyMap', () => {
    expect(spatial.keyMap).toHaveProperty('Enter')
    expect(spatial.keyMap).toHaveProperty('Escape')
  })

  it('ariaAttributes returns aria-level', () => {
    const entity = { id: 'test' }
    const state = {
      focused: true,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 3,
      level: 2,
    }
    const attrs = spatial.ariaAttributes(entity, state)
    expect(attrs['aria-level']).toBe('2')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/behaviors/spatial.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement spatial behavior**

```typescript
// src/interactive-os/behaviors/spatial.ts
import type { AriaBehavior, NodeState, BehaviorContext } from './types'
import type { Command } from '../core/types'
import { spatialCommands } from '../plugins/spatial'
import { focusCommands } from '../plugins/core'
import { renameCommands } from '../plugins/rename'

export const spatial: AriaBehavior = {
  role: 'group',
  childRole: 'group',
  keyMap: {
    Enter: (ctx: BehaviorContext): Command | void => {
      const children = ctx.getChildren(ctx.focused)
      if (children.length > 0) {
        // Container node → enter child level, focus first child
        return createBatchCommand([
          spatialCommands.enterChild(ctx.focused),
          focusCommands.setFocus(children[0]),
        ])
      }
      // Leaf node → start inline editing
      return renameCommands.startRename(ctx.focused)
    },
    Escape: (ctx: BehaviorContext): Command | void => {
      return spatialCommands.exitToParent()
    },
    F2: (ctx: BehaviorContext): Command | void => {
      return renameCommands.startRename(ctx.focused)
    },
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
  activateOnClick: true,
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {}
    if (state.level !== undefined) {
      attrs['aria-level'] = String(state.level)
    }
    return attrs
  },
}
```

Note: `createBatchCommand`는 `src/interactive-os/core/types.ts`에서 import. Enter 핸들러에서 enterChild + setFocus를 batch로 실행해야 하므로 import 필요. 실제 구현 시 해당 import 확인할 것.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/behaviors/spatial.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/behaviors/spatial.ts src/__tests__/behaviors/spatial.test.ts
git commit -m "feat: add spatial behavior — depth traversal via Enter/Esc"
```

---

## Chunk 3: Spatial Navigation Hook

### Task 3: useSpatialNav — DOM position-based neighbor finding

getBoundingClientRect로 가장 가까운 이웃을 찾아 keyMap을 생성하는 hook.

**Files:**
- Create: `src/interactive-os/hooks/use-spatial-nav.ts`
- Create: `src/__tests__/hooks/use-spatial-nav.test.ts`

- [ ] **Step 1: Write failing tests for neighbor finding algorithm**

```typescript
// src/__tests__/hooks/use-spatial-nav.test.ts
import { describe, it, expect } from 'vitest'
import { findNearest } from '../../interactive-os/hooks/use-spatial-nav'

// findNearest is the pure algorithm exported for testing.
// Input: current rect, direction, candidate rects with IDs
// Output: nearest node ID or null

describe('findNearest', () => {
  const rects = new Map<string, DOMRect>([
    ['a', new DOMRect(0, 0, 100, 100)],      // top-left
    ['b', new DOMRect(120, 0, 100, 100)],     // top-right
    ['c', new DOMRect(0, 120, 100, 100)],     // bottom-left
    ['d', new DOMRect(120, 120, 100, 100)],   // bottom-right
  ])

  it('ArrowRight from a → b (nearest to the right)', () => {
    expect(findNearest('a', 'ArrowRight', rects)).toBe('b')
  })

  it('ArrowDown from a → c (nearest below)', () => {
    expect(findNearest('a', 'ArrowDown', rects)).toBe('c')
  })

  it('ArrowLeft from b → a (nearest to the left)', () => {
    expect(findNearest('b', 'ArrowLeft', rects)).toBe('a')
  })

  it('ArrowUp from c → a (nearest above)', () => {
    expect(findNearest('c', 'ArrowUp', rects)).toBe('a')
  })

  it('ArrowRight from b → null (nothing to the right)', () => {
    expect(findNearest('b', 'ArrowRight', rects)).toBeNull()
  })

  it('diagonal preference: ArrowDown from a prefers c (directly below) over d', () => {
    expect(findNearest('a', 'ArrowDown', rects)).toBe('c')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/hooks/use-spatial-nav.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement findNearest algorithm**

```typescript
// src/interactive-os/hooks/use-spatial-nav.ts
import { useRef, useLayoutEffect, useMemo } from 'react'
import type { Command } from '../core/types'
import type { BehaviorContext } from '../behaviors/types'

type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

function center(rect: DOMRect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

function isInDirection(from: DOMRect, to: DOMRect, dir: Direction): boolean {
  const fc = center(from)
  const tc = center(to)
  switch (dir) {
    case 'ArrowRight': return tc.x > fc.x + 1
    case 'ArrowLeft':  return tc.x < fc.x - 1
    case 'ArrowDown':  return tc.y > fc.y + 1
    case 'ArrowUp':    return tc.y < fc.y - 1
  }
}

function distance(from: DOMRect, to: DOMRect, dir: Direction): number {
  const fc = center(from)
  const tc = center(to)
  // Primary axis distance + secondary axis penalty
  const dx = Math.abs(tc.x - fc.x)
  const dy = Math.abs(tc.y - fc.y)
  const isHorizontal = dir === 'ArrowLeft' || dir === 'ArrowRight'
  // Weight primary axis less to prefer aligned neighbors
  return isHorizontal ? dx + dy * 2 : dy + dx * 2
}

export function findNearest(
  fromId: string,
  dir: Direction,
  rects: Map<string, DOMRect>,
): string | null {
  const fromRect = rects.get(fromId)
  if (!fromRect) return null

  let bestId: string | null = null
  let bestDist = Infinity

  for (const [id, rect] of rects) {
    if (id === fromId) continue
    if (!isInDirection(fromRect, rect, dir)) continue
    const dist = distance(fromRect, rect, dir)
    if (dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }

  return bestId
}

// React hook — reads DOM positions and generates spatial keyMap
export function useSpatialNav(containerSelector: string) {
  const rectsRef = useRef<Map<string, DOMRect>>(new Map())

  useLayoutEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return
    const nodes = container.querySelectorAll<HTMLElement>('[data-node-id]')
    const map = new Map<string, DOMRect>()
    nodes.forEach((el) => {
      const id = el.getAttribute('data-node-id')
      if (id) map.set(id, el.getBoundingClientRect())
    })
    rectsRef.current = map
  })

  const keyMap = useMemo(() => {
    const focusCmd = (id: string): Command => ({
      type: 'core:focus',
      payload: { nodeId: id },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            __focus__: { id: '__focus__', focusedId: id },
          },
        }
      },
      undo(store) { return store }, // Focus undo handled by focusCommands
    })

    const makeHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
      const target = findNearest(ctx.focused, dir, rectsRef.current)
      if (target) return focusCmd(target)
    }

    return {
      ArrowUp: makeHandler('ArrowUp'),
      ArrowDown: makeHandler('ArrowDown'),
      ArrowLeft: makeHandler('ArrowLeft'),
      ArrowRight: makeHandler('ArrowRight'),
    } as Record<string, (ctx: BehaviorContext) => Command | void>
  }, [])

  return keyMap
}
```

Note: `focusCmd` 대신 실제로는 `focusCommands.setFocus(id)`를 사용한다. 위 코드는 import 없이 자체 완결되도록 작성했으나, 실제 구현 시 `plugins/core`에서 import할 것.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/hooks/use-spatial-nav.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/hooks/use-spatial-nav.ts src/__tests__/hooks/use-spatial-nav.test.ts
git commit -m "feat: add useSpatialNav hook — DOM position-based neighbor finding"
```

---

## Chunk 4: AriaNode Spatial Parent Support

### Task 4: AriaNode — __spatial_parent__ 인식

`__spatial_parent__`가 존재하면 해당 노드의 직계 자식만 렌더링하도록 AriaNode 수정.

**Files:**
- Modify: `src/interactive-os/components/aria.tsx`
- Test: 기존 테스트 + 수동 검증

- [ ] **Step 1: Read current AriaNode implementation**

Read: `src/interactive-os/components/aria.tsx:62-104`

- [ ] **Step 2: Modify AriaNode renderNodes to respect __spatial_parent__**

AriaNode의 `renderNodes` 함수에서 시작 parentId를 결정하는 로직을 변경:

```typescript
// Before:
return <>{renderNodes(ROOT_ID)}</>

// After:
const spatialParent = store.entities[SPATIAL_PARENT_ID]
const startParentId = (spatialParent?.parentId as string) ?? ROOT_ID
return <>{renderNodes(startParentId, /* flatMode */ !!spatialParent)}</>
```

`flatMode`가 true이면 자식의 자식은 재귀하지 않는다 (한 레벨만 렌더링). spatial behavior가 아닌 기존 behavior들은 `__spatial_parent__`가 없으므로 기존 동작 유지.

- [ ] **Step 3: Run existing tests to verify no regression**

Run: `npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/components/aria.tsx
git commit -m "feat: AriaNode respects __spatial_parent__ for flat-level rendering"
```

---

## Chunk 5: Visual CMS Rebuild

### Task 5: PageVisualCms — spatial behavior + 홈페이지 렌더링

tree behavior를 spatial로 교체하고, 노드 타입별로 실제 홈페이지처럼 렌더링.

**Files:**
- Modify: `src/pages/PageVisualCms.tsx`
- Modify: `src/pages/PageVisualCms.css`

- [ ] **Step 1: Replace tree import with spatial behavior + useSpatialNav**

```typescript
// Before:
import { tree } from '../interactive-os/behaviors/tree'

// After:
import { spatial } from '../interactive-os/behaviors/spatial'
import { spatial as spatialPlugin } from '../interactive-os/plugins/spatial'
import { useSpatialNav } from '../interactive-os/hooks/use-spatial-nav'
```

Plugin 배열에 `spatialPlugin()` 추가.

- [ ] **Step 2: Add useSpatialNav hook and merge keyMap**

```typescript
export default function PageVisualCms() {
  const [data, setData] = useState<NormalizedData>(initialStore)
  const spatialKeyMap = useSpatialNav('[aria-label="Page content editor"]')

  const mergedKeyMap = useMemo(() => ({
    ...spatialKeyMap,
    ...editingKeyMap,
  }), [spatialKeyMap])

  return (
    <Aria
      behavior={spatial}
      data={data}
      plugins={plugins}
      onChange={setData}
      keyMap={mergedKeyMap}
      aria-label="Page content editor"
    >
      <Aria.Node render={(node, state) => <CmsNode node={node} state={state} />} />
    </Aria>
  )
}
```

- [ ] **Step 3: Rebuild CmsNode render — 홈페이지 스타일 렌더링**

노드 타입별로 실제 홈페이지 UI를 렌더링하도록 CmsNode 컴포넌트를 리빌드. 포커스된 노드에 파란 아웃라인 오버레이.

Section 타입별 레이아웃:
- `hero`: 풀폭 배너 (큰 제목 + 소제목 + CTA 버튼)
- `cards`: 3열 그리드
- `tabs`: 탭 헤더 + 탭 패널
- `footer`: 하단 바

- [ ] **Step 4: Update PageVisualCms.css — 홈페이지 레이아웃 스타일**

hero, cards grid, tabs, footer 스타일. 포커스/선택 오버레이.

- [ ] **Step 5: 초기 데이터에서 __expanded__ 제거**

spatial behavior는 expand/collapse를 사용하지 않으므로, initialStore에서 `__expanded__` 설정 코드 제거.

- [ ] **Step 6: Run dev server and verify**

Run: `npx vite dev`
- 페이지에서 화살표로 공간 이동 확인
- Enter로 자식 진입 확인
- Esc로 부모 복귀 확인
- F2로 편집 확인

- [ ] **Step 7: Commit**

```bash
git add src/pages/PageVisualCms.tsx src/pages/PageVisualCms.css
git commit -m "feat: rebuild Visual CMS with spatial behavior — homepage-style rendering"
```

---

## Chunk 6: Integration Tests

### Task 6: E2E 검증 시나리오

Discussion에서 정의한 핵심 시나리오를 테스트로 검증.

**Files:**
- Create: `src/__tests__/pages/page-visual-cms.test.tsx` (또는 Playwright e2e)

- [ ] **Step 1: Write integration tests**

```typescript
describe('Visual CMS spatial navigation', () => {
  it('arrow keys navigate based on visual position')
  it('Enter on container enters child level')
  it('Enter on leaf starts inline editing')
  it('Escape returns to parent level')
  it('F2 starts editing regardless of node type')
  it('Ctrl+Z undoes depth traversal')
  it('card reorder with Alt+Arrow reflects in rendering')
})
```

- [ ] **Step 2: Run and fix until green**

Run: `npx vitest run src/__tests__/pages/page-visual-cms.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/pages/page-visual-cms.test.tsx
git commit -m "test: add Visual CMS spatial navigation integration tests"
```

---

## Execution Notes

- Task 1-3은 독립적이므로 병렬 실행 가능 (서브에이전트 3개)
- Task 4는 Task 1에 의존 (SPATIAL_PARENT_ID import)
- Task 5는 Task 1-4 모두에 의존
- Task 6는 Task 5에 의존
- `createBatchCommand` import 경로는 실제 코드에서 확인 필요 (`core/types.ts` 또는 별도 유틸)
- `getParent` 함수가 `normalized-store`에서 export되는지 확인 필요
- `focusCommands.setFocus`는 `plugins/core`에서 import
