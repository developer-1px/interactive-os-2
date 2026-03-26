# Isomorphic Layer Tree — PRD

> Discussion: IA·아키텍처·문서·네이밍·소스코드 폴더 구조의 멘탈 모델을 동일하게 만든다. 하나의 정규 트리(7레이어)가 5개 뷰 전부를 관통하도록 정렬.

## ① 동기

### WHY

- **Impact**: 개발자(자기 자신)가 홈페이지 사이드바, 소스 폴더, 아키텍처 문서, Area 문서, 네이밍을 볼 때마다 다른 분류 체계를 만난다. "같은 것인데 다른 이름"이 인지 부하를 만들고, 새 모듈을 어디에 놓을지 판단이 흐려진다.
- **Forces**: (a) 코드가 v1→v2로 진화했지만 이름·폴더 경계가 v1에 머물러 있음 (b) hooks/·components/는 "React 형태"로 분류, 나머지는 "아키텍처 레이어"로 분류 — 기준이 두 개 (c) 원자적 실행 필수 — 점진적 전환 시 다른 세션이 레거시로 복구함
- **Decision**: 아키텍처 레이어를 SSOT(정규 트리)로 삼고, 폴더·라우트·문서·네이밍을 여기에 정렬. 7레이어: store/engine/plugins/axis/pattern/primitives/ui. axis와 pattern을 분리하는 이유: 개념적으로 "인터랙션 차원(재료)"과 "인터랙션 패턴(완성품)"은 다른 추상화 수준이며, 의존 방향도 pattern→axis 단방향. 기각 대안: (1) 폴더만 두고 라우트·문서만 정렬 → 근본 원인 미해결 (2) axis+pattern 통합(6레이어) → 개념적 차이를 무시, 순환 의존 내재 (3) core/ 유지 → L1+L2+L3 혼재가 동형 원칙 위반
- **Non-Goals**: (1) 외부 API 설계 (현재 소비자 = 자기 자신) (2) 새 기능 추가 — 순수 구조 리팩터 (3) 테스트 로직 변경 — import 경로만 수정

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 개발자가 `listbox` pattern을 찾고 싶다 | 소스 폴더를 탐색한다 | `pattern/listbox.ts`에서 찾는다 — 라우트 `/internals/pattern/`, 문서 `pattern.md`와 같은 이름 | |
| S2 | 개발자가 `navigate` axis를 찾고 싶다 | 소스 폴더를 탐색한다 | `axis/navigate.ts`에서 찾는다 — 라우트 `/internals/axis/`, 문서 `axis.md`와 같은 이름 | |
| S3 | 개발자가 Store 관련 코드를 찾고 싶다 | `store/` 폴더를 연다 | createStore, storeToTree, computeStoreDiff, types가 모두 여기 있다 — engine 코드는 없다 | |
| S4 | 개발자가 Aria 컴포넌트와 관련 hook을 찾고 싶다 | `primitives/` 폴더를 연다 | Aria, useAria, useAriaZone, ariaRegistry가 모두 한 곳에 있다 | |
| S5 | 개발자가 ARCHITECTURE.md를 읽는다 | 레이어 다이어그램을 본다 | L1 store ~ L7 ui — 폴더명과 1:1 대응 | |
| S6 | 다른 세션이 import를 작성한다 | `from '../behaviors/types'` 경로를 쓴다 | 해당 경로가 존재하지 않음 — 빌드 에러로 즉시 발견 | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 정규 트리와 각 투영

### 정규 트리 (폴더 구조)

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `store/` (L1) | `createStore.ts`, `storeToTree.ts`, `computeStoreDiff.ts`, `types.ts` (Entity, NormalizedData, ROOT_ID, TransformAdapter) | |
| `engine/` (L2) | `createCommandEngine.ts`, `dispatchLogger.ts`, `types.ts` (Command, BatchCommand, createBatchCommand, Middleware), `mergeProps.ts`, `useEngine.ts`, `getVisibleNodes.ts` | |
| `plugins/` (L3) | 기존 유지 + `definePlugin.ts` 이동 (core/에서), `types.ts` (Plugin) 이동, `useSpatialNav.ts` 이동 (hooks/에서) | |
| `axis/` (L4) | 현 `axes/` rename. 읽기/view state 전용: navigate, select, activate, expand, dismiss, tab, value. `types.ts` (PatternContext, GridNav, ValueNav, SelectionMode, KeyMap, AxisConfig, StructuredAxis, Axis) | |
| `pattern/` (L5) | 현 `behaviors/` 내 presets + `composePattern.ts` (axes/에서 이동) + `createPatternContext.ts` (rename) + `edit.ts` (axes/에서 이동 — 유일한 쓰기 axis, plugin commands 직접 사용). `types.ts` (AriaPattern, NodeState, FocusStrategy) | |
| `primitives/` (L6) | `components/` 전체 + hooks/ 중 Aria 관련 (useAria, useAriaZone, useAriaView, useControlledAria, useKeyboard, keymapHelpers) | |
| `ui/` (L7) | 기존 유지 | |
| `devtools/` (—) | 기존 유지 | |

