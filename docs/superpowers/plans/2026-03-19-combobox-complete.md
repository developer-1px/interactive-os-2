# Combobox 완성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** combobox behavior/plugin/UI를 확장하여 Multi-Select, Tag Input, 그룹핑, Creatable 5가지 변형을 하나의 behavior로 커버

**Architecture:** 기존 combobox behavior에 `selectionMode: 'multiple'` 분기 추가. plugin에 토큰 포커스 커맨드 추가. UI 컴포넌트에 토큰 영역 + 그룹 렌더링 + creatable 옵션 추가. behavior → plugin → UI 순서로 아래에서 위로 구축.

**Tech Stack:** React, interactive-os (combobox behavior/plugin, core plugin), Vitest + @testing-library/react

**PRD:** `docs/superpowers/prds/2026-03-19-combobox-complete-prd.md`

---

### Task 1: Behavior — 멀티셀렉트 모드

combobox behavior에 `selectionMode`에 따른 Enter 분기 추가. 멀티 시 Enter = 토글 + 드롭다운 유지.

**Files:**
- Modify: `src/interactive-os/behaviors/combobox.ts`
- Test: `src/interactive-os/__tests__/combobox.test.tsx` (새 파일)

- [ ] **Step 1: 멀티셀렉트 테스트 작성**

