# 테스트 코드 경량화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 66개 테스트 파일(68초)을 ~42개(40초 이하)로 경량화 — 인터랙션 unit + 단순 순수계산 삭제, 복잡 순수계산 환경 최적화

**Architecture:** 인터랙션 unit 16파일 삭제(통합에서 이미 커버), 단순 순수계산 10파일 삭제(간접 검증), 복잡 순수계산 7파일 jsdom→node 전환, 칸반 통합테스트 신규 생성, p1-gap-edge-cases 통합 재분류

**Tech Stack:** Vitest, @testing-library/react, userEvent, jsdom

**PRD:** `docs/superpowers/specs/2026-03-21-test-lightweight-prd.md`

**금지 사항 (PRD §5):**
- unit 케이스를 1:1로 통합에 옮기지 않는다 — 통합 미커버만 선별 추가
- mock 호출 검증(toHaveBeenCalled) 도입 금지
- 복잡 순수계산 unit 삭제 금지
- 한 번에 전부 삭제 금지 — 배치 단위로 삭제 + 검증 반복

---

### Task 1: Baseline 측정

**Files:**
- Read: `vitest.config.ts`

- [ ] **Step 1: 전체 테스트 실행 (baseline)**

Run: `npx vitest run 2>&1 | tail -5`
Expected: 65 passed (66 files), ~68초
기록: 파일 수, 테스트 수, Duration, environment 시간

- [ ] **Step 2: Commit 없음 — baseline 수치만 기록**

---

### Task 2: 칸반 통합테스트 신규 생성

**Files:**
- Create: `src/interactive-os/__tests__/kanban-keyboard.integration.test.tsx`
- Reference: `src/interactive-os/__tests__/grid-keyboard.integration.test.tsx` (패턴 참고)
- Reference: `src/interactive-os/__tests__/kanban.test.ts` (시나리오 참고)
- Reference: `src/interactive-os/behaviors/kanban.ts` (behavior 정의)
- Reference: `src/interactive-os/ui/Kanban.tsx` (컴포넌트)

- [ ] **Step 1: 기존 grid 통합테스트 패턴 확인**

`grid-keyboard.integration.test.tsx`의 구조를 참고:
- `fixtureData()` → `createStore()` 호출
- `renderGrid()` → `render(<Aria>)` 래퍼
- `getFocusedRowId()` → `querySelector('[tabindex="0"]')` 쿼리
- `userEvent.setup()` → `user.keyboard()` → DOM 검증

- [ ] **Step 2: 칸반 통합테스트 작성**

kanban.test.ts의 29개 시나리오를 사용자 관점으로 재구성:
- 수직 네비게이션 (ArrowUp/Down — 같은 열 내)
- 수평 네비게이션 (ArrowLeft/Right — 열 간, 인덱스 유지)
- Home/End (열 내), Mod+Home/Mod+End (전체 보드)
- 빈 열 처리 (빈 열로 이동 시 열 헤더 포커스)
- 선택 (Space 토글, Mod+A 열 전체, Escape 해제)
- CRUD (N 생성, Delete 삭제)
- DnD (Alt+Arrow 열간/열내 이동)
- 히스토리 (Mod+Z undo)

핵심: `userEvent.keyboard()` → DOM 상태 검증. engine.dispatch 금지.

- [ ] **Step 3: 테스트 실행 — 칸반 통합 통과 확인**

