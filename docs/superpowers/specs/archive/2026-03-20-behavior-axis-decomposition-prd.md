# Behavior Axis Decomposition — PRD

> Discussion: AriaBehavior의 keyMap을 원자 축(axis)으로 분해하고, pattern = 축의 우선순위 스택으로 선언. chain of responsibility (void fallback) 단일 개념.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 17개 AriaBehavior 프리셋이 존재하고, keyMap이 flat Record로 정의됨 | 새 pattern(예: carousel, feed)을 추가하려 할 때 | 기존 패턴과 동일한 navigation/selection/activation 코드를 복사-붙여넣기해야 함 |
| 2 | kanban behavior가 203줄이고 ARIA nav + plugin 키바인딩(CRUD/clipboard/history)이 하나의 keyMap에 혼합됨 | Collection 쇼케이스(캘린더, chip input 등)를 추가하려 할 때 | ARIA 행동과 plugin 바인딩의 경계가 불명확하고, plugin 바인딩이 behavior에 오염됨 |
| 3 | listbox, tree, treegrid는 keyMap이 거의 동일하고 depth-arrow 유무만 다름 | 이 사실을 코드에서 읽어내려 할 때 | 각 behavior가 독립 파일이라 공통점이 보이지 않음 |
| 4 | 프레임워크 사용자가 커스텀 pattern을 만들려 할 때 | "listbox인데 Shift 선택은 빼고 싶다" 같은 요구가 있을 때 | listbox 전체를 복사해서 수정하는 것 외에 방법이 없음 |

상태: 🟢

## 2. 인터페이스

> 이 PRD의 인터페이스는 키보드 UI가 아니라 **프레임워크 API** (축 정의, 패턴 합성, 사용).

| 입력 | 조건 | 결과 |
|------|------|------|
| 축(Axis) 정의 | `(key, ctx) → Command \| void`를 리턴하는 partial keyMap | 독립 모듈로 존재, 다른 축과 조합 가능 |
| 패턴(Pattern) 선언 | 축의 순서 배열 + metadata (role, childRole, focus, ariaAttributes 등) | AriaBehavior와 동일한 형태를 리턴, useAria가 소비 가능 |
| 키 이벤트 해결 (resolution) | 사용자가 키를 누름 | 스택의 위에서부터 순회, 첫 번째 non-void Command를 리턴하는 축이 처리. 모든 축이 void면 아무 일 없음 |
| 축이 상태에 따라 분기 | 축 핸들러 내부에서 ctx.isExpanded, isOpen 등 조회 | 조건 불충족 시 void 리턴 → 아래 축으로 fallback |
| useAria에 pattern 전달 | `useAria({ behavior: pattern, ... })` | 기존 AriaBehavior를 넘기던 것과 동일하게 동작 |
| 기존 behavior 프리셋 사용 | `import { listbox } from 'behaviors/listbox'` | 여전히 동작 — pattern이 AriaBehavior를 구현하므로 |

상태: 🟢

## 3. 산출물

### 3-1. Axis 타입

```
Axis = Record<string, (ctx: BehaviorContext) => Command | void>
```

partial keyMap과 동일한 형태. 특별한 래퍼 없음.

### 3-2. 공유 축 모듈 (11개)

| 파일 | 축 이름 | 점유 키 |
|------|---------|---------|
| `axes/nav-v.ts` | navV | ↑↓ Home End |
| `axes/nav-h.ts` | navH | ←→ Home End |
| `axes/nav-vh-uniform.ts` | navVhUniform | ↑↓←→ (동일 동작) |
| `axes/nav-grid.ts` | navGrid | ↑↓←→ Home End Mod+Home Mod+End |
| `axes/depth-arrow.ts` | depthArrow | ←→ (state-dependent) |
| `axes/depth-enter-esc.ts` | depthEnterEsc | Enter Escape (state-dependent) |
| `axes/select-toggle.ts` | selectToggle | Space |
| `axes/select-extended.ts` | selectExtended | Shift+↑↓ Shift+Home Shift+End |
| `axes/activate.ts` | activate | Enter Space(fallback) |
| `axes/activate-follow-focus.ts` | activateFollowFocus | Enter Space + auto |
| `axes/focus-trap.ts` | focusTrap | Escape (Tab cycling은 DOM/focusStrategy 레벨) |

### 3-2b. 패턴 전용 축

