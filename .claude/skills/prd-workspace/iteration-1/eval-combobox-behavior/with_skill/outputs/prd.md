# Combobox Behavior — PRD

> Discussion: combobox behavior를 aria engine에 추가. input 타이핑 → listbox 필터링, 화살표 옵션 선택, Enter 확정. useAria 훅 사용, `<Aria>` 컴포넌트 미사용.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 사용자가 combobox input에 포커스 | 텍스트를 타이핑 | listbox 팝업이 열리고 입력과 매칭되는 옵션만 필터링되어 표시 | |
| M2 | listbox가 열린 상태에서 필터된 옵션 목록이 보임 | ArrowDown/ArrowUp 키 입력 | 옵션 간 포커스가 이동 (aria-activedescendant 갱신) | |
| M3 | 옵션에 포커스가 있는 상태 | Enter 키 입력 | 해당 옵션이 선택(확정)되고, listbox 닫힘, input에 선택값 반영 | |
| M4 | listbox가 열린 상태 | Escape 키 입력 | listbox 닫힘, 선택 변경 없음, input 포커스 유지 | |
| M5 | 사용자가 빈 input에 포커스 | ArrowDown 키 입력 | listbox가 열리고 전체 옵션 표시, 첫 옵션에 포커스 | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `behaviors/combobox.ts` | combobox behavior 정의 — composePattern으로 축 합성. role=combobox, childRole=option, focusStrategy=aria-activedescendant. 이미 존재하며 popupToggle + navV 축 구성 | |
| `plugins/combobox.ts` | combobox plugin — `__combobox__` meta-entity로 isOpen/filterText 상태 관리. open/close/setFilter/create 커맨드. 이미 존재 | |
| `useAria` 훅 소비 | containerProps를 input 요소에 spread. `<Aria>` 컴포넌트 미사용 — containerProps가 input에 가야 하므로. listbox DOM은 data-aria-container 밖에 별도 렌더링 | |
| listbox DOM 구조 | `<ul role="listbox">` + `<li role="option" ...getNodeProps(id)>` — data-aria-container 밖의 별도 DOM 영역 (포탈 또는 인접 sibling) | |
| 필터링 로직 | useAria 외부에서 처리 — filterText(store의 `__combobox__.filterText`)와 data를 비교하여 필터된 NormalizedData를 useAria에 전달. engine 밖의 뷰 로직 | |

