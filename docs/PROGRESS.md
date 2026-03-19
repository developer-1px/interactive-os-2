# interactive-os — Progress Tracker

> **For LLMs:** 작업 시작 시 이 문서를 읽고 현황을 파악하세요. 기능 완료 및 커밋 시 체크를 업데이트하세요.
> **For humans:** 우선순위 태그 `[P0]`~`[P2]`는 수시로 조절 가능합니다.

**Priority legend:** `[P0]` 지금 당장 · `[P1]` 다음에 · `[P2]` 나중에 · 없음 = 완료

---

## ① Normalized Store

- [x] `core/types.ts` — Entity, NormalizedData, Command, BatchCommand, TransformAdapter, Middleware, Plugin
- [x] `core/normalized-store.ts` — createStore, getEntity, getChildren, getParent, addEntity, removeEntity, updateEntity, moveNode, insertNode
- [x] `core/command-engine.ts` — createCommandEngine, dispatch, middleware pipeline
- [x] 에러 처리 — Command execute() 실패 시 자동 롤백 (store 보전)
- [x] 타입 안전 Entity 제네릭 — `Entity<T>` with `data` property, `getEntityData<T>`, `updateEntityData`

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
- [x] 선택 모델 — single/multiple 모드 (selectionMode on AriaBehavior)

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
- [x] paste into leaf → 부모로 라우팅 (container = relationship entry 존재)

### rename()
- [x] startRename / confirmRename / cancelRename
- [x] 이전 값 복원 (undo)
- [x] `<Aria.Editable>` — contenteditable 제자리 편집 UI (F2/Enter/Esc/blur/더블클릭, isEditableElement 가드, IME 지원)

### dnd()
- [x] moveUp / moveDown (형제 간 리오더)
- [x] moveOut / moveIn (부모 레벨 이동)
- [x] moveTo (임의 위치 이동)

### spatial()
- [x] enterChild / exitToParent — `__spatial_parent__` 기반 depth 네비게이션 (Figma-style)
- [x] getSpatialParentId helper (ROOT_ID 기본값)
- [x] undo/redo 지원

### 미구현 플러그인
- [x] focusRecovery() — 포커스 유효성 검증 + 자동 복구 미들웨어
- [ ] `[P2]` permissions() — 노드별 Command 차단 미들웨어 (예제만 존재)

## ④ ARIA Behavior Layer

### 공통
- [x] `behaviors/types.ts` — AriaBehavior, BehaviorContext, NodeState, FocusStrategy
- [x] `behaviors/create-behavior-context.ts` — 엔진 → BehaviorContext 변환
- [x] childRole 지원 (behavior별 ARIA 자식 role)
- [x] focusNext/focusPrev wrap 옵션 (radiogroup용)
- [x] grid? 네임스페이스 (col 네비게이션)
- [x] aria-activedescendant 포커스 전략 + containerProps

### 프리셋
- [x] treegrid (role: treegrid, childRole: row)
- [x] listbox (role: listbox, childRole: option)
- [x] tabs (role: tablist, childRole: tab)
- [x] accordion (role: region, childRole: heading)
- [x] menu (role: menu, childRole: menuitem)
- [x] disclosure (role: group, childRole: button)

### 추가 프리셋
- [x] dialog (role: dialog, childRole: group)
- [x] toolbar (role: toolbar, childRole: button)
- [x] grid — 2D row/col 네비게이션, factory function `grid({ columns })`
- [x] combobox — input + listbox 통합, aria-activedescendant, multi-select + tag tokens + grouped + creatable
- [x] radiogroup — single selection 강제, wrapping nav, aria-checked
- [x] alertdialog — dialog variant with aria-modal
- [x] switch — expanded state 재사용, aria-checked, natural-tab-order

### 추가 프리셋 (Navigation)
- [x] tree — tree view (role: tree, childRole: treeitem), treegrid에서 grid 부분 제거

### 추가 프리셋 (Spatial)
- [x] spatial — depth traversal (Enter/Escape), roving-tabindex both, F2 rename

### 미구현 behavior
- [x] extended selection — Shift 범위 선택 (listbox, treegrid)
- [ ] `[P2]` menubar — 다계층 keyMap 필요 (축 확장)
- [ ] `[P2]` slider — 연속 값 (min/max/step) 축 필요
- [ ] `[P2]` spinbutton — 연속 값 축 필요

