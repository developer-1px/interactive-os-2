# Behavior Axis Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AriaBehavior의 keyMap을 원자 축(axis)으로 분해하고 composePattern으로 조합하여, 기존 17개 behavior를 재작성한다. 모든 기존 테스트는 변경 없이 통과해야 한다.

**Architecture:** 축(Axis) = partial keyMap, 패턴(Pattern) = 축 스택 + metadata → AriaBehavior. chain of responsibility: 키 이벤트를 스택 위에서부터 순회, 첫 non-void Command 승리. plugin 키바인딩(CRUD/clipboard/history)은 축이 아닌 컴포넌트 레벨 useAria keyMap override.

**Tech Stack:** TypeScript, React, Vitest

**Spec:** `docs/superpowers/specs/2026-03-20-behavior-axis-decomposition-prd.md`

---

### Task 1: Axis 타입 + composePattern 함수

**Files:**
- Create: `src/interactive-os/axes/compose-pattern.ts`
- Test: `src/interactive-os/__tests__/compose-pattern.test.ts`

**Context:**
- `Axis` = `Record<string, (ctx: BehaviorContext) => Command | void>` — AriaBehavior.keyMap과 동일한 시그니처
- `composePattern(metadata, ...axes)` → `AriaBehavior` — chain of responsibility로 keyMap 합성
- 같은 키가 여러 축에 있으면: 스택 순서대로 호출, 첫 non-void Command 승리
- metadata = `{ role, childRole, focusStrategy, expandable?, selectionMode?, activateOnClick?, followFocus?, colCount?, ariaAttributes }`
- 참고: `src/interactive-os/behaviors/types.ts` (AriaBehavior, BehaviorContext 인터페이스)

- [ ] **Step 1: 테스트 작성**

