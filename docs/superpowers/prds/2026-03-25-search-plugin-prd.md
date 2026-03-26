# search Plugin + Aria.Search + Aria.SearchHighlight — PRD

> Discussion: 범용 컬렉션 검색. search() plugin(로직+keyMap) + Aria.Search(input UI) + Aria.SearchHighlight(매칭 텍스트 하이라이트). rename 패턴과 동일 구조.

## ① 동기

### WHY

- **Impact**: 모든 Aria 컬렉션(Grid, TreeView, ListBox 등)에서 데이터가 많아지면 스크롤로 찾아야 함. i18n Editor에서 번역 대상 발견이 최대 병목 (리소스 조사 P0 갭)
- **Forces**: Grid에 필터 레이어 부재. Combobox만 `__combobox__` 메타엔티티로 필터 구현. 검색은 뷰 관심사이지만 keyMap(Ctrl+F)과 포커스 관리는 engine 관심사
- **Decision**: plugin + primitive 조합. rename 패턴 답습 — search() plugin이 상태+keyMap, Aria.Search가 input UI, Aria.SearchHighlight가 결과 하이라이트. 기각: (A) 페이지 직접 구현 → 보일러플레이트, (B) hook → UI 미제공, (C) Grid 전용 → TreeView 등 미혜택
- **Non-Goals**: 정규식 검색 아님 (substring match). 서버사이드 검색 아님 (클라이언트 필터). 검색 결과 정렬/랭킹 아님

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Aria 컬렉션에 search plugin 활성 | Ctrl+F | 검색 input에 포커스 | |
| S2 | 검색 input 포커스 | "hero" 타이핑 | "hero" 포함 행만 표시, 나머지 숨김 | |
| S3 | 검색 활성, 필터 결과 표시 중 | Escape | 검색 해제, 전체 행 복원, 컬렉션에 포커스 복귀 | |
| S4 | 검색 활성, 매칭 텍스트 | 화면에서 확인 | 매칭 부분이 `<mark>` 태그로 하이라이트 | |
| S5 | 검색 활성, 필터된 상태 | 방향키로 탐색 | 필터된 행 내에서만 이동 | |
| S6 | 검색 input에서 | 텍스트 전부 지우기 | 필터 해제, 전체 행 표시 | |
| S7 | 컬렉션에 search plugin 없음 | Ctrl+F | 브라우저 기본 검색 동작 (plugin 미개입) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `plugins/search.ts` | search plugin: `__search__` 메타엔티티(filterText), keyMap(Ctrl+F → input 포커스), commands(setFilter, clearFilter). Aria.Item이 렌더 시 필터 적용 | |
| `primitives/aria.tsx` — `Aria.Search` | 검색 input primitive. AriaInternalContext로 dispatch 접근. 타이핑 → setFilter, Escape → clearFilter + 컬렉션 포커스 복귀 | |
| `primitives/aria.tsx` — `Aria.SearchHighlight` | 자식 텍스트에서 filterText 매칭 부분을 `<mark>`로 래핑. filterText 없으면 children 그대로 반환 | |
| `primitives/aria.tsx` — `Aria.Item` 수정 | `__search__.filterText`가 있으면 매칭 안 되는 노드를 skip하는 필터 로직 추가 | |

완성도: 🟢

## ③ 인터페이스

> 두 영역: 검색 input(Aria.Search)과 컬렉션(기존 Aria)

### Aria.Search (검색 input)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 타이핑 | input 포커스 | searchCommands.setFilter(text) dispatch | input onChange → 실시간 필터 | __search__.filterText 갱신, Aria.Item이 매칭 행만 렌더 | |
| Escape | input 포커스 | searchCommands.clearFilter() dispatch + 컬렉션 첫 행에 포커스 | 검색 종료 = 전체 복원 + 컬렉션 복귀. input blur | filterText "", 전체 행 표시, 컬렉션 포커스 | |
| Enter | input 포커스 | 컬렉션 첫 매칭 행에 포커스 이동 (input 유지) | 검색 결과로 진입 — input은 유지하여 검색어 변경 가능 | 컬렉션 포커스, input에 검색어 유지 | |
| ↑↓ | input 포커스 | N/A — input 내 기본 동작 | 검색 input은 single-line이라 방향키 무동작 | N/A | |

