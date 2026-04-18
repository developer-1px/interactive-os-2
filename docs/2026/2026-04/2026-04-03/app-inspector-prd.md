---
id: 1-projects/viewer/prds/app-inspector-prd
title: 'App Inspector — PRD'
status: active
kind: prd
created: 2026-04-03
updated: 2026-04-08
summary: 'Discussion: engine.inspect()로 앱의 capability(keyMap, commands, schema, state)를 직렬화 데이터로 노출하고, devtools UI로 출력'
topics: [1-projects]
relates: []
supersedes: []
---
# App Inspector — PRD

> Discussion: engine.inspect()로 앱의 capability(keyMap, commands, schema, state)를 직렬화 데이터로 노출하고, devtools UI로 출력

## ① 동기

### WHY

- **Impact**: 개발자가 특정 라우트에서 "이 앱이 뭘 할 수 있는가"를 파악하려면 코드를 뒤져야 함. keyMap은 plugin별 분산, registry는 클로저 내부, schema는 정적 import — 런타임 capability를 한 곳에서 볼 수 없음
- **Forces**: engine의 "모든 동작 = 직렬화 가능 데이터" 철학 vs registry/keyMap이 클로저에 갇혀있는 현실. 기존 engine 인터페이스 변경은 최소화해야 함
- **Decision**: engine.inspect()가 core + plugin extras를 합성 반환. 각 plugin이 inspect() 옵셔널 메서드로 자기 데이터를 직렬화. 기각: schema를 engine 밖에서 별도 import → SSOT 분산
- **Non-Goals**: ComponentInspector 확장(DOM 레벨 뷰), 정적 리포트/문서 생성

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | CMS 라우트(`/`)에서 앱이 동작 중 | devtools에서 App Inspector를 열면 | 등록된 모든 commands, 합성된 keyMap, 현재 store state가 직렬화된 데이터로 표시됨 | ✅ 일치 |
| S2 | zodSchema 플러그인이 활성화된 앱 | App Inspector를 열면 | extras에 zodSchema의 nodeSchemas, childRules 요약이 표시됨 | ✅ 일치 (+rootTypes 추가 필드) |
| S3 | history 플러그인이 활성화된 앱 | command 실행 후 Inspector를 보면 | extras에 undo/redo 스택 크기가 표시됨 | ✅ 일치 |
| S4 | 플러그인 없이 bare engine만 사용 | App Inspector를 열면 | core(commands, keyMap, state)만 표시, extras는 빈 객체 | ✅ 일치 |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `Plugin.inspect` | Plugin 인터페이스에 `inspect?: () => Record<string, unknown>` 옵셔널 메서드 추가 | ✅ `engine/types.ts::Plugin.inspect` |
| `CommandEngine.inspect` | `{ commands: string[], keyMap: Record<string, string>, plugins: string[], state: NormalizedData, extras: Record<string, Record<string, unknown>> }` 반환 | ✅ `engine/types.ts::InspectResult` + `engine/types.ts::CommandEngine.inspect` |
| `createCommandEngine` 확장 | options에 keyMap + plugins 수용, inspect()에서 합성 반환 | ✅ `engine/createCommandEngine.ts::inspect` |
| `useEngine` 확장 | 합성된 keyMap을 engine options로 전달 | ✅ `engine/useEngine.ts::mergedKeyMap` |
| `zodSchema.inspect()` | `{ schemas: string[], childRules: Record<string, 'collection'\|'slot'> }` 반환 | ✅ `plugins/zodSchema.ts::inspect` (+rootTypes 추가) |
| `history.inspect()` | `{ undoCount: number, redoCount: number }` 반환 | ✅ `plugins/history.ts::inspect` |
| `inspectToTree` | inspect() 결과를 TreeView용 NormalizedData로 변환. `storeToInspectorTree`와 동일 패턴 | ✅ `engine/inspectToTree.ts::inspectToTree` |
| `AppInspector` UI | `src/devtools/inspector/AppInspector.tsx` — engine.inspect() → inspectToTree → TreeView 렌더링 | ✅ `devtools/inspector/AppInspector.tsx::AppInspector` |

⚠️ PRD에 없지만 구현됨:
- `renderInspectorItem.tsx` — PageStoreInspector에서 추출한 공유 렌더러 (/simplify에서 중복 제거)
- `useAriaZone.ts` / `useControlledAria.ts` — CommandEngine.inspect 인터페이스 준수 패치
- `definePlugin.ts` — inspect 필드 패스스루

완성도: 🟢

## ③ 인터페이스

### A. Engine API

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `engine.inspect()` 호출 | engine에 registry, keyMap, plugins 등록됨 | core + extras 합성 반환 | engine이 capability의 SSOT — 자기가 아는 모든 것을 직렬화 | 상태 변경 없음 (순수 읽기) | ✅ 일치 |
| plugin에 `inspect()` 없음 | extras 합성 시 | 해당 plugin은 extras에서 생략 | inspect는 옵셔널 — 없으면 기여할 데이터가 없는 것 | extras에 해당 키 없음 | ✅ 일치 |

### B. Inspector UI (읽기 전용 TreeView)

| 입력 | 행동 | 왜 이 결과가 나는가 | 역PRD |
|------|------|-------------------|-------|
| ↑↓ | 포커스 이동 | TreeView 기본 navigate | ✅ TreeView 위임 |
| ←→ | expand/collapse | TreeView 기본 expand | ✅ TreeView 위임 |
| Home/End | 첫/마지막 노드 | TreeView 기본 | ✅ TreeView 위임 |
| Tab | inspector 밖으로 이동 | 단일 탭스톱 | ✅ TreeView 위임 |
| 클릭 | 노드 포커스 + toggle | TreeView 기본 | ✅ TreeView 위임 |
| Enter/Escape/Space | N/A | 읽기 전용 — activate/select 없음 | ✅ plugins=[] |