```typescript
// src/interactive-os/__tests__/compose-pattern.test.ts
import { describe, it, expect } from 'vitest'
import { composePattern } from '../axes/compose-pattern'
import type { Axis } from '../axes/compose-pattern'
import type { BehaviorContext } from '../behaviors/types'

// mock ctx — focusNext/toggleSelect/activate가 식별 가능한 Command를 리턴
const mockCtx = {
  focusNext: () => ({ type: 'focusNext' }),
  focusPrev: () => ({ type: 'focusPrev' }),
  toggleSelect: () => ({ type: 'toggleSelect' }),
  activate: () => ({ type: 'activate' }),
} as unknown as BehaviorContext

describe('composePattern', () => {
  it('merges non-overlapping axes into a single keyMap', () => {
    const navV: Axis = {
      ArrowDown: (ctx) => ctx.focusNext(),
      ArrowUp: (ctx) => ctx.focusPrev(),
    }
    const select: Axis = {
      Space: (ctx) => ctx.toggleSelect(),
    }
    const pattern = composePattern(
      { role: 'listbox', childRole: 'option', focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' }, ariaAttributes: () => ({}) },
      navV, select,
    )
    expect(pattern.role).toBe('listbox')
    expect(Object.keys(pattern.keyMap)).toContain('ArrowDown')
    expect(Object.keys(pattern.keyMap)).toContain('Space')
    expect(pattern.keyMap.ArrowDown!(mockCtx)).toEqual({ type: 'focusNext' })
    expect(pattern.keyMap.Space!(mockCtx)).toEqual({ type: 'toggleSelect' })
  })

  it('chain of responsibility — first non-void wins on same key', () => {
    const high: Axis = {
      Space: (ctx) => ctx.toggleSelect(),  // always returns Command
    }
    const low: Axis = {
      Space: (ctx) => ctx.activate(),  // would return Command, but never reached
    }
    const pattern = composePattern(
      { role: 'listbox', childRole: 'option', focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' }, ariaAttributes: () => ({}) },
      high, low,
    )
    expect(pattern.keyMap.Space!(mockCtx)).toEqual({ type: 'toggleSelect' })
  })

  it('chain of responsibility — void falls through to next axis', () => {
    const high: Axis = {
      Space: () => undefined,  // void → fallback
    }
    const low: Axis = {
      Space: (ctx) => ctx.activate(),
    }
    const pattern = composePattern(
      { role: 'listbox', childRole: 'option', focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' }, ariaAttributes: () => ({}) },
      high, low,
    )
    expect(pattern.keyMap.Space!(mockCtx)).toEqual({ type: 'activate' })
  })

  it('all axes void → handler returns undefined', () => {
    const a: Axis = { Space: () => undefined }
    const b: Axis = { Space: () => undefined }
    const pattern = composePattern(
      { role: 'listbox', childRole: 'option', focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' }, ariaAttributes: () => ({}) },
      a, b,
    )
    expect(pattern.keyMap.Space!(mockCtx)).toBeUndefined()
  })

  it('metadata is passed through to AriaBehavior', () => {
    const pattern = composePattern(
      { role: 'tablist', childRole: 'tab', focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' }, followFocus: true, selectionMode: 'single' as const, activateOnClick: true, ariaAttributes: () => ({}) },
    )
    expect(pattern.role).toBe('tablist')
    expect(pattern.childRole).toBe('tab')
    expect(pattern.followFocus).toBe(true)
    expect(pattern.selectionMode).toBe('single')
    expect(pattern.focusStrategy.orientation).toBe('horizontal')
  })

  it('zero axes → empty keyMap', () => {
    const pattern = composePattern(
      { role: 'group', focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' }, ariaAttributes: () => ({}) },
    )
    expect(Object.keys(pattern.keyMap)).toHaveLength(0)
  })

  it('axis reorder changes behavior on same key (PRD #10)', () => {
    const selectAxis: Axis = { Space: (ctx) => ctx.toggleSelect() }
    const activateAxis: Axis = { Space: (ctx) => ctx.activate() }
    const meta = { role: 'test', focusStrategy: { type: 'roving-tabindex' as const, orientation: 'vertical' as const }, ariaAttributes: () => ({}) }

    const selectFirst = composePattern(meta, selectAxis, activateAxis)
    const activateFirst = composePattern(meta, activateAxis, selectAxis)

    expect(selectFirst.keyMap.Space!(mockCtx)).toEqual({ type: 'toggleSelect' })
    expect(activateFirst.keyMap.Space!(mockCtx)).toEqual({ type: 'activate' })
  })

  it('expandable and activateOnClick metadata passthrough', () => {
    const pattern = composePattern(
      { role: 'region', childRole: 'heading', focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' }, expandable: true, activateOnClick: true, ariaAttributes: () => ({}) },
    )
    expect(pattern.expandable).toBe(true)
    expect(pattern.activateOnClick).toBe(true)
  })

  it('axis using ctx.dispatch() can still return Command', () => {
    let dispatched = false
    const axisWithDispatch: Axis = {
      Enter: (ctx) => {
        ctx.dispatch({ type: 'side-effect' } as any)
        return ctx.activate()
      },
    }
    const ctxWithDispatch = { ...mockCtx, dispatch: () => { dispatched = true } } as unknown as BehaviorContext
    const pattern = composePattern(
      { role: 'test', focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' }, ariaAttributes: () => ({}) },
      axisWithDispatch,
    )
    const result = pattern.keyMap.Enter!(ctxWithDispatch)
    expect(result).toEqual({ type: 'activate' })
    expect(dispatched).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/compose-pattern.test.ts`
Expected: FAIL — compose-pattern 모듈 없음

- [ ] **Step 3: 구현**

