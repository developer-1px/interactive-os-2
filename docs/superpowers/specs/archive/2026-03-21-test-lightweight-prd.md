# 테스트 코드 경량화 — PRD

> Discussion: 사용자 인풋 중심 통합테스트 비중 ↑, 인터랙션 unit + 단순 순수계산 삭제, 복잡 순수계산만 잔류

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | 66개 테스트 파일(9.5K줄), 실행 68초 (환경 세팅 45초가 병목) | 16 인터랙션unit + 10 단순계산 + 8 복잡계산 + 33 통합 | 테스트 경량화 실행 | 파일 수 ↓, 실행 시간 ↓, 사용자 인풋 중심 검증 비율 ↑ | ~42개 파일 (8 복잡계산 + 33 통합 + 1 신규칸반통합), 환경 세팅 횟수 절반 이하 | |
| 2 | 인터랙션 unit이 createCommandEngine으로 내부 상태를 직접 조작 | `engine.dispatch(focusCommands.setFocus('node-2'))` → store 상태 검증 | 리팩토링 시 | 내부 API 변경 → 테스트 깨짐 (실제 버그 아님) | 리팩토링 내성 없는 테스트 유지 비용 | |
| 3 | 단순 순수계산(parseKeyCombo 등)이 통합에서 이미 간접 검증됨 | `parseKeyCombo('Ctrl+A')` → `{ctrl:true, key:'a'}` | 별도 unit 유지 시 | 환경 세팅 오버헤드 + 중복 검증 | — | |

상태: 🟢

## 2. 인터페이스

> 이 PRD는 UI 기능이 아닌 **테스트 코드 리팩토링**이므로, 인터페이스 = 삭제/유지 판정 기준 + 흡수 규칙

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| 인터랙션 unit 파일 | createCommandEngine / engine.dispatch 패턴 | 해당 동작이 기존 통합테스트에서 커버됨 | 삭제 | 파일 제거 | |
| 인터랙션 unit 파일 | createCommandEngine / engine.dispatch 패턴 | 해당 동작이 통합에서 미커버 | 통합테스트에 시나리오 추가 → unit 삭제 | 통합 파일에 케이스 추가 + unit 파일 제거 | |
| 단순 순수계산 파일 | 순수 함수, I/O 단순 (입력 1-2개, 출력 단순 값) | 통합에서 간접 검증됨 | 삭제 | 파일 제거 | |
| 복잡 순수계산 파일 | 순수 함수, I/O 조합 폭발 | — | 유지 + jsdom 환경 제거 | `// @vitest-environment node` 또는 vitest.config에서 분리 | |
| 통합테스트 파일 | userEvent + DOM 검증 | — | 유지 (변경 없음) | — | |

상태: 🟢

## 3. 산출물

> 파일별 판정표

### 3-1. 삭제 대상: 인터랙션 Unit (16파일, 138테스트)

| # | 파일 | 테스트 수 | 커버 확인 필요 | 역PRD |
|---|------|---------|--------------|-------|
| 1 | plugin-core.test.ts | 13 | 포커스/선택/확장 → 통합에서 커버? | |
| 2 | plugin-clipboard.test.ts | 8 | copy/paste/cut → 통합에서 커버? | |
| 3 | plugin-history.test.ts | 5 | undo/redo → 통합에서 커버? | |
| 4 | plugin-dnd.test.ts | 13 | moveUp/Down/In/Out → 통합에서 커버? | |
| 5 | plugin-crud.test.ts | 9 | create/remove → 통합에서 커버? | |
| 6 | plugin-rename.test.ts | 7 | rename → rename-ui.test.tsx에서 커버? | |
| 7 | plugin-focus-recovery.test.ts | 16 | 삭제후복구 → 통합에서 커버? | |
| 8 | behavior-context.test.ts | 12 | createBehaviorContext → 통합에서 간접 검증? | |
| 9 | paste-position.test.ts | 3 | 붙여넣기 위치 → clipboard 통합? | |
| 10 | command-engine.test.ts | 6 | dispatch/middleware → 모든 통합에서 간접 검증 | |
| 11 | command-engine-error.test.ts | 2 | rollback → 경계 케이스, 통합 추가 필요? | |
| 12 | selection-model.test.ts | 2 | toggle → listbox/radiogroup 통합에서 커버? | |
| 13 | kanban.test.ts | 29 | 삭제 → 칸반 통합테스트 신규 생성 | |
| 14 | phase3-integration.test.ts | 5 | CRUD+Clipboard+Rename 조합 → 통합 흡수 | |
| 15 | tree-focus-recovery.test.ts | 4 | tree 삭제후복구 → treegrid 통합? | |
| 16 | integration.test.ts | 4 | 포커스/확장/선택 → 기존 통합 커버 | |

### 3-2. 삭제 대상: 단순 순수계산 (10파일, 81테스트)

