---
id: 2-areas/axis/prds/axis-v3-architecture-prd
title: 'Axis v3 Architecture — PRD'
status: active
kind: prd
created: 2026-03-29
updated: 2026-04-08
summary: 'Discussion: 축에서 keyMap 분리, 축=capability SSOT, 패턴=key binding, createPatternContext 해체'
topics: [2-areas, nodeid]
relates: []
supersedes: []
---
# Axis v3 Architecture — PRD

> Discussion: 축에서 keyMap 분리, 축=capability SSOT, 패턴=key binding, createPatternContext 해체

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 축이 keyMap을 소유하면 APG 패턴 전수 조립이 불가하다. expand 축이 ArrowRight/Left를 소유하면 모든 expand가 좌우키에 묶이는데, APG에서 expand 트리거는 패턴마다 다르다 (tree=ArrowRight, accordion=Enter, menu=ArrowRight). grid의 nav↔edit mode 전환도 표현 불가. createPatternContext는 6개 축 commands를 하드코딩 import하는 god object로 OCP 위반.
- **Forces**: (1) 축은 상태 차원에서 직교하지만 키 공간에서는 직교하지 않음 — ArrowRight가 navigate/expand/value에 모두 필요. (2) 현재 chain of responsibility는 정적 우선순위라 컨텍스트 의존 분기 불가. (3) atomic restructure 필수 — 30개 패턴 + UI 완성품 동시 전환.
- **Decision**: 축 = capability SSOT (commands + ctx 확장 + handlers + config + middleware + visibilityFilter + ariaAttributes). 패턴 = key binding + 구조적 aria. 기각 대안: (a) 키 그룹 기준 분해 — 패턴마다 행동 달라서 재사용 불가, (b) chain of responsibility 강화 — 축이 다른 축 존재를 알아야 해서 OCP 위반.
- **Non-Goals**: (1) ctx 타입 완전 안전성 — 실용적으로 union + undefined. (2) 새 축 추가(edit 등)는 이 PRD 범위 밖. (3) plugin keyMap 구조 변경 — 기존 유지.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | tree 패턴 — ArrowRight=expand | accordion 패턴도 expand 축 사용 | accordion의 expand 트리거는 Enter이지 ArrowRight가 아님 → 패턴이 키를 결정해야 | |
| S2 | treegrid 패턴 — ArrowRight 필요 | row면 expand, cell이면 nav | 관심사 간 분기는 패턴이 소유, 관심사 내부 조건(isExpanded?)은 축 handler가 소유 | |
| S3 | 새 패턴 추가 시 | 기존 축 조합으로 구성 | composePattern(identity, axes, keyMap)으로 충돌 없이 선언 | |
| S4 | 기존 패턴 확장 시 | tree → treegrid | composePattern(tree(), additionalAxes, keyMapOverrides)로 기존 바인딩 위에 덮어쓰기 | |
| S5 | 축이 추가될 때 | createPatternContext 수정 없이 | 새 축이 ctx 조각을 제공하고, composePattern이 합성 → OCP | |