완성도: 🟡

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 텍스트 타이핑 (onChange) | input 포커스, listbox 닫힘/열림 | comboboxCommands.setFilter(text) + open() dispatch | input은 네이티브 텍스트 입력을 유지해야 하므로 keyMap이 아닌 onChange 핸들러에서 처리. 타이핑은 항상 필터를 갱신하고 팝업을 연다 | filterText 갱신, listbox 열림, 매칭 옵션만 표시 | |
| ↓ ArrowDown | listbox 닫힘 | comboboxCommands.open() + focusFirst() | 닫힌 상태에서 아래 화살표는 "목록 탐색 시작" 의도 — APG combobox 표준 동작 | listbox 열림, 첫 옵션에 activedescendant 설정 | |
| ↓ ArrowDown | listbox 열림, 옵션 N에 포커스 | ctx.focusNext() | 열린 목록에서 아래 화살표는 다음 항목으로 이동 — 세로 배치 리스트의 기본 탐색 | 옵션 N+1에 activedescendant 이동 | |
| ↑ ArrowUp | listbox 열림, 옵션 N에 포커스 | ctx.focusPrev() | 위 화살표는 이전 항목 — 세로 탐색의 역방향. 가역적 동선 보장 | 옵션 N-1에 activedescendant 이동 | |
| ↑ ArrowUp | listbox 닫힘 | N/A — 무시 | 닫힌 상태에서 위 화살표로 열 이유 없음 (APG: ArrowDown만 열기) | 상태 변화 없음 | |
| ← → 좌우 화살표 | input 포커스 | N/A — 브라우저 기본 동작 (커서 이동) | input 내 텍스트 커서 이동은 네이티브 동작이어야 함. keyMap에서 가로채면 텍스트 편집 불가 | 텍스트 커서 위치만 변경 | |
| Enter | listbox 열림, 옵션에 포커스 | select(focused) + close() | 현재 하이라이트된 옵션을 확정하는 표준 동작. 단일 선택 모드에서 선택 즉시 닫힘 | 선택 확정, listbox 닫힘, input에 선택값 | |
| Enter | listbox 닫힘 | comboboxCommands.open() | 닫힌 상태에서 Enter는 목록을 여는 대안 방법 | listbox 열림 | |
| Escape | listbox 열림 | comboboxCommands.close() | 취소 의도 — 팝업을 닫고 선택 변경 없이 input으로 돌아감 | listbox 닫힘, input 포커스 유지 | |
| Escape | listbox 닫힘 | N/A — 무시 (또는 상위 컨텍스트로 전파) | 이미 닫힌 상태에서 Escape는 combobox 범위 밖 | 상태 변화 없음 | |
| Space | input 포커스 | N/A — 브라우저 기본 동작 (공백 입력) | input에서 Space는 텍스트 입력의 일부. keyMap이 가로채면 공백 타이핑 불가 | 텍스트에 공백 추가 | |
| Tab | input 포커스, listbox 열림/닫힘 | listbox 닫힘 + 포커스 다음 요소로 이동 | Tab은 위젯 간 이동 — combobox를 떠나는 동작. 열린 listbox는 자동 닫힘 | combobox 비활성, 다음 tabbable 요소 포커스 | |
| Home | input 포커스 | N/A — 브라우저 기본 동작 (커서 텍스트 시작) | input 내 커서 이동은 네이티브 유지 | 커서가 텍스트 시작으로 | |
| End | input 포커스 | N/A — 브라우저 기본 동작 (커서 텍스트 끝) | input 내 커서 이동은 네이티브 유지 | 커서가 텍스트 끝으로 | |
| Home (listbox 열림) | listbox 열림, 옵션에 포커스 | ctx.focusFirst() | 목록의 첫 옵션으로 빠르게 이동 — APG combobox 표준 | 첫 옵션에 activedescendant | |
| End (listbox 열림) | listbox 열림, 옵션에 포커스 | ctx.focusLast() | 목록의 마지막 옵션으로 빠르게 이동 — APG combobox 표준 | 마지막 옵션에 activedescendant | |
| 클릭 (옵션) | listbox 열림 | select(clickedId) + close() | 마우스로 옵션 직접 선택은 키보드 Enter와 동일한 확정 동작 | 선택 확정, listbox 닫힘 | |
| 클릭 (input 외부, listbox 외부) | listbox 열림 | close() | 외부 클릭은 "관심 철회" — 팝업 닫힘의 표준 패턴 | listbox 닫힘 | |
| 더블클릭 | N/A | 브라우저 기본 동작 (텍스트 더블클릭 선택) | combobox에서 더블클릭 특수 동작 없음 | | |

### 인터페이스 체크리스트 (AI 자가 검증용)

