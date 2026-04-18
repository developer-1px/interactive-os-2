---
id: 2-areas/engine/prds/engine-layer-hardening-prd
title: 'Engine Layer Hardening — PRD'
created: 2026-04-09
updated: 2026-04-09
summary: 'Discussion: 3-에이전트 엔진 검토에서 도출. 레이어 의존 역전, 정확성 버그, 타입 안전성 갭 7건을 구조적으로 수정한다.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Engine Layer Hardening — PRD

> Discussion: 3-에이전트 엔진 검토에서 도출. 레이어 의존 역전, 정확성 버그, 타입 안전성 갭 7건을 구조적으로 수정한다.

## ① 동기

### WHY

- **Impact**: engine→axis 역방향 의존으로 축 추가 시 useEngine.ts 수정 필수 (OCP 위반). `_execCount` 미초기화로 장시간 사용 시 엔진 정지. Plugin 타입에 `any` 5곳으로 컴파일 타임 검증 불가.
- **Forces**: engine은 axis보다 하위 레이어여야 하지만, axis commands를 하드코딩. useAria(primitives)는 이미 `coreRegistry` 패턴으로 올바르게 구현되어 있어 참조 모델 존재.
- **Decision**: useEngine을 useAria와 동일한 `coreRegistry` 주입 패턴으로 전환. inspect 전용 코드(computeNodeAriaProps, inspectToTree)를 devtools 경계로 분리. 기각 대안: "axis를 engine 아래로 이동" → 전체 레이어 재정의 필요, 과잉.
- **Non-Goals**: engine API 변경 (dispatch/subscribe/inspect 시그니처 유지). 새 기능 추가 없음. Plugin 구조 변경 없음.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | CMS 페이지에서 1,500회 이상 편집 작업 수행 | 다음 키 입력 | command가 정상 dispatch됨 | |
| S2 | 새 axis "placement"를 추가 | engine 디렉토리 파일 확인 | engine 파일 수정 0건 | |
| S3 | middleware가 중첩 dispatch 발생 | 외부 dispatch의 originalType 확인 | 올바른 원본 command 정보 보존 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `engine/useEngine.ts` 수정 | axis import 6줄 제거 → `coreRegistry` 주입으로 전환 | |
| `engine/createCommandEngine.ts` 수정 | `_execCount`를 dispatch당 리셋. `_pendingOriginal`을 스택 구조로 전환. `computeNodeAriaProps` import 제거 → inspect 옵션으로 주입 | |
| `engine/types.ts` 수정 | Plugin.commands/onCopy/onCut/onPaste/onUnhandledKey 타입 강화. buildRegistry 시그니처 타입 안전화. InspectPatternInfo를 engine에서 제거 | |
| `devtools/inspectToTree.ts` (이동) | `engine/inspectToTree.ts` → `devtools/` 이동 | |
| `devtools/computeNodeAriaProps.ts` (이동) | `engine/computeNodeAriaProps.ts` → `devtools/` 이동. engine.inspect()는 외부 주입 함수로 계산 | |
| `engine/defineCommand.ts` 수정 | `as never` 캐스트 제거, 제네릭 타입으로 교체 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `useEngine({ data, plugins })` 호출 | axis commands 내장 | registry를 `coreRegistry`에서 구축 | useAria가 이미 coreRegistry 패턴 사용 중 — 동일 패턴 적용 | axis import 0건, coreRegistry 1건 import | |
| engine.dispatch() 호출 (매 dispatch) | `_execCount` 누적 | dispatch 진입 시 카운터 리셋 | 루프 감지는 단일 dispatch 체인 내에서만 유효 | 1000회/dispatch 제한, 수명 제한 없음 | |
| middleware가 중첩 dispatch | `_pendingOriginal` 덮어쓰기 | 스택(배열) push/pop | 재진입 시 외부 command 보존 필요 | 각 dispatch 레벨의 original 독립 보존 | |
| engine.inspect() 호출 | computeNodeAriaProps 직접 import | inspect options로 ariaComputer 함수 주입 | ARIA 계산은 pattern 정보 필요 → engine이 아닌 호출자가 제공 | engine은 주입된 함수 호출만 | |
| Plugin 선언 | `commands?: Record<string, (...args: any[]) => Command>` | 제네릭 타입으로 교체 | any는 잘못된 payload를 컴파일 타임에 잡지 못함 | `commands?: Record<string, CommandCreator>` | |
| `buildRegistry(sources)` 호출 | `Record<string, any>[]` duck-typing | `CommandDefinitionSet[]` 타입 | 'type' in creator 런타임 체크를 컴파일 타임으로 이동 | 타입 불일치 시 컴파일 에러 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| middleware가 3단 중첩 dispatch | _pendingOriginal 유실 | 각 레벨이 독립적 원본 추적 필요 | 3개 모두 올바른 originalType 보존 | 스택 depth 3 → 0 정상 해소 | |
| dispatch 999회 후 1회 추가 | 정상 실행 | 루프 감지는 단일 chain 내 기준 | 1000번째도 정상 | _execCount 매번 0에서 시작 | |
| Plugin.commands에 handler 없는 객체 전달 | 런타임 무시 | 타입이 강제하므로 도달 불가 | 컴파일 에러 | registry에 등록 안 됨 | |
| computeNodeAriaProps 없이 inspect() 호출 | N/A (현재 필수) | devtools 미사용 환경에서 번들 제외 가능 | nodeProps/computeNodeProps 필드 undefined | inspect 결과에서 ARIA 섹션 생략 | |
| inspectToTree import 경로 변경 후 기존 테스트 | import 깨짐 | 원자적 이동이므로 동시 수정 | 새 경로로 정상 import | 테스트 통과 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 레이어 의존: store→engine→axis (CLAUDE.md) | ②useEngine 수정 | ✅ 해소 | — | |
| 2 | 선언=등록, 합성 런타임 불변, dispatcher 금지 (feedback_declarative_ocp) | ②③ registry 타입 | ✅ 준수 | — | |
| 3 | OCP≠거대 Record 맵, 파일/함수 단위 분리 (feedback_ocp_not_record_map) | ② buildRegistry | ✅ coreRegistry는 axis/coreCommands.ts에서 파일 단위 수집 | — | |
| 4 | 대규모 rename은 원자적 실행 (feedback_atomic_restructure) | ② inspectToTree/computeNodeAriaProps 이동 | ⚠ 주의 | 단일 세션에서 일괄 실행 필수 | |
| 5 | 증상 패칭 금지, 근본 수정 (feedback_fix_root_not_symptom) | ③ _execCount | ✅ 실행 메커니즘 자체 수정 | — | |
| 6 | 설계 원칙 > 사용자 요구, engine 우회 금지 (feedback_design_over_request) | 전체 | ✅ 준수 | — | |
| 7 | 기존 구현 재활용 (feedback_reuse_existing_impl) | ② useEngine→coreRegistry | ✅ useAria의 기존 패턴 차용 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | DatePicker.tsx — useEngine 사용 | axis commands 주입 방식 변경 필요 | Medium | useEngine API에 coreRegistry 자동 포함 (breaking change 없음) | |
| 2 | PageCms.tsx — useEngine 사용 | 동일 | Medium | 동일 대응 | |
| 3 | use-aria-zone.test.tsx, spatial-cross-boundary.test.tsx | import 경로/사용법 변경 | Low | 테스트 코드 동시 수정 | |
| 4 | AppInspector.tsx — inspectToTree import | import 경로 변경 | Low | devtools/ 경로로 수정 | |
| 5 | engine-inspect.test.ts — inspectToTree + computeNodeAriaProps | import 경로 변경 | Low | 새 경로로 수정 | |
| 6 | plugins/types.ts — engine types re-export | Plugin 타입 시그니처 변경 | Medium | re-export 동시 갱신 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | useEngine 호출자의 API 변경 | ⑥-1,2 | DatePicker/PageCms가 axis commands를 직접 전달하게 만들면 사용자 부담 전가 | |
| 2 | engine.inspect() 시그니처 변경 | ⑤-6 설계 우회 금지 | 기존 devtools 호환성 유지. ariaComputer는 engine 생성 시 options로 주입 | |
| 3 | 점진적 이동 (inspectToTree만 먼저, computeNodeAriaProps는 나중에) | ⑤-4 원자적 실행 | 중간 상태에서 다른 세션이 레거시 경로로 복구할 위험 | |
| 4 | `any`를 `unknown`으로만 바꾸는 것 | ⑤-5 증상 패칭 금지 | unknown도 결국 as 캐스트 필요. 제네릭 + CommandCreator 타입이 근본 해법 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | 엔진 생성 후 dispatch 2,000회 실행 | 전부 정상 처리, 에러 없음 | |
| V2 | ①S1 | 단일 dispatch 내 middleware가 1,001회 재귀 | 루프 감지 경고 출력, 엔진 정지 안 함 | |
| V3 | ①S2 | `pnpm check:deps` 실행 | engine→axis 의존 0건 | |
| V4 | ①S3 | history middleware가 중첩 dispatch 발생시키는 테스트 | 외부 DispatchEvent.originalType이 올바른 값 | |
| V5 | ④경계4 | inspect()를 ariaComputer 없이 호출 | nodeProps=undefined, computeNodeProps=undefined, 에러 없음 | |
| V6 | ②전체 | `pnpm typecheck` 통과 | 타입 에러 0건 | |
| V7 | ②전체 | `pnpm test` 기존 테스트 전부 통과 | 실패 0건 | |
| V8 | ⑥-4,5 | AppInspector, engine-inspect.test에서 새 경로 import | 정상 동작 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 범위 분리

- `_execCount` 리셋은 **이 PRD 범위**이지만 1줄 수정이므로 Phase 0으로 즉시 실행 가능
- Plugin.useEffect 타입 강화 (dispatch 금지 강제) → 별도 PRD 후보. 현재는 문서 계약으로 충분

## 실행 Phase 권장

| Phase | 내용 | 리스크 | 파일 수 |
|-------|------|--------|---------|
| 0 | `_execCount` dispatch당 리셋 + `_pendingOriginal` 스택 | Low | 1 |
| 1 | inspectToTree + computeNodeAriaProps → devtools/ 이동 | Low | 5 |
| 2 | useEngine axis import 제거 → coreRegistry 주입 | High | 6 |
| 3 | Plugin/buildRegistry 타입 강화 + defineCommand as never 제거 | Medium | 3 |

#kind/prd #topic/engine
