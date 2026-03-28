# popup 축 신설 — PRD

> Discussion: expand와 popup의 경계는 포커스 이동 여부. aria-haspopup + aria-expanded + aria-controls + 포커스 위임/복귀를 하나의 축으로 묶고, dismiss를 흡수한다. v3 Protocol/Binding 구조의 첫 probe.

## ① 동기

### WHY

- **Impact**: popup 속성 세트(aria-haspopup, aria-expanded, aria-controls, 포커스 위임/복귀)가 축으로 묶여있지 않아 Menu Button(#41), Combobox Grid(#15), Date Picker Combobox(#16), Date Picker Dialog(#18), Menubar submenu(#39,#40) 등의 APG 패턴에서 aria-haspopup/aria-controls를 수동 배선해야 한다. 현재 combobox plugin이 이 역할을 ad-hoc으로 수행하지만 범용화되어 있지 않다.
- **Forces**: expand 축은 인라인 전개(disclosure, accordion, tree)만 담당 — aria-expanded 하나. popup은 그 위에 aria-haspopup + aria-controls + 포커스 위임 + 포커스 복귀가 항상 세트로 필요. 두 축은 "열고 닫는다"는 표면 행동은 같지만, 포커스 이동 여부라는 본질적 차이가 있다. 기존 47🟢 패턴과의 공존 필수.
- **Decision**: popup 축 신설. 기각된 대안: (A) expand에 popup 옵션 추가 — expand의 책임이 상태 토글 + 관계 속성 + 포커스 관리로 3가지가 되어 SRP 위반. (B) 전체 v3 전환 — 이론 미검증 상태에서 47🟢 마이그레이션 리스크. (C) UI 완성품에서 수동 처리 — 공식 있는 계약을 매번 반복하면 누락 위험(pit of failure).
- **Non-Goals**: 나머지 축(expand, select, navigate 등) Protocol/Binding 전환 (이번 probe 검증 후 별도 세션). 기존 combobox plugin 제거 (공존). menubar 포팅 (orientation-by-level이 추가로 필요하여 별도 PRD). 기존 dismiss 축 삭제 (popup이 흡수하되, 현재 dismiss 소비자에 영향 없도록 유지).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | menuButton 패턴에 popup({ type: 'menu' }) 사용 | 렌더링 | trigger에 aria-haspopup="menu", aria-expanded="false" 자동 부여 | |
| S2 | trigger에 포커스, popup 닫힌 상태 | Enter/Space 누름 | popup 열림(aria-expanded="true"), popup 첫 항목으로 포커스 위임 | |
| S3 | popup 열린 상태 | Escape 누름 | popup 닫힘(aria-expanded="false"), trigger로 포커스 복귀 | |
| S4 | popup 열린 상태 | popup 내 항목 클릭 | 항목 활성화 + popup 닫힘 + trigger로 포커스 복귀 | |
| S5 | popup({ type: 'dialog', modal: true }) 사용 | 열림 | popup에 aria-modal="true", Tab으로 popup 내부에서만 순환(focus trap) | |
| S6 | popup({ type: 'listbox' }) 사용 | ArrowDown으로 열림 | combobox 스타일 — popup 열리고 첫 항목 포커스(또는 activedescendant) | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/axis/popup.ts` | popup 축: `POPUP_ID` 메타 엔티티, `popupCommands`(open/close), `popup()` 팩토리 함수. type 파라미터(menu/listbox/grid/tree/dialog)에 따라 aria-haspopup 값과 키보드 바인딩 결정 | |
| `src/interactive-os/axis/types.ts` 수정 | `PatternContext`에 `isOpen`, `open()`, `close()` 추가. `AxisConfig`에 `popupType`, `popupModal` 추가 | |
| `src/interactive-os/pattern/types.ts` 수정 | `AriaPattern`에 `popupType?`, `popupModal?` 추가. `NodeState`에 `open?: boolean` 추가 | |
| `src/interactive-os/pattern/composePattern.ts` 수정 | `popupType`, `popupModal` config 패스스루 | |
| `src/interactive-os/primitives/useAriaView.ts` 수정 | popup 상태 계산: `NodeState.open` 파생. trigger 노드에 `aria-haspopup`, `aria-expanded`, `aria-controls` 자동 부여. modal일 때 focus trap 로직 | |
| `src/interactive-os/primitives/useAria.ts` 수정 | `POPUP_ID` 메타 엔티티 초기화, `__popup__` store 관리 | |
| `src/interactive-os/primitives/useAriaZone.ts` 수정 | popup meta command 처리: `core:open`, `core:close` | |
| `src/interactive-os/pattern/examples/menuButton.ts` 신설 | Menu Button APG 패턴 — popup({ type: 'menu' }) + navigate + activate 조합 | |

완성도: 🟢

## ③ 인터페이스

### popup 상태 전이

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter/Space (trigger) | popup 닫힘 | open → 포커스 위임 | APG Menu Button: "Enter opens the menu and places focus on the first menu item" | popup 열림, 첫 항목 포커스 | |
| Escape (popup 내부) | popup 열림 | close → 포커스 복귀 | APG 공통: "Escape closes the menu and returns focus to the button" | popup 닫힘, trigger 포커스 | |
| ArrowDown (trigger, type=menu) | popup 닫힘 | open → 첫 항목 포커스 | APG Menu Button: "ArrowDown opens the menu and moves focus to the first item" | popup 열림, 첫 항목 포커스 | |
| ArrowUp (trigger, type=menu) | popup 닫힘 | open → 마지막 항목 포커스 | APG Menu Button: "ArrowUp opens the menu and moves focus to the last item" | popup 열림, 마지막 항목 포커스 | |
| Tab (popup 내부, modal=false) | popup 열림 | close → 포커스 복귀 | 비-모달 popup은 Tab으로 벗어나면 닫힘 (APG Menu) | popup 닫힘, 다음 Tab stop | |
| Tab (popup 내부, modal=true) | popup 열림 | focus trap — popup 내부 순환 | 모달 dialog는 Tab이 내부에서만 순환 (APG Dialog) | popup 유지, popup 내부 포커스 이동 | |
| 클릭 (trigger) | popup 닫힘 | open | APG Menu Button: 클릭으로 열기 | popup 열림 | |
| 클릭 (popup 외부, modal=false) | popup 열림 | close | light dismiss — 외부 클릭 시 닫힘 | popup 닫힘 | |
| 클릭 (popup 항목) | popup 열림 | activate + close + 포커스 복귀 | APG Menu: 항목 클릭 = 활성화 후 닫힘 | popup 닫힘, trigger 포커스 | |

### popup 저장 구조

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| open(triggerId) | `__popup__` 엔티티 | isOpen=true, triggerId 저장 | 어떤 trigger가 열었는지 알아야 포커스 복귀 가능 | `{ isOpen: true, triggerId }` | |
| close() | isOpen=true | isOpen=false | 닫힘 | `{ isOpen: false, triggerId }` | |

### popup NodeState 계산

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| getNodeState(trigger) | isOpen=true | open=true | trigger 노드의 상태로 aria-expanded 파생 | `{ open: true }` | |
| getNodeState(trigger) | isOpen=false | open=false | 동일 | `{ open: false }` | |
| getNodeState(non-trigger) | — | open=undefined | popup 상태는 trigger 노드에만 적용 | `{ open: undefined }` | |

### ARIA 속성 자동 생성

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| getNodeProps(trigger) | popupType='menu' | aria-haspopup="menu" 자동 부여 | popup protocol이 type을 선언하면 trigger에 자동 매핑 | props에 aria-haspopup | |
| getNodeProps(trigger) | open=true | aria-expanded="true" 자동 부여 | open 상태에서 aria-expanded 파생 | props에 aria-expanded | |
| getNodeProps(trigger) | popupType 존재 + popup id 있음 | aria-controls={popupId} 자동 부여 | trigger가 제어하는 popup 요소의 DOM id 참조 | props에 aria-controls | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| popupType 없는 패턴에서 popup 상태 접근 | popup 축 미사용 | popup 축을 사용하지 않는 기존 패턴에 영향 없어야 | NodeState.open = undefined, aria-haspopup 미생성 | 기존 동작 유지 | |
| popup 열린 상태에서 trigger 노드 삭제 | isOpen=true, triggerId 존재 | trigger가 사라지면 포커스 복귀 대상이 없음 | popup 강제 닫힘, 포커스는 focusRecovery가 처리 | isOpen=false | |
| popup 열린 상태에서 popup 내 항목 전부 삭제 | popup 열림, 항목 0개 | 빈 popup은 의미 없음 | popup 닫힘 + trigger 포커스 복귀 | isOpen=false | |
| 중첩 popup (menubar submenu) | popup A 열림 → 내부에서 popup B 열림 | 재귀적 popup은 스택으로 관리 — Escape는 가장 안쪽부터 닫음 | popup B 닫힘, popup A 유지 | B=closed, A=open | |
| modal popup 안에서 Tab | popup 열림, modal=true | focus가 popup 밖으로 나가면 안 됨 | Tab이 popup 내부에서만 순환 | 포커스 popup 내부 유지 | |
| aria-controls id 참조 | popup 렌더링 | DOM에 popup 요소가 있어야 id 참조 가능 | popup이 닫혀서 DOM에 없으면 aria-controls 미생성 | 열려있을 때만 aria-controls | |
| 기존 dismiss 축 소비자 | dismiss()를 쓰는 menu, dialog 패턴 | popup이 dismiss를 흡수하지만 기존 패턴이 깨지면 안 됨 | dismiss()는 그대로 유지, popup()은 내부적으로 close 포함 | 하위 호환 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ARIA 표준 용어 우선 (feedback_naming_convention) | popup 축 이름 | ✅ 준수 — aria-has**popup**에서 파생 | — | |
| 2 | 축=ARIA 상태 속성 매핑 (discuss 결론) | popup 속성 세트 | ✅ 준수 — haspopup+expanded+controls가 세트로 매핑 | — | |
| 3 | 선언적 OCP (feedback_declarative_ocp) | popup({ type }) 팩토리 | ✅ 준수 — type 파라미터로 확장, 내부 분기 없음 | — | |
| 4 | Pattern은 조립 블록 (feedback_pattern_is_block_not_abstraction) | menuButton 패턴 | ✅ 준수 — composePattern 사용 | — | |
| 5 | Plugin은 keyMap 소유 (feedback_plugin_owns_keymap) | popup은 plugin이 아니라 axis | ⚠️ 검토 — popup은 axis이므로 keyMap을 축 레벨에서 소유. 기존 combobox plugin과 역할 중복 가능 | combobox plugin은 그대로 유지(Non-Goal), 새 패턴만 popup 축 사용 | |
| 6 | expand/collapse는 history 대상 아님 (feedback_expand_not_history) | popup open/close | ✅ 준수 — popup open/close도 view state, undo 대상 아님 | — | |
| 7 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | popup 닫힘 시 trigger 삭제된 경우 | ✅ 준수 — trigger 삭제 시 focusRecovery가 대체 위치 결정 | — | |
| 8 | 테스트: 인터랙션 통합 (CLAUDE.md) | menuButton conformance test | ✅ 준수 — user.keyboard() → DOM/ARIA 상태 검증 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | axis/types.ts — PatternContext 확장 | isOpen/open()/close() 추가. 기존 ctx 소비자에 새 메서드 노출 | 낮 | optional이므로 기존 소비자 무영향 | |
| 2 | pattern/types.ts — NodeState 확장 | open?: boolean 추가 | 낮 | optional이므로 기존 ariaAttributes 콜백 무영향 | |
| 3 | useAriaView.ts — getNodeProps 수정 | trigger 노드에 aria-haspopup, aria-controls 자동 추가 | 중 | popupType이 설정된 패턴에서만 동작, 기존 패턴은 popupType 없으므로 무영향 | |
| 4 | useAriaZone.ts — META_COMMAND_TYPES 확장 | core:open, core:close 추가 | 낮 | 기존 커맨드와 충돌 없음 | |
| 5 | 기존 menu 패턴 (menu.ts) | 현재 menu는 expand+dismiss 사용. popup 도입해도 기존 menu 안 바꿈 (새 menuButton만 popup 사용) | 낮 | 기존 menu.ts 그대로 유지 | |
| 6 | combobox plugin | 역할 중복(open/close). 하지만 combobox plugin은 filterText, create 등 combobox 전용 로직 포함 | 중 | combobox plugin 유지(Non-Goal). 향후 popup 축 위에 combobox를 재구현할 수 있지만 이번 범위 아님 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | expand 축에 popup 로직 추가 | ⑤#2 축=ARIA 매핑 | expand는 인라인 전개(aria-expanded만), popup은 별도 속성 세트. SRP 위반 | |
| 2 | 기존 combobox plugin 수정/제거 | ① Non-Goals | combobox는 filterText/create 등 전용 로직이 있어 popup 축으로 대체 불가. 공존 | |
| 3 | 기존 dismiss 축 삭제 | ⑥#5 하위 호환 | menu, dialog 등 기존 패턴이 dismiss()를 사용 중. popup이 dismiss를 흡수하되 별도로 dismiss 유지 | |
| 4 | popup open/close를 history(undo/redo) 대상으로 만들기 | ⑤#6 view state | popup 상태는 view state — undo 후 popup이 다시 열리면 혼란 | |
| 5 | trigger가 아닌 노드에 aria-haspopup 부여 | ⑤#2 ARIA 표준 | aria-haspopup는 popup을 여는 trigger 요소에만 해당 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | menuButton 렌더링 → trigger에 aria-haspopup="menu" | trigger 요소에 aria-haspopup="menu", aria-expanded="false" | |
| V2 | S2 | trigger에서 Enter → popup 열림 | aria-expanded="true", popup 첫 menuitem에 포커스 | |
| V3 | S3 | popup 열린 상태에서 Escape | aria-expanded="false", trigger로 포커스 복귀 | |
| V4 | S2 | trigger에서 ArrowDown → popup 열림 | popup 열림 + 첫 항목 포커스 (APG Menu Button 동작) | |
| V5 | S2 | trigger에서 ArrowUp → popup 열림 | popup 열림 + 마지막 항목 포커스 (APG Menu Button 동작) | |
| V6 | S4 | popup 항목 클릭 | 항목 활성화 + popup 닫힘 + trigger 포커스 | |
| V7 | ④ | popupType 없는 기존 패턴(tree, listbox 등) | NodeState.open=undefined, aria-haspopup 미생성, 기존 동작 불변 | |
| V8 | ④ | popup 열린 상태에서 trigger 삭제 | popup 강제 닫힘, focusRecovery 동작 | |
| V9 | S5 | modal popup에서 Tab | popup 내부에서만 포커스 순환 (focus trap) | |
| V10 | ④ | 기존 menu, dialog 패턴 테스트 | 전부 통과 (하위 호환) | |

완성도: 🟢

---

### 설계 결정 (discuss에서 확정)

**D1. 포커스 위임/복귀**: popup middleware에서 처리. select 축의 `selectionFollowsFocusMiddleware`와 동일 패턴. open command dispatch 시 middleware가 popup 첫 항목으로 포커스 이동, close command 시 triggerId로 포커스 복귀.

**D2. aria-controls**: 첫 probe에서 생략. ARIA 1.3에서 combobox required에서 제거됨. APG Menu Button에서도 optional. probe의 핵심 불확실성(popup 축이 composePattern과 호환되는가)과 무관. 향후 DOM id 참조 인프라 구축 시 추가.

---

**전체 완성도:** 🟢 8/8