산출물 구조를 보고 아래를 전수 확인:
- [x] ↑ 키: 해당. listbox 열림 시 이전 옵션 이동. 세로 리스트 탐색.
- [x] ↓ 키: 해당. listbox 열기 + 다음 옵션 이동. 세로 리스트 탐색.
- [x] ← 키: N/A — input 텍스트 커서 이동 (네이티브).
- [x] → 키: N/A — input 텍스트 커서 이동 (네이티브).
- [x] Enter: 해당. 옵션 선택 확정 + 닫기 / 닫힌 상태에서 열기.
- [x] Escape: 해당. listbox 닫기.
- [x] Space: N/A — input 텍스트 공백 입력 (네이티브).
- [x] Tab: 해당. listbox 닫기 + 위젯 떠남.
- [x] Home/End: listbox 열림 시 첫/마지막 옵션 이동. input 시 네이티브 커서.
- [x] Cmd/Ctrl 조합: N/A — combobox 표준에 없음.
- [x] 클릭: 해당. 옵션 클릭 = 선택 확정.
- [x] 더블클릭: N/A — 특수 동작 없음.
- [x] 이벤트 버블링: input(container)과 listbox(외부 DOM)가 분리되므로 일반적 버블링 이슈 낮음. 단, listbox 옵션 클릭 이벤트가 상위로 버블링되지 않도록 주의 필요.

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 필터 결과 0개 (매칭 옵션 없음) | listbox 열림, filterText="xyz" | 빈 목록에서 ArrowDown/Enter가 오작동하면 안 됨. activedescendant가 존재하지 않는 ID를 가리키면 접근성 위반 | listbox는 열린 상태 유지 + "결과 없음" 표시. ArrowDown/Up 무시. Enter 시 close만 (선택 없이) | activedescendant 없음, listbox 열림 유지 | |
| 첫 옵션에서 ArrowUp | listbox 열림, 첫 옵션 포커스 | 리스트 시작에서 위로 가면 순환하지 않음 — APG combobox 기본. 순환하면 "끝에 도달했다"는 인지 불가 | 포커스 변경 없음 (첫 옵션 유지) | 상태 변화 없음 | |
| 마지막 옵션에서 ArrowDown | listbox 열림, 마지막 옵션 포커스 | 리스트 끝에서 아래로 가면 순환하지 않음 — 같은 이유 | 포커스 변경 없음 (마지막 옵션 유지) | 상태 변화 없음 | |
| 빠른 연속 타이핑 | input 포커스, listbox 열림 | 매 키입력마다 setFilter → 데이터 필터링 → re-render. 디바운스 없이 즉시 반영이 기본 (combobox는 즉시 피드백이 UX 핵심) | 매 글자마다 필터 결과 즉시 갱신 | filterText 갱신, 필터된 목록 표시 | |
| 필터 중 포커스된 옵션이 필터 아웃 | listbox 열림, 옵션 B 포커스, 타이핑으로 B가 필터링됨 | 포커스 대상이 사라지면 activedescendant가 없는 ID를 가리킴 — 접근성 위반 | 필터된 목록의 첫 옵션으로 포커스 자동 이동. 목록 비면 activedescendant 제거 | 첫 매칭 옵션에 포커스 또는 포커스 없음 | |
| multiple 모드에서 Backspace + 빈 filterText | filterText 비어있고, 선택된 태그 존재 | 빈 input에서 Backspace는 "마지막 선택 태그 제거" — 멀티 태그 입력의 표준 UX | 마지막 선택 항목 선택 해제 (토글) | 선택 목록에서 마지막 항목 제거 | |
| listbox가 data-aria-container 밖 | useAria가 container 내부에서 DOM focus sync | listbox 옵션은 container 밖이므로 DOM focus sync(el.focus)가 동작하지 않아야 함. aria-activedescendant가 대신 포커스를 전달 | DOM focus는 input에 유지, activedescendant로 시각적 포커스 표현 | input에 DOM focus, listbox 옵션에 data-focused | |
| 외부 데이터 변경으로 옵션 추가/제거 | listbox 열림 | 실시간 데이터 변경(서버 응답 등)에도 engine sync가 정상 동작해야 함 | useAria의 data sync 메커니즘으로 자동 반영. 포커스된 옵션 제거 시 focusRecovery 작동 | 목록 갱신, focusRecovery 보장 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | containerProps가 input에 spread (K1) | ② useAria 훅 소비 | 준수 | — | |
| P2 | listbox는 data-aria-container 밖 (K2) | ② listbox DOM 구조, ④ DOM focus sync | 준수 | — | |
| P3 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② plugins/combobox.ts | 확인 필요(?) — 현재 combobox plugin은 keyMap 미포함. behavior가 keyMap 전담. combobox는 behavior가 키 동작을 정의하고 plugin은 상태 커맨드만 제공하는 구조이므로 위반 아님 (dnd/crud/rename과 같은 패턴) | — | |
| P4 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | 전체 | 준수 — engine 우회 없이 behavior + plugin + useAria 조합으로 구현 | — | |
| P5 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 이름 | 준수 — combobox, option, listbox 모두 APG 표준 | — | |
| P6 | focusRecovery 불변 조건 (feedback_focus_recovery_invariant) | ④ 외부 데이터 변경 | 준수 — useAria 내장 focusRecovery가 옵션 제거 시 자동 작동 | — | |
| P7 | 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ 클릭/키보드 | 준수 — input과 listbox가 별도 DOM이므로 중첩 이슈 낮음. defaultPrevented 가드는 useAria에 내장 | — | |
| P8 | 파일명 = 주 export (feedback_filename_equals_export) | ② 파일명 | 준수 — combobox.ts(behavior), combobox.ts(plugin) | — | |
| P9 | 테스트: 계산은 unit, 인터랙션은 통합 (feedback_test_strategy) | ⑧ 검증 | 준수 — 통합 테스트는 userEvent → DOM/ARIA 상태로 검증 | — | |
| P10 | trigger ↔ popup 축 미해결 (project_aria_behavior_axis_gaps) | ② behavior 축 구성 | 알려진 갭 — 현재 combobox는 popupToggle 커스텀 축으로 해결. trigger↔popup 범용 축은 미래 과제 | 현재 PRD 범위 밖. 커스텀 축 유지 | |
| P11 | 가역적 동선 (feedback_reversible_motion) | ③ ArrowDown/ArrowUp | 준수 — ArrowDown으로 이동한 포커스를 ArrowUp으로 원위치 복귀 가능 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `useAria` — containerProps를 input에 spread | containerProps에 aria-activedescendant, onKeyDown이 포함되는데, input의 네이티브 onKeyDown과 충돌 가능. 특히 좌우 화살표/Home/End가 keyMap에 잡히면 텍스트 커서 이동 불가 | 높 | behavior keyMap에서 ←→/Home/End를 등록하지 않아 네이티브 동작 유지. 현재 combobox behavior는 ArrowDown/Up/Enter/Escape만 등록 → 안전 | |
| S2 | `__combobox__` meta-entity — META_ENTITY_IDS에 이미 포함 | useAria의 data sync에서 `__combobox__`가 보존되므로 외부 data 변경 시 isOpen/filterText 상태 유지 | 낮 | 이미 처리됨 — META_ENTITY_IDS에 `'__combobox__'` 포함 확인 | |
| S3 | DOM focus sync 로직 | listbox 옵션이 data-aria-container 밖이므로, useAria의 DOM focus sync(`document.querySelector('[data-node-id=...]')`)가 listbox 옵션에 el.focus()를 호출하면 input에서 DOM focus가 빠져나감 | 높 | aria-activedescendant 모드에서는 DOM focus sync가 스킵됨 (useAria L362: `if (behavior.focusStrategy.type === 'aria-activedescendant') return`). 안전 | |
| S4 | isEditableElement 가드 (useAria L345) | containerProps.onKeyDown에서 `isEditableElement` 체크 — input은 editable이므로, 만약 `event.target !== event.currentTarget`이면 keyMap 스킵됨. 그러나 input 자체가 container이면 target === currentTarget이라 정상 동작 | 중 | containerProps를 input에 직접 spread하므로 target === currentTarget 보장. 문제 없음 | |
| S5 | listbox 옵션 클릭 시 input blur | 옵션 클릭 → input blur → listbox 닫힘 경쟁 조건. 선택 전에 닫히면 UX 깨짐 | 중 | 옵션에 `onMouseDown={e => e.preventDefault()}` 또는 `pointerdown` preventDefault로 input blur 방지. ④ 경계에 추가 필요(?) | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | keyMap에 ←→/Home/End 등록 금지 (listbox 닫힌 상태) | ⑥ S1 | input 네이티브 텍스트 커서 이동을 방해. combobox의 input은 텍스트 편집이 핵심 | |
| F2 | listbox 옵션에 el.focus() 호출 금지 | ⑥ S3 | DOM focus가 input에서 빠져나가면 타이핑 불가. aria-activedescendant로만 시각적 포커스 표현 | |
| F3 | engine 우회하여 store 직접 조작 금지 | ⑤ P4 | focusRecovery, history 등 middleware 체인이 동작하지 않음 | |
| F4 | `<Aria>` 컴포넌트 사용 금지 | ⑤ P1 (K1) | containerProps가 `<div data-aria-container>` 대신 input에 가야 함 | |
| F5 | 필터링 로직을 engine 내부에 넣지 않음 | ② 필터링 로직 | 필터링은 뷰 로직 — 어떤 옵션을 보여줄지는 engine 관심사가 아님. data prop으로 필터된 데이터를 외부에서 전달 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | input에 "ap" 타이핑 | listbox 열림, "apple" 표시, "banana" 숨김 | |
| V2 | ①M2 | listbox 열림 → ArrowDown 2회 | 두 번째 옵션에 aria-activedescendant 설정, data-focused 표시 | |
| V3 | ①M3 | 옵션 포커스 → Enter | aria-selected="true", listbox 닫힘, input value에 선택값 | |
| V4 | ①M4 | listbox 열림 → Escape | listbox 닫힘, 이전 선택값 유지, input에 DOM focus | |
| V5 | ①M5 | 빈 input → ArrowDown | listbox 열림, 전체 옵션 표시, 첫 옵션에 activedescendant | |
| V6 | ④E1 (필터 0개) | "xyz" 타이핑 → 매칭 0개 → ArrowDown | listbox 열림 유지, 포커스 이동 없음, activedescendant 없음 | |
| V7 | ④E2 (첫 옵션 ArrowUp) | 첫 옵션에서 ArrowUp | 포커스 변경 없음, 첫 옵션 유지 | |
| V8 | ④E5 (포커스 필터 아웃) | 옵션 B 포커스 → 타이핑으로 B 필터 아웃 | 첫 매칭 옵션으로 activedescendant 자동 이동 | |
| V9 | ④E6 (multiple Backspace) | multiple 모드, 빈 input, 태그 3개 → Backspace | 마지막 태그 제거 (toggleSelect) | |
| V10 | ④E7 (container 밖 DOM) | listbox 열림, ArrowDown으로 옵션 이동 | DOM focus는 input에 유지 (`document.activeElement === input`), listbox 옵션에 data-focused만 표시 | |
| V11 | ③ 클릭 | 옵션 클릭 | 선택 확정, listbox 닫힘, input blur 안 됨 | |
| V12 | ③ 외부 클릭 | listbox 열림 → listbox/input 밖 클릭 | listbox 닫힘 | |
| V13 | ③ Tab | listbox 열림 → Tab | listbox 닫힘, 다음 tabbable 요소 포커스 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (전 항목 초안 완료, 사용자 확인 대기)

### 미확인 사항 (?)

1. **⑥ S5**: 옵션 클릭 시 input blur 방지 — `onMouseDown preventDefault` 패턴이 적절한지, 아니면 다른 메커니즘이 필요한지
2. **③ Home/End listbox 열림 시**: APG에서 combobox listbox 열린 상태의 Home/End 동작이 "첫/마지막 옵션 이동"인지 "input 커서 이동"인지 — 현재 구현(behavior)에서는 Home/End가 keyMap에 등록되어 있으므로 옵션 이동으로 동작
3. **③ Tab 시 listbox 닫기**: Tab 이벤트는 keyMap에서 잡지 않으므로 blur 이벤트로 처리해야 하는지 — 외부 클릭과 같은 메커니즘으로 통합 가능한지
4. **⑤ P3**: combobox plugin이 keyMap 없이 commands만 제공하는 것이 "plugin owns keyMap" 원칙에 부합하는지 — behavior가 키 동작을 정의하므로 plugin은 상태 관리만 담당하는 것이 적절한 것으로 판단
