# defineCommand 패턴 도입 (Phase 1: 추상화 벽) — PRD

> Discussion: Command의 execute 분리 → Redux 표준 action/reducer. Phase 1은 인터페이스만 세우고 내부는 .execute() 유지

## ① 동기

### WHY

- **Impact**: axis v3 전환 시 low 변경 → UI 15종+ 전체 깨짐 → 10만 코인 증발. Command가 execute 함수를 소유하여 직렬화/분류/타입안전성 불가. meta/data 구분이 META_COMMAND_TYPES(15 type) + SKIP_META(7 entity ID)로 이중 하드코딩
- **Forces**: Command = self-executing(함수 포함 객체) vs Command = 순수 메시지(직렬화 가능). 현재 history/focusRecovery가 command.execute를 spy하는 middleware 패턴 사용 중 — Phase 1에서 변경 불가
- **Decision**: Redux 표준 action/reducer 분리. defineCommand(=createSlice)로 선언 → action creator 반환 + handler 분리. Phase 1은 defineCommand 내부에서 .execute()를 붙여 하위 호환 유지. 기각: (A) 점진적 전환 → "대규모 restructure는 원자적 실행 필수" 원칙 위반. (B) engine handler registry 먼저 → history spy 패턴 변경 필요, blast radius 과대
- **Non-Goals**: engine handler registry 전환(Phase 2), history/focusRecovery spy 패턴 변경(Phase 2), pattern/primitives/ui 변경 없음, createBatchCommand 호출 사이트 변경 없음

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | axis가 command를 정의해야 함 | defineCommand로 선언 | action creator + handler가 분리되어 반환, 내부에서 .execute() 자동 생성 | |
| S2 | plugin이 여러 command를 그룹으로 정의해야 함 | defineCommands로 선언 | 각 command의 action creator를 key로 접근, handlers는 내부 심볼로 수집 가능 | |
| S3 | 기존 engine이 cmd.execute(store) 호출 | defineCommand로 만든 command를 dispatch | .execute()가 내부에 있으므로 기존 engine 동작 동일 | |
| S4 | useAriaZone이 meta/data를 구분해야 함 | defineCommand에 meta: true 선언 | command.meta로 분기 가능, META_COMMAND_TYPES Set 제거 가능 | |
| S5 | command type을 상수로 참조해야 함 | focus.type | 'core:focus' 문자열 대신 상수 참조, 오타 방지 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `engine/defineCommand.ts` (신규) | `defineCommand`, `defineCommands` 팩토리. Command 타입 확장(meta 플래그) | |
| `engine/types.ts` (수정) | Command에 `meta?: boolean` 추가 | |
| `axis/navigate.ts` (수정) | focusCommands, gridColCommands → defineCommands 전환 (2 사이트) | |
| `axis/select.ts` (수정) | selectionCommands → defineCommands 전환 (5 사이트) | |
| `axis/expand.ts` (수정) | expandCommands → defineCommands 전환 (3 사이트) | |
| `axis/checked.ts` (수정) | checkedCommands → defineCommands 전환 (3 사이트) | |
| `axis/popup.ts` (수정) | popupCommands → defineCommands 전환 (2 사이트) | |
| `axis/value.ts` (수정) | valueCommands → defineCommands 전환 (2 사이트) | |
| `plugins/crud.ts` (수정) | crudCommands → defineCommands 전환 (2 사이트) | |
| `plugins/dnd.ts` (수정) | dndCommands → defineCommands 전환 (5 사이트) | |
| `plugins/rename.ts` (수정) | renameCommands → defineCommands 전환 (3 사이트) | |
| `plugins/clipboard.ts` (수정) | clipboardCommands → defineCommands 전환 (7 사이트) | |
| `plugins/search.ts` (수정) | searchCommands → defineCommands 전환 (3 사이트) | |
| `plugins/combobox.ts` (수정) | comboboxCommands → defineCommands 전환 (4 사이트) | |
| `plugins/spatial.ts` (수정) | spatialCommands → defineCommands 전환 (2 사이트) | |
| `plugins/workspaceStore.ts` (수정) | workspaceCommands → defineCommands 전환 (7 사이트) | |

**수정 없음:** engine/createCommandEngine.ts, pattern/\*, primitives/\*, ui/\*, plugins/history.ts, plugins/focusRecovery.ts

완성도: 🟢

## ③ 인터페이스

