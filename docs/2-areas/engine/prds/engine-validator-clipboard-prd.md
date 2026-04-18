---
id: 2-areas/engine/prds/engine-validator-clipboard-prd
title: 'Engine Validator + Clipboard NormalizedData 수렴 — PRD'
status: active
kind: prd
created: 2026-04-11
updated: 2026-04-12
summary: 'Discussion: clipboard를 NormalizedData 연산으로 수렴시키고, validator를 engine 기본 레이어로 내려서 모든 mutation command가 자동 검증되게 한다. zod는 validator를 engine에 등록하는 플러그인 역할.'
topics: [2-areas]
relates: []
supersedes: []
---
# Engine Validator + Clipboard NormalizedData 수렴 — PRD

> Discussion: clipboard를 NormalizedData 연산으로 수렴시키고, validator를 engine 기본 레이어로 내려서 모든 mutation command가 자동 검증되게 한다. zod는 validator를 engine에 등록하는 플러그인 역할.

## ① 동기

### WHY

- **Impact**: 파일 밑에 파일이 붙는 등 구조 위반이 clipboard paste 외 경로(DnD, CRUD)에서 무방비. 구조 무결성이 플러그인 미들웨어에 갇혀 있어 보호 범위가 좁다.
- **Forces**: store는 순수 데이터여야 하고(레이어 제약), 모든 mutation은 command 경유(불변량), zod 직접 의존은 피해야 함(범용성). 이 세 힘이 "검증을 어디에 둘 것인가"를 결정한다.
- **Assets**: `deriveCanAccept`/`deriveCanDelete` 로직(zodSchema.ts), `collectSubtree`/`insertClipboardEntry`(clipboard.ts), engine middleware 체인, `EngineEvent` 구독 시스템.
- **Decision**: validator를 engine command 파이프라인에 넣는다. store 연산 레벨이 아닌 command 레벨 — 모든 mutation이 command 경유하므로 실질 차이 없고, store 순수성 유지. 기각: store 함수에 validator 인자 추가 — store 시그니처 오염, 테스트에서도 validator를 신경써야 함.
- **Non-Goals**: reject UI 피드백(shake, toast 등)은 다음 사이클. 기존 clipboard의 native clipboard 연동(serialize/deserialize)은 구조 변경 없이 유지.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | zod childRules에서 file은 children 불가 | file 노드에 paste 시도 | paste 거부, store 변경 없음, CommandResult.ok = false | ✓ `zodSchema.ts:73-150` validator + `createCommandEngine.ts:136-169` runValidators. 전용 유닛 테스트 없음(회귀만) |
| S2 | zod childRules 없이 engine 사용 (뷰어 모드) | 아무 mutation command 실행 | validator 없으므로 전부 통과 (기존 동작 보존) | ✓ `createCommandEngine.ts:136` validators optional, `definePlugin.ts:39` |
| S3 | section에 card를 copy → 다른 section에 paste | paste 실행 | NormalizedData 버퍼에서 subtree 추출 → 대상 section에 merge | ✓ `clipboard.ts:272` copy→extractSubtree, `:340` paste→mergeSubtree |
| S4 | DnD로 card를 file 노드 안으로 이동 | dnd:moveTo command 실행 | validator가 거부, 이동 안 됨 | ✓ 구조적 보장(`MUTATION_PREFIXES`에 `dnd:` 포함, `createCommandEngine.ts:137`). 전용 테스트 없음 |
| S5 | crud:create로 file 안에 새 노드 생성 시도 | childRules에서 file은 leaf | validator가 거부, 생성 안 됨 | ✓ 구조적 보장(`crud:` prefix). 전용 테스트 없음 |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ValidatorFn` 타입 | `(store: NormalizedData, command: Command) => CommandResult` — engine이 호출하는 함수 시그니처 | ✓ `engine/types.ts:94` |
| `CommandResult` 타입 | `{ ok: true; store: NormalizedData } \| { ok: false; reason: string }` — dispatch 반환값 | ✓ `engine/types.ts:89-91` discriminated union |
| `PluginConfig.validator` 필드 | `definePlugin`에 validator 슬롯 추가. 플러그인이 등록하면 engine이 mutation command 실행 전 호출 | ✓ `definePlugin.ts:26,60`, `engine/types.ts:198` |
| `engine.dispatch` 반환 타입 변경 | `void` → `CommandResult` | ✓ `engine/types.ts:70`, `createCommandEngine.ts:256` `return _lastResult` |
| `extractSubtree(store, nodeIds)` | store에서 서브트리를 NormalizedData로 추출. clipboard.ts의 `collectSubtree` 승격 | ✓ `store/createStore.ts:133-157` |
| `mergeSubtree(store, subtree, parentId, index?)` | NormalizedData 서브트리를 store에 병합. clipboard.ts의 `insertClipboardEntry` 승격 | ✓ `store/createStore.ts:170-187` (+ `insertSubtreeNode` helper) |
| clipboard 버퍼 → `NormalizedData` | `ClipboardEntry[]` 제거, 버퍼를 `NormalizedData`로 교체 | ✓ `plugins/clipboard.ts:22-23` 모듈 변수. `ClipboardEntry`/`collectSubtree`/`insertClipboardEntry` 완전 제거 |
| `zodSchema` 플러그인 리팩토링 | middleware 패턴 → `validator` 필드 등록 패턴. `deriveCanAccept`/`deriveCanDelete` → `ValidatorFn` 팩토리로 변환 | ✓ `plugins/zodSchema.ts:73-150` validator 함수. middleware/intercepts 삭제. ⚠ payload mutation(canAcceptFn 주입) 발견 — handoff의 "남은 것" 항목으로 이월 |

완성도: 🟢

## ③ 인터페이스

### validator 등록 (Plugin → Engine)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `zodSchema({ childRules, rootTypes })` 플러그인 등록 | engine에 validator 없음 | definePlugin의 validator 필드를 engine이 수집 | 플러그인 등록 시 engine이 commands/keyMap과 동일하게 validator도 수집하는 통일된 패턴 | engine이 mutation command 실행 전 validator 호출 | ✓ `createCommandEngine.ts:136-169` runValidators, validator 배열 수집 |
| validator 없이 engine 생성 | validator 미등록 | 모든 command가 검증 없이 실행 | validator가 optional이므로 기존 동작 그대로 보존 | 기존과 동일 | ✓ `createCommandEngine.ts:136` optional 체크 |

### clipboard copy (NormalizedData 수렴)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `clipboard:copy` + 선택된 노드 ID들 | store에 노드 존재 | `extractSubtree(store, nodeIds)` → NormalizedData 버퍼에 저장 | 버퍼가 NormalizedData이므로 store 연산 한 번으로 완료. ClipboardEntry 변환 불필요 | clipboardBuffer = NormalizedData, clipboardMode = 'copy' | ✓ `plugins/clipboard.ts:272` copy handler |

### clipboard paste (validator 경유)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `clipboard:paste` + 대상 노드 ID | 버퍼에 NormalizedData 있음 | `findPasteTarget` → `mergeSubtree(store, buffer, targetId)` | validator가 engine 레벨에서 command를 검증. paste command handler는 store 연산만 수행 | 노드가 대상 위치에 삽입됨 | ✓ `clipboard.ts:340,347` paste handler |
| `clipboard:paste` + validator 거부 대상 | 파일 노드에 paste 시도 | engine이 validator 호출 → reject | validator가 childRules로 "file은 children 불가"를 판정 | store 변경 없음, `{ ok: false, reason }` 반환 | ✓ `createCommandEngine.ts:136-164` runValidators 경로, reason 이벤트 방출 |

### dispatch 반환값

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| mutation command + validator 통과 | 유효한 mutation | handler 실행 → store 변경 | validator가 통과시킴 | `{ ok: true, store }` 반환 | ✓ `_lastResult` 추적 + return (`createCommandEngine.ts:184,197,208,256`) |
| mutation command + validator 거부 | 구조 위반 mutation | handler 실행 안 함 | validator가 거부 | `{ ok: false, reason }` 반환, store 불변 | ✓ `createCommandEngine.ts:161-164` early return, dispatch 이벤트에 reason 실음 |
| non-mutation command (focus, select 등) | 어떤 상태든 | validator 거치지 않고 바로 실행 | axis command는 구조 변경이 아니라 view state 변경 | 기존과 동일 | ✓ `MUTATION_PREFIXES` 화이트리스트(`:137`) — `crud:`, `dnd:`, `clipboard:paste/cut/duplicateAfter`만 검증 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 clipboard에서 paste | 버퍼 NormalizedData가 빈 entities/relationships | paste할 대상이 없으므로 no-op이 자연스러움 | store 그대로 반환 | `{ ok: true, store }` (변경 없음) | ✓ mergeSubtree가 빈 subtree에 대해 no-op. 전용 테스트 없음 |
| 복수 validator 등록 (여러 플러그인) | 두 플러그인이 각각 validator 등록 | 복수 validator는 AND 조합 — 하나라도 거부하면 거부. 부분 허용은 모순 | 모든 validator 통과해야 실행 | 첫 거부 시 `{ ok: false }` | ✓ `runValidators`가 배열 순회, 첫 reject 시 early return |
| cut 후 paste → undo | cut으로 원본 제거 + paste로 이동 | history 플러그인이 cut+paste를 하나의 트랜잭션으로 기록해야 undo 시 원본 복구 | undo 시 원본 위치에 노드 복원 | 기존 동작 유지 | ✓ history 플러그인 변경 없음, `clipboard-overwrite` 회귀로 간접 보장 |
| 외부 clipboard에서 paste (deserialize) | OS clipboard 텍스트 → deserialize → NormalizedData 버퍼 | 외부 데이터도 NormalizedData로 변환 후 동일 경로 — validator 자동 적용 | deserialize 성공 → validator 검증 → merge or reject | 유효하면 삽입, 무효하면 거부 | ✓ `setExternalClipboard`가 NormalizedData 그대로 버퍼에 주입 — 내부/외부 경로 통합 |
| BatchCommand 내 일부 command가 validator 거부 | 3개 command 중 2번째가 거부 | 배치 전체가 원자적이어야 — 일부만 실행되면 중간 상태. 전체 거부가 안전 | 배치 내 하나라도 거부 → 전체 거부 | store 불변, `{ ok: false }` | ✓ `runValidators` batch 루프(`:148-155`), 전체 early return. 전용 테스트 없음 |
| validator가 mutation인지 판별 | focus:set 같은 axis command | axis command는 store 구조를 바꾸지 않으므로 검증 불필요. 과잉 검증은 성능 낭비 | mutation command type 목록으로 판별 (crud:create, crud:delete, dnd:move*, clipboard:paste, clipboard:cut) | axis command는 validator skip | ✓ `MUTATION_PREFIXES` 하드코딩(`createCommandEngine.ts:137`) + `meta:true` 스킵. ⚠ ⑦-2 "플러그인 선언 방식" 금지 규칙 위반 — PRD 의도와 다르게 하드코딩됨. handoff 이월 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 모든 상태 NormalizedData+Command (`feedback_all_state_normalized_command`) | clipboard 버퍼가 module-level 변수 | ⚠ 현재 위반 중 — 이번 리팩토링으로 버퍼를 NormalizedData로 교체하지만, module-level 싱글턴 자체는 유지 | clipboard 버퍼를 NormalizedData 타입으로 교체. 싱글턴 패턴은 OS clipboard 모델이므로 허용 (여러 engine이 하나의 OS clipboard를 공유하는 것은 의도된 설계) | |
| 2 | 선언적 OCP / switch 금지 (`feedback_declarative_ocp`) | validator 판별 로직 | ✅ 준수 | validator는 함수 시그니처 주입이므로 분기 없음 | |
| 3 | 거대 Record 금지 (`feedback_ocp_not_record_map`) | mutation command 목록 | ⚠ 주의 | mutation command type을 판별하는 Set이 필요하지만, 각 플러그인이 자기 command를 `mutation: true`로 선언하는 방식으로 분산 | |
| 4 | 데이터 모델 먼저 (`feedback_model_first_state`) | clipboard 버퍼 | ✅ 버퍼가 NormalizedData로 수렴하면 준수 | | |
| 5 | 설계 > 요구 / engine 우회 금지 (`feedback_design_over_request`) | validator를 engine에 넣는 것 자체가 이 원칙의 실현 | ✅ 준수 | | |
| 6 | Plugin = commands + keyMap 소유 (`feedback_axis_pattern_principles`) | clipboard plugin이 keyMap 소유 | ✅ 현재도 준수 (Mod+D). copy/cut/paste는 native event이므로 onCopy/onCut/onPaste로 처리 | | |
| 7 | 오컴의 면도날 (`feedback_occams_razor`) | ClipboardEntry 제거 | ✅ 코드 줄 수 감소 방향 | | |
| 8 | 원자적 리팩토링 (`feedback_atomic_restructure`) | 파일 구조 변경 | ✅ 단일 세션 worktree에서 일괄 실행 | | |
| 9 | 레이어 의존 순서 (CLAUDE.md) | validator는 engine 레이어, store는 순수 유지 | ✅ 준수 | | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `engine.dispatch` 반환 타입 `void` → `CommandResult` | 기존 호출부 타입 에러 | 낮음 | 조사 결과 반환값을 사용하는 호출부 **0건**. 타입만 바뀌고 실동작 영향 없음 | |
| 2 | `zodSchema` 플러그인의 middleware → validator 전환 | PageCms.tsx, PageWriter.tsx의 zodSchema 호출부 | 낮음 | zodSchema의 외부 API(`zodSchema({ childRules, rootTypes })`)는 동일 유지. 내부만 middleware → validator로 변경 | |
| 3 | `clipboardCommands.paste/cut`의 canAccept/canDelete 인자 제거 | zodSchema가 이 인자를 주입하던 미들웨어 소멸 | 중간 | validator가 engine 레벨에서 대체하므로 clipboard command에서 canAccept/canDelete 인자 자체가 불필요. command 시그니처 단순화 | |
| 4 | `cmsSchema.ts`의 `cmsCanAccept`/`cmsCanDelete` 수동 구현 | zodSchema 플러그인으로 통합 가능해짐 | 낮음 | 이번 범위에서는 건드리지 않음. 추후 deprecated 제거 시 정리 | |
| 5 | `cellEdit.ts`의 clipboardCommands 직접 호출 | cellEdit은 cell value 복사(COPY_CELL 등)만 사용 — 구조 mutation이 아님 | 없음 | cell value command는 validator 대상 아님 (entity data 필드 수정이지 트리 구조 변경 아님) | |
| 6 | `useAriaView.ts`의 getSerializedText/setExternalClipboard | serialize/deserialize 흐름은 유지 | 낮음 | 내부 버퍼가 NormalizedData로 바뀌어도 외부 API(getSerializedText, setExternalClipboard)는 동일 시그니처 유지 | |
| 7 | 테스트 4개 (clipboard-overwrite, clipboard-serialize, clipboard-multiselect, spatial-focus-recovery) | ClipboardEntry 제거 + command 시그니처 변경으로 테스트 수정 필요 | 중간 | 테스트 내용(검증 대상)은 동일, 셋업 코드만 수정 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | store 함수(addEntity, moveNode 등)에 validator 인자 추가 | ⑤-9 레이어 순수성 | store는 순수 데이터 연산. 정책(validator)은 engine 레이어 소관 | |
| 2 | mutation command를 하드코딩된 Set으로 판별 | ⑤-3 거대 Record 금지 | 각 플러그인이 자기 command를 `mutation: true`로 선언. engine이 수집 | |
| 3 | clipboard 버퍼를 별도 React Context나 Zustand에 저장 | ⑤-4 별도 상태 레이어 금지 | module-level 싱글턴(OS clipboard 모델)은 유지하되, 타입만 NormalizedData로 교체 | |
| 4 | engine 내부에 clipboard 전용 분기 추가 | ⑤-7 오컴의 면도날 | engine은 범용 validator만 호출. clipboard를 특별 취급하지 않음 | |
| 5 | 점진적 리팩토링 (ClipboardEntry 잔존 + 새 코드 병존) | ⑤-8 원자적 리팩토링 | 한 세션에서 ClipboardEntry 완전 제거. 중간 상태 없음 | |
| 6 | `entriesToStore`를 공개 API로 유지 | ⑥-7 테스트 영향 | 버퍼가 NormalizedData이면 이 변환 함수 자체가 불필요. 제거 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | zod childRules에서 file은 leaf → file 노드에 clipboard:paste | `{ ok: false, reason: "file cannot accept children" }`, store 불변 | ✗ 전용 유닛 테스트 없음. 구조적으로만 보장 |
| V2 | S2 동기 | validator 없이 engine 생성 → crud:create 실행 | 기존과 동일하게 성공 | ✗ 전용 테스트 없음 |
| V3 | S3 동기 | section 내 card copy → 다른 section에 paste | card가 대상 section의 children에 추가됨. 버퍼는 NormalizedData | 부분 — `clipboard-overwrite.test.ts:82`가 새 플러그인 파이프라인을 회귀로 커버 |
| V4 | S4 동기 | DnD로 card를 file 노드 안으로 dnd:moveTo | validator 거부, `{ ok: false }` | ✗ 전용 테스트 없음 |
| V5 | S5 동기 | crud:create로 file 안에 새 노드 | validator 거부 | ✗ 전용 테스트 없음 |
| V6 | ④ 경계 | 빈 clipboard에서 paste | store 불변, `{ ok: true }` | ✗ 없음 |
| V7 | ④ 경계 | BatchCommand 내 2번째 command가 validator 거부 | 전체 배치 거부, store 불변 | ✗ 없음 |
| V8 | ④ 경계 | cut → paste → undo | 원본 위치에 노드 복원 | 부분 — 기존 clipboard-undo 테스트가 간접 커버 (세션 중 fail 상태, 동시 세션 영향) |
| V9 | ④ 경계 | 외부 clipboard paste (deserialize → validator) | deserialize 성공 + validator 통과 → 삽입. validator 거부 → store 불변 | 부분 — `clipboard-serialize.test.ts`가 serialize 경로 회귀 |
| V10 | ④ 경계 | focus:set command 실행 | validator 거치지 않음, 직접 실행 | ✓ `MUTATION_PREFIXES` 구조로 자동 보장. 전용 테스트 없음 |
| V11 | ⑥-3 부작용 | clipboard:paste command에서 canAccept 인자 없이 호출 | engine validator가 대체하여 동일 결과 | ✓ clipboard command 시그니처에서 canAccept/canDelete 인자 제거됨 |
| V12 | ② 산출물 | extractSubtree(store, [id1, id2]) 호출 | 두 서브트리를 포함한 NormalizedData 반환 | ✗ 전용 유닛 테스트 없음. copy 경로로 간접 사용 |
| V13 | ② 산출물 | mergeSubtree(store, subtree, parentId, 2) | parentId의 index 2 위치에 subtree 노드들 삽입 | ✗ 전용 유닛 테스트 없음. paste 경로로 간접 사용 |

### 역PRD 종합

- **구조 산출물 8개**: 100% 구현 ✓
- **시나리오 S1~S5**: 구조적 보장 ✓, 그러나 S4/S5는 회귀 테스트조차 없음
- **검증 V1~V13**: 전용 유닛 테스트 대부분 부재. 회귀는 `clipboard-overwrite`/`clipboard-serialize` 경유로만 보장
- **L1 갭 (코드 수정)**: 없음 — 전부 원래 설계대로 작동
- **L2 갭 (이월)**:
  1. zodSchema validator의 `payload.canAcceptFn` 주입 — 순수 validator 원칙 위반, 구조 해결 필요
  2. `MUTATION_PREFIXES` 하드코딩 — ⑦-2 금지 규칙("플러그인이 `mutation: true`로 선언")과 불일치, 현재 engine 레벨 하드코딩
  3. V1~V13 전용 유닛 테스트 부재 — validator 경로 전용 테스트 추가 필요
  4. `cmsSchema.ts`의 수동 `cmsCanAccept`/`cmsCanDelete` 제거 — zodSchema 플러그인으로 통합 가능
  5. clipboard 버퍼를 module-level 싱글턴 → engine 컨텍스트 이동

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