```typescript
// src/interactive-os/axes/compose-pattern.ts
import type { AriaBehavior, BehaviorContext, FocusStrategy, NodeState, SelectionMode } from '../behaviors/types'
import type { Command, Entity } from '../core/types'

export type Axis = Record<string, (ctx: BehaviorContext) => Command | void>

export interface PatternMetadata {
  role: string
  childRole?: string
  focusStrategy: FocusStrategy
  expandable?: boolean
  selectionMode?: SelectionMode
  activateOnClick?: boolean
  followFocus?: boolean
  colCount?: number
  ariaAttributes: (node: Entity, state: NodeState) => Record<string, string>
}

export function composePattern(metadata: PatternMetadata, ...axes: Axis[]): AriaBehavior {
  // Collect all unique keys across all axes
  const allKeys = new Set<string>()
  for (const axis of axes) {
    for (const key of Object.keys(axis)) {
      allKeys.add(key)
    }
  }

  // Build merged keyMap with chain of responsibility
  const keyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {}
  for (const key of allKeys) {
    const handlers = axes
      .map((axis) => axis[key])
      .filter((h): h is (ctx: BehaviorContext) => Command | void => h != null)

    if (handlers.length === 1) {
      keyMap[key] = handlers[0]!
    } else {
      keyMap[key] = (ctx) => {
        for (const handler of handlers) {
          const result = handler(ctx)
          if (result !== undefined) return result
        }
        return undefined
      }
    }
  }

  return {
    role: metadata.role,
    childRole: metadata.childRole,
    keyMap,
    focusStrategy: metadata.focusStrategy,
    expandable: metadata.expandable,
    selectionMode: metadata.selectionMode,
    activateOnClick: metadata.activateOnClick,
    followFocus: metadata.followFocus,
    colCount: metadata.colCount,
    ariaAttributes: metadata.ariaAttributes,
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/compose-pattern.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: 커밋**

```
feat(axes): composePattern — chain of responsibility axis composition
```

---

### Task 2: Navigation 축 (navV, navH, navVhUniform, navGrid)

**Files:**
- Create: `src/interactive-os/axes/nav-v.ts`
- Create: `src/interactive-os/axes/nav-h.ts`
- Create: `src/interactive-os/axes/nav-vh-uniform.ts`
- Create: `src/interactive-os/axes/nav-grid.ts`
- Test: `src/interactive-os/__tests__/axes-nav.test.ts`

**Context:**
- 각 축의 keyMap은 기존 behavior 파일에서 추출. 정확한 동작은 아래 참조:
  - navV: `behaviors/listbox.ts` 의 ArrowDown/ArrowUp/Home/End
  - navH: `behaviors/tabs.ts` 의 ArrowRight/ArrowLeft/Home/End
  - navVhUniform: `behaviors/radiogroup.ts` 의 4방향 (wrap 필수)
  - navGrid: `behaviors/grid.ts` 의 4방향 + Mod+Home/End
- wrap 옵션이 필요한 축은 factory 함수: `navVhUniform(options?)`, `navH(options?)`
- navGrid는 `navGrid(options: { columns: number })` factory — ctx.grid 사용

- [ ] **Step 1: 테스트 작성** — navV의 ArrowDown/ArrowUp/Home/End가 ctx.focusNext/focusPrev/focusFirst/focusLast를 호출하는지 검증. navH 동일 패턴. navVhUniform은 4방향 모두 wrap:true. navGrid는 ctx.grid?.focusNextCol 등 사용.

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: 구현**

navV:
```typescript
import type { Axis } from './compose-pattern'
export const navV: Axis = {
  ArrowDown: (ctx) => ctx.focusNext(),
  ArrowUp: (ctx) => ctx.focusPrev(),
  Home: (ctx) => ctx.focusFirst(),
  End: (ctx) => ctx.focusLast(),
}
```

navH (factory — wrap 옵션):
```typescript
import type { Axis } from './compose-pattern'
export function navH(options?: { wrap?: boolean }): Axis {
  const wrap = options?.wrap
  return {
    ArrowRight: (ctx) => ctx.focusNext(wrap ? { wrap: true } : undefined),
    ArrowLeft: (ctx) => ctx.focusPrev(wrap ? { wrap: true } : undefined),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
  }
}
```

navVhUniform (factory — wrap 옵션):
```typescript
import type { Axis } from './compose-pattern'
export function navVhUniform(options?: { wrap?: boolean }): Axis {
  const opts = options?.wrap ? { wrap: true } : undefined
  return {
    ArrowDown: (ctx) => ctx.focusNext(opts),
    ArrowUp: (ctx) => ctx.focusPrev(opts),
    ArrowRight: (ctx) => ctx.focusNext(opts),
    ArrowLeft: (ctx) => ctx.focusPrev(opts),
  }
}
```

navGrid (factory — columns 필수):
```typescript
import type { Axis } from './compose-pattern'
export function navGrid(options: { columns: number }): Axis {
  return {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    ArrowRight: (ctx) => ctx.grid?.focusNextCol() ?? ctx.focusNext(),
    ArrowLeft: (ctx) => ctx.grid?.focusPrevCol() ?? ctx.focusPrev(),
    Home: (ctx) => ctx.grid?.focusFirstCol() ?? ctx.focusFirst(),
    End: (ctx) => ctx.grid?.focusLastCol() ?? ctx.focusLast(),
    'Mod+Home': (ctx) => ctx.focusFirst(),
    'Mod+End': (ctx) => ctx.focusLast(),
  }
}
// Note: columns는 navGrid의 keyMap에서 직접 사용하지 않음 — metadata.colCount로 전달되어 ctx.grid를 세팅
// factory 시그니처는 의미적 명확성을 위해 유지
```

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat(axes): nav-v, nav-h, nav-vh-uniform, nav-grid — navigation axes
```