| 위치 | 축 이름 | 점유 키 | 사용 패턴 |
|------|---------|---------|----------|
| `behaviors/kanban.ts` 내부 | kanbanCrossH | ←→ Home End Mod+Home Mod+End | kanban (columns>cards 2단계 구조 종속) |
| `behaviors/kanban.ts` 내부 | kanbanNavV | ↑↓ | kanban (column header↔card 전환) |
| `behaviors/combobox.ts` 내부 | popupToggle | ArrowDown Enter Escape Backspace | combobox (isOpen 상태 분기) |
| `behaviors/spatial.ts` 내부 | spatialNav | Home End F2 | spatial (SPATIAL_PARENT_ID 기반) |
| P2 (미구현) | valueArrow | ↑↓ 또는 ←→ | slider, spinbutton |

### 3-3. 패턴 합성 함수

```
composePattern(metadata, ...axes) → AriaBehavior
```

- metadata: `{ role, childRole, focusStrategy, expandable?, selectionMode?, activateOnClick?, followFocus?, colCount?, ariaAttributes }`
- axes: `Axis[]` — 우선순위 순서 (첫 번째가 최우선)
- 리턴: `AriaBehavior` — 기존 인터페이스와 완전 호환

내부 구현: axes를 순회하며 merged keyMap 생성. 같은 키가 여러 축에 있으면 chain of responsibility 핸들러로 래핑.

### 3-4. 기존 behavior 프리셋 재작성

각 behavior 파일은 composePattern 호출로 교체:

| 기존 | 변경 후 |
|------|---------|
| `listbox.ts` — 28줄 flat keyMap | `composePattern(meta, selectExtended, selectToggle, activate, navV)` |
| `tree.ts` — 38줄 flat keyMap | `composePattern(meta, selectExtended, selectToggle, activate, depthArrow, navV)` |
| `treegrid.ts` — 38줄 flat keyMap | `composePattern(meta, selectExtended, selectToggle, activate, depthArrow, navV)` |
| `grid.ts` — factory | `composePattern(meta, selectToggle, navGrid)` |
| `tabs.ts` — 21줄 | `composePattern(meta, activateFollowFocus, navH)` |
| `toolbar.ts` — 19줄 | `composePattern(meta, activate, navH)` |
| `menu.ts` — 28줄 | `composePattern(meta, activate, depthArrow, navV)` |
| `accordion.ts` — 27줄 | `composePattern(meta, activate, navV)` |
| `radiogroup.ts` — 19줄 | `composePattern(meta, selectToggle, navVhUniform)` |
| `disclosure.ts` — 20줄 | `composePattern(meta, activate)` |
| `switch.ts` — 16줄 | `composePattern(meta, activate)` |
| `dialog.ts` — 17줄 | `composePattern(meta, focusTrap)` |
| `alertdialog.ts` — 17줄 | `composePattern(meta, focusTrap)` |
| `combobox.ts` — factory 64줄 | `composePattern(meta, popupToggle, navV)` (popupToggle은 패턴 전용 축) |
| `spatial.ts` — 57줄 | `composePattern(meta, selectToggle, depthEnterEsc)` + 방향키는 useSpatialNav 훅 (DOM 좌표 기반, 축 범위 밖) |
| `kanban.ts` — 203줄 | `composePattern(meta, selectToggle, kanbanCrossH, kanbanNavV)` — crossH/navV는 kanban 내부 축 (데이터 구조 종속). CRUD/clipboard/history 키는 컴포넌트 레벨 `useAria({ keyMap })` override (plugin 바인딩은 축이 아님) |

### 3-5. 디렉터리 구조

```
src/interactive-os/
  axes/               ← NEW
    nav-v.ts
    nav-h.ts
    nav-vh-uniform.ts
    nav-grid.ts
    depth-arrow.ts
    depth-enter-esc.ts
    select-toggle.ts
    select-extended.ts
    activate.ts
    activate-follow-focus.ts
    focus-trap.ts
    compose-pattern.ts  ← composePattern 함수
  behaviors/           ← 기존 유지 (composePattern으로 재작성)
    listbox.ts
    tree.ts
    ...
```

### 3-6. 관계도

```
[축 레이어 — 순수 ARIA 행동]
axes/nav-v.ts ─┐
axes/select-toggle.ts ─┤
axes/activate.ts ─┤── composePattern() ──→ AriaBehavior
axes/depth-arrow.ts ─┘                         │
                                                ▼
[컴포넌트 레이어]                    useAria({ behavior, keyMap })
                                                ▲
[plugin 키바인딩 — app-level]                   │
{ Delete: crudCommands.remove,    ─────────────┘
  'Mod+C': clipboardCommands.copy,
  'Mod+Z': historyCommands.undo }
```

### 역PRD: 산출물 ↔ 코드 매핑

> axis-v2(5축 모델) 적용으로 11개 공유 축 → 5개 factory로 통합. v1 축 파일 삭제 완료.

