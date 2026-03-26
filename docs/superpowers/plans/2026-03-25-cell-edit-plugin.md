# cellEdit Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google Sheets 2모드 셀 편집 UX를 cellEdit plugin으로 구현 — Mod+X 셀 cut, Delete 셀 클리어, Enter/Shift+Enter 행 이동

**Architecture:** 독립 cellEdit plugin이 keyMap을 소유하여 edit 축의 Enter/Delete를 shadow. clipboard.ts에 cutCellValue/clearCellValue command 추가. AriaEditable에 enterContinue prop 추가로 편집 모드 Enter 처리. Grid.tsx에서 cellClipboardKeyMap 제거하고 cellEdit plugin으로 대체.

**Tech Stack:** TypeScript, React, vitest, @testing-library/react, userEvent

**PRD:** `docs/superpowers/prds/2026-03-25-cell-edit-plugin-prd.md`

**KeyMap priority (중요):** `keyMapOverrides(컴포넌트) > pluginKeyMaps > behavior.keyMap(축)`. cellEdit plugin keyMap이 pluginKeyMaps 레벨이므로 axis keyMap(edit 축)을 자동 shadow한다.

**Priority 변경 주의:** 기존 Grid.tsx의 cellClipboardKeyMap은 keyMapOverrides(최고 우선) 레벨이었으나, cellEdit plugin으로 이전하면 pluginKeyMaps 레벨로 내려간다. 그러나 Mod+C/V를 keyMapOverrides로 설정하는 Grid 소비자가 없으므로 (Grid.tsx가 유일한 설정 지점) 실질적 영향 없음. Task 4에서 Grid 소비자를 확인한다.

---

### Task 1: clipboard.ts — cutCellValue + clearCellValue commands 추가

**Files:**
- Modify: `src/interactive-os/plugins/clipboard.ts`
- Test: `src/interactive-os/__tests__/cell-edit.integration.test.tsx` (새 파일)

- [ ] **Step 1: 테스트 파일 생성 — clearCellValue unit 테스트**

```typescript
// V3: 2026-03-25-cell-edit-plugin-prd.md
it('clearCellValue sets cell to empty string', () => {
  // createStore with cells: ['hello', 'world']
  // dispatch clearCellValue(nodeId, 0)
  // expect cells[0] === ''
})

// V7: 2026-03-25-cell-edit-plugin-prd.md
it('clearCellValue undo restores original value', () => {
  // dispatch clearCellValue → dispatch undo
  // expect cells[0] === 'hello'
})

// V9: 2026-03-25-cell-edit-plugin-prd.md
it('clearCellValue on empty cell is no-op', () => {
  // cells: ['', 'world'], dispatch clearCellValue(nodeId, 0)
  // expect store unchanged
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/cell-edit.integration.test.tsx`
Expected: FAIL — clearCellValue not exported

- [ ] **Step 3: clipboard.ts에 clearCellValue command 구현**

`clipboardCommands`에 추가. 패턴은 기존 `pasteCellValue`와 동일:
- type: `'clipboard:clearCellValue'`
- execute: `getCells(store, nodeId)` → `cells[colIndex] = ''` → `updateEntityData`
- undo: `previousValue` 복원
- 빈 셀이면 store 그대로 반환 (no-op)

CLEAR_CELL constant 추가, `definePlugin` commands에 등록.

- [ ] **Step 4: cutCellValue 테스트 추가**

```typescript
// V1: 2026-03-25-cell-edit-plugin-prd.md
it('cutCellValue copies value to buffer and clears cell', () => {
  // dispatch cutCellValue(nodeId, 0)
  // expect cells[0] === ''
  // dispatch pasteCellValue on another node → expect pasted value
})

// V6: 2026-03-25-cell-edit-plugin-prd.md
it('cutCellValue undo restores original value', () => {
  // dispatch cutCellValue → undo
  // expect cells[0] === 'hello'
})
```

- [ ] **Step 5: cutCellValue command 구현**

`clipboardCommands`에 추가:
- type: `'clipboard:cutCellValue'`
- execute: `cellValueBuffer = getCells()[colIndex]` (copy) + `cells[colIndex] = ''` (clear) + `updateEntityData`
- undo: `previousValue` 복원

CUT_CELL constant 추가, `definePlugin` commands에 등록.

