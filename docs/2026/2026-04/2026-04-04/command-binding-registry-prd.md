---
id: 2-areas/engine/prds/command-binding-registry-prd
title: 'Command Binding Registry — PRD'
status: active
kind: prd
created: 2026-04-04
updated: 2026-04-08
summary: 'Discussion: 모든 pointer 행동에 이름 있는 커맨드 부여. useCommand 도입 + ariaRegistry 확장 + inspector 양방향 뷰.'
topics: [2-areas]
relates: []
supersedes: []
---
# Command Binding Registry — PRD

> Discussion: 모든 pointer 행동에 이름 있는 커맨드 부여. useCommand 도입 + ariaRegistry 확장 + inspector 양방향 뷰.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: keyMap/clickMap 경유 행동은 이름 있는 Command로 추적·리플레이 가능하지만, ui/pages의 익명 useCallback onClick은 inspector에서 안 보인다. 개발자가 "이 앱에서 가능한 행동 목록"을 파악할 수 없다.
- **Forces**: 모든 상태는 NormalizedData+Command 원칙 vs 빅뱅 마이그레이션 불가 현실. 기존 clickMap 인프라는 축 레벨만 커버.
- **Decision**: useCommand 레이어 도입 — 이름만 먼저 부여하고, 내부 구현은 점진적으로 engine 전환. ariaRegistry 확장으로 바인딩 정보 등록. 기각: 별도 전역 레지스트리(생명주기 중복), engine 내부만(React state 행동 포함 불가).
- **Non-Goals**: 기존 익명 onClick 일괄 마이그레이션. engine 밖 React state의 즉시 NormalizedData 전환.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | inspector 열림 + ListBox 마운트 | 노드 뷰에서 아이템 선택 | 해당 노드의 커맨드 목록 표시 (Click→select:selectAndAnchor 등) | ✅ `bindingRegistry.ts::byNode` + `useAria.ts` 자동 등록 |
| S2 | inspector 열림 + TabGroup 마운트 | 커맨드 뷰에서 'tab:close' 검색 | 바인딩된 엘리먼트(close 버튼) + 이벤트(Click) 표시 | ✅ `bindingRegistry.ts::byCommand` |
| S3 | DatePicker가 익명 onClick으로 changeMonth 호출 | inspector 커맨드 뷰 조회 | changeMonth가 안 보임 = 갭 인식 가능 | ✅ 설계 — 미등록 익명 핸들러는 registry에 없음 |
| S4 | changeMonth를 useCommand('datepicker:changeMonth')로 전환 | inspector 커맨드 뷰 조회 | 'datepicker:changeMonth' → [prevMonth Click, nextMonth Click] 표시 | ✅ `useCommand.ts::useCommand` |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useCommand` hook | `primitives/useCommand.ts` — 이름 있는 커맨드 핸들러 생성. 마운트 시 bindingRegistry에 등록, 언마운트 시 해제 | ✅ `useCommand.ts::useCommand` |
| `bindingRegistry` | `primitives/bindingRegistry.ts` — 전역 Map. `{commandName, nodeId, input}` 튜플. `byNode(id)`, `byCommand(name)` 양방향 조회 | ✅ `bindingRegistry.ts::registerBinding,byNode,byCommand` |
| `InspectResult.bindings` | `engine/types.ts` 확장 — `bindings: BindingEntry[]` 추가 | ✅ `types.ts::BindingEntry,InspectResult.bindings` |
| `composePattern` 자동 등록 | clickMap/keyMap 엔트리를 bindingRegistry에 자동 등록 | ✅ `useAria.ts` DEV useEffect 내 자동 등록 |
| Inspector 바인딩 뷰 | `devtools/inspector/` — 노드→커맨드 뷰 + 커맨드→엘리먼트+이벤트 뷰 | 🔀 트리 변환만 구현(`inspectToTree.ts`), UI 컴포넌트 미구현 |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `useCommand('tab:close', handler, {input:'Click', nodeId})` 마운트 | registry 비어있음 | bindingRegistry에 엔트리 등록 | 이름이 있어야 inspector에서 보인다 | registry에 엔트리 추가 | ✅ |
| 컴포넌트 언마운트 | registry에 엔트리 있음 | 해당 nodeId 바인딩 전부 해제 | 죽은 노드가 남으면 유령 표시 | 엔트리 제거 | ✅ |
| `byNode(id)` | registry에 여러 엔트리 | 해당 노드의 바인딩 목록 반환 | inspector 노드 뷰 조회용 | `[{command, input}...]` | ✅ |
| `byCommand(name)` | registry에 여러 엔트리 | 해당 커맨드의 바인딩 목록 반환 | inspector 커맨드 뷰 조회용 | `[{nodeId, input}...]` | ✅ |
| composePattern clickMap 생성 | 축이 clickKeys 선언 | clickMap 엔트리를 bindingRegistry에 자동 등록 | 기존 clickMap이 마이그레이션 없이 즉시 표시 | registry에 축 바인딩 추가 | ✅ DEV 전용 |
| composePattern keyMap 생성 | 축이 keys 선언 | keyMap 엔트리도 bindingRegistry에 자동 등록 | keyboard/mouse 같은 registry로 커버리지 비교 | registry에 키보드 바인딩 추가 | ✅ DEV 전용 |

> useCommand의 `input` 파라미터는 호출자가 명시한다 (A안). 이벤트에서 자동 추론하지 않는다.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 같은 nodeId로 useCommand 2번 (다른 커맨드) | 첫 엔트리 있음 | 하나의 버튼이 Click+DblClick 등 복수 바인딩 가능 | 둘 다 등록, byNode가 2개 반환 | 엔트리 누적 | ✅ V4 |
| 같은 command+input+nodeId 중복 등록 | 동일 엔트리 존재 | 중복이면 byCommand에 유령 | 덮어쓰기 (idempotent) | 엔트리 1개 유지 | ✅ V5 |
| React strict mode 리렌더 | 이전 엔트리 있음 | 마운트/언마운트 반복 | useEffect cleanup→재등록, 깜빡임 없음 | 동일 엔트리 유지 | ✅ 설계 (useEffect cleanup+멱등) |
| 축 바인딩 + useCommand 공존 | 축 자동 + 수동 바인딩 | 같은 registry에 공존해야 커버리지 비교 | byNode가 축+수동 전부 반환 | 병합된 목록 | ✅ V7 |
| nodeId 없이 useCommand (글로벌 단축키) | — | 라우트 레벨 Mod+S 등도 추적 필요 | nodeId optional, byCommand에서 `{nodeId:null, input}` | 글로벌 엔트리 | ✅ V6 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언=등록, dispatcher 금지 (feedback_declarative_ocp) | ③ useCommand | ✅ 준수 | — | ✅ |
| 2 | 모든 OS 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | ② useCommand | 🟡 부분 | useCommand는 이름만 부여하는 중간 단계. 점진적으로 engine 전환 예정. Non-Goals에 명시 | ✅ DEV 관찰 전용, Non-Goals 범위 |
| 3 | UI 컴포넌트만 노출, primitives 금지 (feedback_ui_over_primitives) | ② useCommand | ✅ 준수 | useCommand는 primitives 내부, ui 컴포넌트가 사용 | ✅ |
| 4 | click도 keyMap처럼 선언적 맵 (feedback_click_map_needed) | ③ composePattern 자동 등록 | ✅ 준수 | 기존 clickMap이 자동으로 registry에 등록 | ✅ |
| 5 | OCP — 확장에 열림 (feedback_axis_pattern_principles) | ② bindingRegistry | ✅ 준수 | 새 바인딩 추가 시 registry 코드 수정 불필요 | ✅ |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | composePattern.ts — splitInputMap 후 등록 로직 추가 | 패턴 생성 성능 미세 영향 | 낮 | DEV 모드에서만 등록 (prod 번들 제외) | ✅ useAria.ts DEV guard 적용 |
| 2 | InspectResult 타입 확장 | 기존 inspector 코드가 새 필드 무시 | 낮 | optional 필드로 추가 | ✅ optional |
| 3 | useAria.ts — getNodeProps에��� clickMap 처리 | 기존 clickMap 동작 변경 없음, 등록만 추가 | 낮 | 등록은 side-effect, 기존 로직 ���변 | ✅ |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | prod 빌드에 bindingRegistry 포함 | ⑥-1 성능 | devtools 전용, tree-shake 대상 | ✅ DEV guard |
| 2 | 기존 clickMap/keyMap 동작 변경 | ⑥-3 | 등록은 부가 효과, 기존 dispatch 경로 불변 | ✅ |
| 3 | 익명 onClick 일괄 마이그레이션 | ① Non-Goals | 빅뱅 금지, 점진적 전환만 | ✅ |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | ListBox 마운트 → byNode(itemId) 호출 | Click→select:selectAndAnchor, Shift+Click→select:extendToFocused 반환 | ✅ `binding-registry.test.ts::returns bindings for a given nodeId` |
| V2 | ①S2 | TabGroup useCommand('tab:close') 등록 → byCommand('tab:close') | [{nodeId: closeBtn, input: 'Click'}] 반환 | ✅ `binding-registry.test.ts::returns all nodes that trigger a command` |
| V3 | ①S4 | useCommand 등록 → 언마운트 → byCommand | 빈 배열 반환 (cleanup 확인) | ✅ `binding-registry.test.ts::removes a specific binding` |
| V4 | ④-1 | 같은 nodeId에 2개 useCommand → byNode | 2개 엔트리 반환 | ✅ `binding-registry.test.ts::accumulates distinct command bindings` |
| V5 | ④-2 | 동일 튜플 중복 등록 → byNode | 1개만 반환 (idempotent) | ✅ `binding-registry.test.ts::ignores duplicate tuples` |
| V6 | ④-5 | nodeId 없이 useCommand('route:save', h, {input:'Mod+S'}) → byCommand | [{nodeId: null, input: 'Mod+S'}] | ✅ `binding-registry.test.ts::supports null nodeId for global shortcuts` |
| V7 | ④-4 | clickMap 자동 등록 + useCommand 수동 등록 → byNode | 축+수동 바인딩 병합 반환 | ✅ `binding-registry.test.ts::byNode returns both axis and manual bindings merged` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