### defineCommand API

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `defineCommand(type, { meta, create, handler })` | 함수 정의 시점 | action creator 함수 반환 | Redux createAction 패턴 — 선언과 사용 분리 | creator 함수 + `.type` + `.handler` 속성 | |
| `creator(...args)` 호출 | — | `{ type, payload, meta, execute }` 반환 | create()로 payload 생성 + handler를 execute로 래핑 (Phase 1 호환) | Command 객체 (기존 engine 호환) | |
| `creator.type` 접근 | — | type 리터럴 문자열 반환 | const assertion으로 좁은 타입 — 오타 방지 + 타입 내로잉 | `'core:focus'` 등 리터럴 | |
| `creator.handler` 접근 | — | handler 함수 반환 | Phase 2에서 engine registry 수집용 | `(store, payload) => store'` | |

### defineCommands API (그룹)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `defineCommands({ name: { type, meta, create, handler } })` | 함수 정의 시점 | 각 name에 대한 action creator 객체 반환 | 현재 `xxxCommands.yyy()` 호출 패턴 유지 | `{ setFocus: creator, ... }` | |
| `commands.name(...args)` | — | 개별 defineCommand와 동일 | 각 entry가 독립된 defineCommand | Command 객체 | |

### 전환 전후 소비자 호환성

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `focusCommands.setFocus('n1')` | 전환 전후 동일 | `{ type, payload, meta, execute }` 반환 | defineCommands가 내부에서 execute 생성 | 소비자 코드 변경 없음 | |
| `engine.dispatch(cmd)` | Phase 1 변경 없음 | `cmd.execute(store)` 호출 | engine은 execute 존재를 전제 | 동일 동작 | |

### 타입 안전성

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `defineCommand<P>` 제네릭 | — | create 반환 타입으로 P 추론 | TS가 create에서 payload 타입 추론 — 별도 선언 불필요 | handler payload = P | |
| type에 const assertion | — | `.type`이 리터럴 타입 | 넓은 string이 아니라 좁은 리터럴 | `creator.type: 'core:focus'` | |