- [ ] **Step 6: 테스트 전체 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/cell-edit.integration.test.tsx`
Expected: PASS

- [ ] **Step 7: 커밋**

```
feat: clipboard에 cutCellValue, clearCellValue command 추가
```

---

### Task 2: cellEdit plugin 생성

**Files:**
- Create: `src/interactive-os/plugins/cellEdit.ts`
- Test: `src/interactive-os/__tests__/cell-edit.integration.test.tsx` (확장)

- [ ] **Step 1: 셀 모드 키보드 통합 테스트 추가**

테스트 fixture: `createStore`로 3행×3열 Grid, `grid({ columns: 3, edit: true })` behavior, plugins에 `[core(), crud(), rename(), history(), cellEdit()]` 사용. StatefulGrid 컴포넌트로 `useState` + `onChange`.

```typescript
// V3: 2026-03-25-cell-edit-plugin-prd.md
it('Delete in cell mode clears cell value, not row', async () => {
  // focus row-1, user.keyboard('{Delete}')
  // row count unchanged, cell text === ''
})

// V12: 2026-03-25-cell-edit-plugin-prd.md
it('Enter in cell mode moves focus to next row without entering edit mode', async () => {
  // focus row-1, user.keyboard('{Enter}')
  // focused row === row-2
  // assert: no [data-renaming] element exists (rename not active)
  // assert: RENAME_ID entity is not active in store
})

// V13a: 2026-03-25-cell-edit-plugin-prd.md
it('Shift+Enter in cell mode moves focus to previous row', async () => {
  // focus row-2, user.keyboard('{Shift>}{Enter}{/Shift}')
  // focused row === row-1
})

// V1: 2026-03-25-cell-edit-plugin-prd.md
it('Mod+X in cell mode cuts cell value', async () => {
  // focus row-1, user.keyboard('{Control>}x{/Control}')
  // cell text === ''
})

// V2: 2026-03-25-cell-edit-plugin-prd.md
it('Mod+X then Mod+V pastes cut value to target cell', async () => {
  // focus row-1 col-0, Mod+X → ArrowDown → Mod+V
  // row-1 col-0 === '', row-2 col-0 === original row-1 value
})