완성도: 🟢 90%

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `axis/types.ts` 재설계 | `Axis` 인터페이스 — createCtx, handlers, config, middleware, visibilityFilter, ariaAttributes. 기존 KeyMap 소유 제거 | |
| `axis/navigate.ts` 재설계 | commands + createCtx(focused, focusNext/Prev/First/Last/Parent/Child) + handlers(movesNext, movesPrev, movesFirst, movesLast) + config(focusStrategy). keyMap 제거. APG: "moves focus to the next/previous/first/last node" | |
| `axis/select.ts` 재설계 | commands + createCtx(selected, toggleSelect, extendSelection) + handlers(togglesSelection) + config + middleware. keyMap 제거. APG: "toggles the selection state" | |
| `axis/expand.ts` 재설계 | commands + createCtx(isExpanded, expand, collapse, focusChild, focusParent) + handlers(opensOrFocusChild, closesOrFocusParent) + config + visibilityFilter + ariaAttributes(aria-expanded). keyMap 제거. APG: "opens the node; moves focus to the first child" / "closes the node; moves focus to its parent" | |
| `axis/value.ts` 재설계 | commands + createCtx(value nav) + handlers(increase, decrease, setToFirst, setToLast) + config + ariaAttributes(aria-valuenow/min/max). keyMap 제거. APG: "Increase/Decrease the value" / "Set to the first/last allowed value" | |
| `axis/popup.ts` 재설계 | commands + createCtx(isOpen, open, close) + handlers(opensPopup, closesPopup) + config + visibilityFilter + ariaAttributes(aria-haspopup, aria-expanded, aria-controls). keyMap 제거. APG: "opens/closes the popup" | |
| `axis/checked.ts` 재설계 | commands + createCtx(isChecked, toggleCheck) + handlers(togglesCheck) + config + ariaAttributes(aria-checked). keyMap 제거. APG: "toggles the checked state" | |
| `axis/activate.ts` 삭제 | 독립 상태 없음, 다른 축 commands의 if-else dispatcher. 패턴 keyMap에서 직접 표현 | |
| clickMap 도입 | keyMap과 동일한 선언적 맵. 키: modifier 조합(none/shift/mod/shift+mod), 값: (ctx, nodeId) => Command. 현재 useAria/useAriaView의 하드코딩된 Shift+Click/Cmd+Click/click 분기를 대체. 축이 handlers로, 패턴이 바인딩으로 소유 | |
| `axis/dismiss.ts` 삭제 | popup.close의 별칭. popup 축 handlers에 흡수 | |
| `axis/tab.ts` 흡수 | navigate config(tabFocusStrategy)로 흡수. tab('loop')의 keyMap은 패턴이 직접 선언 | |
| `pattern/composePattern.ts` 재설계 | overload: (1) composePattern(identity, axes, keyMap) 신규 생성, (2) composePattern(basePattern, axes, keyMap) 기존 패턴 확장 | |
| `pattern/createPatternContext.ts` 해체 | god object → 축별 createCtx 합성으로 대체. 이 파일 삭제 또는 thin shell로 축소 | |
| `pattern/types.ts` — AriaPattern 재설계 | keyMap을 필수 유지하되, 축이 아닌 composePattern에서 조립된 결과물로 | |
| `pattern/roles/*.ts` 30개 패턴 마이그레이션 | 각 패턴이 keyMap을 직접 선언. 축은 capability만 주입 | |
| `primitives/useAriaView.ts` 수정 | createPatternContext 호출 → 새 ctx 합성 방식으로 전환. behaviorCtxOptions 제거 | |
| `primitives/useAria.ts` 수정 | META_ENTITY_IDS 하드코딩 → 축이 등록한 meta entity 목록으로 동적화 | |
| `primitives/useAriaZone.ts` 수정 | META_COMMAND_TYPES 하드코딩 → 축이 등록한 command types으로 동적화 | |

완성도: 🟢 90%

## ③ 인터페이스

> 입력 → 왜 이 결과가 나는가 → 결과

### 축 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `expand()` 호출 | — | createCtx, handlers, config, visibilityFilter, ariaAttributes 반환 | 축은 capability의 SSOT — 키 바인딩 없이 능력만 제공 | StructuredAxis 객체 | |
| `expand().handlers.opensOrFocusChild(ctx)` 호출 | ctx.isExpanded = false | expand 실행 | APG tree: "When focus is on a closed node, opens the node" — 관심사 내부 조건은 축이 소유 | Command(expand) 반환 | |
| `expand().handlers.opensOrFocusChild(ctx)` 호출 | ctx.isExpanded = true | focusChild 실행 | APG tree: "When focus is on an open node, moves focus to the first child node" | Command(focusChild) 반환 | |
| `expand().handlers.closesOrFocusParent(ctx)` 호출 | ctx.isExpanded = true | collapse 실행 | APG tree: "When focus is on an open node, closes the node" | Command(collapse) 반환 | |
| `expand().handlers.closesOrFocusParent(ctx)` 호출 | ctx.isExpanded = false | focusParent 실행 | APG tree: "When focus is on a child node that is also either an end node or a closed node, moves focus to its parent node" | Command(focusParent) 반환 | |

### composePattern 인터페이스 — 신규 생성

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `composePattern(identity, [navigate(), select(), expand()], keyMap)` | — | axes의 config/middleware/visibilityFilter/ariaAttributes를 merge + keyMap을 그대로 사용 | 축은 능력, 패턴은 바인딩 — 각자의 소유물만 합성 | AriaPattern 반환 | |
| axes가 같은 config key를 제공 | expand와 popup 모두 ariaAttributes에 aria-expanded 제공 | 뒤쪽 축이 앞쪽을 override | axis 배열 순서 = 우선순위, 선언적이고 예측 가능 | 마지막 축의 aria-expanded 적용 | |
| identity.ariaAttributes + 축.ariaAttributes | — | identity의 구조적 aria(posinset, setsize, level)와 축의 상태 aria(selected, expanded)를 merge | 구조=패턴 소유, 상태=축 소유 — 관심사 분리 | 합성된 ariaAttributes 함수 | |

