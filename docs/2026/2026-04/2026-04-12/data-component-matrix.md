---
id: 2-areas/distribution/data-component-matrix
type: note
slug: dataComponentMatrix
title: 'Data → Component Matrix'
tags: [untagged]
created: 2026-04-12
updated: 2026-04-12
summary: 'ARIA OS LLM-facing 카탈로그 SSOT. LLM이 요구사항으로부터 데이터 형태를 식별하면, 이 표가 사용할 컴포넌트를 가리킨다. aria.md(시스템 프롬프트)가 이 매트릭스를 직접 인용한다.'
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Data → Component Matrix

> ARIA OS LLM-facing 카탈로그 SSOT. LLM이 요구사항으로부터 데이터 형태를 식별하면, 이 표가 사용할 컴포넌트를 가리킨다. aria.md(시스템 프롬프트)가 이 매트릭스를 직접 인용한다.

## 사용법

LLM은 3단계로 매트릭스를 소비한다:

1. **요구사항 → 데이터 형태**: 사용자의 자연어를 12 데이터 형태 중 하나로 분류
2. **데이터 형태 → 1차 컴포넌트**: 매트릭스의 1차 추천을 사용
3. **변형이 필요할 때만 → 2차**: 사용자 요구가 명확히 다르면 2차 옵션 사용

매트릭스에 없는 형태(차트/네트워크 그래프 등)는 ui 카탈로그의 갭이다. 그 자리에 임시 변환 시도 → 안 되면 사용자에게 부재를 알린다.

---

## 매트릭스

| # | 데이터 형태 | 예시 | 1차 컴포넌트 | 2차 / 대안 | aria-os/ui import |
|---|----------|------|-----------|----------|-----|
| 1 | **트리 (parent-child)** | 파일 탐색기, 카테고리 | `TreeView` | `TreeGrid` (속성 컬럼 필요 시) | `TreeView`, `TreeGrid` |
| 2 | **평면 list, 단일 선택** | 아이템 선택, 사이드바 | `ListBox` | `RadioGroup` (≤7개, 동시 표시) | `ListBox`, `RadioGroup` |
| 3 | **평면 list, 다중 선택** | 태그 선택, 필터 | `ListBox` (multi 모드) | `SwitchGroup`, `CheckboxMixed` | `ListBox`, `SwitchGroup` |
| 4 | **그룹화 list** | 카테고리별 메뉴 | `ListBoxGrouped` | `Accordion` | `ListBoxGrouped` |
| 5 | **표 (행 × 열)** | 이슈 트래커, 데이터 그리드 | `Grid` | `Table` (읽기 전용 단순 표) | `Grid`, `Table` |
| 6 | **단계형 진행** | 마법사, 탭 패널 | `TabList` (auto select) | `TabList(manual)`, `Accordion` | `TabList` |
| 7 | **확장/축소 섹션** | FAQ, 설정 그룹 | `Accordion` | `DisclosureGroup` (독립 여러 개) | `Accordion`, `DisclosureGroup` |
| 8 | **Boolean 토글** | 단일 on/off 설정 | `Toggle` | `Checkbox`, `Switch` (form 안) | `Toggle`, `Checkbox` |
| 9 | **Boolean × 그룹** | 권한 매트릭스 | `SwitchGroup` | `CheckboxMixed` (parent/child) | `SwitchGroup` |
| 10 | **상호배타 액션** | 정렬 방향, 뷰 모드 | `ToggleGroup` | `ButtonToggle`, `RadioGroup` | `ToggleGroup` |
| 11 | **범위 수치** | 볼륨, 슬라이더 입력 | `Slider` | `Spinbutton` (정확한 수치) | `Slider`, `Spinbutton` |
| 12 | **자유 텍스트 + 옵션** | 자동완성, 검색 | `Combobox` | — | `Combobox` |
| 13 | **칸반 (상태 × 아이템)** | 작업 보드, 워크플로우 | `Kanban` | — | `Kanban` |
| 14 | **날짜** | 일정, 마감일 | `DatePicker` | `CalendarGrid` (인라인) | `DatePicker`, `CalendarGrid` |
| 15 | **알림 (영구)** | 페이지 내 경고 | `Alert` | `Feed` (시간순 누적) | `Alert`, `Feed` |
| 16 | **알림 (휘발)** | 토스트, 스낵바 | `Toaster` | `Tooltip` (호버 힌트) | `Toaster`, `Tooltip` |
| 17 | **모달 결정** | 확인/취소 다이얼로그 | `AlertDialog` | `Dialog` (양식 모달) | `AlertDialog`, `Dialog` |
| 18 | **메뉴 (단일 트리거)** | 컨텍스트 메뉴, 드롭다운 | `MenuList` | `MenuButton` (트리거 묶음) | `MenuList`, `MenuButton` |
| 19 | **메뉴바 (수평 다중)** | 앱 상단 메뉴 | `Menubar` | — | `Menubar` |
| 20 | **툴바** | 편집기 액션 그룹 | `Toolbar` | `ButtonToolbar` | `Toolbar`, `ButtonToolbar` |
| 21 | **양식 (필드 그룹)** | 회원가입, 설정 페이지 | `Form` | — | `Form` |
| 22 | **공간 탐색 (2D)** | 그리드 카드, 마인드맵 | `SpatialView` | — | `SpatialView` |
| 23 | **진행도/측정값** | 다운로드 진행, KPI | `Meter` | — | `Meter` |
| 24 | **링크 (네비게이션)** | 사이드바 항목, 브레드크럼 | `Link` | `Breadcrumb` | `Link`, `Breadcrumb` |
| 25 | **분할 패널 (리사이즈)** | 에디터 + 프리뷰 | `WindowSplitter` | — | `WindowSplitter` |
| 26 | **셀렉션 오버레이** | 다중 선택 드래그 | `SelectionOverlay` | — | `SelectionOverlay` |