Run: `npx vitest run kanban-keyboard.integration 2>&1`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/__tests__/kanban-keyboard.integration.test.tsx
git commit -m "test: add kanban keyboard integration test"
```

---

### Task 3: p1-gap-edge-cases 통합 재분류

p1-gap-edge-cases.test.ts는 이미 `renderHook`+`useAria`를 사용하여 통합 수준으로 작성되어 있다.
내용 이동 없이 재분류만 수행 — 파일은 그대로 유지하고 삭제 대상에서 제외.

**Files:**
- Keep: `src/interactive-os/__tests__/p1-gap-edge-cases.test.ts` (통합으로 재분류, 삭제 안 함)

- [ ] **Step 1: 파일이 통합 수준임을 확인**

renderHook + useAria + rerender 패턴 사용 중 → 이미 통합테스트.
삭제 대상(Task 4~6)에서 이 파일을 제외했는지 확인.

- [ ] **Step 2: Commit 없음 — 재분류는 논리적 판정만**

---

### Task 4: 인터랙션 Unit 삭제 — 플러그인 그룹 (7파일)

**Files:**
- Delete: `src/interactive-os/__tests__/plugin-core.test.ts`
- Delete: `src/interactive-os/__tests__/plugin-clipboard.test.ts`
- Delete: `src/interactive-os/__tests__/plugin-history.test.ts`
- Delete: `src/interactive-os/__tests__/plugin-dnd.test.ts`
- Delete: `src/interactive-os/__tests__/plugin-crud.test.ts`
- Delete: `src/interactive-os/__tests__/plugin-rename.test.ts`
- Delete: `src/interactive-os/__tests__/plugin-focus-recovery.test.ts`

- [ ] **Step 1: 각 파일의 시나리오가 통합에서 커버되는지 확인**

확인 방법: 각 unit 시나리오에 대응하는 통합테스트 케이스가 존재하는지 grep.
- plugin-core (포커스/선택/확장) → accordion/listbox/treegrid 통합
- plugin-clipboard (copy/paste/cut) → phase3-integration 또는 viewer 통합
- plugin-history (undo/redo) → 여러 통합에서 간접 사용
- plugin-dnd (moveUp/Down/In/Out) → treegrid/viewer 통합
- plugin-crud (create/remove) → viewer/rename-ui 통합
- plugin-rename (rename) → rename-ui.test.tsx
- plugin-focus-recovery → viewer-focus-loss, treegrid 통합

미커버 발견 시: 해당 통합 파일에 시나리오 추가 (1:1 이관 아님, 사용자 관점 시나리오만).

- [ ] **Step 2: 플러그인 unit 7파일 삭제**

```bash
git rm src/interactive-os/__tests__/plugin-core.test.ts
git rm src/interactive-os/__tests__/plugin-clipboard.test.ts
git rm src/interactive-os/__tests__/plugin-history.test.ts
git rm src/interactive-os/__tests__/plugin-dnd.test.ts
git rm src/interactive-os/__tests__/plugin-crud.test.ts
git rm src/interactive-os/__tests__/plugin-rename.test.ts
git rm src/interactive-os/__tests__/plugin-focus-recovery.test.ts
```

- [ ] **Step 3: 전체 테스트 실행**

Run: `npx vitest run 2>&1 | tail -5`
Expected: 잔여 테스트 전부 통과

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(test): delete plugin interaction unit tests — covered by integration"
```

---

### Task 5: 인터랙션 Unit 삭제 — 엔진/기타 그룹 (9파일)

**Files:**
- Delete: `src/interactive-os/__tests__/behavior-context.test.ts`
- Delete: `src/interactive-os/__tests__/paste-position.test.ts`
- Delete: `src/interactive-os/__tests__/command-engine.test.ts`
- Delete: `src/interactive-os/__tests__/command-engine-error.test.ts`
- Delete: `src/interactive-os/__tests__/selection-model.test.ts`
- Delete: `src/interactive-os/__tests__/kanban.test.ts`
- Delete: `src/interactive-os/__tests__/phase3-integration.test.ts`
- Delete: `src/interactive-os/__tests__/tree-focus-recovery.test.ts`
- Delete: `src/interactive-os/__tests__/integration.test.ts`

- [ ] **Step 1: 통합 커버리지 확인**

- behavior-context → 모든 통합에서 간접 검증 (behavior 사용 시 context 생성)
- paste-position → clipboard 통합에서 간접 검증
- command-engine → 모든 통합에서 간접 검증 (dispatch 기반)
- command-engine-error → 경계: rollback. 통합에서 커버 안 되면 시나리오 추가
- selection-model → listbox/radiogroup 통합
- kanban.test.ts → Task 2에서 통합 대체 완료
- phase3-integration → 이미 엔진 레벨 통합, viewer/rename 통합에서 커버
- tree-focus-recovery → treegrid 통합
- integration.test.ts → 기존 통합 전체에서 커버

미커버 발견 시 통합에 선별 추가.

- [ ] **Step 2: 8파일 삭제**

```bash
git rm src/interactive-os/__tests__/behavior-context.test.ts
git rm src/interactive-os/__tests__/paste-position.test.ts
git rm src/interactive-os/__tests__/command-engine.test.ts
git rm src/interactive-os/__tests__/command-engine-error.test.ts
git rm src/interactive-os/__tests__/selection-model.test.ts
git rm src/interactive-os/__tests__/kanban.test.ts
git rm src/interactive-os/__tests__/phase3-integration.test.ts
git rm src/interactive-os/__tests__/tree-focus-recovery.test.ts
git rm src/interactive-os/__tests__/integration.test.ts
```