| 산출물 | 역PRD (실제 코드) |
|---|---|
| Axis 타입 (KeyMap) | `src/interactive-os/axes/composePattern.ts::KeyMap` |
| 공유 축 navV → navigate | `src/interactive-os/axes/navigate.ts::navigate` |
| 공유 축 navH → navigate | `src/interactive-os/axes/navigate.ts::navigate({ orientation: 'horizontal' })` |
| 공유 축 navVhUniform → navigate | `src/interactive-os/axes/navigate.ts::navigate({ orientation: 'both', wrap: true })` |
| 공유 축 navGrid → navigate | `src/interactive-os/axes/navigate.ts::navigate({ grid: { columns: N } })` |
| 공유 축 depthArrow → expand | `src/interactive-os/axes/expand.ts::expand({ mode: 'arrow' })` |
| 공유 축 depthEnterEsc → expand | `src/interactive-os/axes/expand.ts::expand({ mode: 'enter-esc' })` |
| 공유 축 selectToggle → select | `src/interactive-os/axes/select.ts::select()` |
| 공유 축 selectExtended → select | `src/interactive-os/axes/select.ts::select({ extended: true })` |
| 공유 축 activate → activate | `src/interactive-os/axes/activate.ts::activate` |
| 공유 축 activateFollowFocus → activate | `src/interactive-os/axes/activate.ts::activate({ followFocus: true })` |
| 공유 축 focusTrap → dismiss | `src/interactive-os/axes/dismiss.ts::dismiss` |
| composePattern 합성 함수 | `src/interactive-os/axes/composePattern.ts::composePattern` |
| behavior 재작성 (listbox) | `src/interactive-os/behaviors/listbox.ts::listbox` |
| behavior 재작성 (tree) | `src/interactive-os/behaviors/tree.ts::tree` |
| behavior 재작성 (treegrid) | `src/interactive-os/behaviors/treegrid.ts::treegrid` |
| behavior 재작성 (grid) | `src/interactive-os/behaviors/grid.ts::grid` |
| behavior 재작성 (tabs) | `src/interactive-os/behaviors/tabs.ts::tabs` |
| behavior 재작성 (toolbar) | `src/interactive-os/behaviors/toolbar.ts::toolbar` |
| behavior 재작성 (menu) | `src/interactive-os/behaviors/menu.ts::menu` |
| behavior 재작성 (kanban) | `src/interactive-os/behaviors/kanban.ts::kanban` |
| behavior 재작성 (combobox) | `src/interactive-os/behaviors/combobox.ts::combobox` |
| behavior 재작성 (spatial) | `src/interactive-os/behaviors/spatial.ts::spatial` |
| 디렉터리 구조 (axes/) | `src/interactive-os/axes/` (9 파일: composePattern, navigate, select, activate, expand, dismiss, tab, value, edit) |

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 같은 키가 여러 축에 정의됨 (예: Space가 selectToggle과 activate 모두에 있음) | 스택 순서대로 시도. 첫 번째가 Command를 리턴하면 처리 완료. void를 리턴하면 다음 축 시도 |
| 모든 축이 void를 리턴 | 아무 일도 안 일어남 (event.preventDefault 호출하지 않음) |
| 축이 0개인 패턴 | 유효하지만 모든 키에 대해 아무 일 없음. ariaAttributes와 role만 적용 |
| 축 내부에서 ctx.dispatch() 직접 호출 | 허용 — 현재 combobox에서 이미 사용 중. Command 리턴과 별개로 side effect 발생 가능 |
| wrap 옵션이 필요한 축 (radiogroup, tabs) | 축 factory: `navVhUniform({ wrap: true })`, `navH({ wrap: true })` — 옵션을 받는 축은 함수로 생성 |
| grid columns 옵션 | `navGrid({ columns: N })` factory |
| kanban의 CRUD/clipboard/history 키 | 축이 아닌 plugin 바인딩. 컴포넌트에서 `useAria({ keyMap: { Delete: ..., 'Mod+C': ... } })` override로 주입. behavior(축 스택)는 순수 ARIA 행동만 담당 |
| 기존 useAria의 keyMap override | 현행 spread merge 유지 (`{ ...behavior.keyMap, ...overrides }`). ARIA 축 키와 plugin 키는 영역이 다르므로 chain of responsibility 불필요. 겹침이 발생하면 그때 검토 |
| composePattern의 리턴 타입 | `AriaBehavior` 그대로. 기존 코드가 AriaBehavior를 기대하는 곳에 그대로 전달 가능 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | AriaBehavior 인터페이스를 변경하면 안 됨 | 22개 파일이 import. 하위 호환성 파괴. composePattern이 AriaBehavior를 리턴하면 변경 불필요 |
| 2 | 축에 side effect를 넣으면 안 됨 (ctx.dispatch 제외) | 축은 순수하게 Command를 리턴하는 것이 원칙. dispatch는 기존 combobox에서 이미 사용 중이므로 허용하되, DOM 조작/fetch/state mutation 금지 |
| 3 | 축의 실행 순서를 런타임에 동적으로 변경하면 안 됨 | 스택은 선언 시 고정. 런타임 재배치는 디버깅을 불가능하게 만듦 |
| 4 | composePattern 밖에서 keyMap merge를 직접 하면 안 됨 | `{ ...axisA, ...axisB }` spread는 chain of responsibility를 깨뜨림 (void fallback 불가). 반드시 composePattern 사용 |
| 5 | 기존 behavior 파일의 export 이름/경로를 변경하면 안 됨 | `import { listbox } from 'behaviors/listbox'` — 90개+ import가 존재. 내부만 composePattern으로 교체 |
| 6 | 축 이름에 자체 용어를 발명하면 안 됨 | ARIA 표준 용어 우선 (naming convention 규칙) |
| 7 | plugin 키바인딩(CRUD/clipboard/history/dnd)을 축에 넣으면 안 됨 | 축은 순수 ARIA 행동만 담당. plugin 키바인딩은 컴포넌트 레벨 `useAria({ keyMap })` override로 주입. 관심사 분리: 축 = ARIA spec, keyMap override = app-level plugin 바인딩 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | 기존 468개 테스트 전수 통과 | 모든 테스트가 변경 없이 통과 (행위 동일) |
| 2 | listbox에서 Space 키 | selectToggle 축이 처리 → toggleSelect 호출 |
| 3 | tree에서 ArrowRight (collapsed 노드) | depthArrow 축이 처리 → expand 호출 |
| 4 | tree에서 ArrowRight (leaf 노드) | depthArrow가 void → navV fallback → ↑↓ 전용이라 ←→ 미처리 → 아무 일 없음 |
| 5 | tabs에서 Space | activateFollowFocus가 처리 (selectToggle이 스택에 없으므로 경합 없음) |
| 6 | "listbox인데 Shift 선택 없는 패턴" 생성 | `composePattern(listboxMeta, selectToggle, activate, navV)` — selectExtended만 빼면 됨 |
| 7 | tree와 treegrid의 keyMap이 동일함을 코드에서 확인 | 두 behavior 모두 같은 축 조합, metadata(role/childRole/ariaAttributes)만 다름 |
| 8 | kanban behavior가 composePattern으로 재작성 후 기존 테스트 통과 | kanban 키보드 테스트 전수 통과 |
| 9 | composePattern 리턴값이 AriaBehavior 타입 | TypeScript 컴파일 에러 없음 |
| 10 | 축 순서 변경 시 동작 변경 확인 | `[activate, selectToggle]` vs `[selectToggle, activate]` — Space 동작이 달라짐 |