---

### Task 3: Depth 축 (depthArrow, depthEnterEsc)

**Files:**
- Create: `src/interactive-os/axes/depth-arrow.ts`
- Create: `src/interactive-os/axes/depth-enter-esc.ts`
- Test: `src/interactive-os/__tests__/axes-depth.test.ts`

**Context:**
- depthArrow: `behaviors/tree.ts` 의 ArrowRight/ArrowLeft — state-dependent (isExpanded → focusChild/collapse, !isExpanded → expand/focusParent)
- depthEnterEsc: `behaviors/spatial.ts` 의 Enter/Escape — Enter = enterChild (children있으면) or startRename (leaf), Escape = exitToParent
- depthEnterEsc는 spatial 전용 로직(`spatialCommands`, `SPATIAL_PARENT_ID`)을 사용 — `behaviors/spatial.ts`에서 그대로 추출
- 참고: `src/interactive-os/plugins/spatial.ts` (spatialCommands, SPATIAL_PARENT_ID)

- [ ] **Step 1: 테스트 작성** — depthArrow: collapsed→expand, expanded→focusChild, ArrowLeft: expanded→collapse, collapsed→focusParent. depthEnterEsc: Enter with children→enterChild batch, Enter leaf→startRename, Escape with parent→exitToParent batch, Escape at root→void.

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: 구현**

depthArrow:
```typescript
import type { Axis } from './compose-pattern'
export const depthArrow: Axis = {
  ArrowRight: (ctx) => ctx.isExpanded ? ctx.focusChild() : ctx.expand(),
  ArrowLeft: (ctx) => ctx.isExpanded ? ctx.collapse() : ctx.focusParent(),
}
```

depthEnterEsc — `behaviors/spatial.ts`의 Enter/Escape 로직을 그대로 추출:
```typescript
import type { Axis } from './compose-pattern'
import { createBatchCommand, ROOT_ID } from '../core/types'
import { spatialCommands, SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands } from '../plugins/core'
import { renameCommands } from '../plugins/rename'

export const depthEnterEsc: Axis = {
  Enter: (ctx) => {
    const children = ctx.getChildren(ctx.focused)
    if (children.length > 0) {
      return createBatchCommand([
        spatialCommands.enterChild(ctx.focused),
        focusCommands.setFocus(children[0]),
      ])
    }
    return renameCommands.startRename(ctx.focused)
  },
  Escape: (ctx) => {
    const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
    const parentId = spatialParent?.parentId as string | undefined
    if (!parentId || parentId === ROOT_ID) return undefined
    return createBatchCommand([
      spatialCommands.exitToParent(),
      focusCommands.setFocus(parentId),
    ])
  },
}
```

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat(axes): depth-arrow, depth-enter-esc — hierarchical traversal axes
```

---

### Task 4: Selection 축 (selectToggle, selectExtended)

**Files:**
- Create: `src/interactive-os/axes/select-toggle.ts`
- Create: `src/interactive-os/axes/select-extended.ts`
- Test: `src/interactive-os/__tests__/axes-select.test.ts`

**Context:**
- selectToggle: Space → `ctx.toggleSelect()` — 모든 selection-enabled 패턴이 공유
- selectExtended: Shift+Arrow/Home/End → `ctx.extendSelection(direction)` — listbox, tree, treegrid
- 참고: `behaviors/listbox.ts` (두 축 모두 사용)

- [ ] **Step 1: 테스트 작성**

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: 구현**

```typescript
// axes/select-toggle.ts
import type { Axis } from './compose-pattern'
export const selectToggle: Axis = {
  Space: (ctx) => ctx.toggleSelect(),
}

// axes/select-extended.ts
import type { Axis } from './compose-pattern'
export const selectExtended: Axis = {
  'Shift+ArrowDown': (ctx) => ctx.extendSelection('next'),
  'Shift+ArrowUp': (ctx) => ctx.extendSelection('prev'),
  'Shift+Home': (ctx) => ctx.extendSelection('first'),
  'Shift+End': (ctx) => ctx.extendSelection('last'),
}
```

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat(axes): select-toggle, select-extended — selection axes
```

