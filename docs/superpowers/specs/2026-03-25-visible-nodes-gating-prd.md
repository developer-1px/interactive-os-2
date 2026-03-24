# getVisibleNodes Entity-Gating — PRD

> Discussion: getVisibleNodes가 tree-only 가시성 모델이라 그룹 있는 listbox에서 ArrowDown 불가. `__expanded__` entity 존재 자체를 게이팅 신호로 사용하는 방향으로 결정.

## ① 동기

### WHY

- **Impact**: NavList 사이드바(그룹 구조)에서 ArrowDown/Up이 동작하지 않는다. focusNext가 visible 리스트에서 현재 항목을 찾지 못해 포커스가 고정됨. 키보드 네비게이션이 완전히 차단되는 치명적 UX 버그.
- **Forces**: getVisibleNodes는 `expandedIds` 화이트리스트로 자식 가시성을 결정. tree에서는 "기본 접힘"이 올바르고, 그룹에서는 "기본 펼침"이 올바름. 두 기본값이 충돌.
- **Decision**: `__expanded__` entity 존재 = 게이팅 활성, 부재 = 전부 walk. expandedIds 모델 유지, 분기 없음, tree 초기화 비용 없음. 기각 대안: (1) collapsedIds 블랙리스트 → tree가 매 데이터 변경마다 전체 순회 필요, (2) expandable 파라미터 분기 → 모양만 다른 구조에 분기를 치는 나쁜 설계.
- **Non-Goals**: expand/collapse 커맨드 API 변경 없음. aria-expanded 렌더링 변경 없음. entity key `__expanded__` 이름 변경 없음.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | NavList에 그룹 구조 데이터 (ROOT→groups→items), expand axis 미사용 | ArrowDown | 다음 항목으로 포커스 이동 | |
| M2 | Tree에 계층 데이터, expand axis 사용, 초기 전부 접힘 | ArrowDown | root 자식 사이에서만 이동 (자식은 숨김) | |
| M3 | Tree에서 노드를 expand한 뒤 | ArrowDown | expanded 노드의 자식도 순회 | |
| M4 | Accordion에 3개 섹션, expand axis 사용 | 첫 섹션 expand + ArrowDown | 첫 섹션 자식 → 두 번째 섹션 순서로 이동 | |
| M5 | 평면 리스트 (자식 없음), expand axis 미사용 | ArrowDown | 다음 항목으로 포커스 이동 (기존 동작 유지) | |

완성도: 🟡

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `engine/getVisibleNodes.ts` 수정 | `__expanded__` entity 존재 여부로 게이팅. entity 없으면 전부 walk | |
| `axis/expand.ts` 수정 | `config`에 `expandable: true` 반환 (현재 빈 config). composePattern이 pattern.expandable에 merge | |
| `primitives/useAria.ts` 수정 | 초기화에서 `behavior.expandable === true`면 `__expanded__: { expandedIds: [] }` dispatch. expandedIds 파생 시 entity 부재 = null 구분 | |
| `plugins/focusRecovery.ts` treeReachable 수정 | `__expanded__` entity 없으면 `true` 반환 (게이팅 없음 = 항상 도달 가능) | |
| `primitives/useAriaView.ts` 수정 | getNodeState에서 expanded 상태 판정: entity 없으면 expanded=undefined | |
| `primitives/useAriaZone.ts` 수정 | viewState에서 expandedIds 타입을 `null | string[]`로 확장. null = entity 없음 | |
| `pattern/createPatternContext.ts` 수정 | isExpanded: entity 없으면 false (expand 개념 없음) | |
| 테스트 추가/수정 | navlist 그룹 네비게이션 테스트, tree 초기 접힘 테스트 | |

완성도: 🟡

## ③ 인터페이스

