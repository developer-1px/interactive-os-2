---
id: 2-areas/engine/prds/engine-handler-registry-prd
type: prd
slug: engineHandlerRegistry
title: 'Engine Handler Registry (defineCommand Phase 2) — PRD'
tags: [untagged]
created: 2026-03-29
updated: 2026-04-08
summary: 'Discussion: Command에서 .execute() 제거 → 순수 메시지 + engine registry lookup + .reduce() direct API + middleware getStore() 단순화'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Engine Handler Registry (defineCommand Phase 2) — PRD

> Discussion: Command에서 .execute() 제거 → 순수 메시지 + engine registry lookup + .reduce() direct API + middleware getStore() 단순화

## ① 동기

### WHY

- **Impact**: Command가 self-executing이라 직렬화/로깅/replay 불가. middleware가 spy 패턴({...cmd, execute: spy})으로 불필요하게 복잡. Phase 1에서 추상화 벽을 세웠지만 .execute()가 남아있어 action/reducer 분리가 불완전.
- **Forces**: handler가 Command 객체의 closure에 묶여있음 ↔ engine이 type으로 handler를 찾아야 순수 메시지가 됨. defineCommand의 creator.handler가 이미 노출되어 있지만 engine이 아직 활용하지 않음. 제약: defineCommand API(호출부) 변경 불가, 기존 테스트 전통과, batch 패턴 유지.
- **Decision**: Engine이 plugin.commands에서 handler를 수집하여 registry 구축 → executor가 registry lookup으로 실행. Direct 호출 경로는 creator.reduce()로 대체. 기각: B(전부 dispatch 전환 — 직접 변환이 정당한 용도), C(global registry — side-effect 의존 = 테스트 격리 깨짐).
- **Non-Goals**: useAriaZone의 applyMetaCommand 구조 변경 (이미 switch-case로 동작, 별도 과제). 새로운 command 추가. axis v3 전환.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | defineCommand로 선언된 command가 있다 | engine.dispatch(cmd)를 호출한다 | engine이 cmd.type으로 registry에서 handler를 찾아 store를 변환한다 | |
| S2 | 직접 store 변환이 필요하다 (workspace 헬퍼, 테스트) | creator.reduce(store, ...args)를 호출한다 | handler가 store에 직접 적용되어 새 store를 반환한다 | |
| S3 | history middleware가 undo/redo를 처리한다 | Mod+Z를 누른다 | middleware가 getStore()로 before/after를 캡처하고, spy 패턴 없이 동작한다 | |
| S4 | batch command를 dispatch한다 | createBatchCommand([cmd1, cmd2])를 dispatch한다 | engine이 sub-command 각각을 registry lookup으로 순차 실행한다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `engine/types.ts` 수정 | Command에서 execute 제거: `{ type, payload?, meta? }`. BatchCommand에서 execute 제거. createBatchCommand은 순수 메시지만 반환 | |
| `engine/defineCommand.ts` 수정 | creator가 execute 없는 순수 메시지 반환 + `creator.reduce(store, ...args)` static method 추가 | |
| `engine/createCommandEngine.ts` 수정 | plugins에서 handler registry(Map<string, handler>) 구축 + executor가 registry lookup. batch는 sub-command 순차 lookup | |
| `plugins/history.ts` 수정 | spy 패턴 제거 → getStore() before/after. `history:__restore`를 defineCommand로 전환 (diffs+direction을 payload로) | |
| `plugins/focusRecovery.ts` 수정 | spy 패턴 제거 → getStore() before/after | |
| `plugins/workspaceStore.ts` 수정 | 헬퍼 함수에서 .execute() → .reduce() 전환 (6곳) | |
| `ui/TabGroup.tsx` 수정 | .execute() → .reduce() 전환 | |
| `ui/Workspace.tsx` 수정 | .execute() → .reduce() 전환 | |
| `ui/Combobox.tsx` 수정 | .execute() → .reduce() 전환 | |
| 테스트 파일들 수정 | .execute() → .reduce() 전환 (30+곳) | |