### 타입 분리

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `axis/types.ts` | PatternContext, GridNav, ValueNav, SelectionMode, KeyMap, AxisConfig, StructuredAxis, Axis — axis가 계약을 정의, pattern이 구현 | |
| `pattern/types.ts` | AriaPattern (현 AriaBehavior), NodeState, FocusStrategy — pattern의 산출물과 상태 타입 | |
| `composePattern.ts` 이동 | `axes/` → `pattern/` — axis를 받아 AriaPattern을 생산하므로 pattern 레이어 | |

### 네이밍 변경

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `AriaBehavior` → `AriaPattern` | 타입명 rename (33 occurrences, 15 files) | |
| `BehaviorContext` → `PatternContext` | 타입명 rename (152 occurrences, 39 files) | |
| `createBehaviorContext` → `createPatternContext` | 함수명 + 파일명 rename | |
| `switchBehavior` → `switchPattern` | 함수명 rename | |

### 라우트 정렬

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `/internals/axis/*` 유지 | 독립 라우트 그룹 — axis는 별도 레이어(L4) | |
| `/internals/pattern/*` 신규 | pattern presets 라우트 그룹 (L5) | |
| `/internals/components/*` → `/internals/primitives/*` | 라우트 그룹 rename | |
| routeConfig.ts 재구조화 | 7그룹: store, engine, plugin, axis, pattern, primitives + area (meta) | |

### 문서 정렬

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `docs/2-areas/core.md` → 분리: `store.md` + `engine.md` | 문서 분리 | |
| `docs/2-areas/axes.md` → `axis.md` | 단수형 rename | |
| `docs/2-areas/patterns.md` → `pattern.md` | 단수형 rename | |
| `docs/2-areas/hooks.md` → `primitives.md` 통합 | hooks 내용을 primitives.md에 합침 | |
| `ARCHITECTURE.md` 갱신 | 기존 L1~L7 → 새 L1~L7 (store/engine/plugins/axis/pattern/primitives/ui), 이름 정렬 | |
| `PROGRESS.md` 갱신 | 섹션명 정렬 | |
| `naming-dictionary.md` 갱신 | Behavior→Pattern 반영 | |

### uiCategories slug 정규화

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| kebab-case slug → camelCase | `tree-grid` → `treeGrid`, `alert-dialog` → `alertDialog` 등. 프로젝트 규칙(kebab-case 금지) 준수 | |

완성도: 🟡

## ③ 인터페이스

> 이 작업은 UI 인터랙션이 아니라 **구조 리팩터**이므로, 인터페이스 = "import 경로 변환 규칙"