### 위임 패턴 (self-reference)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `select(id)` → `selectRange([id])` 위임 | 현재 selectionCommands 내부 자기참조 | defineCommands 밖에서 별도 sugar 함수 | defineCommands 내 자기참조 불가 — sugar는 독립 함수 | `export const select = (id) => selectionCommands.selectRange([id])` | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| handler가 store 불변 반환 (copy 등 side-effect only) | execute가 같은 store 반환 | copy는 모듈 버퍼에만 쓰고 store 불변 — 현재와 동일 | handler가 store 그대로 반환, execute도 동일 | store 변경 없음 | |
| create 인자 0개 (clearAnchor 등) | payload 없는 command | 인자 없는 command 다수 — create 생략 시 payload=undefined | create 생략 가능, handler는 `(store) => store'`로 동작 | payload undefined | |
| 같은 type을 두 번 defineCommand | 발생하면 안 됨 | type은 global unique, 중복은 설계 오류 | Phase 2에서 engine registry가 경고. Phase 1은 검증 없음 | — | |
| batch 안에 meta/data 혼재 | zone이 batch를 split | meta 플래그가 command에 내재하므로 기존 split 로직이 `.meta`로 전환 | batch 내 각 command의 `.meta`로 분리 | meta→viewState, data→engine | |
| history middleware가 cmd.execute spy | `{ ...cmd, execute: spy }` 패턴 | Phase 1에서 execute 존재, spy 정상 동작 | 기존과 동일 — Phase 2에서 별도 해결 | 변경 없음 | |
| plugin이 같은 type command intercept (zodSchema→paste) | keyMap 레벨 override | defineCommand는 command 생성만, intercept는 keyMap/middleware 레벨 | 영향 없음 — intercept 메커니즘 불변 | 변경 없음 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 대규모 restructure는 원자적 실행 필수 (feedback_atomic_restructure) | ② 전체 | 준수 — big-bang + worktree 격리 | — | |
| P2 | 선언적 OCP: 선언=등록, switch-case 금지 (feedback_declarative_ocp) | ③ defineCommand | 준수 — 선언=등록 일체화 | — | |
| P3 | 표준 용어 우선, 자체 이름 발명 금지 (feedback_naming_convention) | ② 네이밍 | 준수 — defineCommand는 definePlugin과 프로젝트 내 일관성 우선. Redux createAction보다 범위가 넓음(handler 포함) | — | |
| P4 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ③ plugin 전환 | 준수 — defineCommands는 command만, keyMap은 plugin 소유 | — | |
| P5 | 축은 keyMap 소유 금지 (feedback_axis_no_keymap) | ③ axis 전환 | 준수 — axis defineCommands는 capability만 | — | |
| P6 | engine 우회 금지 (feedback_design_over_request) | ③ Phase 1 호환 | 준수 — .execute()는 engine 내부 경로 | — | |
| P7 | 네이밍 consistency + aptness (feedback_naming_audit_two_axes) | ② defineCommand | 준수 — definePlugin/defineCommand 일관 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | axis 6파일 xxxCommands export | 반환 타입에 meta 추가 | 낮음 | optional이므로 기존 타입 호환 | |
| B2 | plugins 8파일 xxxCommands export | 동일 — meta 추가 | 낮음 | optional 호환 | |
| B3 | useAriaZone META_COMMAND_TYPES Set | `cmd.meta`로 교체하면 primitives 1줄 수정 | 낮음 | Phase 1에 포함 — `META_COMMAND_TYPES.has(cmd.type)` → `cmd.meta === true` 한 줄 교체. 인터페이스 변경 아닌 분기 조건 변경 | |
| B4 | 테스트에서 inline command 생성 | `{ type, execute }` 직접 생성 시 meta 없음 | 중간 | 테스트도 xxxCommands 사용하도록 전환 | |
| B5 | history/focusRecovery spy 패턴 | `{ ...cmd, execute }` spread 시 meta 자동 복사 | 낮음 | 영향 없음 | |
| B6 | Command 인터페이스에 meta 추가 | 기존 직접 생성 코드 타입 에러 없이 통과 | 낮음 | optional이므로 하위 호환 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | engine/createCommandEngine.ts 수정 | ⑥ Phase 1 범위 | dispatch는 cmd.execute(store) 유지 — Phase 2까지 금지 | |
| F2 | history/focusRecovery spy 패턴 수정 | ⑥B5 | spy 패턴은 Phase 1에서 동작 — Phase 2에서 별도 설계 | |
| F3 | pattern/ · ui/ 파일 수정 | ① Non-Goals | command를 쓰기만 하는 레이어 — 영향 없음 | |
| F4 | defineCommand 없이 `{ type, execute }` 직접 생성 (신규) | ⑤P2 선언적 OCP | 이후 모든 command는 defineCommand로만 생성 | |
| F5 | type 문자열 직접 비교하는 새 코드 | ⑤P2 | creator.type 상수 참조. 기존 비교(history 등)는 Phase 1 유지 | |
| F6 | create에서 side-effect | ③ 인터페이스 계약 | create는 순수 payload 생성만, side-effect는 handler에서 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | defineCommand('core:focus', { meta, create, handler }) 호출 | action creator 반환. .type === 'core:focus', .handler 존재 | |
| V2 | ①S1 | creator('node-1') 호출 | { type, payload: { id: 'node-1' }, meta: true, execute } 반환 | |
| V3 | ①S2 | defineCommands({ setFocus, setColIndex }) 호출 | 각 key에 action creator | |
| V4 | ①S3 | defineCommand 산출 command를 engine.dispatch에 전달 | cmd.execute(store) 정상 실행, store 업데이트 | |
| V5 | ①S4 | meta: true command의 .meta 확인 | command.meta === true | |
| V6 | ①S4 | meta 미선언(data) command의 .meta 확인 | command.meta === undefined | |
| V7 | ①S5 | focusCommands.setFocus.type 접근 | 'core:focus' 리터럴 타입 | |
| V8 | ④ create 0인자 | create 생략 defineCommand | creator()가 payload: undefined 반환 | |
| V9 | ④ batch 혼재 | createBatchCommand([metaCmd, dataCmd]) | 각 command에 .meta 유지 | |
| V10 | ④ spy 호환 | { ...cmd, execute: spy } spread | meta 필드 자동 복사 | |
| V11 | ⑥B3 | useAriaZone cmd.meta === true 분기 | META_COMMAND_TYPES Set 제거 후 동일 동작 | |
| V12 | ① 전체 | 전환 후 pnpm test | 전체 통과 | |
| V13 | ① 전체 | 전환 후 pnpm typecheck | 통과 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. **동기 ↔ 검증**: S1~S5 모두 V1~V13으로 커버 ✅
2. **인터페이스 ↔ 산출물**: defineCommand.ts 신규 + 14파일 수정 = ③ 계약과 일치 ✅
3. **경계 ↔ 검증**: 6개 경계 → V8~V11로 커버 ✅
4. **금지 ↔ 출처**: F1~F6 모두 ⑤/⑥에서 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 0건 ✅