### composePattern 인터페이스 — 패턴 확장

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `composePattern(tree(), [navigate({ grid: columns })], { ArrowRight: override })` | tree의 기존 AriaPattern | base의 identity/axes 위에 추가 axes merge + keyMap은 base 위에 override merge | OCP — base를 수정하지 않고 확장 | AriaPattern (tree + grid nav + override keyMap) | |
| override에 없는 키 | base keyMap에 ArrowDown 존재 | base의 ArrowDown 유지 | override는 명시한 키만 덮어씀 — 나머지는 보존 | base ArrowDown 그대로 | |
| override에 있는 키 | base keyMap에 ArrowRight 존재 | override의 ArrowRight로 교체 | 확장의 의도 = "이 키의 행동을 변경" | override ArrowRight 적용 | |

### clickMap 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| click (no modifier) | listbox 패턴 | select(nodeId) + activate | APG listbox: click = select + activate. 현재 useAria에 하드코딩된 것을 패턴이 선언 | selected=[nodeId], onActivate 호출 | |
| Shift+click | listbox 패턴, selectionMode=multiple | extendSelectionTo(nodeId) | APG: Shift+Click = 범위 선택. modifier 조합이 keyMap의 "키"에 해당 | selection 범위 확장 | |
| Mod+click | listbox 패턴, selectionMode=multiple | toggleSelect(nodeId) | APG: Ctrl/Cmd+Click = 토글 선택 | 해당 노드 선택 토글 | |
| click (no modifier) | tree 패턴, parent 노드 | select + toggleExpand + activate | APG tree: "click on parent = expand toggle + select". expandOnParentClick 하드코딩 대체 | expanded 토글 + selected | |
| click | checkbox 패턴 | toggleCheck(nodeId) | APG checkbox: click = toggle. 현재 checkOnClick config로 하드코딩된 것 | checked 토글 | |

### ctx 합성 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| axes = [navigate(), select(), expand()] | engine 인스턴스 | 각 축의 createCtx 호출 + 결과를 하나의 ctx 객체로 합성 | 축이 ctx 조각의 SSOT이므로 합성은 기계적 | { focused, focusNext, ..., selected, toggleSelect, ..., isExpanded, expand, ... } | |
| axes = [navigate(), value()] | engine 인스턴스 | navigate + value의 createCtx만 합성 | 사용하지 않는 축의 메서드는 ctx에 없음 — god object 해소 | { focused, focusNext, ..., value: { increment, ... } } | |
| dispatch, getEntity, getChildren | — | 항상 포함 — 축이 아닌 engine 기본 능력 | 모든 keyMap handler가 필요로 하는 공통 도구 | BaseCtx에 포함 | |

완성도: 🟢 90%

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 축 0개로 composePattern | identity + 빈 axes + keyMap | 일부 패턴(alert, feed, meter)은 축 없이 존재 | config/middleware/visibilityFilter 없이 keyMap만 있는 AriaPattern 반환 | 정상 동작 | |
| 확장 시 base axes와 추가 axes의 config 충돌 | tree의 focusStrategy=vertical + grid의 focusStrategy=both | 확장의 의도는 "grid 차원 추가"이므로 추가 axes가 우선 | 추가 axes의 config가 base를 override | focusStrategy=both | |
| 확장 시 base axes와 추가 axes의 middleware 충돌 | tree의 select middleware + 추가 axes의 select middleware | middleware는 합성 가능(reduceRight) | 기존 + 추가 middleware를 체이닝 | 양쪽 middleware 모두 실행 | |
| 확장 시 base axes와 추가 axes의 visibilityFilter 충돌 | tree의 expand filter + 추가 filter | visibilityFilter는 AND 합성 | 기존 + 추가 filter 모두 적용 | 두 filter 모두 shouldDescend=true일 때만 descend | |
| ariaAttributes 충돌 — expand와 popup 모두 aria-expanded | expand=expanded 상태, popup=open 상태 | 하나의 패턴에서 expand와 popup을 동시에 쓰면 aria-expanded의 소유자가 모호 | 이 조합은 APG에서 발생하지 않음 — 하나의 노드가 expand이면서 popup trigger인 경우 없음. 만약 발생하면 뒤쪽 축 우선 | 뒤쪽 축의 aria-expanded | |
| handlers를 패턴 keyMap에서 직접 호출하지 않고 커스텀 로직 작성 | 패턴이 expand.handlers.enter 대신 자체 로직 작성 | handlers는 편의 — 강제 아님. 패턴이 ctx.expand() 직접 호출 가능 | ctx 메서드 직접 사용도 허용 | 정상 동작 | |
| tab('loop')의 keyMap — 축에서 분리 후 | tab 축 삭제, navigate로 흡수 | tab('loop')의 Tab/Shift+Tab keyMap은 패턴이 직접 선언해야 | 패턴 keyMap에 Tab: ctx => ctx.focusNext({ wrap: true }) 추가 | navigate config만 tabFocusStrategy로 제공 | |
| useAriaZone의 META_COMMAND_TYPES 하드코딩 | 현재 14개 command type 하드코딩 | 새 축 추가 시 이 set도 수정 필요 = OCP 위반 | 축이 자신의 command types를 등록, composePattern이 수집 | AriaPattern에 metaCommandTypes: Set\<string\> 추가 | |
| useAriaZone의 applyMetaCommand switch-case | 현재 14개 case 하드코딩 | 새 command type 추가 시 switch 수정 = OCP 위반 | 축이 applyMeta reducer 제공, composePattern이 합성. zone은 합성된 reducer만 호출 | AriaPattern에 applyMeta: (state, command) => state 추가 | |
| useAria의 META_ENTITY_IDS 하드코딩 | 현재 12개 entity ID 하드코딩 | 새 축 추가 시 이 set도 수정 필요 = OCP 위반 | 축이 자신의 meta entity IDs를 등록, composePattern이 수집 | AriaPattern에 metaEntityIds: Set\<string\> 추가 | |
| 기존 plugin keyMap의 original 패턴 | plugin keyMap: (ctx, original?) => ... | plugin은 behavior keyMap의 handler를 original로 받음 | 새 구조에서도 behavior.keyMap은 AriaPattern에 있으므로 동일하게 동작 | 변경 없음 | |

