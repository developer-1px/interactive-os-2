# Pointer Interaction Support — PRD

> Discussion: 키보드 인터랙션만 구현되어 있어 클릭 시 되어야 하는 동작들이 안 됨. useAria onClick 확장 + selectOnClick config + behavior 옵션 수정으로 해결.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | Tree View에서 폴더 노드가 닫혀있다 | `{ expanded: false, selected: false }` | 사용자가 폴더를 클릭한다 | 폴더가 열리고(expand) 선택된다 | `{ expanded: true, selected: true }` | |
| 2 | Treegrid에서 폴더 행이 닫혀있다 | `{ expanded: false, selected: false }` | 사용자가 폴더 행을 클릭한다 | 폴더가 열리고 선택된다 | `{ expanded: true, selected: true }` | |
| 3 | Listbox에서 3번째 옵션이 선택되어 있다 | `selected: ['c']` | 사용자가 5번째 옵션을 Shift+Click한다 | 3~5번째가 범위 선택된다 | `selected: ['c','d','e']` | |
| 4 | Listbox에서 1번째만 선택되어 있다 | `selected: ['a']` | 사용자가 3번째 옵션을 Ctrl+Click한다 | 1번째 유지 + 3번째 추가 선택 | `selected: ['a','c']` | |
| 5 | Combobox가 닫혀있다 | `__combobox__.isOpen: false` | 사용자가 입력 필드를 클릭한다 | 드롭다운이 열린다 | `__combobox__.isOpen: true` | |
| 6 | Grid에서 아무것도 선택 안 됨 | `selected: []` | 사용자가 셀을 클릭한다 | 해당 행이 선택된다 | `selected: ['row-2']` | |

상태: 🟡

## 2. 인터페이스

### 2.1 클릭 동작 (behavior별)

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| Click on node | `focused: 'a', selected: []` | `selectOnClick && selectionMode` | 포커스 이동 + 해당 노드 select | `focused: 'b', selected: ['b']` | |
| Click on node | `focused: 'a', selected: ['a']` | `activateOnClick` | 포커스 이동 + activate (기존 동작) | `focused: 'b'` + onActivate 콜백 | |
| Click on expandable node | `expanded: false` | `activateOnClick && expandable` | expand 토글 (기존 동작) | `expanded: true` | |
| Shift+Click on node | `focused: 'b', selected: ['b']` | `selectOnClick && selectionMode === 'multiple'` | 앵커(현재 focused)~타겟 범위 선택 | `selected: ['b','c','d']` | |
| Ctrl+Click (Cmd+Click) on node | `selected: ['a']` | `selectOnClick && selectionMode === 'multiple'` | 기존 선택 유지 + 토글 | `selected: ['a','c']` | |
| Click on node | any | `!selectOnClick && !activateOnClick` | 포커스 이동만 (onFocus 핸들러) | `focused: 'b'` | |

### 2.2 behavior별 적용 매트릭스

| Behavior | activateOnClick | selectOnClick | 클릭 결과 |
|----------|----------------|---------------|----------|
| tree | ✅ (추가) | ✅ (추가) | expand + select |
| treegrid | ✅ (추가) | ✅ (추가) | expand + select |
| listbox | ✅ (기존) | ✅ (추가) | activate + select |
| grid | — | ✅ (추가) | select |
| tabs | ✅ (기존) | — | activate (followFocus로 선택) |
| accordion | ✅ (기존) | — | expand 토글 |
| disclosure | ✅ (기존) | — | expand 토글 |
| switch | ✅ (기존) | — | toggle |
| radiogroup | ✅ (기존) | — | check |
| menu | ✅ (기존) | — | activate |
| toolbar | ✅ (기존) | — | activate |
| spatial | ✅ (기존) | — | activate |
| combobox | — | — | 별도 처리 (컴포넌트) |
| dialog | — | — | N/A |
| alertdialog | — | — | N/A |
| kanban | — | ✅ (추가) | select |
| slider | — | — | 컴포넌트 자체 처리 |
| spinbutton | — | — | 컴포넌트 자체 처리 |

### 2.3 onClick 실행 순서

1. 포커스 이동 (기존 onFocus 핸들러 — 브라우저 기본 동작)
2. selectOnClick 처리:
   - Shift+Click → `ctx.extendSelectionTo(id)`
   - Ctrl/Cmd+Click → `ctx.toggleSelect()` (기존 선택 유지)
   - 일반 Click → `selectionCommands.select(id)` (단일 선택으로 교체)
3. activateOnClick 처리 (기존)

상태: 🟡

