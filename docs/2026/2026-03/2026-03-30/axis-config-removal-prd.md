---
id: 2-areas/axis/prds/axis-config-removal-prd
type: prd
slug: axisConfigRemoval
title: 'AxisConfig 제거 — PRD'
tags: [expanded-id]
created: 2026-03-30
updated: 2026-04-08
summary: 'Discussion: AxisConfig 19필드가 v2 운반체 잔재. 축이 플래그를 설정하고 useAria가 해석하는 중간 해석 계층 = OCP 위반.'
legacy:
  status: active
  kind: prd
  topics: [2-areas, expanded_id]
  relates: []
  supersedes: []
---
# AxisConfig 제거 — PRD

> Discussion: AxisConfig 19필드가 v2 운반체 잔재. 축이 플래그를 설정하고 useAria가 해석하는 중간 해석 계층 = OCP 위반.

## ① 동기

### WHY

- **Impact**: 축을 추가하거나 수정할 때마다 AxisConfig 필드 추가 → composePattern의 applyAxisConfig 수정 → AriaPattern 필드 추가 → useAria의 if 분기 추가. 4곳 동시 변경 필수. 열린 확장 불가.
- **Forces**: v2에서 축=번들(keyMap+config)이었을 때 AxisConfig는 자연스러운 전달체. v3에서 축=capability로 바뀌었지만 config 구조만 잔존. useAria/useAriaView/useAriaZone/composePattern 4파일이 소비자라 원자적 변경 필수.
- **Decision**: AxisConfig 삭제. 축이 entities 선언/middleware/visibilityFilter를 직접 제공. useAria는 합성만. 기각 대안: (A) init 함수 방식 — 비선언적, 합성 어려움. (C) 현행 유지 — OCP 위반 방치.
- **Non-Goals**: AriaPattern 인터페이스 전면 재설계 (이번은 AxisConfig 제거만). Identity 구조 변경 (별도 백로그).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | expand가 필요한 패턴 | expandConfig()를 composePattern에 전달 | __expanded__ entity가 store에 초기화되고, visibilityFilter가 순회에 적용됨 | |
| S2 | selection이 필요한 패턴 | selectConfig()를 composePattern에 전달 | __selection__ entity 초기화, anchorResetMiddleware 합성 | |
| S3 | click 선택이 필요한 패턴 | clickMap에 Click: selectAndAnchor 선언 | 클릭 시 선택됨. selectOnClick 플래그 없이 동작 | |
| S4 | activationFollowsSelection이 필요한 패턴 | activationFollowsSelectionMiddleware()를 축에서 제공 | focus→selection→activation 체인이 middleware만으로 동작 | |
| S5 | 새 축 추가 | 새 entities/middleware/visibilityFilter 제공 | useAria 코드 변경 0. composePattern 변경 0 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `axis/types.ts` 수정 | AxisConfig 삭제. Axis 타입: `{ keyMap, entities?, middleware?, visibilityFilter? }`. EntityDecl 타입 추가 | |
| `axis/select.ts` 수정 | selectConfig() → entities 선언 반환 | |
| `axis/expand.ts` 수정 | expandConfig() → entities 선언 반환 | |
| `axis/activate.ts` 수정 | activateConfig() 삭제. activateOnClick handler 추가 | |
| `axis/popup.ts` 수정 | popup entities 선언 추가 (config-only 함수 신설 또는 패턴이 직접 선언) | |
| `axis/checked.ts` 수정 | checked entities 선언 추가 (config-only 함수 신설) | |
| `pattern/composePattern.ts` 수정 | mergeAxisConfigs/applyAxisConfig 삭제. collectEntities 추가. Identity 슬림화 | |
| `pattern/types.ts` 수정 | AriaPattern에서 플래그 필드 제거, `requiredEntities` 추가 | |
| `primitives/useAria.ts` 수정 | entity 초기화 분기 → requiredEntities 순회. legacy click 경로 삭제 (clickMap으로 완전 이관) | |
| `primitives/useAriaView.ts` 수정 | expandTracking/expandable/checkOnClick 플래그 참조 → requiredEntities 또는 entity 존재 체크로 교체 | |
| `primitives/useAriaZone.ts` 수정 | activationFollowsSelection 플래그 분기 삭제 (middleware로 이관) | |
| 패턴 roles 12파일 수정 | config 플래그 → clickMap + entities 선언으로 교체 (tree, tabs, tabsManual, radiogroup, radiogroupActivedescendant, toolbar, disclosure, menu, menuButton, menuActivedescendant + misc: spatial, navlist) | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| expandConfig() | config: { expandTracking: true } + visibilityFilter | `{ keyMap: {}, entities: [{ id: EXPANDED_ID, default: { expandedIds: [] } }], visibilityFilter }` | 축이 entity를 선언하면 useAria가 해석 불필요 | composePattern이 entities 수집, AriaPattern.requiredEntities에 저장 | |
| selectConfig({ mode, selectionFollowsFocus }) | config 플래그 + middleware | `{ keyMap: {}, entities: [{ id: SELECTION_ID, default: { selectedIds: [] } }, { id: SELECTION_ANCHOR_ID, default: {} }], middleware }`. selectionMode는 Identity에서 선언 | middleware가 동작 결정. 플래그 중복 제거 | middleware만으로 동작 | |
| checkedConfig() (신설) | checked() v2 번들의 config 부분 | `{ keyMap: {}, entities: [{ id: CHECKED_ID, default: { checkedIds: [] } }] }` | expand와 동일 패턴 | entity 초기화 보장 | |
| popupConfig() (신설) | popup() v2 번들의 config 부분 | `{ keyMap: {}, entities: [{ id: POPUP_ID, default: { isOpen: false, triggerId: '' } }], visibilityFilter: popupVisibilityFilter }` | popup도 entity + visibilityFilter 필요 | 동일 패턴 | |
| activateConfig() | config: { activateOnClick, expandOnParentClick } | **삭제**. 패턴이 직접 Click handler 선언. expand 동작은 ctx.activate() 내부에서 처리 | click은 clickMap SSOT. config 플래그 불필요 | activateConfig() export 제거 | |
| 패턴 clickMap 선언 | selectOnClick/activateOnClick 플래그 | `Click: selectAndAnchor` 또는 `Click: activateHandler` 등 패턴이 직접 선언 | 선언적 — 무슨 일이 일어나는지 읽을 수 있음 | useAria legacy click 경로 삭제 | |
| activationFollowsSelection | useAria/useAriaZone에서 if 분기 | activationFollowsSelectionMiddleware() — selection 변경 감지 시 engine onChange에서 onActivate 호출하는 middleware | middleware는 이미 축이 제공하는 OCP 메커니즘 | useAria/useAriaZone에서 분기 삭제 | |
| composePattern(identity, ...axes) | mergeAxisConfigs → applyAxisConfig | collectEntities + collectMiddlewares + collectVisibilityFilters. config bag 없음 | 3종류의 선언적 capability만 수집 | AxisConfig 타입 삭제 | |
| useAria engine 초기화 | if (expandTracking) / if (checkedTracking) / if (popupType) 3분기 | `for (e of requiredEntities) if (!store[e.id]) create(e)` 1루프 | 어떤 entity든 동일 메커니즘. 축별 분기 없음 | OCP 달성 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| entity가 이미 store에 존재 (외부 데이터에 __expanded__ 포함) | if (!data.entities[EXPANDED_ID]) 체크 | 외부 store가 이미 expand 상태면 덮어쓰면 안 됨 | requiredEntities 루프에서 존재 체크 유지 — 없을 때만 생성 | 기존 동작 보존 | |
| entities 선언 없는 축 (dismiss = handler만) | Axis에 entities 필드 없음 | 모든 축이 entity를 필요로 하지 않음 | entities가 undefined이면 skip | Axis.entities = optional | |
| 중복 entity ID | 두 축이 같은 ID 선언 | entity ID는 축마다 고유 (EXPANDED_ID, SELECTION_ID 등). 중복은 설계 오류 | 먼저 선언된 것 유지 (idempotent) | 런타임 에러 아님, 조용히 skip | |
| selectionFollowsFocus/activationFollowsSelection 조회 (tabs.selectionFollowsFocus) | AriaPattern에 boolean 필드 | 테스트에서 pattern preset 특성 확인에 사용 | AriaPattern에 조회용 boolean 유지. 동작 분기 아님 — middleware가 동작 담당 | 필드 유지, 의미 변경 (동작→metadata) | |
| legacy click 경로 삭제 후 clickMap 미선언 패턴 | selectOnClick 플래그로 동작 | config 플래그 → clickMap 전환이 누락되면 click 동작 깨짐 | 전환 대상 12패턴을 전수 확인. 전환 누락 = 테스트 실패로 감지 | 전수 확인 + 기존 테스트 커버리지 | |
| onActivate intercept와 clickMap | legacy: 직접 cb.onActivate(id) 호출 | clickMap handler가 ctx.activate() 반환 → dispatchKeyAction 동일 경로로 intercept | click 경로에 dispatchKeyAction 적용 필요 | useAria click dispatch에 intercept 추가 | |
| expandOnParentClick=false (navTree) | config 플래그로 expand 억제 | tree 패턴의 Click handler에서 expand를 안 하면 됨. ctx.activate()가 자식 있으면 expand하므로, expand 없이 activate만 하려면 별도 handler 필요 | activateOnly handler 추가: ctx에서 expand 하지 않는 activate | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언적 OCP: 선언=등록, 중간 해석 계층 금지 (`feedback_declarative_ocp`) | ③ 전체 — config 플래그 → entities/middleware 선언 | ✅ 준수 (이번 변경의 핵심 동기) | — | |
| 2 | 축은 keyMap 소유 금지, capability만 (`feedback_axis_no_keymap`) | ② activateConfig 삭제 | ✅ 준수 — config 함수도 keyMap: {} 반환하므로 keyMap 소유 아님 | — | |
| 3 | click도 keyMap처럼 선언적 맵 필요 (`feedback_click_map_needed`) | ③ selectOnClick/activateOnClick → clickMap | ✅ 준수 — 플래그가 clickMap 선언으로 교체됨 | — | |
| 4 | 원자적 실행 필수 (`feedback_atomic_restructure`) | ② 12패턴 + 4 primitive 동시 변경 | ⚠️ 주의 — 파일 수 많음. 단계별 분리 시 중간 상태에서 깨질 수 있음 | 한 커밋에 원자적 실행. 중간 커밋 금지 | |
| 5 | visibilityFilter는 axis/plugin이 선언, engine은 순회만 (`feedback_visibility_filter_ocp`) | ② expandConfig/popupConfig가 visibilityFilter 제공 | ✅ 이미 준수 — 변경 없음 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | AriaPattern 인터페이스 (pattern/types.ts) | 필드 삭제로 AriaPattern을 직접 읽는 코드가 깨짐 | 중 | 소비자 전수 확인: useAria, useAriaView, useAriaZone, useControlledAria, useTreeView, AppShell, 테스트 | |
| 2 | pattern roles 12파일 + misc 2파일 | config 플래그 → clickMap 전환. 기존 click 동작이 미세하게 달라질 수 있음 | 높 | 기존 APG conformance 테스트 + pointer-interaction 테스트로 회귀 감지 | |
| 3 | composePattern 시그니처 (Axis 타입 변경) | Axis를 직접 구성하는 외부 코드 (kanbanPreset, AppShell, 테스트) | 중 | Axis.config → Axis.entities 전환. config만 썼으면 entities로 교체 | |
| 4 | activateConfig() 삭제 | 이 함수를 import하는 4패턴 (tree, menu, menuButton, menuActivedescendant) | 중 | import 제거 + clickMap 선언으로 교체 | |
| 5 | activationFollowsSelection → middleware 이관 | useAria/useAriaZone의 engine onChange 콜백에서 분기 제거 | 높 | middleware가 동일 동작을 보장하는지 테스트로 검증 (selection-follows-focus.test.tsx) | |
| 6 | ctx.activate()와 expandOnParentClick 분리 | 현재 ctx.activate()가 내부에서 expand 포함. expandOnParentClick=false 시 별도 처리 필요 | 중 | activateOnly handler 또는 ctx.activate({ expand: false }) 옵션 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | 중간 커밋 (일부만 전환) | ⑤#4 원자적 실행 | composePattern은 Axis.config를 읽는데 패턴은 entities를 보내면 → 불일치 | |
| 2 | clickMap 없이 legacy click 경로 삭제 | ⑥#2 | click 동작이 사라짐. 12패턴 전수 전환 후에만 삭제 가능 | |
| 3 | activationFollowsSelection 플래그 삭제 (동작+조회 동시) | ⑥#5, ④ 조회 경계 | 테스트가 `tabs.activationFollowsSelection`로 조회. 동작 분기만 제거, 필드는 metadata로 유지 | |
| 4 | requiredEntities에 init 함수 넣기 | discuss 결정: 선언적 B 방식 | 선언 = data, 함수 = 부작용. 합성/디버깅 어려움 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | expandConfig() 사용 패턴(tree)에서 노드 expand/collapse | __expanded__ entity 초기화됨. ArrowRight expand, ArrowLeft collapse 동작 | |
| V2 | S2 | selectConfig() 사용 패턴(listbox)에서 Space 토글 선택 | __selection__ entity 초기화됨. Space로 select 동작 | |
| V3 | S3 | Click: selectAndAnchor 선언 패턴에서 클릭 | 노드 선택됨. Shift+Click 범위 선택, Mod+Click 토글 | |
| V4 | S4 | tabs 패턴에서 ArrowRight | focus 이동 → selection 변경 → onActivate 호출 (middleware 체인) | |
| V5 | S5, ④경계1 | 외부 데이터에 __expanded__ 포함된 상태로 마운트 | 기존 expand 상태 보존. 덮어쓰지 않음 | |
| V6 | ④경계5 | tree Click → select + expand on parent | clickMap handler가 select + anchor. 부모 노드면 expand toggle도 실행 | |
| V7 | ④경계6 | navTree (expandOnParentClick=false) Click | select만, expand 안 함. onActivate 호출됨 | |
| V8 | ④경계4 | tabs.selectionFollowsFocus 조회 | boolean 값 존재. true | |
| V9 | S5 | 가상: 새 축이 entities + middleware 제공 | useAria 코드 변경 없이 entity 초기화 + middleware 합성 동작 | |
| V10 | ⑥#2 | 기존 pointer-interaction 테스트 전체 | 모든 click 동작 회귀 없음 | |
| V11 | ⑥#5 | selection-follows-focus 테스트 전체 | activationFollowsSelection 동작 보존 | |

완성도: 🟢

---

**전체 완성도:** 🟢 구현 완료

## 역PRD

| 항목 | 증거 |
|------|------|
| AxisConfig 삭제 | `AxisConfig` grep 결과 0건 — 완전 제거 |
| entities 선언 | `src/interactive-os/axis/types.ts` — `EntityDecl`, `CtxFactory` 타입 존재 |
| composePattern 변경 | `composePattern.ts:148` — `collectEntities(required)` |
| requiredEntities | `composePattern.ts:163+` — AriaPattern에 entities 합성 |
| clickMap 이관 | `composePattern.ts` — `splitInputMap`으로 keyMap/clickMap 분리 |
| 축 middleware | `src/interactive-os/axis/select.ts` — `ctx.selected.*` namespace |
