# Axis Showcase Layer — PRD

> Discussion: axis decomposition(11개 공유 축)을 Plugin과 대등한 독립 레이어(`/axis/{name}`)로 승격. 각 축 = 최소 pattern 래핑 인터랙티브 데모.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 11개 공유 축 + composePattern이 완성된 상태 | 축 시스템을 이해하려는 사용자가 프로젝트에 진입 | 축별 독립 데모 페이지에서 해당 축의 키보드 동작만 체험할 수 있다 |
| 2 | Plugin 레이어가 store 능력(CRUD, DnD 등)을 개별 페이지로 보여주는 선례가 있음 | behavior 능력(nav, depth, select, activate)도 동일한 패턴으로 보여주고 싶음 | Axis 레이어가 Plugin과 대등한 ActivityBar 항목으로 존재한다 |
| 3 | "pattern = 축의 조합"이라는 핵심 개념이 코드에만 존재 | 이 개념을 시각적으로 전달하고 싶음 | 각 축 페이지에서 "이 축 하나만 넣은 최소 behavior"를 직접 조작할 수 있다 |

상태: 🟢

## 2. 인터페이스

> 산출물: 세로 리스트 기반 (대부분의 축). navGrid만 그리드 배치.

| 입력 | 조건 | 결과 |
|------|------|------|
| **↑** | navV, navVhUniform, navGrid, depthArrow(tree), selectExtended(Shift+↑) 페이지 | 이전 항목으로 포커스 이동 |
| **↓** | navV, navVhUniform, navGrid, depthArrow(tree), selectExtended(Shift+↓) 페이지 | 다음 항목으로 포커스 이동 |
| **←** | navH, navVhUniform, navGrid, depthArrow 페이지 | 축별 동작: navH=이전, depthArrow=접기/부모, navGrid=왼쪽 셀 |
| **→** | navH, navVhUniform, navGrid, depthArrow 페이지 | 축별 동작: navH=다음, depthArrow=펼치기/자식, navGrid=오른쪽 셀 |
| **Home** | navV, navH, navVhUniform, navGrid, selectExtended(Shift+Home) 페이지 | 첫 항목으로 이동 |
| **End** | navV, navH, navVhUniform, navGrid, selectExtended(Shift+End) 페이지 | 마지막 항목으로 이동 |
| **Enter** | activate, activateFollowFocus, depthEnterEsc 페이지 | 축별 동작: activate=활성화, depthEnterEsc=자식 진입 |
| **Escape** | focusTrap, depthEnterEsc 페이지 | 축별 동작: focusTrap=탈출, depthEnterEsc=부모 복귀 |
| **Space** | selectToggle, activate 페이지 | 축별 동작: selectToggle=선택 토글, activate=활성화 |
| **Shift+↑/↓** | selectExtended 페이지 | 범위 선택 확장/축소 |
| **Shift+Home/End** | selectExtended 페이지 | 현재~처음/끝까지 범위 선택 |
| **Tab** | N/A | 각 페이지 내 단일 Tab stop (roving-tabindex) |
| **클릭** | 모든 페이지 | 해당 항목에 포커스 이동 |
| **Cmd/Ctrl 조합** | N/A | 축 데모에서는 사용하지 않음 (plugin 영역) |
| **더블클릭** | N/A | 축 데모에서는 사용하지 않음 |

상태: 🟢

## 3. 산출물

### 라우트 구조

```
/axis/nav-v              — 세로 네비게이션
/axis/nav-h              — 가로 네비게이션
/axis/nav-vh-uniform     — 균일 4방향 네비게이션
/axis/nav-grid           — 2D 그리드 네비게이션
/axis/depth-arrow        — 화살표 깊이 탐색
/axis/depth-enter-esc    — Enter/Escape 깊이 탐색
/axis/select-toggle      — Space 토글 선택
/axis/select-extended    — Shift 범위 선택
/axis/activate           — Enter/Space 활성화
/axis/activate-follow-focus — 포커스 따라가기 활성화
/axis/focus-trap         — Escape 포커스 탈출
```

### 파일 구조

```
src/pages/axis/
├── PageNavV.tsx
├── PageNavH.tsx
├── PageNavVhUniform.tsx
├── PageNavGrid.tsx
├── PageDepthArrow.tsx
├── PageDepthEnterEsc.tsx
├── PageSelectToggle.tsx
├── PageSelectExtended.tsx
├── PageActivate.tsx
├── PageActivateFollowFocus.tsx
└── PageFocusTrap.tsx
```

### 각 페이지 구조 (Plugin 패턴 복제)

```
page-header    — 축 이름 + 한 줄 설명
page-keys      — 이 축이 바인딩하는 키 목록 (<kbd>)
card           — <Aria> + 최소 pattern(composePattern(minimal-meta, 해당축))
               — 독립 store + core() + focusRecovery()
```

### ActivityBar 등록

```
id: 'axis'
label: 'Axis'
icon: Axe (lucide-react)
basePath: '/axis/nav-v'
items: 11개 축 페이지
순서: Store → Engine → **Axis** → Navigation → Plugin → Collection → Components → Vision
이유: 축(원자) → 패턴(조합) → 플러그인(능력) → 컬렉션(완성품) 인과 순서
```

### 축별 최소 pattern 매핑