### 컬렉션 (기존 Aria + search plugin)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Ctrl+F | 컬렉션 포커스 | 검색 input 포커스 | search plugin keyMap이 Ctrl+F를 잡아 Aria.Search input에 focus() | input 포커스, 기존 filterText 선택 | |
| Escape | 컬렉션 포커스, 검색 활성 | clearFilter + input 숨기기 (?) | search 비활성이면 Escape는 패턴 기본 동작(dismiss 등)으로 넘김 | 전체 행 복원 | |
| ↑↓←→ | 컬렉션 포커스, 검색 활성 | 필터된 행 내에서만 이동 | Aria.Item이 필터된 노드만 렌더하므로 focusNext/Prev가 필터 결과 안에서 동작 | 필터된 행 간 이동 | |
| Home/End | 컬렉션 포커스, 검색 활성 | 필터된 결과의 첫/마지막 행 | navigate 축이 보이는 노드 기준 동작 | N/A | |
| Tab | 검색 활성 | N/A — 기존 동작 (Tab이 있으면 패턴 동작) | search가 Tab을 shadow하지 않음 | N/A | |
| Space | 컬렉션 포커스 | N/A — 기존 동작 | search가 Space를 shadow하지 않음 | N/A | |
| 클릭 (input) | 어디서든 | input 포커스 | 일반 클릭 동작 | input 포커스 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 검색어에 매칭 행 0개 | filterText="zzz" | 모든 행 숨김, 빈 상태 표시 필요 | 행 0개 표시 — 컬렉션 빈 상태 | 포커스 없음 | |
| 검색 중 현재 포커스 노드가 필터에서 제외 | row-2 포커스, filterText 변경으로 row-2 매칭 안 됨 | 포커스 노드가 사라지면 focusRecovery가 처리 (기존 메커니즘) | 매칭되는 첫 행으로 포커스 이동 | focusRecovery 동작 | |
| filterText 빈 문자열 | 검색 input 비움 | 빈 문자열 = 필터 해제. 전체 행 표시 | 전체 행 표시 | __search__.filterText = "" | |
| search plugin 없는 Aria | plugin 미추가 | Ctrl+F = 브라우저 기본. Aria.Search 렌더해도 dispatch 불가 | 브라우저 검색 | N/A | |
| SearchHighlight에 filterText 없을 때 | __search__ 미존재 또는 filterText="" | children 그대로 반환, `<mark>` 없음 | zero-cost passthrough | children 그대로 | |
| 대소문자 | filterText="Hero" | case-insensitive match (Combobox 선례) | "hero", "Hero", "HERO" 모두 매칭 | 매칭 행 표시 | |
| SearchHighlight에 HTML 요소 포함 | children이 `<span><strong>text</strong></span>` | textContent만 매칭, DOM 구조 보존 | `<mark>` 는 텍스트 노드에만 적용 | DOM 구조 유지 | |
| TreeView에서 검색 | 계층 구조 | 매칭 노드의 조상도 표시해야 트리 구조 유지 (?) | 이 PRD scope: flat 컬렉션만 (Grid, ListBox). Tree는 별도 | flat only | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② search plugin이 Ctrl+F keyMap 소유 | ✅ 준수 | — | |
| 2 | 파일명 = 주 export (feedback_filename_equals_export) | ② search.ts → export function search | ✅ 준수 | — | |
| 3 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ④ Tree scope 제외 — flat only | ✅ Tree 검색은 조상 표시 로직 필요, 별도 작업 | — | |
| 4 | 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ Aria.Search input이 키 이벤트를 먹으면 컬렉션 keyMap에 전파 안 됨 | ✅ input이 포커스 잡으면 컬렉션 keyMap 미도달 — 자연 격리 | — | |
| 5 | 계산은 unit, 인터랙션은 통합 (feedback_test_strategy) | ⑧ filterText 매칭 로직은 unit, Ctrl+F→타이핑→필터는 통합 | ✅ 준수 | — | |
| 6 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② search — WAI-ARIA combobox pattern의 search role과 일관 | ✅ | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `aria.tsx` Aria.Item 렌더 로직 | `__search__` 필터 분기 추가 — __search__ 없으면 기존 동작 | 낮 | opt-in: plugin 안 넣으면 분기 미진입 | |
| 2 | `aria.tsx` export (Aria 객체) | Aria.Search, Aria.SearchHighlight 추가 | 낮 | Object.assign 확장, 기존 속성 불변 | |
| 3 | Ctrl+F 브라우저 기본 검색 가로챔 | search plugin 있는 Aria에서 Ctrl+F 시 브라우저 검색 안 됨 | 중 | 의도된 동작 — plugin이 있으면 커스텀 검색 우선. plugin 없으면 브라우저 기본 | |
| 4 | focusRecovery 의존 | 필터로 포커스 노드 사라질 때 focusRecovery 필요 | 낮 | focusRecovery가 이미 "없는 노드 → 첫 노드" 폴백 제공 (useAria.ts line 140-153) | |
| 5 | META_ENTITY_IDS 확장 | `__search__`를 META_ENTITY_IDS에 추가 필요 | 낮 | useAria.ts의 Set에 추가 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | store의 relationships 직접 수정으로 필터 | ⑤#3 설계 원칙 | 필터는 뷰 레벨 — Aria.Item 렌더 시 skip. store는 원본 유지 | |
| 2 | Tree 계층 검색 이 PRD에서 구현 | ⑤#3, ④ scope | 조상 노드 표시 로직은 별도 작업 필요 | |
| 3 | Aria.Search를 Aria 외부에서 사용 | ⑥#1 | AriaInternalContext 의존 — Aria 내부에서만 동작 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | Ctrl+F → 검색 input 포커스 | input에 포커스, 커서 깜빡 | |
| V2 | S2 동기 | "hero" 타이핑 → 행 필터 | "hero" 포함 행만 표시, 나머지 숨김 | |
| V3 | S3 동기 | Escape → 검색 해제 | 전체 행 복원, 컬렉션 포커스 | |
| V4 | S4 동기 | 매칭 텍스트 하이라이트 | `<mark>` 태그로 "hero" 부분 감싸짐 | |
| V5 | S5 동기 | 필터 상태에서 ArrowDown | 필터된 행 내 다음 행으로 이동 | |
| V6 | S6 동기 | 검색어 전부 지우기 | 전체 행 표시 | |
| V7 | S7 동기 | plugin 없이 Ctrl+F | 브라우저 기본 검색 (plugin 미개입) | |
| V8 | 경계#1 | 매칭 0개 | 행 0개 표시 | |
| V9 | 경계#2 | 필터로 포커스 노드 제외 | focusRecovery → 첫 매칭 행 포커스 | |
| V10 | 경계#5 | SearchHighlight에 filterText 없음 | children 그대로, mark 없음 | |
| V11 | 경계#6 | 대소문자 무시 | "Hero", "hero" 모두 매칭 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