완성도: 🟢

## ③ 인터페이스

> 비-UI 리팩토링: API 계약 수준으로 서술

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `engine.dispatch(cmd)` | cmd = `{ type, payload, meta }` (execute 없음) | executor가 `registry.get(cmd.type)` lookup → handler(store, payload) | handler가 registry에 분리 저장되어 있으므로 Command에 execute가 필요 없다 | store 변환됨, middleware 정상 동작 | |
| `creator.reduce(store, ...args)` | 직접 store 변환 필요 | create(args) → payload → handler(store, payload) → new store | dispatch chain 없이 순수 함수 변환. 테스트/헬퍼에서 engine 없이 사용 | new store 반환 | |
| `createBatchCommand([cmd1, cmd2])` | batch 메시지 생성 | `{ type: 'batch', commands: [cmd1, cmd2] }` 반환 (execute 없음) | engine executor가 batch type을 인식하고 sub-command 순차 lookup | — (메시지만 생성) | |
| batch dispatch | executor가 batch 수신 | sub-commands를 순차 reduce: `commands.reduce((s, c) => registry.get(c.type)(s, c.payload), store)` | 각 sub-command의 handler가 registry에 있으므로 순차 적용 가능 | 모든 sub-command 적용된 store | |
| history middleware가 command 수신 | command가 middleware chain 통과 | `before = getStore()` → `next(command)` → `after = getStore()` → diff | getStore()가 engine의 store를 직접 참조하므로 spy wrapping 불필요 | diff 기록, command는 수정되지 않음 | |
| `history:undo` dispatch | past에 diff가 있다 | middleware가 intercept → `history:__restore` command 생성 (payload: { diffs, direction }) → next()로 전달 | __restore handler가 registry에 등록되어 applyDelta 실행 | store 복원, future에 diff push | |
| unknown type dispatch | registry에 없는 type | executor가 handler를 못 찾음 | 등록되지 않은 command는 실행할 수 없다 | error log, store 불변 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| registry에 없는 command type | engine에 해당 plugin 미등록 | 누락된 handler 실행 시 silent corruption보다 명시적 실패가 안전 | console.warn + store 불변 (no-op) | store 변경 없음 | |
| 빈 batch command | commands: [] | 빈 배열 reduce는 초기값(store) 반환 | store 불변 반환 | store 변경 없음 | |
| nested batch (batch 안의 batch) | batch 안에 batch sub-command | 재귀적으로 sub-commands를 풀어야 정확한 순차 실행 | executor가 재귀적으로 batch 풀어서 순차 lookup | 모든 leaf command 적용 | |
| middleware가 command를 replace | history가 undo → __restore로 교체 | middleware는 command를 수정하지 않고 새 command를 next()로 전달 | __restore가 registry lookup으로 실행 | 정상 동작 | |
| creator.reduce에 잘못된 인자 | TypeScript 타입으로 보호 | 타입 안전성이 런타임 에러를 방지 | 컴파일 에러 | — | |
| handler가 throw | handler 내부 에러 | executor의 기존 try-catch가 store를 prev로 롤백 | error log + store 불변 | store 롤백 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | meta: true는 core:* axis commands만 (feedback) | ② history:__restore | 아니오 — __restore는 meta 아님, data mutation (store 복원) | — | |
| 2 | 선언적 OCP: 선언=등록, 합성 런타임 불변 (feedback) | ② registry 구축 | 아니오 — plugin.commands 선언이 곧 registry 등록. engine은 순회만 | — | |
| 3 | defineCommand API 유지 (제약) | ② defineCommand.ts | 아니오 — 호출부(axis, plugins)는 변경 없음. 반환값에서 execute만 제거 | — | |
| 4 | 원자적 실행 (feedback_atomic_restructure) | 전체 | 아니오 — worktree 격리 + 한 번에 전환 | — | |
| 5 | 설계 원칙 > 사용자 요구 (feedback) | ② middleware 변경 | 아니오 — getStore() 패턴이 더 원칙적 (spy = 우회) | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | history middleware spy 패턴 | getStore() 전환 시 타이밍 차이 가능? — 아니오, middleware chain은 동기적이므로 next() 전후의 getStore()는 정확 | 낮 | 허용 | |
| 2 | focusRecovery middleware spy 패턴 | 동일 — 동기적 chain이라 getStore() 전환 안전 | 낮 | 허용 | |
| 3 | UI 컴포넌트 (.execute() 사이트) | .reduce()로 기계적 전환. 동작 동일 | 낮 | 허용 | |
| 4 | 테스트 코드 (30+곳) | 대량 수정이지만 기계적. cmd.execute(store) → creator.reduce(store, args) | 중 | worktree 격리 + 전수 전환 | |
| 5 | dispatchLogger — batch 로깅 | isBatchCommand 체크가 `command.type === 'batch'`이면 execute 유무 무관 | 낮 | 허용 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | plugin commands에 meta: true 붙이지 않는다 | ⑤ #1 | Phase 1 교훈 — useAriaZone 라우팅이 바뀜 | |
| 2 | defineCommand 호출부(axis, plugins) 시그니처를 변경하지 않는다 | ⑤ #3 | Phase 1에서 전환 완료된 호출부를 다시 건드리면 안 됨 | |
| 3 | middleware에서 command.execute()를 호출하지 않는다 | Phase 2 핵심 | .execute()가 제거되므로 존재하지 않음 | |
| 4 | global side-effect registry를 만들지 않는다 | discussion 기각안 C | 테스트 격리 깨짐 | |
| 5 | unknown command type에 silent pass하지 않는다 | ④ 경계 #1 | 누락 handler는 console.warn으로 명시적 알림 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | dispatch(focusCommands.setFocus('a')) — engine이 registry lookup으로 실행 | store에 __focus__.focusedId = 'a' | |
| V2 | S2 | focusCommands.setFocus.reduce(store, 'a') — direct 변환 | 동일한 store 결과, dispatch chain 미경유 | |
| V3 | S3 | history undo/redo — getStore() before/after로 diff 캡처 | undo가 정상 동작, spy 패턴 없음 | |
| V4 | S4 | createBatchCommand([cmd1, cmd2]) dispatch — execute 없는 batch | 두 command 모두 registry lookup으로 순차 실행 | |
| V5 | 경계 #1 | 등록되지 않은 command type dispatch | console.warn + store 불변 | |
| V6 | 경계 #3 | nested batch dispatch | 재귀적으로 풀어서 모든 leaf command 실행 | |
| V7 | 경계 #6 | handler가 throw하는 command dispatch | store 롤백 + error log | |
| V8 | ② | Command 인터페이스에 execute가 없음 | TypeScript 컴파일 시 cmd.execute 접근 = 타입 에러 | |
| V9 | 전체 | 기존 1193+ 테스트 전부 통과 | .reduce() 전환 후 동작 동일 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. **동기 ↔ 검증**: S1~S4 → V1~V4 매핑 완료 ✅
2. **인터페이스 ↔ 산출물**: 7개 API 계약이 산출물과 1:1 대응 ✅
3. **경계 ↔ 검증**: 6개 경계 중 핵심 4개(V5~V8) 커버 ✅
4. **금지 ↔ 출처**: 5개 금지 모두 ⑤/④/discussion에서 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 없음 ✅

## 역PRD

| 항목 | 증거 |
|------|------|
| handler registry | `createCommandEngine.ts:1` — PRD 참조 주석, `:82` — `registry.get(command.type)` |
| Command.execute 제거 | `engine/types.ts` — `.execute` grep 0건 |
| creator.reduce() | `engine/defineCommand.ts` — `.reduce()` static method |
| history spy 제거 | `plugins/history.ts` — getStore() before/after 패턴 |
| batch registry lookup | `createCommandEngine.ts` — sub-command 순차 registry lookup |

#kind/prd #topic/engine