---

### Task 5: Activation 축 (activate, activateFollowFocus)

**Files:**
- Create: `src/interactive-os/axes/activate.ts`
- Create: `src/interactive-os/axes/activate-follow-focus.ts`
- Test: `src/interactive-os/__tests__/axes-activate.test.ts`

**Context:**
- activate: Enter + Space → `ctx.activate()` — toolbar, menu, accordion, disclosure, switch 등
- activateFollowFocus: Enter + Space → `ctx.activate()` — tabs 전용 (metadata.followFocus=true와 함께 사용)
- 두 축의 keyMap은 동일하지만, activateFollowFocus는 의미적 구분을 위해 별도 모듈. 실제 followFocus 동작은 useAria가 metadata.followFocus를 읽어 처리.
- 참고: `behaviors/tabs.ts`, `behaviors/toolbar.ts`

- [ ] **Step 1: 테스트 작성**

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: 구현**

```typescript
// axes/activate.ts
import type { Axis } from './compose-pattern'
export const activate: Axis = {
  Enter: (ctx) => ctx.activate(),
  Space: (ctx) => ctx.activate(),
}

// axes/activate-follow-focus.ts
import type { Axis } from './compose-pattern'
export const activateFollowFocus: Axis = {
  Enter: (ctx) => ctx.activate(),
  Space: (ctx) => ctx.activate(),
}
```

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat(axes): activate, activate-follow-focus — activation axes
```

---

### Task 6: focusTrap 축

**Files:**
- Create: `src/interactive-os/axes/focus-trap.ts`
- Test: `src/interactive-os/__tests__/axes-misc.test.ts`

**Context:**
- focusTrap: `behaviors/dialog.ts`의 Escape → `ctx.collapse()` 추출
- Tab cycling은 DOM/focusStrategy(natural-tab-order) 레벨에서 처리 — keyMap에 Tab 불필요
- crossH는 kanban 데이터 구조(columns>cards 2단계)에 종속 → 공유 축이 아닌 kanban.ts 내부 축으로 이동 (Task 12)
- valueArrow는 P2 미구현 → 이번 scope 제외
- 공유 축 최종: 11개 (navV, navH, navVhUniform, navGrid, depthArrow, depthEnterEsc, selectToggle, selectExtended, activate, activateFollowFocus, focusTrap)

- [ ] **Step 1: 테스트 작성** — focusTrap: Escape → collapse

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: 구현**

```typescript
// axes/focus-trap.ts
import type { Axis } from './compose-pattern'
export const focusTrap: Axis = {
  Escape: (ctx) => ctx.collapse(),
}
```

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat(axes): focus-trap — dialog escape axis
```

---

### Task 7: 단순 behavior 재작성 (disclosure, switch, dialog, alertdialog, accordion, toolbar, radiogroup, tabs)

**Files:**
- Modify: `src/interactive-os/behaviors/disclosure.ts`
- Modify: `src/interactive-os/behaviors/switch.ts`
- Modify: `src/interactive-os/behaviors/dialog.ts`
- Modify: `src/interactive-os/behaviors/alertdialog.ts`
- Modify: `src/interactive-os/behaviors/accordion.ts`
- Modify: `src/interactive-os/behaviors/toolbar.ts`
- Modify: `src/interactive-os/behaviors/radiogroup.ts`
- Modify: `src/interactive-os/behaviors/tabs.ts`
- Test: 기존 integration 테스트 전수 사용

**Context:**
- export 이름/경로 변경 금지 — 내부만 composePattern으로 교체
- 각 behavior의 ariaAttributes 함수는 그대로 유지
- metadata에 기존 behavior의 모든 옵션 (expandable, selectionMode, activateOnClick, followFocus) 포함
- `behaviors/alertdialog.ts`도 참고: dialog와 동일하지만 role='alertdialog', `aria-modal: 'true'` 추가

- [ ] **Step 1: disclosure, switch, dialog, alertdialog 재작성**

disclosure: `composePattern(meta, activate)`
switch: `composePattern(meta, activate)`
dialog: `composePattern(meta, focusTrap)`
alertdialog: `composePattern(meta, focusTrap)`