```tsx
// src/interactive-os/__tests__/combobox.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../ui/combobox'
import { createStore } from '../core/createStore'
import { ROOT_ID } from '../core/types'

function fruitStore() {
  return createStore({
    entities: {
      apple:  { id: 'apple',  data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      cherry: { id: 'cherry', data: { label: 'Cherry' } },
    },
    relationships: { [ROOT_ID]: ['apple', 'banana', 'cherry'] },
  })
}

describe('combobox — single select (existing)', () => {
  it('Enter selects item and closes dropdown', async () => {
    const user = userEvent.setup()
    const { container } = render(<Combobox data={fruitStore()} />)
    const input = container.querySelector('input') as HTMLElement
    input.focus()
    await user.keyboard('{ArrowDown}') // open + focus apple
    await user.keyboard('{Enter}')     // select + close
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input).toHaveValue('Apple')
  })
})

describe('combobox — multi select', () => {
  it('Enter toggles selection and keeps dropdown open', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox data={fruitStore()} selectionMode="multiple" />
    )
    const input = container.querySelector('input') as HTMLElement
    input.focus()
    await user.keyboard('{ArrowDown}')  // open + focus apple
    await user.keyboard('{Enter}')      // toggle apple ON
    // Dropdown stays open
    expect(input.getAttribute('aria-expanded')).toBe('true')
    // Apple is selected
    expect(container.querySelector('[data-node-id="apple"][aria-selected="true"]')).toBeTruthy()
    // Enter again toggles OFF
    await user.keyboard('{Enter}')
    expect(container.querySelector('[data-node-id="apple"][aria-selected="true"]')).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실행, 실패 확인**

Run: `npx vitest run src/interactive-os/__tests__/combobox.test.tsx`
Expected: FAIL — `selectionMode` prop not accepted by Combobox

- [ ] **Step 3: behavior에 멀티셀렉트 분기 추가**

`src/interactive-os/behaviors/combobox.ts` — `selectionMode`를 제거하고 behavior factory 함수로 변경:

```ts
export function combobox(options?: { selectionMode?: 'single' | 'multiple' }): AriaBehavior {
  const mode = options?.selectionMode ?? 'single'
  return {
    role: 'combobox',
    childRole: 'option',
    selectionMode: mode,
    keyMap: {
      // ... existing ArrowDown, ArrowUp, Home, End, Escape ...
      Enter: (ctx) => {
        const comboboxEntity = ctx.getEntity('__combobox__')
        const isOpen = (comboboxEntity as Record<string, unknown> | undefined)?.isOpen ?? false
        if (isOpen) {
          if (mode === 'multiple') {
            // Toggle selection, keep dropdown open
            return ctx.toggleSelect()
          }
          // Single: select + close
          return createBatchCommand([
            selectionCommands.select(ctx.focused),
            comboboxCommands.close(),
          ])
        }
        return comboboxCommands.open()
      },
    },
    // ... rest unchanged ...
  }
}
```

- [ ] **Step 4: UI에 selectionMode prop 추가**

`src/interactive-os/ui/combobox.tsx`:
- Add `selectionMode?: 'single' | 'multiple'` to ComboboxProps
- Pass to behavior factory: `combobox({ selectionMode })`

- [ ] **Step 5: 테스트 통과 확인**
- [ ] **Step 6: 전체 회귀 확인** — `npx vitest run`
- [ ] **Step 7: 커밋**

```
feat: combobox — multi-select mode (Enter toggles, dropdown stays open)
```

---

### Task 2: UI — 태그 토큰 렌더링 + 삭제

멀티셀렉트 시 선택된 항목을 입력 필드 앞에 태그 토큰으로 표시. Backspace로 마지막 토큰 삭제.

**Files:**
- Modify: `src/interactive-os/ui/combobox.tsx`
- Modify: `src/interactive-os/behaviors/combobox.ts` (Backspace keyMap)
- Test: `src/interactive-os/__tests__/combobox.test.tsx`

- [ ] **Step 1: 토큰 렌더링 테스트**

```tsx
it('multi-select renders selected items as tokens', async () => {
  const user = userEvent.setup()
  const { container } = render(
    <Combobox data={fruitStore()} selectionMode="multiple" editable />
  )
  const input = container.querySelector('input') as HTMLElement
  input.focus()
  await user.keyboard('{ArrowDown}{Enter}')  // select apple
  await user.keyboard('{ArrowDown}{Enter}')  // select banana

  const tokens = container.querySelectorAll('[data-combobox-token]')
  expect(tokens).toHaveLength(2)
  expect(tokens[0].textContent).toContain('Apple')
  expect(tokens[1].textContent).toContain('Banana')
})
```

- [ ] **Step 2: 토큰 삭제 테스트**

```tsx
it('Backspace on empty input removes last token', async () => {
  const user = userEvent.setup()
  const { container } = render(
    <Combobox data={fruitStore()} selectionMode="multiple" editable />
  )
  const input = container.querySelector('input') as HTMLElement
  input.focus()
  await user.keyboard('{ArrowDown}{Enter}')  // select apple
  await user.keyboard('{ArrowDown}{Enter}')  // select banana
  expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(2)

  // Backspace on empty input → remove last token (banana)
  await user.keyboard('{Backspace}')
  expect(container.querySelectorAll('[data-combobox-token]')).toHaveLength(1)
  expect(container.querySelector('[data-combobox-token]')?.textContent).toContain('Apple')
})
```

- [ ] **Step 3: 테스트 실패 확인**
- [ ] **Step 4: 토큰 렌더링 구현**

`combobox.tsx`에서:
- `selectionMode === 'multiple'`일 때 선택된 항목들을 토큰으로 렌더링
- 토큰: `<span data-combobox-token role="listitem">[label] <button>×</button></span>`
- 토큰 × 버튼 클릭 → 해당 항목 선택 해제 (`selectionCommands.toggleSelect`)
- 토큰 영역: `<div role="list">` 래퍼

- [ ] **Step 5: Backspace 키맵 추가**

`combobox.ts` behavior에서 Backspace 처리:
- 현재 combobox state에서 filterText가 비어있으면 → 마지막 선택 항목 deselect
- filterText가 있으면 → 브라우저 네이티브 (문자 삭제)

```ts
Backspace: (ctx) => {
  if (mode !== 'multiple') return // single: 브라우저 네이티브
  const comboboxEntity = ctx.getEntity('__combobox__')
  const filterText = (comboboxEntity as Record<string, unknown> | undefined)?.filterText ?? ''
  if (filterText !== '') return // 문자가 있으면 브라우저 네이티브
  const selected = ctx.selected
  if (selected.length > 0) {
    return selectionCommands.toggleSelect(selected[selected.length - 1])
  }
},
```

- [ ] **Step 6: 테스트 통과 확인**
- [ ] **Step 7: 전체 회귀** — `npx vitest run`
- [ ] **Step 8: 커밋**

```
feat: combobox — tag tokens for multi-select + Backspace delete
```

---

### Task 3: 그룹핑 지원

store에 `type: 'group'` 엔티티가 있으면 드롭다운에 그룹 헤더를 표시하고, 키보드 이동 시 헤더를 건너뜀.

**Files:**
- Modify: `src/interactive-os/behaviors/combobox.ts` (그룹 헤더 건너뛰기)
- Modify: `src/interactive-os/ui/combobox.tsx` (그룹 렌더링)
- Test: `src/interactive-os/__tests__/combobox.test.tsx`

- [ ] **Step 1: 그룹 fixture + 테스트 작성**

```tsx
function groupedStore() {
  return createStore({
    entities: {
      fruits: { id: 'fruits', data: { type: 'group', label: 'Fruits' } },
      apple:  { id: 'apple',  data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      vegs:   { id: 'vegs',   data: { type: 'group', label: 'Vegetables' } },
      carrot: { id: 'carrot', data: { label: 'Carrot' } },
    },
    relationships: {
      [ROOT_ID]: ['fruits', 'vegs'],
      fruits: ['apple', 'banana'],
      vegs: ['carrot'],
    },
  })
}

describe('combobox — grouped', () => {
  it('ArrowDown skips group headers', async () => {
    const user = userEvent.setup()
    const { container } = render(<Combobox data={groupedStore()} />)
    const input = container.querySelector('input') as HTMLElement
    input.focus()
    await user.keyboard('{ArrowDown}') // open → focus apple (skip 'fruits' header)
    const focused = container.querySelector('[data-focused="true"]')
    expect(focused?.textContent).toContain('Apple')
  })

  it('renders group headers as non-selectable labels', async () => {
    const user = userEvent.setup()
    const { container } = render(<Combobox data={groupedStore()} />)
    const input = container.querySelector('input') as HTMLElement
    input.focus()
    await user.keyboard('{ArrowDown}')

    const groups = container.querySelectorAll('[role="group"]')
    expect(groups).toHaveLength(2)
    const headers = container.querySelectorAll('[role="presentation"]')
    expect(headers).toHaveLength(2)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: behavior — 그룹 헤더 건너뛰기**

그룹이 있으면 `focusNext()`/`focusPrev()`가 자동으로 그룹 엔티티를 건너뛰어야 함. 현재 `visibleNodes()`는 전체 tree를 walk하므로 그룹 엔티티(자식 있는 노드)도 포함됨.

접근 방식: combobox behavior의 ArrowDown/Up에서 `focusNext`를 호출한 뒤, 포커스된 노드가 `type: 'group'`이면 한 번 더 이동. 또는 behavior의 `visibleNodes`에서 그룹을 제외.

더 깨끗한 접근: UI 레이어에서 그룹 엔티티를 store에서 flatten하여 option만 visibleNodes에 포함. 그룹 헤더는 렌더링에서만 표시.

**구현:** combobox UI가 grouped store를 flat option 리스트로 변환:
- ROOT → [fruits, vegs] → flatten → [apple, banana, carrot]을 `__combobox_items__` 관계로 관리
- 또는 behavior의 ArrowDown에서 `type: 'group'` 체크 후 건너뛰기

**가장 단순한 구현:** ArrowDown/Up 후 포커스 대상이 그룹이면 한 번 더 이동:

```ts
ArrowDown: (ctx) => {
  // ... existing open logic ...
  const cmd = ctx.focusNext()
  // Check if target is a group — if so, skip
  // (BehaviorContext doesn't expose "next focused" — need different approach)
},
```

BehaviorContext의 `focusNext()`는 커맨드를 반환하지 실행하지 않으므로, 다음 포커스 대상을 미리 알 수 없음. **해결: UI 레이어에서 grouped store를 flat store로 변환** — 그룹의 자식을 ROOT 직속으로 끌어올림. 그룹 헤더는 렌더링에서만 추가.

- [ ] **Step 4: UI — 그룹 렌더링**

Combobox UI:
1. store에서 ROOT 자식을 읽어 `type: 'group'` 체크
2. 그룹이면: 그룹 헤더(role="presentation") + 자식 option 렌더
3. 비그룹이면: 직접 option 렌더
4. behavior에는 flat한 option 목록만 전달 (그룹 엔티티는 제외)

```tsx
// 그룹 감지 + flat 렌더링
const rootChildren = getChildren(store, ROOT_ID)
const isGrouped = rootChildren.some(id => {
  const d = store.entities[id]?.data as Record<string, string> | undefined
  return d?.type === 'group'
})

// 드롭다운 렌더링
{isGrouped ? (
  rootChildren.map(groupId => {
    const group = store.entities[groupId]
    const groupData = group?.data as Record<string, string>
    const items = getChildren(store, groupId)
    return (
      <div key={groupId} role="group" aria-label={groupData?.label}>
        <div role="presentation" className="combo-group-label">
          {groupData?.label}
        </div>
        {items.map(itemId => renderOption(itemId))}
      </div>
    )
  })
) : (
  children.map(childId => renderOption(childId))
)}
```

**핵심:** behavior에 전달되는 data의 relationships를 변환 — 그룹의 자식을 ROOT 직속으로 옮기고 그룹 엔티티는 제거. 이러면 `focusNext()`가 자연스럽게 option만 순회.

- [ ] **Step 5: 테스트 통과 확인**
- [ ] **Step 6: 전체 회귀** — `npx vitest run`
- [ ] **Step 7: 커밋**

```
feat: combobox — group support (headers skip, flat option navigation)
```

---

### Task 4: Creatable 모드

필터 결과 0개일 때 "Create [입력값]" 옵션 표시. Enter 시 새 엔티티 생성 + 선택.

**Files:**
- Modify: `src/interactive-os/ui/combobox.tsx`
- Modify: `src/interactive-os/plugins/combobox.ts` (create 커맨드)
- Test: `src/interactive-os/__tests__/combobox.test.tsx`

- [ ] **Step 1: creatable 테스트**

```tsx
describe('combobox — creatable', () => {
  it('shows create option when filter has no matches', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox data={fruitStore()} editable creatable />
    )
    const input = container.querySelector('input') as HTMLElement
    input.focus()
    await user.type(input, 'Mango')

    const createOption = container.querySelector('[data-combobox-create]')
    expect(createOption).toBeTruthy()
    expect(createOption?.textContent).toContain('Mango')
  })

  it('Enter on create option adds new entity and selects it', async () => {
    const user = userEvent.setup()
    let latestData: NormalizedData | null = null
    const { container } = render(
      <Combobox
        data={fruitStore()}
        editable
        creatable
        onChange={(d) => { latestData = d }}
      />
    )
    const input = container.querySelector('input') as HTMLElement
    input.focus()
    await user.type(input, 'Mango')
    await user.keyboard('{ArrowDown}{Enter}') // focus create option + select

    // New entity should exist in store
    expect(latestData).toBeTruthy()
    const entities = Object.values(latestData!.entities)
    expect(entities.some(e => (e.data as Record<string, unknown>)?.label === 'Mango')).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: plugin — create 커맨드**

`plugins/combobox.ts`에 추가:

```ts
create(label: string): Command {
  const id = `__created_${Date.now()}`
  return {
    type: 'combobox:create',
    payload: { label },
    execute(store) {
      return {
        ...store,
        entities: {
          ...store.entities,
          [id]: { id, data: { label } },
        },
        relationships: {
          ...store.relationships,
          [ROOT_ID]: [...(store.relationships[ROOT_ID] ?? []), id],
        },
      }
    },
    undo(store) {
      const { [id]: _removed, ...restEntities } = store.entities
      void _removed
      return {
        ...store,
        entities: restEntities,
        relationships: {
          ...store.relationships,
          [ROOT_ID]: (store.relationships[ROOT_ID] ?? []).filter(i => i !== id),
        },
      }
    },
  }
},
```

- [ ] **Step 4: UI — create 옵션 렌더링**

`combobox.tsx`에서:
- `creatable` prop 추가
- 필터 결과 0개 + filterText 비어있지 않을 때 → create 옵션 표시
- create 옵션은 `data-combobox-create` attr + `focusable`
- Enter on create → `comboboxCommands.create(filterText)` + `selectionCommands.select(newId)` + close(단일)/유지(멀티)

- [ ] **Step 5: 테스트 통과 확인**
- [ ] **Step 6: 전체 회귀** — `npx vitest run`
- [ ] **Step 7: 커밋**

```
feat: combobox — creatable mode (create new items from filter text)
```

---

### Task 5: 데모 페이지 업데이트

PageCombobox에 5가지 변형 데모 추가.

**Files:**
- Modify: `src/pages/PageCombobox.tsx`

- [ ] **Step 1: 5가지 변형 데모 추가**

```tsx
// Select (기존)
<Combobox data={store} />

// Autocomplete (기존)
<Combobox data={store} editable />

// Multi-Select
<Combobox data={store} selectionMode="multiple" editable />

// Grouped
<Combobox data={groupedStore} />

// Creatable
<Combobox data={store} editable creatable />
```

- [ ] **Step 2: 전체 테스트 회귀** — `npx vitest run`
- [ ] **Step 3: 커밋**

```
feat: combobox demo — 5 variants (select, autocomplete, multi, grouped, creatable)
```