// V10: 2026-03-25-cell-edit-plugin-prd.md
it('Grid without cellEdit: Delete removes row', async () => {
  // render grid WITHOUT cellEdit plugin
  // Delete → row count decreases
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/cell-edit.integration.test.tsx`
Expected: FAIL — cellEdit not found

- [ ] **Step 3: cellEdit.ts plugin 구현**

```typescript
// ② 2026-03-25-cell-edit-plugin-prd.md
export function cellEdit(): Plugin {
  return definePlugin({
    name: 'cellEdit',
    keyMap: {
      'Delete': (ctx) => clipboardCommands.clearCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Mod+X': (ctx) => clipboardCommands.cutCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Mod+C': (ctx) => clipboardCommands.copyCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Mod+V': (ctx) => clipboardCommands.pasteCellValue(ctx.focused, ctx.grid?.colIndex ?? 0),
      'Enter': (ctx) => ctx.focusNext(),
      'Shift+Enter': (ctx) => ctx.focusPrev(),
    },
  })
}
```

주의: `Mod+C`/`Mod+V`는 cellClipboardKeyMap에서 이전하는 것. `Enter`/`Shift+Enter`는 navigate 명령 반환 (focusNext/focusPrev가 Command 반환).

`'Shift+Enter'` 키 표기가 useKeyboard.ts의 `findMatchingKey`에서 지원되는지 확인 필요 — `normalizeKey` 함수 참조.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/cell-edit.integration.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```
feat: cellEdit plugin — 셀 모드 Delete/Enter/Mod+X/C/V keyMap
```

---

### Task 3: AriaEditable enterContinue prop

**Files:**
- Modify: `src/interactive-os/primitives/aria.tsx` (AriaEditable 함수, ~line 168)
- Test: `src/interactive-os/__tests__/cell-edit.integration.test.tsx` (확장)

- [ ] **Step 1: 편집 모드 Enter 통합 테스트 추가**

Grid에 `renderCell`로 `<Aria.Editable field="cells.0" enterContinue>` 전달.

```typescript
// V4: 2026-03-25-cell-edit-plugin-prd.md
it('Enter in edit mode confirms and moves to next row', async () => {
  // focus row-1, F2 → edit mode
  // type 'new value', Enter
  // row-1 cell === 'new value', focused row === row-2, not in edit mode
})

// V5: 2026-03-25-cell-edit-plugin-prd.md
it('Shift+Enter in edit mode confirms and moves to previous row', async () => {
  // focus row-2, F2 → edit mode
  // type 'changed', Shift+Enter
  // row-2 cell === 'changed', focused row === row-1, not in edit mode
})

// V8: 2026-03-25-cell-edit-plugin-prd.md
it('Enter at last row confirms without moving', async () => {
  // focus last row, F2 → edit mode, Enter
  // still on last row, not in edit mode
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Expected: FAIL — enterContinue prop 미지원

- [ ] **Step 3: AriaEditable에 enterContinue prop 구현**

`aria.tsx`의 `AriaEditable` 함수에 `enterContinue?: boolean` prop 추가.

기존 `onKeyDown` Enter 핸들러 수정 (line 252 부근):

```typescript
if (e.key === 'Enter' && !composingRef.current) {
  e.preventDefault()
  const shiftKey = e.shiftKey
  confirm()
  if (enterContinue && nodeCtx && ariaCtx) {
    // tabContinue 패턴과 동일: synthetic ArrowDown/ArrowUp 후 셀 모드 유지
    setTimeout(() => {
      const nodeEl = document.querySelector<HTMLElement>(`[data-node-id="${nodeCtx.nodeId}"]`)
      if (nodeEl) {
        nodeEl.dispatchEvent(new KeyboardEvent('keydown', {
          key: shiftKey ? 'ArrowUp' : 'ArrowDown',
          code: shiftKey ? 'ArrowUp' : 'ArrowDown',
          bubbles: true, cancelable: true,
        }))
      }
      // auto-rename 없음 — Sheets 표준, 셀 모드 복귀
    }, 0)
  }
}
```

Shift+Enter 분기: `e.shiftKey`로 방향 결정. `enterContinue` false일 때 기존 동작 그대로 (confirm만).

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/cell-edit.integration.test.tsx`
Expected: PASS

- [ ] **Step 5: 커밋**

```
feat: AriaEditable enterContinue — Enter confirm 후 행 이동
```

---

### Task 4: Grid.tsx 정리 — cellClipboardKeyMap 제거 + cellEdit 통합

**Files:**
- Modify: `src/interactive-os/ui/Grid.tsx`
- Test: `src/interactive-os/__tests__/cell-edit.integration.test.tsx` (확장)
- Test: 기존 `src/interactive-os/__tests__/grid-keyboard.integration.test.tsx` (회귀 확인)

- [ ] **Step 1: Grid.tsx 사용 회귀 테스트 확인**

```typescript
// V13: 2026-03-25-cell-edit-plugin-prd.md
it('existing clipboard-overwrite tests still pass', () => {
  // 기존 grid-keyboard 테스트가 깨지지 않는지 확인
})
```

Run: `pnpm vitest run src/interactive-os/__tests__/grid-keyboard.integration.test.tsx`
Expected: 현재 상태 확인 (백로그 #33 실패 포함 가능)

- [ ] **Step 2: Grid.tsx 수정**

1. `cellClipboardKeyMap` const 삭제 (line 35-44)
2. `clipboardCommands` import 삭제
3. `cellEdit` plugin import 추가: `import { cellEdit } from '../plugins/cellEdit'`
4. `mergedPlugins`에서 `enableEditing`일 때 `cellEdit()` 추가:
   ```typescript
   const mergedPlugins = React.useMemo(
     () => enableEditing ? [...plugins, replaceEditPlugin(), cellEdit()] : plugins,
     [plugins, enableEditing],
   )
   ```
5. `mergedKeyMap`에서 cellClipboardKeyMap 참조 제거:
   ```typescript
   const mergedKeyMap = React.useMemo(
     () => keyMap ? { ...keyMap } : undefined,
     [keyMap],
   )
   ```
6. Grid.tsx `defaultRenderCell`은 `<span>` 반환이므로 enterContinue 불필요. 외부에서 `renderCell` prop으로 `<Aria.Editable enterContinue>` 전달하는 건 소비자 책임. Grid.tsx 자체는 변경 불필요.
7. Grid 소비자 검색 (`grep -r "Grid" --include="*.tsx"`)으로 keyMapOverrides를 사용하는 곳이 없는지 확인. 있으면 cellEdit plugin 추가 안내.

- [ ] **Step 3: 전체 테스트 실행**

Run: `pnpm vitest run src/interactive-os/__tests__/grid-keyboard.integration.test.tsx src/interactive-os/__tests__/cell-edit.integration.test.tsx`
Expected: PASS (백로그 #33 해결 포함)

- [ ] **Step 4: 커밋**

```
refactor: Grid.tsx cellClipboardKeyMap 제거 → cellEdit plugin으로 이전
```

---

### Task 5: 전체 검증 + 나머지 V-시나리오

**Files:**
- Test: `src/interactive-os/__tests__/cell-edit.integration.test.tsx` (최종 보완)

- [ ] **Step 1: 누락 V-시나리오 보완**

```typescript
// V11: 2026-03-25-cell-edit-plugin-prd.md — IME는 jsdom 한계로 스킵 표시
it.todo('IME composition Enter does not confirm')
```

- [ ] **Step 2: 전체 테스트 스위트 실행**

Run: `pnpm vitest run`
Expected: ALL PASS

- [ ] **Step 3: 커밋**

```
test: cellEdit V-시나리오 전체 검증
```