| # | 파일 | 테스트 수 | 비고 | 역PRD |
|---|------|---------|------|-------|
| 1 | normalized-store.test.ts | 23 | CRUD 순수함수, 통합에서 간접 검증 | |
| 2 | use-engine.test.ts | 9 | useEngine 훅, jsdom 사용 중 | |
| 3 | use-aria-sync.test.ts | 4 | 외부 동기화, jsdom 사용 중 | |
| 4 | recorder-capture.test.ts | 2 | TRACKED_KEYS 멤버십 | |
| 5 | use-keyboard.test.ts | 10 | parseKeyCombo/matchKeyEvent | |
| 6 | transform-adapter.test.ts | 5 | normalize/denormalize 라운드트립 | |
| 7 | cms-types.test.ts | 4 | localeMap 헬퍼 | |
| 8 | cms-templates.test.ts | 5 | createSection 템플릿 | |
| 9 | spatial.test.ts (src/__tests__/plugins/) | 8 | spatialCommands, undo | |
| 10 | spatial.test.ts (src/__tests__/behaviors/) | 11 | 공간 계층 탐색 | |

### 3-3. 유지: 복잡 순수계산 (8파일, 89테스트) — jsdom 제거

| # | 파일 | 테스트 수 | 환경 변경 | 역PRD |
|---|------|---------|----------|-------|
| 1 | compose-pattern.test.ts | 14 | → node | |
| 2 | axes-select-v2.test.ts | 6 | → node | |
| 3 | axes-navigate-v2.test.ts | 22 | → node | |
| 4 | axes-expand-v2.test.ts | 12 | → node | |
| 5 | axes-trap-v2.test.ts | 5 | → node | |
| 6 | axes-activateV2.test.ts | 8 | → node | |
| 7 | spatial-focus-recovery.test.ts | 14 | → node (isReachable 조합 복잡) | |

### 3-4. 통합 재분류: jsdom 필수 (1파일)

| # | 파일 | 테스트 수 | 비고 | 역PRD |
|---|------|---------|------|-------|
| 1 | p1-gap-edge-cases.test.ts | 8 | renderHook+useAria 사용 → 이미 통합 수준, 재분류만 (내용 이동 없음) | |

### 3-5. 유지: 통합 (32파일, 238테스트) — 변경 없음

(목록 생략 — 기존 통합테스트 전체 유지)

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 인터랙션 unit 삭제 후 통합 미커버 시나리오 발견 | unit에만 존재하던 케이스 | 통합테스트에 시나리오 추가 후 삭제 | 통합 파일에 케이스 추가 | |
| kanban.test.ts — 29개 케이스가 통합 없이 독립 | 칸반 인터랙션 unit only | ✅ 칸반 통합테스트(kanban-keyboard.integration.test.tsx) 신규 생성 후 unit 삭제 | 통합 파일 신규 + unit 삭제 | |
| spatial-focus-recovery — I/O 복잡도 높음 | isReachable 플러그, 14케이스 | ✅ 복잡계산으로 재분류, jsdom 제거하여 유지 | → node 환경 | |
| p1-gap-edge-cases — renderHook+useAria 사용 | 외부 데이터 동기화 | ✅ jsdom 필수 → 통합으로 이관 (use-aria-sync 계열 통합에 흡수) | 통합 이관 | |
| 삭제 후 전체 테스트 실패 | — | 실패 케이스 분석 → 통합 추가 또는 복잡계산 재분류 | — | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | unit 케이스를 1:1로 통합에 옮기기 | 줄 수만 이동, 경량화 아님. 통합 미커버만 선별 추가 | |
| 2 | mock 호출 검증(toHaveBeenCalled) 도입 | 프로젝트 원칙 위반 — 테스트를 위한 테스트 | |
| 3 | 복잡 순수계산 unit 삭제 | I/O 폭발 시나리오는 통합으로 커버 불가능 | |
| 4 | 통합테스트의 userEvent→DOM 패턴 변경 | 검증 원칙 훼손 | |
| 5 | 전체 25파일을 한 번에 삭제 후 테스트 돌리기 | 어디서 깨졌는지 추적 불가. 논리 그룹(플러그인/엔진/계산) 단위로 삭제+확인 반복 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | 전체 테스트 실행 (삭제 전 baseline) | 65 passed, 68초 | |
| 2 | 인터랙션 unit 16파일 삭제 후 전체 실행 | 잔여 테스트 전부 통과 | |
| 3 | 단순 순수계산 10파일 삭제 후 전체 실행 | 잔여 테스트 전부 통과 | |
| 4 | 복잡 순수계산 7파일 jsdom → node 변경 후 실행 | 해당 7파일 통과 | |
| 5 | 최종 전체 실행 | ~39파일, 실행 시간 40초 이하 (환경 세팅 횟수 절반) | |
| 6 | 통합 미커버 시나리오 추가분 | 추가된 통합 케이스 통과 | |

상태: 🟢

---

**전체 상태:** 🟢 6/6