완성도: 🟢 90%

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 선언적 OCP: 선언=등록, 합성 런타임 불변, switch-case dispatcher 금지 (feedback_declarative_ocp) | ② createPatternContext 해체, activate 삭제 | 준수 — 이것이 이 PRD의 핵심 동기 | — | |
| P2 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② plugin keyMap 구조 | 준수 — plugin은 기존대로 keyMap 소유. 축만 keyMap 분리 | — | |
| P3 | atomic restructure 필수 (feedback_atomic_restructure) | ② 전체 | 준수 — 30개 패턴 + 관련 파일 원자적 전환 | — | |
| P4 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② handlers 이름 | 준수 — APG 원문 동사 사용: opensOrFocusChild("opens the node; moves focus to the first child"), increase("Increase the value"), togglesSelection("toggles the selection state") 등 | — | |
| P5 | Pattern=composePattern+examples/APG (feedback_pattern_apg_only) | ② 30개 패턴 | 준수 — 패턴은 여전히 composePattern으로만 생성 | — | |
| P6 | visibilityFilter는 axis/plugin이 선언, engine은 순회만 (feedback_visibility_filter_ocp) | ② expand, popup의 visibilityFilter | 준수 — 축이 계속 소유 | — | |
| P7 | 축 모델 상한 = 6축 (project_axis_upper_bound) | ② 축 목록 6개 | 준수 — navigate, select, expand, value, popup, checked | — | |
| P8 | APG focus/selection/activation 별개 개념 (feedback_apg_three_concepts) | ② activate 삭제 | 준수 — activate dispatcher가 사라지고 패턴이 명시적으로 선택 | — | |