## ⑤ Components + Hooks

- [x] `components/aria.tsx` — `<Aria>` + `<Aria.Node>` compound component
- [x] `components/aria-context.ts` — React context
- [x] `hooks/use-aria.ts` — useAria() hook (escape hatch)
- [x] `hooks/use-keyboard.ts` — parseKeyCombo, matchKeyEvent, findMatchingKey (Mod 플랫폼 독립)
- [x] gridcell 자동 래핑 (treegrid row 내부)
- [x] aria-label prop 지원
- [x] **포커스 리커버리** — `focusRecovery()` 미들웨어로 삭제/축소/이동/생성/undo 시 자동 복구
- [x] `<Aria.Cell>` — grid 멀티 컬럼 지원, AriaNodeContext
- [x] `useControlledAria` — 외부 store 연동 훅 (controlled state variant)
- [x] DOM 스크롤 동기화 — 포커스 이동 시 `scrollIntoView({ block: 'nearest' })` 자동 호출
- [x] `hooks/use-spatial-nav.ts` — `useSpatialNav` hook + `findNearest` 순수 함수 (DOM 위치 기반 방향키 네비게이션)
- [ ] `[P2]` 대용량 가상화 — 10k+ 노드 렌더링

## ⑥ UI Layer (Reference Components)

- [x] TreeGrid (enableEditing + full keyMap)
- [x] ListBox
- [x] TabList
- [x] Accordion
- [x] MenuList
- [x] DisclosureGroup
- [x] SwitchGroup
- [x] Grid (2D row/col navigation with Aria.Cell)
- [x] RadioGroup
- [x] Combobox (input + listbox, aria-activedescendant, editable, multi-select + tag tokens, grouped, creatable)
- [ ] `[P2]` shadcn CLI — `npx interactive-os add treegrid`

## ⑦ 인프라

- [x] Vitest (410 tests, 50 files)
- [x] axe-core 접근성 테스트
- [x] ESLint (0 errors)
- [x] tsup 라이브러리 빌드 (ESM + DTS, 42 modules)
- [x] npm exports (package.json)
- [x] README
- [x] LICENSE (MIT)
- [x] CLAUDE.md (프로젝트 로컬) — PROGRESS.md 업데이트 규칙 명시
- [x] CI/CD — GitHub Actions (test + lint + build)
- [x] npm publish 자동화 — GitHub Release → npm publish (provenance)

## ⑧ App Shell

