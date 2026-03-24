# Dispatch Logger — PRD

> Discussion: LLM 디버깅용 dispatch 구조화 로그. DEV 기본 활성, opt-out, delegate 패턴.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | LLM이 버그를 디버깅 중이다. dispatch 흐름이 보이지 않는다 | engine: 에러 시만 console.warn, 정상 흐름 로그 없음 | dispatch가 실행된다 | command.type, payload, store 변경분이 구조화된 한 줄 로그로 출력된다 | console에 `[dispatch #N] type \| payload \| ∆ diff` 형태 출력 | |
| 2 | DEV 환경에서 개발 중이다 | logger: 존재하지 않음 | engine이 생성된다 | logger가 자동으로 활성화된다 | engine 내부에 logger middleware 주입됨 | |
| 3 | 로그 노이즈가 불필요한 상황이다 | logger: DEV 기본 활성 | `{ logger: false }` 옵션을 전달한다 | logger가 비활성화된다 | logger middleware 미주입 | |
| 4 | 커스텀 로그 소비가 필요하다 (테스트 assert 등) | logger: 기본 console delegate | `{ logger: (entry) => ... }` 커스텀 함수를 전달한다 | 커스텀 delegate가 LogEntry를 받는다 | 배열 push 등 외부 소비 가능 | |

상태: 🟢

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| `createCommandEngine(store, mw, onChange, { logger: true })` | logger 미주입 | DEV 환경 | 기본 console delegate로 logger middleware 주입 | 모든 dispatch에 `defaultLogger` 호출 | |
| `createCommandEngine(store, mw, onChange, { logger: false })` | — | 어떤 환경이든 | logger 미주입 | dispatch 시 로그 없음 | |
| `createCommandEngine(store, mw, onChange, { logger: customFn })` | — | 어떤 환경이든 | customFn을 delegate로 logger middleware 주입 | dispatch 시 customFn(LogEntry) 호출 | |
| `createCommandEngine(store, mw, onChange)` (옵션 생략) | — | DEV 환경 | `{ logger: true }`와 동일 | 기본 console delegate 활성 | |
| `createCommandEngine(store, mw, onChange)` (옵션 생략) | — | PROD 환경 | logger 미주입 | dispatch 시 로그 없음 | |
| 일반 Command dispatch | `store: { entities: { __focus__: { focusedId: "a" } } }` | — | LogEntry 생성: seq, type, payload, diff | `[dispatch #1] setFocus \| { target: "b" } \| ∆ __focus__.focusedId: "a" → "b"` | |
| BatchCommand dispatch | `store: { entities: { x: ..., y: ... } }` | command.type === 'batch' | 부모 entry + 자식 entry 각각 생성 | `[dispatch #2] batch(2)` + 들여쓴 자식 로그 | |
| Command.execute가 throw | prev store 유지 (rollback) | error catch 후 | LogEntry에 error 필드 채움, diff 빈 배열 | `[dispatch #N] ERROR type \| "message" \| (rollback)` | |
| Command 실행 결과 store 변경 없음 | `store === prevStore` | referential equality | diff: empty | `(no change)` 표시 | |

상태: 🟢