- [ ] **Step 3: 전체 테스트 실행**

Run: `npx vitest run 2>&1 | tail -5`
Expected: 잔여 테스트 전부 통과

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(test): delete engine/behavior interaction unit tests — covered by integration"
```

---

### Task 6: 단순 순수계산 Unit 삭제 (10파일)

**Files:**
- Delete: `src/interactive-os/__tests__/normalized-store.test.ts`
- Delete: `src/interactive-os/__tests__/use-engine.test.ts`
- Delete: `src/interactive-os/__tests__/use-aria-sync.test.ts`
- Delete: `src/interactive-os/__tests__/recorder-capture.test.ts`
- Delete: `src/interactive-os/__tests__/use-keyboard.test.ts`
- Delete: `src/interactive-os/__tests__/transform-adapter.test.ts`
- Delete: `src/pages/cms/__tests__/cms-types.test.ts`
- Delete: `src/pages/cms/__tests__/cms-templates.test.ts`
- Delete: `src/__tests__/plugins/spatial.test.ts`
- Delete: `src/__tests__/behaviors/spatial.test.ts`

- [ ] **Step 1: 10파일 삭제**

p1-gap-edge-cases.test.ts는 Task 3에서 통합으로 재분류되어 삭제 대상 아님.

```bash
git rm src/interactive-os/__tests__/normalized-store.test.ts
git rm src/interactive-os/__tests__/use-engine.test.ts
git rm src/interactive-os/__tests__/use-aria-sync.test.ts
git rm src/interactive-os/__tests__/recorder-capture.test.ts
git rm src/interactive-os/__tests__/use-keyboard.test.ts
git rm src/interactive-os/__tests__/transform-adapter.test.ts
git rm src/pages/cms/__tests__/cms-types.test.ts
git rm src/pages/cms/__tests__/cms-templates.test.ts
git rm src/__tests__/plugins/spatial.test.ts
git rm src/__tests__/behaviors/spatial.test.ts
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `npx vitest run 2>&1 | tail -5`
Expected: 잔여 테스트 전부 통과

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(test): delete simple computation unit tests — indirectly covered by integration"
```

---

### Task 7: 복잡 순수계산 환경 최적화 (7파일)

**Files:**
- Modify: `src/interactive-os/__tests__/compose-pattern.test.ts` (첫 줄에 디렉티브 추가)
- Modify: `src/interactive-os/__tests__/axes-select-v2.test.ts`
- Modify: `src/interactive-os/__tests__/axes-navigate-v2.test.ts`
- Modify: `src/interactive-os/__tests__/axes-expand-v2.test.ts`
- Modify: `src/interactive-os/__tests__/axes-trap-v2.test.ts`
- Modify: `src/interactive-os/__tests__/axes-activateV2.test.ts`
- Modify: `src/interactive-os/__tests__/spatial-focus-recovery.test.ts`

- [ ] **Step 1: 각 파일 첫 줄에 환경 디렉티브 추가**

각 파일의 첫 줄 앞에 추가:
```typescript
// @vitest-environment node
```

DOM API 사용이 없음은 사전 조사에서 확인됨 (document.*, window.* 미사용).

- [ ] **Step 2: 해당 7파일만 실행**

Run: `npx vitest run compose-pattern axes-select-v2 axes-navigate-v2 axes-expand-v2 axes-trap-v2 axes-activateV2 spatial-focus-recovery 2>&1`
Expected: 7파일 전부 통과

- [ ] **Step 3: 전체 테스트 실행**

Run: `npx vitest run 2>&1 | tail -5`
Expected: 전체 통과

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf(test): switch complex computation tests to node environment — skip jsdom setup"
```

---

### Task 8: 최종 검증 및 결과 비교

- [ ] **Step 1: 전체 테스트 실행 + 결과 기록**

Run: `npx vitest run 2>&1 | tail -5`
Expected:
- 파일 수: ~42개 (baseline 66 → 42)
- Duration: 40초 이하 (baseline 68초)
- 테스트 전부 통과

- [ ] **Step 2: Baseline과 비교**

| 지표 | Before | After | 변화 |
|------|--------|-------|------|
| 테스트 파일 수 | 66 | ~42 | -24 |
| 테스트 케이스 수 | 576 | ~N | -M |
| Duration | 68초 | ?초 | -N초 |
| environment 시간 | 45초 | ?초 | -N초 |

- [ ] **Step 3: tsc + eslint 확인**

Run: `npx tsc --noEmit && npx eslint src/ --quiet`
Expected: 에러 0
