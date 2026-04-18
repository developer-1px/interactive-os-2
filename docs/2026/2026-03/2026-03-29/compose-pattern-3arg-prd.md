---
id: 2-areas/pattern/prds/compose-pattern-3arg-prd
type: prd
slug: composePattern3arg
title: 'composePattern 3인자 리팩토링 — PRD'
tags: [axes, newaxes, newaxis, sel]
created: 2026-03-29
updated: 2026-04-08
summary: 'Discussion: Identity 14필드 god object → 축 인스턴스 SSOT + required 배열 + APG 3섹션 1:1 매핑'
legacy:
  status: active
  kind: prd
  topics: [2-areas, axes, newaxes, newaxis, sel]
  relates: []
  supersedes: []
---
# composePattern 3인자 리팩토링 — PRD

> Discussion: Identity 14필드 god object → 축 인스턴스 SSOT + required 배열 + APG 3섹션 1:1 매핑

## ① 동기

### WHY

- **Impact**: 패턴 작성자(LLM/개발자)가 role 파일을 작성할 때 Identity에 축 데이터를 중복 선언해야 하고, handler와 config의 연결이 타입으로 보장되지 않아 런타임 crash가 발생한다. APG 명세와 코드의 언어가 불일치하여 올바른 패턴을 작성하기 어렵다.
- **Forces**: (1) Identity 14개 필드에 축 데이터가 산재 → config/handler/aria-* 이중 번역 (2) handler를 import하고 대응 config를 안 넣어도 컴파일 통과 → pit of failure (3) APG는 Roles/States/Keyboard 3섹션인데 코드는 이 구조와 안 맞음. 제약: 31개 role 파일 + primitives + engine 전부 수정 필요.
- **Decision**: composePattern(identity, required[], keyMap) 3인자 + 축 인스턴스가 config+handler+auto-aria 소유. 기각: Builder 패턴(LLM 체인 순서 실수), 단일 객체(가독성 하락), 현재 variadic(pit of failure).
- **Non-Goals**: auto-ARIA 완전 구현 (별도 PRD), UI 레이어/pages 변경, plugin keyMap 구조 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | LLM이 새 APG 패턴을 구현하려 한다 | role 파일을 작성한다 | Identity는 {role, childRole}만, 축은 required[]에, 키는 keyMap에 — APG 3섹션과 1:1로 읽힌다 | |
| S2 | 축 handler(sel.toggle)를 keyMap에 넣었다 | required[]에 해당 축(sel)을 안 넣었다 | 런타임 에러가 즉시 발생한다 (silent failure 아님) | |
| S3 | 축 인스턴스(sel)를 만들었다 | handler도 거기서 꺼낸다 (sel.toggle, sel.keys) | config와 handler가 같은 변수에서 나와서 분리 불가능 | |
| S4 | navigate도 축이다 | required[]에 nav를 넣는다 | createPatternContext에 base 하드코딩 0, merge만 수행 | |
| S5 | 기존 role 파일을 새 형태로 변환한다 | 31개 파일을 기계적으로 변환한다 | 기존 테스트 전부 통과, 동작 변경 없음 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `composePattern` 시그니처 | `(identity, required[], keyMap)` 3인자. variadic 제거 | |
| `Identity` 타입 축소 | `{ role, childRole, panel? }` — 14필드→3필드. focus는 navigate 인자 | |
| `AxisInstance` 타입 | axis config(entities, middleware, ctxFactory, visibilityFilter) + handlers + keys preset + `__sym` 런타임 검증용 심볼 | |
| `navigate()` 축 함수 | `navigate('vertical'\|'horizontal'\|'both'\|'activedescendant'\|'natural')` — focusStrategy 소유. handlers: next, prev, first, last, parent, child, nextWrap, prevWrap | |
| `selected()` 리팩토링 | config + handlers(toggle, extendNext/Prev/First/Last, selectAndAnchor, extendToFocused) + keys/clickKeys preset | |
| `expanded()` 리팩토링 | config + handlers(toggle, expandOrFocusChild, collapseOrFocusParent, set) | |
| `checked()` 리팩토링 | config + handlers(toggle) | |
| `popup()` 신규 | `popup('menu'\|'listbox'\|'dialog', opts?)` — config + handlers(open, close, openOrActivate, openFirstOrFocusNext, openLastOrFocusPrev) + triggerKeys + visibilityFilter 소유 | |
| `value()` 신규 | `value({ min, max, step })` — config + handlers(increment, decrement, incrementBig, decrementBig, setToMin, setToMax) | |
| `grid()` 신규 | `grid(columns)` — config + handlers(focusNextCol, focusPrevCol, focusFirstCol, focusLastCol, tabCycleNext, tabCyclePrev, focusRow) | |
| `createPatternContext` 단순화 | base 하드코딩 제거. focusedId+visibleNodes 계산 후 ctxFactory merge만 | |
| `activate` standalone | 축이 아닌 순수 이벤트. handler로 직접 import 유지 | |
| `AriaPattern` 타입 축소 | Identity에서 이관된 필드 제거 (selectionMode, expandable, valueRange, colCount, popupType, focusStrategy 등) | |
| 31개 role 파일 변환 | 새 3인자 형태로 기계적 변환. 동작 변경 없음 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `navigate('vertical')` 호출 | — | nav 인스턴스 반환 | APG focus management = 축. roving/activedescendant/natural은 패턴 결정 | `{ next, prev, first, last, parent, child, nextWrap, prevWrap, ...axisConfig }` | |
| `selected('multiple')` 호출 | — | sel 인스턴스 반환 | aria-selected 상태 변화 = 축. mode+followFocus+attribute는 축 옵션 | `{ toggle, extendNext, ..., keys, clickKeys, ...axisConfig }` | |
| `expanded()` 호출 | — | exp 인스턴스 반환 | aria-expanded 상태 변화 = 축 | `{ toggle, set, expandOrFocusChild, collapseOrFocusParent, ...axisConfig }` | |
| `checked()` 호출 | — | chk 인스턴스 반환 | aria-checked 상태 변화 = 축 | `{ toggle, ...axisConfig }` | |
| `popup('menu')` 호출 | — | pop 인스턴스 반환 | aria-haspopup+expanded = 복합 축 | `{ open, close, openOrActivate, openFirstOrFocusNext, openLastOrFocusPrev, triggerKeys, ...axisConfig }` | |
| `value({min,max,step})` 호출 | — | val 인스턴스 반환 | aria-valuenow/min/max 상태 변화 = 축 | `{ increment, decrement, incrementBig, decrementBig, setToMin, setToMax, ...axisConfig }` | |
| `grid(columns)` 호출 | — | g 인스턴스 반환 | 2D focus variant. colCount 필수 | `{ focusNextCol, ..., tabCycleNext, tabCyclePrev, focusRow, ...axisConfig }` | |
| `composePattern(identity, [nav,sel], keyMap)` | identity = `{role, childRole}` | AriaPattern 반환 | 3인자: Roles/States/Keyboard = APG 1:1 | required의 axisConfig 합성된 AriaPattern | |
| `composePattern(basePattern, [newAxes], overrideKM)` | basePattern = AriaPattern | base.required + newAxes merge, base.keyMap + overrideKM merge | 데코레이터: 기존 패턴 유지 + 필요한 것만 추가/override | base 기반 확장된 AriaPattern | |
| `composePattern(basePattern, [], {Enter: custom})` | basePattern = AriaPattern | keyMap만 override, 축 추가 없음 | 키 하나만 바꿀 때. 빈 required = 축 추가 없음 | base + Enter만 교체 | |
| `sel.toggle` keyMap에 넣고 required에 sel 누락 | composePattern 실행 | 런타임 에러 throw | handler.__sym과 required[].__sym 매칭 실패 | Error("handler requires axis not in required") | |
| `activate` 직접 import | — | 정상 동작 | 순수 이벤트, __sym 없음 → 검증 skip | keyMap에 포함 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 같은 축 2번 `[sel1, sel2]` | required에 동일 축 중복 | 설정 충돌 = 버그 | 런타임 에러: "duplicate axis type" | Error | |
| 복합 handler (treegrid arrowRight = exp+grid) | role 로컬 함수 | role-specific 조합은 closure로. __sym 없음 → 검증 skip | 정상 동작 | keyMap에 포함 | |
| handler optional chaining + 축 누락 | required에 축 없음 | __sym 검증이 1차. optional chaining은 2차 안전장치 | 1차 에러. 우회 시 void(no-op) | 에러 또는 void | |
| `panel: 'tabpanel'` + required에 selected 없음 | panel은 구조 결정 | panel 가시성은 축에서 유추. 축 없으면 의미 없음 | 경고 로그. panel 렌더되나 가시성 조건 없음 | 경고 | |
| 데코레이터에서 base와 같은 축 추가 | base에 selected, 데코도 selected | 덮어쓰기 — 데코가 옵션 변경(single→multiple) | 새 축이 base 축 교체 | 새 selected | |
| 비-인터랙티브 role (alert, meter, link) | composePattern 불필요 | 축 없는 role은 plain 객체 | `{ role: 'alert' }` 직접 선언 | plain 객체 | |
| navigate 없이 `[sel]`만 전달 | required에 nav 없음 | navigate = 모든 인터랙티브 패턴의 base. 없으면 focus 불가 | 런타임 에러: "navigate axis required" | Error | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언적 OCP (feedback_declarative_ocp) | ② composePattern 3인자 | ✅ 준수 | — | |
| 2 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 축 이름 selected/expanded/checked | ✅ 준수 | — | |
| 3 | 축은 keyMap 소유 금지 (feedback_axis_no_keymap) | ② 축 인스턴스 handlers | ✅ 준수 — handlers는 capability, 바인딩은 패턴 결정 | — | |
| 4 | Pattern=조립 블록 (feedback_pattern_is_block_not_abstraction) | ③ 데코레이터 override | ✅ 준수 | — | |
| 5 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ④ navigate 필수 | ✅ ��수 | — | |
| 6 | visibilityFilter는 axis/plugin 선언 (feedback_visibility_filter_ocp) | ② popup/expanded가 filter 소유 | ✅ 준수 | — | |
| 7 | 원자적 restructure (feedback_atomic_restructure) | S5 31개 role 변환 | ⚠️ 주의 | 실행 시 원자적 변환 필수 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `composePattern` 시그니처 | 모든 role 파일 + 외부 호출처 깨짐 | 높 | 원자적 전환 (⑤#7) | |
| 2 | `Identity` 타입 | 소비자 전부 수정 | 높 | ② 포함 | |
| 3 | `AriaPattern` 타입 | useAriaView, useControlledAria 등 primitives | 높 | focusStrategy 등 접근 경로 변경 | |
| 4 | `createPatternContext` | base 하드코딩 제거 → navigate ctxFactory 의존 | 중 | navigate 축이 제공 | |
| 5 | standalone handler import | `import { focusNext }` 사용처 | 중 | nav 인스턴스 handler로 교체 | |
| 6 | `useAriaView.getNodeProps` | selectionMode, expandable 등 AriaPattern 필드 의존 | 높 | auto-ARIA 별도 PRD. 과도기: 축 config에서 메타 추출 | |
| 7 | 테스트 파일 | mockCtx, createPatternContext 호출 변경 | 중 | 원자적 변환 | |
| 8 | plugin keyMap | plugin → pattern handler 참조 | 낮 | Non-Goals — 기존 시그니처 유지 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | 점진적 전환 (old+new 공존) | ⑤#7 | 두 형태 공존 → LLM이 구형 학습, 불일치 확산 | |
| 2 | Identity에 축 데이터 남기기 | ⑥#1 | 이중 번역 재발, SSOT 위반 | |
| 3 | handler를 standalone export 유지 | ⑥#5 | 축 없이 handler import 가능 = pit of failure 재발 | |
| 4 | auto-ARIA를 이 PRD에서 구현 | Non-Goals | 범위 초과. 과도기 대응 | |
| 5 | navigate를 선택적 축으로 취급 | ④ navigate 필수 | 인터랙티브 패턴에 focus 필수 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 APG 1:1 | tree role 파일이 `composePattern({role:'tree',childRole:'treeitem'}, [nav,sel,exp], keyMap)` 형태 | Identity 2필드, required에 축 3개, keyMap에 handler — APG 구조와 1:1 | |
| V2 | S2 축 누락 감지 | sel.toggle을 keyMap에 넣고 required에 sel 안 넣음 | 런타임 에러 "handler requires axis not in required" | |
| V3 | S3 인스턴스 소유 | sel.toggle, sel.keys, sel.clickKeys가 sel 인스턴스에서 접근 가능 | 하나의 변수에서 config+handler+preset 전부 획득 | |
| V4 | S4 createPatternContext | navigate ctxFactory가 focusNext/Prev 등 제공, createPatternContext에 하드코딩 0 | ctx.focusNext → nav ctxFactory가 생성한 메서드 | |
| V5 | S5 기존 테스트 | 31개 role 변환 후 기존 통합 테스트 전체 | 전부 통과, 동작 변경 없음 | |
| V6 | ④ 중복 축 | required에 같은 축 타입 2개 전달 | 런타임 에러 "duplicate axis type" | |
| V7 | ④ navigate 필수 | required에 navigate 없이 [sel]만 전달 | 런타임 에러 "navigate axis required" | |
| V8 | ④ 복합 handler | treegrid arrowRight(exp+grid 조합) role 로컬 함수 | __sym 없는 로컬 함수는 검증 skip, 정상 동작 | |
| V9 | ④ 데코레이터 | composePattern(basePattern, [newAxis], overrideKM) | base required + new merge, keyMap override | |
| V10 | ④ 데코레이터 축 교체 | base에 selected('single'), 데코에 selected('multiple') | 새 selected가 base 교체 | |
| V11 | ③ 빈 override | composePattern(base, [], {Enter: custom}) | base 유지 + Enter만 교체 | |

완성도: 🟢

---

**전체 완성도:** 🟢 구현 완료

## 역PRD

| 항목 | 증거 |
|------|------|
| 3인자 시그니처 | `composePattern.ts:141` — `composePattern(config: Identity, required: Axis[], inputMap: KeyMap)` |
| Identity 축소 | `composePattern.ts:7-13` — `{ role, childRole, panel?, ariaAttributes? }` |
| AxisInstance 타입 | `src/interactive-os/axis/types.ts` — `Axis` 타입에 handlers + config 소유 |
| navigate() 축 함수 | `src/interactive-os/axis/navigate.ts:132` — `navigate(type, opts?)` |
| selected()/expanded()/checked() | `axis/select.ts`, `axis/expand.ts`, `axis/checked.ts` — 인스턴스 반환 |
| popup() 축 | `axis/popup.ts` — popup 인스턴스 |
| grid() 축 | `navigate.ts:175` — `grid(columns, opts?)` |
| 31개 role 변환 | `pattern/roles/*.ts` 전부 `composePattern(identity, [axes], keyMap)` 형태 |

#kind/prd #topic/pattern