## 3. 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `LogEntry` 타입 | `{ seq: number, type: string, payload: unknown, diff: StoreDiff[], parent?: number, error?: string }` | `dispatchLogger.ts::LogEntry` |
| `StoreDiff` 타입 | `{ path: string, before: unknown, after: unknown }` 또는 `{ path: string, kind: 'added' \| 'removed' \| 'changed', before?: unknown, after?: unknown }` | `computeStoreDiff.ts::StoreDiff` |
| `Logger` 타입 | `(entry: LogEntry) => void` | `dispatchLogger.ts::Logger` |
| `dispatchLogger.ts` 모듈 | LogEntry, Logger, EngineOptions 타입 + defaultLogger + isBatchCommand. 로깅 로직은 engine 내부에서 executor를 감싸는 형태 | `dispatchLogger.ts` |
| `defaultLogger: Logger` | LogEntry → 구조화 console.log 포맷 변환 | `dispatchLogger.ts::defaultLogger` |
| `computeStoreDiff(prev, next)` | NormalizedData 두 개를 비교하여 StoreDiff[] 반환 | `computeStoreDiff.ts::computeStoreDiff` |
| `EngineOptions` 타입 | `{ logger?: boolean \| Logger }` — createCommandEngine 4번째 인자 | `dispatchLogger.ts::EngineOptions` |

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 빈 store에서 첫 dispatch | `{ entities: {}, relationships: {} }` | 정상 로깅, diff에 added entity 표시 | `∆ entities: +item-1` | |
| 매우 큰 payload (100+ 필드) | payload가 거대 객체 | payload를 JSON.stringify하되 길이 제한 (truncate) | `payload: { ...truncated (142 keys) }` | |
| 중첩 batch (batch 안의 batch) | batch → batch → commands | 재귀적으로 풀어쓰기, 들여쓰기 깊이 증가 | `[dispatch #3.1.2] ...` 형태 | |
| Command.execute가 throw | prev store 유지 | LogEntry에 `error` 필드로 에러 메시지 기록, diff는 빈 배열 | `[dispatch #4] ERROR setFocus \| "Cannot read ..." \| (rollback)` | |
| seq 오버플로 | 수천 번 dispatch | number 자연 증가, 리셋 없음 | seq: 9999+ 정상 | |
| 메타 엔티티 (`__` prefix) 변경 | `__focus__`, `__selection__` 등 | **값 수준** diff 표시 | `∆ __focus__.focusedId: "a" → "b"` | |
| 사용자 엔티티 변경 | `entities.item-1` 변경 | **id 수준** diff 표시 (shallow) | `∆ entities: ~item-1` | |
| 사용자 엔티티 추가/제거 | — | id 수준으로 `+`/`-` 표시 | `∆ entities: +item-4, -item-2` | |
| relationships 변경 | `__root__: ["a","b","c"]` | 배열 diff: 추가/제거된 id 표시 | `∆ __root__: -b` | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | production 번들에 logger 코드 포함 | 번들 사이즈 + 성능. DEV 가드 또는 tree-shaking으로 제거 | |
| 2 | store 전체 덤프 | LLM 컨텍스트 낭비. 변경분만 표시 | |
| 3 | 사용자 엔티티의 deep diff | 노이즈. 사용자 엔티티는 id 수준 shallow, 메타 엔티티만 값 수준 | |
| 4 | logger가 dispatch 흐름에 side-effect | logger는 순수 관찰자. store 변경, 에러 throw 금지 | |
| 5 | 기존 `createCommandEngine` 시그니처 breaking change | 4번째 인자는 optional 객체. 기존 호출부 변경 불필요 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | 커스텀 delegate로 engine 생성 → setFocus dispatch | delegate에 LogEntry 전달됨: seq=1, type="setFocus", diff에 __focus__ 변경 | `dispatch-logger.test.ts::logs single command with seq, type, payload, diff` |
| 2 | batch(removeEntity + setFocus) dispatch | delegate에 3개 entry: parent batch + 2 children, parent는 seq=N, children은 parent=N | `dispatch-logger.test.ts::logs batch with parent (full diff) + children (type/payload only)` |
| 3 | store 변경 없는 command dispatch | diff: [], 기본 포맷에 `(no change)` 표시 | `dispatch-logger.test.ts::logs no-change command with empty diff` + `dispatch-logger.test.ts::formats no-change command` |
| 4 | `{ logger: false }` 옵션 → dispatch | delegate 호출 없음 | `dispatch-logger.test.ts::does not log when logger is false` |
| 5 | 옵션 생략 + DEV 환경 → dispatch | console.log 호출됨 (기본 delegate) | `dispatch-logger.test.ts::formats single command as structured string` |
| 6 | 옵션 생략 + PROD 환경 → dispatch | 로그 없음 | ❌ 테스트 없음 |
| 7 | 메타 엔티티 변경 | diff에 값 수준: `__focus__.focusedId: "a" → "b"` | `dispatch-logger.test.ts::detects meta entity value-level change` |
| 8 | 사용자 엔티티 추가/제거 | diff에 id 수준: `entities: +item-4` | `dispatch-logger.test.ts::detects user entity added` + `dispatch-logger.test.ts::detects user entity removed` |
| 9 | 사용자 엔티티 값 변경 | diff에 id 수준: `entities: ~item-1` (변경됨 표시, 값 미표시) | `dispatch-logger.test.ts::detects user entity changed (shallow)` |
| 10 | Command.execute가 throw → dispatch | LogEntry에 error 필드, diff 빈 배열, 기본 포맷에 `ERROR` + 에러 메시지 표시 | `dispatch-logger.test.ts::logs error command with error field` + `dispatch-logger.test.ts::formats error command` |

상태: 🟢

---

**전체 상태:** 🟢 6/6