- [x] ActivityBar — 8 레이어 그룹 (Store, Engine, Navigation, Plugin, Collection, Components, Vision + Viewer)
- [x] 레이어별 nested routes (`/{layer}/{page}`)
- [x] Default landing: `/viewer` (독립 레이아웃, App Shell 밖)
- [x] Placeholder 컴포넌트 (미구현 레이어 페이지용)
- [x] Viewer 마크다운 렌더링 — remark-breaks 줄바꿈, 타이포그래피 전면 개선
- [x] Viewer 소스 뷰어 — Shiki 라인 넘버 (CSS counter), 심볼 하이라이트 (클릭 토글)
- [x] Viewer Quick Open — Cmd+P fuzzy 파일 검색 (Fuse.js, combobox ARIA 패턴)
- [x] APG Keyboard Tables — W3C 원문 키보드 인터랙션 표 14개 패턴 페이지 렌더링
- [x] Store Explorer — NormalizedData 구조를 TreeGrid로 시각화 (meta entities 포함)
- [x] Store Operations — 순수 함수 API 데모 (addEntity, removeEntity, moveNode 등)
- [x] Engine Pipeline — Command dispatch 9단계 흐름 시각화
- [x] Engine History — Undo/Redo 스택 실시간 로그
- [x] Plugin 레이어 — CRUD, Clipboard, History, DnD, Rename 인터랙티브 페이지 (독립 라우트 그룹)
- [x] Components 레이어 — `<Aria>`, `<Aria.Cell>`, Hooks API 쇼케이스 (3 pages)
- [x] Vision Architecture — mermaid 아키텍처 다이어그램 5개 렌더링
- [x] Visual CMS Landing — interactive-os 소개 랜딩 페이지 (Hero, Features, How it works, 14 APG Patterns, Footer)
- [x] Visual CMS Spatial Navigation — 단일 useAria + spatial behavior + useSpatialNav로 DOM 위치 기반 4방향 네비게이션, Enter/Escape depth, Space 선택, Shift+Arrow 범위 선택, Home/End
- [x] Visual CMS Unified Store — 6개 섹션 + 중첩 엔티티를 단일 normalized store로 통합
- [x] Dark/Light Theme System — `[data-theme]` CSS custom property layers, dark-first 디자인, localStorage 토글 + flash 방지
- [x] Combobox Token Migration — 인라인 스타일 → CSS 토큰 클래스 (combo-item, combo-input, combo-dropdown)
- [x] Demo Page Quality Lift — page-header, page-keys, demo-section, card 스타일 개선
- [x] Viewer Theme Compat — Shiki 테마 자동 전환 (shared MutationObserver hook)
- [x] Viewer Redesign — refined-documentation 스타일 (15px body, 1.75 line-height, 720px prose column, 48px padding)
- [x] Design System — ARIA attr 기반 CSS 디자인 시스템 (`data-focused` 코어 추가, App.css → tokens/components/app 3파일 분리, 11개 UI 컴포넌트 inline style 제거, `prefers-reduced-motion`)
- [x] CSS Architecture Migration — 3-Layer 구조 (tokens → ARIA state → component CSS), app.css 분해 (13개 컴포넌트 CSS 파일), UI 컴포넌트 inline style → className 전환, spacing/transition 토큰 추가
- [x] Route Restructuring — Navigation(read-only) → Plugin(개별 능력) → Collection(조립 쇼케이스) 3층 분리, Plugin 그룹 신설, Navigation에 treegrid/listbox/grid/combobox read-only 추가, 데모 데이터 공유 모듈 추출

## ⑨ APG Pattern Coverage

> W3C APG (ARIA Authoring Practices Guide) 패턴 기준 구현 현황

| APG Pattern | Behavior | UI Comp | Demo Page | APG Table | Status |
|---|---|---|---|---|---|
| Accordion | ✅ | ✅ | ✅ | ✅ | Done |
| Alert Dialog | ✅ | — | ✅ | ✅ | Done |
| Combobox | ✅ | ✅ | ✅ | ✅ | Done |
| Dialog (Modal) | ✅ | — | ✅ | ✅ | Done |
| Disclosure | ✅ | ✅ | ✅ | ✅ | Done |
| Grid | ✅ | ✅ | ✅ | ✅ | Done |
| Listbox | ✅ | ✅ | ✅ | ✅ | Done |
| Menu | ✅ | ✅ | ✅ | ✅ | Done |
| Radio Group | ✅ | ✅ | ✅ | ✅ | Done |
| Switch | ✅ | ✅ | ✅ | ✅ | Done |
| Tabs | ✅ | ✅ | ✅ | ✅ | Done |
| Toolbar | ✅ | — | ✅ | ✅ | Done |
| Tree View | ✅ | ✅ | ✅ | ✅ | Done |
| Treegrid | ✅ | ✅ | ✅ | ✅ | Done |
| Menubar | ❌ | ❌ | ❌ | ❌ | `[P2]` 다계층 keyMap |
| Slider | ❌ | ❌ | ❌ | ❌ | `[P2]` 연속값 축 |
| Spinbutton | ❌ | ❌ | ❌ | ❌ | `[P2]` 연속값 축 |
| Carousel | ❌ | ❌ | ❌ | ❌ | — |
| Feed | ❌ | ❌ | ❌ | ❌ | — |
| Table | ❌ | ❌ | ❌ | ❌ | read-only grid |
| Tooltip | ❌ | ❌ | ❌ | ❌ | — |
| Window Splitter | ❌ | ❌ | ❌ | ❌ | — |

*Native HTML 패턴 (Alert, Breadcrumb, Button, Checkbox, Link, Meter)은 behavior 불필요로 제외*

**14/14 composite widget 구현 완료** · 8개 미구현 (P2 또는 미계획)

---

*Last updated: 2026-03-19 — Rename UI: Aria.Editable contenteditable 제자리 편집, 422 tests, 51 files*