| 입력 (현재 경로) | 행동 | 왜 이 결과가 나는가 | 결과 (새 경로) | 역PRD |
|:---|:---|:---|:---|---|
| `from '../core/types'` (Entity, NormalizedData 등) | store types import | L1 타입은 store에 속함 | `from '../store/types'` | |
| `from '../core/types'` (Command, Middleware 등) | engine types import | L2 타입은 engine에 속함 | `from '../engine/types'` | |
| `from '../core/types'` (Plugin) | plugin type import | L3 타입은 plugins에 속함 | `from '../plugins/types'` | |
| `from '../core/createStore'` | store API import | L1 함수 | `from '../store/createStore'` | |
| `from '../core/createCommandEngine'` | engine API import | L2 함수 | `from '../engine/createCommandEngine'` | |
| `from '../core/definePlugin'` | plugin factory import | L3 함수 | `from '../plugins/definePlugin'` | |
| `from '../behaviors/types'` (PatternContext, SelectionMode 등) | axis 타입 import | 계약 타입은 axis에 | `from '../axis/types'` | |
| `from '../behaviors/types'` (AriaBehavior, NodeState 등) | pattern 타입 import | 산출물 타입은 pattern에 | `from '../pattern/types'` | |
| `from '../behaviors/{preset}'` | preset import | L5 pattern | `from '../pattern/{preset}'` | |
| `from '../axes/{axis}'` | axis import | L4 axis (복수→단수) | `from '../axis/{axis}'` | |
| `from '../axes/composePattern'` | 합성기 import | pattern 레이어로 이동 | `from '../pattern/composePattern'` | |
| `from '../behaviors/createBehaviorContext'` | context factory import | rename + pattern 레이어 | `from '../pattern/createPatternContext'` | |
| `from '../hooks/useAria'` | primitive hook import | L5 = primitives | `from '../primitives/useAria'` | |
| `from '../hooks/useEngine'` | engine hook import | L2 = engine | `from '../engine/useEngine'` | |
| `from '../hooks/useSpatialNav'` | spatial hook import | L3 = plugins | `from '../plugins/useSpatialNav'` | |
| `from '../components/aria'` | Aria component import | L5 = primitives | `from '../primitives/aria'` | |
| `from '../behaviors/createBehaviorContext'` (`getVisibleNodes`) | traversal import | engine 레벨 함수 | `from '../engine/getVisibleNodes'` | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|:---|:---|:---|:---|:---|---|
| axis/와 pattern/을 분리할 때 타입 순환 | 현재 axes/ ↔ behaviors/ 순환 의존 | axis가 계약(PatternContext)을 정의하고 pattern이 구현하면 단방향. Dependency Inversion | axis/types.ts에 계약, pattern/types.ts에 산출물. 순환 0 | | |
| composePattern은 어느 레이어? | 현재 axes/에 위치 | axis를 받아 AriaPattern을 만드는 합성기 — 산출물(AriaPattern)이 pattern 타입이므로 pattern 레이어 | pattern/composePattern.ts | | |
| core/types.ts 3분할 시 순환 의존 | types.ts에 L1+L2+L3 타입 혼재, 의존: L1←L2←L3 | Command.execute(store: NormalizedData)에서 L2가 L1 타입을 참조 | engine/types.ts가 store/types.ts를 import. 역방향 없음 | 순환 없이 분리 | |
| createBatchCommand는 어디에? | core/types.ts 안에 함수+타입 혼재 | BatchCommand는 Command의 합성이므로 L2 | engine/types.ts에 포함 | | |
| mergeProps.ts는 어디에? | core/에 있지만 import 없는 독립 유틸 | 레이어 무관 유틸, 하지만 engine에서 주로 사용 | engine/mergeProps.ts (또는 primitives/ — 실제 소비자 확인 필요) | | |
| 테스트 파일의 import 경로 | `__tests__/` 안에서 `../behaviors/`, `../hooks/` 등 참조 | 테스트도 동일 경로 규칙 | 전수 교체 | | |
| routeConfig에서 axis 개별 항목 | 현재 7개 axis가 `/internals/axis/{name}`으로 라우팅 | axis는 독립 레이어(L4)이므로 독립 라우트 그룹 유지 | `/internals/axis/{name}` (경로 동일, 복수→단수만 변경) | | |
| AppShell.tsx의 `import { toolbar } from './interactive-os/behaviors/toolbar'` | 앱 레이어에서 직접 behavior import | pattern으로 경로 변경 | `from './interactive-os/pattern/toolbar'` | | |
| docs/2-areas/ 하위 폴더 (axes/, patterns/, hooks/ 등) | 현재 문서 하위폴더도 폴더명 불일치 | 정규 트리 투영 | `axis/`, `pattern/`, `primitives/` 등으로 rename | | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|:---|:---|:---|:---|---|
| 1 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 네이밍 변경: createBehaviorContext → createPatternContext | 준수 — 파일명도 함께 rename | — | |
| 2 | kebab-case 금지 (CLAUDE.md) | ② uiCategories slug | 현재 위반 (`tree-grid` 등) → 이번에 해소 | camelCase로 전환 | |
| 3 | ARIA 표준 용어 우선, 자체 이름 발명 금지 (feedback_naming_convention) | ② Pattern 네이밍 | 준수 — "Pattern"은 APG 공식 용어 ("ARIA Design Patterns") | — | |
| 4 | 아키텍처 레이어 = 라우트 그룹 (feedback_layer_equals_route) | ② 라우트 정렬 | 현재 위반 → 이번에 해소 | 7그룹으로 정렬 (axis + pattern 분리) | |
| 5 | rename 시 반드시 git mv (CLAUDE.md) | ② 전체 폴더 이동 | 준수 필수 — macOS case-insensitive 충돌 방지 | git mv 사용 | |
| 6 | 원자적 실행 필수 (feedback_atomic_restructure) | 전체 | 준수 — 단일 세션, worktree 격리 후 일괄 커밋 | — | |
| 7 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ② getVisibleNodes 이동 | 준수 — 레이어 위반 해소가 편의보다 우선 | — | |
| 8 | PROGRESS.md = concept map (feedback_progress_as_concept_map) | ② 문서 갱신 | 섹션명 갱신 필요 | Behavior→Pattern 등 반영 | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|:---|:---|:---|:---|---|
| 1 | 모든 import 경로 (~200+개) | 경로 오타 시 빌드 실패 | 중 | tsc --noEmit으로 전수 검증 | |
| 2 | 테스트 파일 import | 테스트 실패 가능 | 중 | 전체 테스트 스위트 실행으로 검증 | |
| 3 | docs/ 내 코드 예시의 import 경로 | 문서 내 코드가 실제 경로와 불일치 | 낮 | docs/ 내 import 경로도 전수 교체 | |
| 4 | 다른 병렬 세션의 작업 | 진행 중인 세션이 구 경로로 코드 생성 | 높 | 다른 세션 없을 때 실행, worktree 격리 | |
| 5 | CLAUDE.md 내 경로 참조 | 가이드 경로 불일치 | 낮 | CLAUDE.md도 갱신 | |
| 6 | naming-dictionary.md | Behavior 관련 항목 갱신 필요 | 낮 | 스크립트 재실행 또는 수동 갱신 | |
| 7 | git blame 이력 | git mv 시 이력 추적 가능하지만 대규모 이동은 blame 품질 저하 | 낮 | 허용 — 구조 정합성이 이력보다 중요 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|:---|:---|:---|---|
| 1 | 점진적 전환 (일부 폴더만 먼저 이동) | ⑥-4 부작용 | 중간 상태에서 다른 세션이 레거시 복구 | |
| 2 | import 경로 alias/reexport로 우회 | ⑤-7 설계원칙 | 호환성 shim은 레거시를 영속시킴 — 깨끗하게 자르기 | |
| 3 | 로직 변경 (리팩터 + 기능 변경 혼합) | ① Non-Goals | 순수 구조 리팩터, 동작 변경 없음. 테스트가 동일하게 통과해야 함 | |
| 4 | cp + rm 대신 git mv 미사용 | ⑤-5 원칙 | macOS case-insensitive 충돌, 이력 단절 | |
| 5 | types.ts를 분할하지 않고 한 곳에서 reexport | ⑤-7 설계원칙 | 실제 분리 없이 경로만 바꾸면 동형 원칙 위반 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|:---|:---|:---|---|
| V1 | S1 동기 | `pattern/listbox.ts` 파일 존재 확인 | 파일 존재 + export 동일 | |
| V2 | S2 동기 | `axis/navigate.ts` 파일 존재, `axis/` → `pattern/` 의존 없음 확인 | axis가 pattern을 import하지 않음 | |
| V3 | S3 동기 | `store/` 폴더에 engine 코드 없음 확인 | createCommandEngine.ts 부재 | |
| V4 | S4 동기 | `primitives/` 폴더에 useAria + Aria + ariaRegistry 존재 | 전부 존재 | |
| V5 | S5 동기 | ARCHITECTURE.md 레이어명 = 폴더명 | 7레이어, 이름 1:1 대응 | |
| V6 | S6 동기 | `from '../behaviors/types'` 로 import 시 | tsc 빌드 에러 (경로 미존재) | |
| V7 | 경계 | `tsc --noEmit` 통과 | 타입 에러 0 | |
| V8 | 경계 | 전체 테스트 스위트 통과 | 기존 테스트 전부 pass (import 경로만 변경, 로직 동일) | |
| V9 | 경계 | `AriaBehavior` grep 시 결과 0 | 구 이름 완전 제거 | |
| V10 | 경계 | `BehaviorContext` grep 시 결과 0 | 구 이름 완전 제거 | |
| V11 | 경계 | axis/ → pattern/ 방향 의존만 존재, 역방향 0 | grep으로 axis/ 내 `from '../pattern` 검색 결과 0 | |
| V12 | 경계 | routeConfig 라우트 그룹명이 폴더명과 일치 | store, engine, plugin, axis, pattern, primitives | |
| V13 | ⑤-2 원칙 | uiCategories slug에 kebab-case 없음 | 전부 camelCase | |
| V14 | ⑥-3 부작용 | docs/ 내 import 경로가 실제 폴더와 일치 | 불일치 0 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (AI 초안 완료, 사용자 확인 필요)