## 3. 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `AxisConfig.selectOnClick` | 새 config 필드. boolean. select 축이 자동으로 true 설정 (opt-in 옵션 불필요) | `src/interactive-os/behaviors/types.ts::selectOnClick` |
| `select()` 축 수정 | 항상 `selectOnClick: true`를 config에 추가. selectionMode=multiple이면 Shift/Cmd+Click도 자동 지원 | `src/interactive-os/axes/select.ts::select` |
| `activate()` 축 수정 | tree/treegrid용 onClick 옵션 추가 | `src/interactive-os/axes/activate.ts::activate` |
| `useAria.ts` onClick 핸들러 확장 | MouseEvent 받아서 modifier 분기 + select 디스패치 | `src/interactive-os/hooks/useAria.ts::useAria` |
| `AriaBehavior.selectOnClick` | 타입에 optional 필드 추가 | `src/interactive-os/behaviors/types.ts::selectOnClick` |
| `tree.ts` behavior 수정 | `activate({ onClick: true, toggleExpand: true })` 추가 | `src/interactive-os/behaviors/tree.ts::tree` |
| `treegrid.ts` behavior 수정 | 동일 | `src/interactive-os/behaviors/treegrid.ts::treegrid` |
| `grid.ts` behavior | select 축 사용 → selectOnClick 자동 (변경 불필요) | `src/interactive-os/behaviors/grid.ts::grid` |
| `kanban.ts` behavior | select 축 사용 → selectOnClick 자동 (변경 불필요) | `src/interactive-os/behaviors/kanban.ts::kanban` |
| `listbox.ts` behavior | select 축 사용 → selectOnClick 자동 (변경 불필요) | `src/interactive-os/behaviors/listbox.ts::listbox` |
| Combobox 컴포넌트 수정 | input onClick → `comboboxCommands.open()`. option onClick → single이면 select+close, multiple이면 toggleSelect (Enter 키와 동일) | `src/interactive-os/ui/Combobox.tsx` |

상태: 🟡

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| selectionMode='single'에서 Shift+Click | `selected: ['a']` | 범위 선택 안 됨, 단일 선택으로 교체 | `selected: ['c']` | |
| disabled 노드 클릭 | `disabled: true` | 아무 동작 없음 | 변화 없음 | |
| 이미 선택된 노드 일반 Click | `selected: ['a','b','c'], focused: 'b'` | 해당 노드만 선택 (나머지 해제) | `selected: ['b']` | |
| 이미 선택된 노드 Ctrl+Click | `selected: ['a','b','c']` | 해당 노드 선택 해제 | `selected: ['a','c']` | |
| 빈 트리에서 클릭 | `entities: []` | 아무 동작 없음 | 변화 없음 | |
| 중첩 구조에서 자식 노드 클릭 | 부모/자식 모두 onClick 있음 | 자식만 처리 (이벤트 버블링 가드) | 자식만 select/activate | |
| activedescendant 전략에서 option 클릭 | combobox dropdown 열림 | single: select+close. multiple: toggleSelect. 포커스는 input에 유지 | single: `selected: ['opt-3'], isOpen: false`. multiple: `selected: [..., 'opt-3'], isOpen: true` | |

상태: 🟡

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | onClick에서 `event.preventDefault()` 호출 | 브라우저 기본 포커스 이동을 막으면 안 됨 | |
| 2 | engine/store 구조 변경 | 이번 작업은 useAria + 축 config 확장만. engine은 이미 select/extend 지원 | |
| 3 | 기존 키보드 동작 변경 | 포인터 지원 추가이지 키보드 대체가 아님 | |
| 4 | Combobox option 클릭을 behavior 수준에서 처리 | Combobox는 activedescendant 전략이라 onClick이 일반 노드와 다름. 컴포넌트에서 처리 | |
| 5 | pointerMap 같은 새 축 모델 개념 도입 | 오버엔지니어링. onClick 핸들러 확장으로 충분 | |

상태: 🟡

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | Tree: 폴더 노드 클릭 | aria-expanded="true" + aria-selected="true" | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'click on folder expands it'`, `'click on folder also selects it'` |
| 2 | Tree: 리프 노드 클릭 | aria-selected="true" (expand 무관) | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'click on leaf node selects it (no expand attr change)'` |
| 3 | Treegrid: 폴더 행 클릭 | aria-expanded="true" + aria-selected="true" | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'click on folder row expands and selects it'` |
| 4 | Listbox: option 클릭 | aria-selected="true" | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'click selects a single node'` |
| 5 | Listbox: Shift+Click | 앵커~타겟 범위의 모든 option이 aria-selected="true" | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'Shift+Click selects range from anchor to target'` |
| 6 | Listbox: Ctrl+Click | 기존 선택 유지 + 타겟 토글 | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'Ctrl+Click toggles individual selection'`, `'Ctrl+Click deselects already selected node'` |
| 7 | Grid: 셀 클릭 | 해당 행 aria-selected="true" | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'click on grid row selects it'` |
| 8 | Combobox: input 클릭 | 드롭다운 열림 (aria-expanded="true") | — (테스트 미구현) |
| 9 | 기존 키보드 테스트 | 전부 통과 (regression 없음) | regression suite |
| 10 | 중첩 구조에서 자식 클릭 | 부모에 이벤트 전파 안 됨 | — (테스트 미구현) |
| 11 | disabled 노드 클릭 | 아무 변화 없음 | `src/interactive-os/__tests__/pointer-interaction.test.tsx::'clicking a disabled node does not change selection'` |
| 12 | Combobox: option 클릭 (single) | select + dropdown 닫힘 | — (테스트 미구현) |
| 13 | Combobox: option 클릭 (multiple) | toggleSelect + dropdown 유지 | — (테스트 미구현) |

상태: 🟡

---

**전체 상태:** 🟡 6/6 (AI 초안 완료, 사용자 확인 대기)