---

## 데이터 형태 식별 트리 (LLM 결정)

```
요구사항에 "선택"이 있나?
├─ 단일 선택
│  ├─ 옵션이 트리 구조 → #1 트리
│  ├─ 옵션이 평면 list → #2 평면 단일
│  └─ 상호배타 액션 → #10 ToggleGroup
├─ 다중 선택
│  ├─ 평면 → #3 평면 다중
│  └─ 그룹화 → #4 그룹화 list
└─ 선택 없음 → 아래

요구사항에 "데이터 그리드"가 있나?
├─ Yes (행/열) → #5 Grid/Table
└─ No → 아래

요구사항에 "입력"이 있나?
├─ 텍스트 → #12 Combobox 또는 Form 안 TextField
├─ Boolean → #8 Toggle
├─ 수치 (범위) → #11 Slider
├─ 날짜 → #14 DatePicker
└─ 양식 (다중 필드) → #21 Form

요구사항에 "탐색/이동"이 있나?
├─ 트리 탐색 → #1 트리
├─ 페이지 전환 → #6 TabList
├─ 펼침/축소 → #7 Accordion
├─ 메뉴 → #18 MenuList / #19 Menubar
└─ 링크 → #24 Link

요구사항에 "알림/피드백"이 있나?
├─ 영구 (페이지 안) → #15 Alert
├─ 휘발 (토스트) → #16 Toaster
├─ 사용자 결정 필요 → #17 AlertDialog
└─ 호버 힌트 → Tooltip

요구사항에 "보드/칸반"이 있나?
└─ Yes → #13 Kanban

요구사항이 위 어디에도 안 맞나?
└─ 매트릭스 빈칸 — 가장 가까운 형태로 변환하거나 사용자에게 ui 부재 알림
```

---

## 매트릭스 빈칸 (식별된 갭)

ui 카탈로그가 아직 커버하지 못하는 데이터 형태:

| 형태 | 사용 사례 | 임시 대응 | 후속 plan |
|------|---------|---------|---------|
| **차트/메트릭** | 라인/바/도넛 차트 | 사용자에게 알림 | `project_metric_component_gap` 참조 |
| **그래프/네트워크** | 노드/엣지 시각화 | `SpatialView` 임시 사용 | TBD |
| **타임라인** | 가로 시간축 이벤트 | `Feed` (수직 대체) | TBD |
| **지도** | 지리적 시각화 | 사용자에게 알림 | TBD |
| **리치 텍스트 에디터** | WYSIWYG | `Form` + textarea (아주 단순한 경우) | TBD |
| **이미지/비디오 갤러리** | 미디어 그리드 | `Grid` + custom cells | TBD |
| **실시간 협업 커서** | 멀티유저 표시 | 없음 | TBD |

빈칸이 식별되면 새 ui 컴포넌트 추가 PR을 트리거한다. 빈칸을 채우는 PR은 (1) 컴포넌트 추가 (2) 본 매트릭스 갱신 (3) aria.md 회귀 (4) evals 통과 4개를 동시에 해야 한다.

---

## ARIA props 압축표

모든 ui 컴포넌트는 `AriaComponentProps` (`aria-os/ui`의 type export)를 확장한다. 공통 props:

| Prop | 타입 | 설명 |
|------|------|------|
| `data` | `NormalizedData` | 컴포넌트가 렌더할 데이터. `aria-os/schema`에서 가져옴 |
| `onChange?` | `(data) => void` | 데이터 변경 콜백 |
| `plugins?` | `Plugin[]` | crud / history / clipboard / dnd 등 옵트인 |
| `renderItem?` | `RenderItem` | 사용자 정의 아이템 렌더러 (선택) |
| `itemSlots?` | `ItemSlots` | icon, rightContent 등 슬롯 |
| `onActivate?` | `(id) => void` | Enter/double-click 콜백 |
| `onFocusChange?` | `(id \| null) => void` | 포커스 이동 콜백 |
| `className?` | `string` | 컨테이너 클래스 |
| `'aria-label'?` | `string` | 접근성 라벨 |

LLM은 위 9개 prop만 알면 90%의 케이스를 커버한다. 나머지(컴포넌트별 특수 prop)는 `aria-os/ui` TypeScript 타입에서 가져온다.

---

## FlatLayout 9 변형

`aria-os/layout`의 `definePage()`로 화면을 배치한다. LayoutNode 9 종류:

| 타입 | 용도 | 핵심 prop |
|------|------|---------|
| `split` | 좌우/상하 2분할 | `direction: 'horizontal'\|'vertical'`, `sizes: number[]` |
| `stack` | 세로 흐름 | `gap: 'sm'\|'md'\|'lg'` |
| `bar` | 가로 정렬 (헤더/툴바) | `justify: 'start'\|'center'\|'between'\|'end'` |
| `grid` | NxM 그리드 | `columns: 2..7`, `gap` |
| `nav` | 사이드바 + 본문 | `sidebarWidth: 0..1` |
| `tab` | 탭 컨테이너 | (탭 자식들) |
| `section` | 제목 묶음 | `title`, `count?` |
| `widget` | 실 컴포넌트 인스턴스 | `widget: '<name>'`, `props` |
| `overlay` | 모달/팝업 | `overlayType: 'modal'\|'popup'\|'hint'`, `trigger`, `visible` |

LLM은 widget 노드에 매트릭스 1차 컴포넌트 이름(`'TreeGrid'`, `'ListBox'` 등)을 넣는다. widgetRegistry가 컴포넌트 이름 → React 컴포넌트로 해석.

---

## 갱신 정책

이 파일은 ui 카탈로그의 SSOT다. 새 ui 컴포넌트가 추가되면 동시에 본 매트릭스에 행을 추가해야 한다. 매트릭스가 stale하면 LLM 생성 정확도가 떨어진다.

CI 검증:
- 매트릭스의 컴포넌트명이 모두 `aria-os/ui` 실 export와 매칭되는지
- aria.md(Plan 5)의 인용이 본 파일과 일치하는지
- 매트릭스 빈칸 표는 갭이 해결되면 갱신

#kind/note #topic/distribution