완성도: 🟢

## ④ 경계

| 극단 조건 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 역PRD |
|----------|------------------------|----------|-------|
| plugin 0개 bare engine | axis commands만으로 동작 | commands = axis 기본, keyMap = {}, plugins = [], extras = {} | ✅ `options?.keyMap ?? {}` |
| inspect() 반복 호출 | 순수 읽기 — 부작용 없음 | 매번 현재 스냅샷, 캐싱 없음 | ✅ 매번 새 객체 생성 |
| plugin.inspect() 에러 throw | 하나의 오류가 전체를 깨뜨리면 안 됨 | 해당 extras에 `{ error: message }`, 나머지 정상 | ✅ try/catch 에러 격리 |
| store 빈 상태 | 초기화 직후에도 inspect 가능 | state = 빈 NormalizedData, commands/keyMap 정상 | ✅ 구조적으로 보장 |
| keyMap 같은 키 복수 plugin | 현재 plugin 순서대로 override | inspect는 최종 합성 결과만 표시 | ✅ last-write-wins |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언=등록, 합성 런타임 불변 (`feedback_declarative_ocp`) | ② Plugin.inspect | ✅ 준수 | — | ✅ 일치 |
| 2 | 모든 OS 상태는 NormalizedData+Command (`feedback_all_state_normalized_command`) | ② inspect 반환값 | ✅ 준수 | 상태가 아닌 읽기 전용 메타데이터 스냅샷 | ✅ 일치 |
| 3 | UI → ui/ 기존 완성품 사용 (CLAUDE.md) | ② AppInspector | ✅ 준수 | TreeView 사용 | ✅ 일치 |
| 4 | pages에서 useAria 직접 사용 금지 (CLAUDE.md) | ② AppInspector | ✅ 준수 | devtools 도메인, TreeView 충분 | ✅ 일치 |
| 5 | engine 우회 금지 (`feedback_design_over_request`) | ③ engine API | ✅ 준수 | 인터페이스 확장 | ✅ 일치 |
| 6 | 읽기가 기본 (`feedback_readonly_default`) | ③ inspect | ✅ 준수 | 순수 읽기 | ✅ 일치 |

⚠️ 역PRD에서 추가 발견: `style={}` 금지 원칙 위반 — renderInspectorItem.tsx. 단 기존 PageStoreInspector에서 추출한 코드이며 devtools 영역.

완성도: 🟢

## ⑥ 부작용

| # | 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|----------------|-----------|--------|------|-------|
| 1 | `CommandEngine` 인터페이스 | inspect() 추가 — 반환 타입 확장 | 낮 | 기존 코드 깨지지 않음 | ✅ useAriaZone/useControlledAria 패치 완료 |
| 2 | `EngineOptions` 타입 | keyMap, plugins 옵셔널 필드 추가 | 낮 | 기존 호출 영향 없음 | ✅ 옵셔널이라 무영향 |
| 3 | `Plugin` 인터페이스 | inspect 옵셔널 추가 | 낮 | 기존 plugin 정상 동작 | ✅ 옵셔널이라 무영향 |
| 4 | `useEngine` | keyMap을 engine options로 전달 추가 | 중 | 기존 동작 유지, 추가 전달만 | ✅ 마운트 시 1회 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | inspect()에서 store 변경 | ⑤#6 | 순수 읽기 함수 | ✅ store 읽기만 |
| 2 | inspect 결과 캐싱/메모이제이션 | ④ 경계 | 항상 현재 스냅샷 반환, stale 방지 | ✅ 매번 새 객체 |
| 3 | plugin.inspect() 에러 전파 | ④ 경계 | 하나의 오류가 전체를 깨뜨리면 안 됨 | ✅ try/catch 격리 |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | CMS 앱에서 engine.inspect() 호출 | commands에 axis+plugin 전부, keyMap 합성, state 현재 store | ❌ 테스트 없음 |
| V2 | ①S2 | zodSchema 활성 상태에서 inspect | extras.zodSchema에 schemas + childRules | ❌ 테스트 없음 |
| V3 | ①S3 | history 활성, command 실행 후 inspect | extras.history.undoCount ≥ 1 | ❌ 테스트 없음 |
| V4 | ①S4 | plugin 없는 bare engine에서 inspect | commands = axis 기본, extras = {} | ❌ 테스트 없음 |
| V5 | ④ 에러 격리 | plugin.inspect()가 throw | 해당 extras에 { error }, 나머지 정상 | ❌ 테스트 없음 |
| V6 | ④ 빈 상태 | 빈 store로 inspect | state = 빈 NormalizedData, commands/keyMap 정상 | ❌ 테스트 없음 |
| V7 | ② UI | AppInspector TreeView 렌더링 | commands/keyMap/state/extras가 트리 노드로 표시 | ❌ 테스트 없음 |

완성도: 🔴

---

**전체 완성도:** 🟢 7/8 (⑧ 검증 테스트 미작성)

### 교차 검증

1. **동기 ↔ 검증**: S1~S4 → V1~V4 ✅
2. **인터페이스 ↔ 산출물**: inspect() 반환 타입 일치 ✅
3. **경계 ↔ 검증**: 에러 격리(V5), 빈 상태(V6) ✅
4. **금지 ↔ 출처**: 3개 모두 ④/⑤ 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 없음 ✅