- [ ] **Step 2: 기존 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/disclosure-keyboard.integration.test.tsx src/interactive-os/__tests__/switch-keyboard.integration.test.tsx src/interactive-os/__tests__/dialog-keyboard.integration.test.tsx src/interactive-os/__tests__/alertdialog-keyboard.integration.test.tsx`

- [ ] **Step 3: accordion, toolbar, radiogroup, tabs 재작성**

accordion: `composePattern(meta, activate, navV)`
toolbar: `composePattern(meta, activate, navH())`
radiogroup: `composePattern(meta, selectToggle, navVhUniform({ wrap: true }))`
tabs: `composePattern(meta, activateFollowFocus, navH())`

- [ ] **Step 4: 기존 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/accordion-keyboard.integration.test.tsx src/interactive-os/__tests__/toolbar-keyboard.integration.test.tsx src/interactive-os/__tests__/radiogroup-keyboard.integration.test.tsx src/interactive-os/__tests__/tabs-keyboard.integration.test.tsx src/interactive-os/__tests__/follow-focus.test.tsx`

- [ ] **Step 5: 커밋**

```
refactor(behaviors): 8 simple behaviors → composePattern
```

---

### Task 8: 계층적 behavior 재작성 (listbox, tree, treegrid, menu)

**Files:**
- Modify: `src/interactive-os/behaviors/listbox.ts`
- Modify: `src/interactive-os/behaviors/tree.ts`
- Modify: `src/interactive-os/behaviors/treegrid.ts`
- Modify: `src/interactive-os/behaviors/menu.ts`
- Test: 기존 integration 테스트 전수 사용