### 역PRD: 검증 ↔ 테스트 매핑

| # | 테스트 파일 :: 테스트명 |
|---|---|
| 1 | 기존 integration 테스트 전수 (listbox/tree/tabs/toolbar/menu/grid 등) |
| 2 | `src/interactive-os/__tests__/listbox-keyboard.integration.test.tsx::ListBox keyboard integration > selection > Space toggles selection` |
| 3 | `src/interactive-os/__tests__/treeview.integration.test.tsx::TreeView > ArrowRight expands a parent node` |
| 4 | (chain of responsibility) `src/interactive-os/__tests__/compose-pattern.test.ts::composePattern > chain of responsibility — void falls through to next axis` |
| 5 | `src/interactive-os/__tests__/tabs-keyboard.integration.test.tsx::TabList keyboard integration > activation > Enter activates focused tab` |
| 6 | composePattern으로 축 빼기 가능 — `src/interactive-os/__tests__/compose-pattern.test.ts::composePattern > merges non-overlapping axes` |
| 7 | tree/treegrid 동일 축 조합 — behavior 파일 비교 (role/childRole만 다름) |
| 8 | `src/interactive-os/__tests__/kanban-keyboard.integration.test.tsx` |
| 9 | `src/interactive-os/__tests__/compose-pattern.test.ts::composePattern > metadata is passed through to AriaBehavior` |
| 10 | `src/interactive-os/__tests__/compose-pattern.test.ts::composePattern > axis reorder changes behavior on same key` |

상태: 🟢

---

**전체 상태:** 🟢 6/6