| 축 | 최소 metadata | 데모 데이터 형태 |
|---|---|---|
| navV | role: listbox, childRole: option, vertical | 5~7개 아이템 flat list |
| navH | role: toolbar, childRole: button, horizontal | 5~7개 아이템 flat list (가로 배치) |
| navVhUniform | role: radiogroup, childRole: radio, both | 5~7개 아이템 flat list |
| navGrid | role: grid, childRole: row, colCount: 3~4 | 3×4 그리드 |
| depthArrow | role: tree, childRole: treeitem, expandable | 2 depth tree (부모 3 + 자식 각 2~3) |
| depthEnterEsc | role: group, childRole: group, expandable | 2 depth 그룹 (spatial style) |
| selectToggle | role: listbox, childRole: option, selectionMode: multiple | 5~7개 아이템 flat list |
| selectExtended | role: listbox, childRole: option, selectionMode: multiple | 7~10개 아이템 flat list |
| activate | role: listbox, childRole: option | 5~7개 아이템 + 활성화 시 시각 피드백 |
| activateFollowFocus | role: tablist, childRole: tab, followFocus | 4~5개 탭 + 포커스 이동 시 자동 활성화 피드백 |
| focusTrap | role: dialog, childRole: group | 3~5개 아이템 + Escape 시 탈출 피드백 |

### 역PRD: 산출물 ↔ 코드 매핑

> axis-v2(5축 모델) 적용으로 11개 개별 페이지 → 6개 통합 데모로 수렴.

| 산출물 | 역PRD (실제 코드) |
|---|---|
| 축 데모 페이지 (navigate) | `src/pages/axis/NavigateDemo.tsx::NavigateDemo` |
| 축 데모 페이지 (select) | `src/pages/axis/SelectDemo.tsx::SelectDemo` |
| 축 데모 페이지 (activate) | `src/pages/axis/ActivateDemo.tsx::ActivateDemo` |
| 축 데모 페이지 (expand) | `src/pages/axis/ExpandDemo.tsx::ExpandDemo` |
| 축 데모 페이지 (dismiss) | `src/pages/axis/DismissDemo.tsx::DismissDemo` |
| 축 데모 페이지 (edit) | `src/pages/axis/EditDemo.tsx::EditDemo` |
| 데모 데이터 | `src/pages/axis/axis-demo-data.ts::axisListData, axisTreeData, axisGridData` |
| ActivityBar 등록 | `src/routeConfig.ts` (id: `internals/axis`, basePath: `/internals/axis/navigate`) |

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 축이 바인딩하지 않는 키 입력 | 아무 반응 없음 (void 반환 → no-op). 이것이 "이 축은 이 키만 담당한다"를 체험하는 핵심 |
| navH 페이지에서 ↑↓ 입력 | 무반응 — 가로 축만 활성 |
| selectToggle 페이지에서 ↑↓ 입력 | 무반응 — 선택 축만 활성 (nav 축 없음) |
| depthArrow 페이지에서 리프 노드에서 → | 자식 진입 불가 → void (no-op) |
| navGrid 페이지에서 마지막 셀 → | 다음 행 첫 셀로 이동 또는 no-op (?) |
| 빈 리스트 | 발생하지 않음 — 데모 데이터는 하드코딩 |
| focusTrap에서 Escape | 포커스 탈출 시각 피드백 (실제 dialog close는 아님) |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| 1 | 축 데모에 plugin keyMap(CRUD, clipboard, history 등) 추가 | 축의 순수 동작만 보여줘야 함. plugin은 Plugin 레이어의 영역 |
| 2 | 여러 축을 한 페이지에 조합하여 데모 | 각 축의 독립 동작을 체험하는 것이 목적. 조합은 Navigation/Collection 레이어가 담당 |
| 3 | 축 코드(src/interactive-os/axes/) 수정 | 쇼케이스는 기존 축을 그대로 사용. 축 자체를 바꾸지 않음 |
| 4 | 새 UI 컴포넌트 생성 | 기존 `<Aria>` + `<Aria.Item>` (+ `<Aria.Cell>` for grid)으로 충분 |
| 5 | barrel export | 프로젝트 규칙 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| 1 | ActivityBar에서 Axis 클릭 | `/axis/nav-v` 페이지 렌더링 |
| 2 | 각 11개 축 페이지 접근 | 페이지 렌더링 + 키보드 인터랙션 동작 |
| 3 | navV 페이지에서 ↑↓ Home End | 포커스 이동 동작 |
| 4 | navV 페이지에서 ←→ Space Enter | 무반응 (해당 축 범위 밖) |
| 5 | selectToggle 페이지에서 Space | 선택 토글 동작 |
| 6 | selectToggle 페이지에서 ↑↓ | 무반응 (nav 축 없음) |
| 7 | depthArrow 페이지에서 ←→ | 접기/펼치기/부모이동/자식이동 동작 |
| 8 | navGrid 페이지에서 4방향 키 | 2D 그리드 셀 이동 동작 |
| 9 | 기존 테스트(468+) 전부 통과 | 축 코드 변경 없으므로 regression 없음 |
| 10 | 각 페이지 page-keys가 해당 축의 키만 표시 | 다른 축의 키가 보이지 않음 |

상태: 🟢

---

**전체 상태:** 🟢 6/6