완성도: 🟢 90%

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | 30개 `pattern/roles/*.ts` | 모든 패턴의 시그니처 변경 — axes에서 keyMap을 빼고 패턴이 직접 선언 | 높 | atomic restructure로 한 번에 전환. 기존 테스트가 행동 검증 | |
| B2 | `primitives/useAria.ts` | createPatternContext 호출 → 새 ctx 합성 호출로 변경 | 높 | AriaPattern 인터페이스는 유지(keyMap, config 등 외부 형태 동일)하므로 useAria의 변경은 내부 ctx 생성 부분에 한정 | |
| B3 | `primitives/useAriaView.ts` | behaviorCtxOptions 제거 → ctx 합성 방식 변경 | 높 | useAriaView가 AriaPattern에서 직접 ctx를 합성하도록 변경 | |
| B4 | `primitives/useAriaZone.ts` | META_COMMAND_TYPES 하드코딩 → AriaPattern에서 동적 참조 | 중 | applyMetaCommand의 switch-case는 command.execute()로 대체 가능 (?) | |
| B5 | UI 완성품 (ui/*.tsx) | pattern 소비 방식은 useAria({ behavior: pattern() }) — 외부 API 불변 | 낮 | pattern()의 반환 타입 AriaPattern이 호환되면 UI 변경 없음 | |
| B6 | 기존 integration test | behavior keyMap이 바뀌면 테스트의 키 입력 → 결과 검증에 영향 | 중 | keyMap 행동은 동일하게 유지 — 구조만 변경. 테스트는 행동 검증이므로 패스해야 함 | |
| B7 | activate 축 소비처 13개 패턴 | activate() 호출을 각 패턴의 keyMap에서 직접 표현으로 대체 | 높 | 각 패턴의 APG 스펙을 참조하여 Enter/Space의 정확한 행동을 명시 | |
| B8 | tab 축 — tab('loop') 사용처 | tab keyMap이 사라지므로 패턴이 직접 Tab/Shift+Tab 선언 필요 | 낮 | 현재 tab 축 사용처 0개 (탐색 결과). dialog/toolbar에서 추후 사용 시 패턴 keyMap으로 | |
| B9 | dismiss 축 — alertdialog, dialog 사용 | dismiss.Escape → 패턴 keyMap에서 직접 Escape 선언 | 낮 | 2개 파일만 영향 | |

완성도: 🟢 85%

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | 축에 keyMap을 남기는 것 | ⑤ P1 (선언적 OCP) | 이 PRD의 핵심 — 축은 capability만 소유 | |
| X2 | createPatternContext에 새 축 import 추가 | ⑤ P1 (선언적 OCP) | god object 재발. 축이 createCtx를 제공하고 composePattern이 합성 | |
| X3 | activate 축 재도입 또는 ctx.activate() 범용 메서드 유지 | ⑤ P8 (APG 3개념 분리) | if-else dispatcher = 중간 해석 계층. 패턴이 명시적으로 선택 | |
| X4 | 점진적 마이그레이션 (v2 호환 레이어 유지) | ⑤ P3 (atomic restructure) | 두 모델 공존 = 복잡도 2배. 한 커밋에 전환 | |
| X5 | AriaPattern 외부 인터페이스 변경 | ⑥ B5 | UI 완성품이 useAria({ behavior: pattern() })로 소비. 외부 형태 유지 | |
| X6 | plugin keyMap 구조 변경 | Non-Goals | plugin은 기존대로 keyMap 소유 — 이 PRD 범위 밖 | |

완성도: 🟢 90%

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | tree와 accordion이 모두 expand 축을 사용하되 다른 키에 바인딩 | tree: ArrowRight=expand.enter, accordion: Enter=expand (키 충돌 없음) | |
| V2 | S2 | treegrid에서 ArrowRight — row와 cell에서 다른 행동 | row: expand.enter 호출, cell: grid.focusNextCol 호출 (패턴이 분기) | |
| V3 | S3 | 새 패턴을 기존 축 조합으로 생성 | composePattern(identity, axes, keyMap) — 기존 축/패턴 수정 없음 | |
| V4 | S4 | tree를 확장하여 treegrid 생성 | composePattern(tree(), [navigate({ grid })], overrides) — tree 코드 수정 없음 | |
| V5 | S5 | 가상의 새 축 추가 시 createPatternContext 수정 필요 없음 | 새 축이 createCtx 제공 → composePattern이 합성 → 기존 파일 무변경 | |
| V6 | ④ 축 0개 | alert 패턴 — 축 없이 생성 | composePattern(identity, [], keyMap) 정상 동작 | |
| V7 | ④ config 충돌 | 확장 시 focusStrategy 충돌 | 추가 axes의 config가 base override | |
| V8 | ④ plugin 호환 | plugin keyMap의 original 패턴 | 기존과 동일하게 behavior keyMap handler를 original로 받음 | |
| V9 | ⑥ B6 | 기존 integration test 전수 실행 | 행동 변경 없으므로 전부 패스 | |
| V10 | ⑥ B7 | activate 소비처 13개 패턴 — Enter/Space 행동 | 각 패턴의 APG 스펙과 동일한 행동 유지 | |

완성도: 🟢 85%

---

**전체 완성도:** 🟢 8/8

| 단계 | 완성도 |
|------|--------|
| ① 동기 | 🟢 90% |
| ② 산출물 | 🟢 90% |
| ③ 인터페이스 | 🟢 90% |
| ④ 경계 | 🟢 90% |
| ⑤ 원칙 대조 | 🟢 90% |
| ⑥ 부작용 | 🟢 85% |
| ⑦ 금지 | 🟢 90% |
| ⑧ 검증 | 🟢 85% |
