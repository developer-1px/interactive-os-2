# interactive-os — Progress Tracker

> **For LLMs:** 작업 시작 시 이 문서를 읽고 현황을 파악하세요. 기능 완료 및 커밋 시 체크를 업데이트하세요.
> **For humans:** 우선순위 태그 `[P0]`~`[P2]`는 수시로 조절 가능합니다.

**Priority legend:** `[P0]` 지금 당장 · `[P1]` 다음에 · `[P2]` 나중에 · 없음 = 완료

---

## ① Normalized Store

- [x] `core/types.ts` — Entity, NormalizedData, Command, BatchCommand, TransformAdapter, Middleware, Plugin
- [x] `core/normalized-store.ts` — createStore, getEntity, getChildren, getParent, addEntity, removeEntity, updateEntity, moveNode, insertNode
- [x] `core/command-engine.ts` — createCommandEngine, dispatch, middleware pipeline
- [ ] `[P2]` 에러 처리 — Command execute() 실패 시 롤백, onError 콜백
- [ ] `[P1]` 타입 안전 Entity 제네릭 — `Entity<T>` 로 소비자 데이터 shape 강제

## ② Command Engine

- [x] dispatch + middleware pipeline (outside-in)
- [x] onStoreChange 외부 동기화
- [ ] `[P2]` Command 직렬화 — 협업/로깅용 serialize/deserialize

## ③ Plugins

### core()
- [x] focus (setFocus, undo 시 이전 포커스 복원)
- [x] selection (select, toggleSelect, clearSelection + undo)
- [x] expand/collapse (expand, collapse, toggleExpand)
- [x] **포커스 리커버리** — `focusRecovery()` 미들웨어, 단일 정책: 다음 형제 → 이전 형제 → 부모
- [ ] `[P1]` 선택 모델 확장 — single/multiple/extended 모드, Shift 범위 선택

### history()
- [x] undo/redo via snapshot-based command stack
- [x] redo stack clear on new command

### crud()
- [x] create (entity + relationship, 특정 index 지원)
- [x] delete (재귀 subtree 삭제 + undo 시 복원)
- [x] deleteMultiple (BatchCommand)

### clipboard()
- [x] copy (clone with new IDs)
- [x] cut + paste (move)
- [x] multi-node copy/paste

### rename()
- [x] startRename / confirmRename / cancelRename
- [x] 이전 값 복원 (undo)

### dnd()
- [x] moveUp / moveDown (형제 간 리오더)
- [x] moveOut / moveIn (부모 레벨 이동)
- [x] moveTo (임의 위치 이동)

### 미구현 플러그인
- [x] focusRecovery() — 포커스 유효성 검증 + 자동 복구 미들웨어
- [ ] `[P2]` permissions() — 노드별 Command 차단 미들웨어 (예제만 존재)

## ④ ARIA Behavior Layer

### 공통
- [x] `behaviors/types.ts` — AriaBehavior, BehaviorContext, NodeState, FocusStrategy
- [x] `behaviors/create-behavior-context.ts` — 엔진 → BehaviorContext 변환
- [x] childRole 지원 (behavior별 ARIA 자식 role)

### 프리셋
- [x] treegrid (role: treegrid, childRole: row)
- [x] listbox (role: listbox, childRole: option)
- [x] tabs (role: tablist, childRole: tab)
- [x] accordion (role: region, childRole: heading)
- [x] menu (role: menu, childRole: menuitem)
- [x] disclosure (role: group, childRole: button)

### 미구현 behavior
- [ ] `[P2]` grid — 2D row/col 네비게이션, Relationship 모델 확장 필요
- [ ] `[P2]` toolbar — horizontal 포커스, 그룹 내 순환
- [ ] `[P2]` radiogroup — single selection 강제

## ⑤ Components + Hooks

- [x] `components/aria.tsx` — `<Aria>` + `<Aria.Node>` compound component
- [x] `components/aria-context.ts` — React context
- [x] `hooks/use-aria.ts` — useAria() hook (escape hatch)
- [x] `hooks/use-keyboard.ts` — parseKeyCombo, matchKeyEvent, findMatchingKey (Mod 플랫폼 독립)
- [x] gridcell 자동 래핑 (treegrid row 내부)
- [x] aria-label prop 지원
- [x] **포커스 리커버리** — `focusRecovery()` 미들웨어로 삭제/축소/이동/생성/undo 시 자동 복구
- [ ] `[P1]` `<Aria.Cell>` — treegrid 멀티 컬럼 지원
- [ ] `[P1]` useExternalStore — 외부 store 연동 훅 (Zustand/Jotai 어댑터)
- [ ] `[P2]` 대용량 가상화 — 10k+ 노드 렌더링
- [ ] `[P2]` DOM 스크롤 동기화 — 포커스 이동 시 자동 스크롤

## ⑥ UI Layer (Reference Components)

- [x] TreeGrid (enableEditing + full keyMap)
- [x] ListBox
- [x] TabList
- [x] Accordion
- [x] MenuList
- [x] DisclosureGroup
- [ ] `[P2]` shadcn CLI — `npx interactive-os add treegrid`

## ⑦ 인프라

- [x] Vitest (202 tests, 26 files)
- [x] axe-core 접근성 테스트
- [x] ESLint (0 errors)
- [x] tsup 라이브러리 빌드 (ESM + DTS, 27 modules)
- [x] npm exports (package.json)
- [x] README
- [x] LICENSE (MIT)
- [ ] `[P1]` CLAUDE.md (프로젝트 로컬) — PROGRESS.md 업데이트 규칙 명시
- [ ] `[P2]` CI/CD — GitHub Actions (test + lint + build)
- [ ] `[P2]` npm publish 자동화

---

*Last updated: 2026-03-16*