> 이 변경은 UI 인터랙션 변경이 아니라 엔진 내부 로직 변경. 인터페이스 = 함수의 입출력 계약.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `getVisibleNodes(engine)` | `__expanded__` entity 없음 | 모든 자식을 재귀 walk | entity 부재 = 게이팅 비활성, 모든 노드가 visible | 전체 평탄화된 노드 리스트 | |
| `getVisibleNodes(engine)` | `__expanded__: { expandedIds: [] }` | root 자식만 반환, 손자는 건너뜀 | entity 존재 = 게이팅 활성, 빈 배열 = 아무것도 expand 안 됨 | root 직계 자식만 포함된 리스트 | |
| `getVisibleNodes(engine)` | `__expanded__: { expandedIds: ['A'] }` | A의 자식까지 walk, 나머지는 건너뜀 | A만 expanded, 나머지는 gated | A와 A의 자식 + 나머지 root 자식 | |
| `treeReachable(store, nodeId)` | `__expanded__` entity 없음 | `true` 반환 | 게이팅 없음 = 모든 노드 도달 가능 | — | |
| `treeReachable(store, nodeId)` | `__expanded__` entity 있음, 조상이 expanded | `true` 반환 | 기존 동작 유지 | — | |
| `treeReachable(store, nodeId)` | `__expanded__` entity 있음, 조상이 미expanded | `false` 반환 | 기존 동작 유지 | — | |
| expand axis `config` | — | `{ expandable: true }` 반환 | expand axis 사용 = pattern.expandable 설정, useAria가 마운트 시 `__expanded__` entity 생성 | pattern.expandable = true | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 데이터 (root 자식 0개) | entity 무관 | 자식 없으면 walk 대상 없음 | 빈 배열 반환 | — | |
| 그룹만 있고 리프 없음 | entity 없음 | 그룹 자체가 visible, 자식 없으니 walk 종료 | 그룹 ID만 반환 | — | |
| 3단 중첩 (ROOT→그룹→서브그룹→리프) | entity 없음 | 게이팅 없으면 전체 재귀 | 모든 레벨 평탄화 | — | |
| tree에서 expand 후 데이터 교체 (외부 sync) | `__expanded__` entity 존재, expandedIds에 없는 노드 추가 | 새 노드는 기본 접힘 (expandedIds에 없으므로) | 새 노드의 자식은 숨김 | 기존 expanded 상태 유지 | |
| expand axis 미사용 패턴에서 expandCommands 직접 dispatch | entity 없음 → expand 커맨드 실행 | lazy init으로 entity 생성 후 expand | 이후 게이팅 활성화됨 | `__expanded__: { expandedIds: [nodeId] }` | |
| typeahead 검색 시 그룹 데이터 | entity 없음 | typeahead도 getVisibleNodes 사용 — 그룹 자식이 검색 대상에 포함 | 리프 항목이 typeahead에 나옴 | — | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 모양만 다르지 구조는 같다 (discuss 중 사용자 확인) | 전체 설계 | ✅ 준수 | — | |
| P2 | 설계 원칙 > 사용자 요구 충족 (feedback_design_over_request) | ②③ | ✅ 준수 — engine 우회 없이 기존 모델 활용 | — | |
| P3 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ②⑥ | ✅ 준수 — treeReachable 수정하되 인터페이스 유지 | — | |
| P4 | 정규화 트리 순회로 UI 패턴 해결 (feedback_normalization_solves_ui) | ③ | ✅ 준수 — 컨테이너 타입별 분기 없이 데이터 존재 여부로 판단 | — | |
| P5 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② | ✅ 준수 — expand axis가 config 소유 | — | |
| P6 | 수정 전 설계 의도 이해 필수 (feedback_fix_requires_design_understanding) | 전체 | ✅ 준수 — explain 2건으로 설계 의도 파악 완료 | — | |
| P7 | 테스트: 계산→unit, 인터랙션→통합 (feedback_test_strategy) | ⑧ | ✅ 준수 — getVisibleNodes는 unit, NavList ArrowDown은 통합 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | tree.ts, treegrid.ts, spatial.ts, menu.ts — expand axis 사용 패턴 | expand axis가 `expandable: true` config를 반환 → composePattern이 pattern.expandable에 merge → useAria 초기화에서 `__expanded__: { expandedIds: [] }` 생성. 기존 경로(behavior.expandable)를 그대로 활용 | 낮 | expand axis의 config에 `expandable: true` 추가만으로 해결. useAria 초기화에 entity 생성 로직 1줄 추가 | |
| S2 | focusRecovery의 treeReachable | entity 없는 패턴에서 focusRecovery가 모든 노드를 reachable로 판정 — 이것은 올바름 (숨길 노드가 없으므로) | 낮 | 허용 | |
| S3 | useAriaView의 getNodeState expanded 필드 | entity 없으면 expanded=undefined → aria-expanded 속성이 렌더되지 않음 — listbox/navlist에서 이것이 올바른 동작 (그룹은 aria-expanded를 갖지 않음) | 낮 | 허용 | |
| S4 | useAriaZone의 viewState 초기화 | 현재 `expandedIds: []`로 초기화 — entity 존재 여부와 무관하게 빈 배열. zone에서도 entity 부재를 표현할 수 있어야 함 | 중 | `expandedIds: null | string[]`로 타입 확장. null = entity 없음 | |
| S5 | 기존 테스트 | getVisibleNodes를 사용하는 기존 테스트가 `__expanded__` entity 없이 동작 중 → 전환 후 모든 자식이 visible로 변경될 수 있음 | 중 | 테스트 확인 후 expand axis 사용 테스트에 초기 entity 추가 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| F1 | getVisibleNodes에 pattern 타입 분기 추가 | P1 원칙 위반 | "모양만 다르지 구조는 같다" — 데이터로 구분해야지 타입으로 분기하면 안 됨 | |
| F2 | expandedIds/collapsedIds 이중 모델 | discuss 기각 | 두 모델 공존은 복잡성만 증가 | |
| F3 | navlist에서 expand 관련 코드 추가 | discuss 기각 | navlist는 expand 개념이 없음. 워크어라운드로 expand 주입 금지 | |
| F4 | `__expanded__` entity key 이름 변경 | Non-Goals | 이 PRD 범위 밖. 별도 rename이 필요하면 별도 작업 | |
| F5 | tree 초기화에서 데이터 전체 순회 | S1 대응 | expand 커맨드의 lazy init 또는 axis config으로 해결. 순회 비용 발생 금지 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | M1 | NavList 그룹 데이터에서 ArrowDown 3회 | 첫 그룹 내 항목 3개를 순서대로 이동 | |
| V2 | M1 | NavList 그룹 데이터에서 Home/End | 전체 리스트의 첫/마지막 리프 항목으로 이동 | |
| V3 | M2 | Tree 초기 상태에서 ArrowDown | root 자식 사이에서만 이동, 손자 건너뜀 | |
| V4 | M3 | Tree 노드 expand 후 ArrowDown | expanded 노드의 자식으로 진입 | |
| V5 | M5 | 평면 리스트 ArrowDown | 기존 동작과 동일 (regression 없음) | |
| V6 | ④-3 | 3단 중첩 그룹 + entity 없음 | 전체 평탄화, 모든 리프 순회 가능 | |
| V7 | ④-4 | Tree 외부 sync로 새 노드 추가 | 새 노드는 기본 접힘 (자식 숨김) | |
| V8 | ④-6 | NavList 그룹에서 typeahead 검색 | 그룹 내 리프 항목이 검색 대상에 포함 | |
| V9 | S2 | expand 없는 패턴에서 노드 삭제 → focusRecovery | 포커스가 인접 노드로 복구 | |
| V10 | S5 | 기존 tree/treegrid/accordion 테스트 전체 통과 | regression 없음 | |

완성도: 🟡

---

**전체 완성도:** 🟡 8/8 (AI 초안 완료, 사용자 확인 전)