**Context:**
- listbox: `composePattern(meta, selectExtended, selectToggle, activate, navV)` — activateOnClick: true
- tree: `composePattern(meta, selectExtended, selectToggle, activate, depthArrow, navV)` — listbox + depthArrow
- treegrid: tree와 동일 축 조합, role/childRole/ariaAttributes만 다름
- menu: `composePattern(meta, activate, depthArrow, navV)` — selection 없음, activateOnClick: true
- tree/treegrid가 동일 축 조합임을 코드에서 확인 가능해야 함 (PRD 검증 #7)

- [ ] **Step 1: listbox 재작성**

- [ ] **Step 2: listbox 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/listbox-keyboard.integration.test.tsx src/interactive-os/__tests__/extended-selection.test.tsx`

- [ ] **Step 3: tree, treegrid 재작성**

- [ ] **Step 4: tree/treegrid 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/treegrid-keyboard.integration.test.tsx src/interactive-os/__tests__/a11y.test.tsx src/interactive-os/__tests__/use-aria.test.tsx`

- [ ] **Step 5: menu 재작성**

- [ ] **Step 6: menu 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/menu-keyboard.integration.test.tsx`

- [ ] **Step 7: 커밋**

```
refactor(behaviors): listbox, tree, treegrid, menu → composePattern
```

---

### Task 9: Grid behavior 재작성

**Files:**
- Modify: `src/interactive-os/behaviors/grid.ts`
- Test: 기존 integration 테스트

**Context:**
- grid는 factory 함수: `grid(options: { columns: number })` → AriaBehavior
- 재작성: `composePattern(meta(columns), selectToggle, navGrid({ columns }))` 형태
- metadata.colCount = options.columns 전달 필수
- 참고: `src/interactive-os/__tests__/grid-keyboard.integration.test.tsx`

- [ ] **Step 1: grid 재작성**

- [ ] **Step 2: 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/grid-keyboard.integration.test.tsx`

- [ ] **Step 3: 커밋**

```
refactor(behaviors): grid → composePattern
```

---

### Task 10: Combobox behavior 재작성

**Files:**
- Modify: `src/interactive-os/behaviors/combobox.ts`
- Test: 기존 integration 테스트

**Context:**
- combobox는 factory: `combobox(options?)` → AriaBehavior
- popupToggle은 패턴 전용 축 — combobox.ts 내부에 정의 (별도 파일 불필요)
- popupToggle 축: ArrowDown(closed→open+focusFirst, open→void), Enter(open→select+close, closed→open), Escape(open→close, closed→void), Backspace(multi+empty→remove last tag)
- navV가 fallback으로 ArrowDown/ArrowUp/Home/End 처리
- 참고: `src/interactive-os/behaviors/combobox.ts` (현재 구현), `src/interactive-os/__tests__/combobox-keyboard.integration.test.tsx`

- [ ] **Step 1: combobox 재작성** — popupToggle 축을 파일 내부에 정의, `composePattern(meta, popupToggle, navV)` 형태

- [ ] **Step 2: 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/combobox-keyboard.integration.test.tsx src/interactive-os/__tests__/combobox.test.tsx`

- [ ] **Step 3: 커밋**

```
refactor(behaviors): combobox → composePattern with popupToggle axis
```

---

### Task 11: Spatial behavior 재작성

**Files:**
- Modify: `src/interactive-os/behaviors/spatial.ts`
- Test: 기존 테스트

**Context:**
- spatial: `composePattern(meta, selectToggle, depthEnterEsc)` — 방향키는 useSpatialNav 훅이 처리 (축 범위 밖)
- 기존 Home/End 로직(`SPATIAL_PARENT_ID` 기반)은 spatial 전용 → 파일 내부 축으로 정의
- F2 → startRename도 spatial 전용 축
- 참고: `src/interactive-os/__tests__/behaviors/spatial.test.tsx`, `src/__tests__/behaviors/spatial.test.ts`

- [ ] **Step 1: spatial 재작성** — spatialNav(Home/End/F2) 축을 파일 내부에 정의, `composePattern(meta, selectToggle, depthEnterEsc, spatialNav)`

- [ ] **Step 2: 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/behaviors/spatial.test.tsx src/__tests__/behaviors/spatial.test.ts`

- [ ] **Step 3: 커밋**

```
refactor(behaviors): spatial → composePattern with depthEnterEsc axis
```

---

### Task 12: Kanban behavior 재작성 + plugin 키바인딩 분리

**Files:**
- Modify: `src/interactive-os/behaviors/kanban.ts`
- Modify: `src/interactive-os/ui/Kanban.tsx`
- Test: 기존 테스트

**Context:**
- kanban behavior: `composePattern(meta, selectToggle, kanbanCrossH, kanbanNavV)` — 순수 ARIA 행동만
- crossH는 kanban 데이터 구조(columns>cards 2단계)에 종속 → kanban.ts 내부에 정의 (공유 axes/ 아님)
- kanbanNavV도 column-aware(header→first card 전환) → kanban.ts 내부 축
- CRUD/clipboard/history/dnd/rename 키바인딩 → `Kanban.tsx`에서 `useAria({ keyMap })` override로 이동
- 이동할 키: Delete, N, Ctrl+Enter, Mod+C/X/V, Mod+Z/Shift+Z, Alt+Arrow (4방향), Enter, F2
- Mod+A(column-scoped selectAll)와 Escape(clear selection)는 kanban ARIA 행동 → kanban 내부 축
- 참고: `src/interactive-os/__tests__/kanban.test.ts`, `src/interactive-os/behaviors/kanban.ts` (현재 203줄)

- [ ] **Step 1: kanban behavior 재작성** — kanbanCrossH(←→ cross-column + Home/End/Mod+Home/Mod+End) + kanbanNavV(column-aware ↑↓) + selectToggle + kanbanEditing(Mod+A, Escape clear) 축을 파일 내부 정의, composePattern으로 조합

- [ ] **Step 2: Kanban.tsx에 plugin keyMap override 추가** — Delete, N, Ctrl+Enter, Mod+C/X/V, Mod+Z/Shift+Z, Alt+Arrow, Enter(rename), F2(rename)를 useAria keyMap으로 이동

- [ ] **Step 3: 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/kanban.test.ts`

- [ ] **Step 4: 커밋**

```
refactor(behaviors): kanban → composePattern, plugin keybindings → Kanban.tsx keyMap override
```

---

### Task 13: 전체 검증 + exports

**Files:**
- Possibly modify: `package.json` (exports에 axes 추가)
- Test: 전체 테스트 스위트

- [ ] **Step 1: 전체 테스트 실행**

Run: `pnpm vitest run`
Expected: 모든 테스트 통과

- [ ] **Step 2: TypeScript 컴파일 검증**

Run: `pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Lint 검증**

Run: `pnpm lint`
Expected: 0 errors

- [ ] **Step 4: 라이브러리 빌드 검증**

Run: `pnpm build:lib`
Expected: 성공

- [ ] **Step 5: package.json exports에 axes 추가** — `composePattern` + 11개 공유 축을 export (crossH는 kanban 내부, valueArrow는 P2)

- [ ] **Step 6: 빌드 재검증**

- [ ] **Step 7: 커밋**

```
feat(axes): export composePattern and 13 axes from package
```
