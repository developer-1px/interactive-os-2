# Navigation/Collection ActivityBar Restructure

> 작성일: 2026-03-17

## Problem

현재 ActivityBar는 코드 아키텍처 레이어 순서(Plugins → Behaviors)로 구성되어 있다. 그러나 ARIA 관점에서 위젯은 두 카테고리로 나뉜다:

1. **Navigation** — focus/tab/arrow/selection/expand만으로 충분한 위젯 (accordion, tabs, menu 등)
2. **Collection** — CRUD/clipboard/history/dnd가 의미 있는 위젯 (treegrid, listbox, grid, combobox)

이 개념적 구분이 쇼케이스 탐색 순서에 반영되지 않고 있다.

## Design

### ActivityBar 순서 변경

**Before:**
```
Viewer | Store | Engine | Plugins | Behaviors | Vision
```

**After:**
```
Viewer | Store | Engine | Navigation | Collection | Vision
```

- `Plugins` 그룹 삭제 — Collection에 흡수
- `Behaviors` 그룹 삭제 — Navigation + Collection으로 분할

### Navigation 그룹

- id: `navigation`
- icon: `Compass` (lucide-react)
- basePath: `/navigation/accordion`
- 정렬 기준: 인터랙션 복잡도 순 (단일 토글 → 리스트형 → 모달형)
- items:
  - accordion (ready)
  - disclosure (ready)
  - switch (ready)
  - tabs (ready)
  - radiogroup (ready)
  - menu (ready)
  - toolbar (ready)
  - dialog (ready)
  - alertdialog (ready)

### Collection 그룹

- id: `collection`
- icon: `Layers` (lucide-react)
- basePath: `/collection/treegrid`
- items:
  - treegrid (ready)
  - listbox (ready)
  - grid (ready)
  - combobox (wip)
  - crud (placeholder)
  - clipboard (placeholder)
  - history (placeholder)
  - dnd (placeholder)
  - rename (placeholder)

### 라우트 매핑

| Before | After |
|--------|-------|
| `/behaviors/accordion` | `/navigation/accordion` |
| `/behaviors/disclosure` | `/navigation/disclosure` |
| `/behaviors/tabs` | `/navigation/tabs` |
| `/behaviors/radiogroup` | `/navigation/radiogroup` |
| `/behaviors/switch` | `/navigation/switch` |
| `/behaviors/dialog` | `/navigation/dialog` |
| `/behaviors/alertdialog` | `/navigation/alertdialog` |
| `/behaviors/toolbar` | `/navigation/toolbar` |
| `/behaviors/menu` | `/navigation/menu` |
| `/behaviors/treegrid` | `/collection/treegrid` |
| `/behaviors/listbox` | `/collection/listbox` |
| `/behaviors/grid` | `/collection/grid` |
| `/behaviors/combobox` | `/collection/combobox` |
| `/plugins/core` | 삭제 (core는 plugin이 아님) |
| `/plugins/crud` | `/collection/crud` |
| `/plugins/clipboard` | `/collection/clipboard` |
| `/plugins/rename` | `/collection/rename` |
| `/plugins/dnd` | `/collection/dnd` |
| (없음) | `/collection/history` (추가) |

### history 네이밍 충돌 참고

`/engine/history`(Command dispatch 이력 시각화)와 `/collection/history`(history plugin 데모)는 서로 다른 페이지. sidebar에서 그룹명(Engine vs Collection)으로 구분되므로 충돌 없음.

### 변경 범위

**수정: `src/App.tsx` 단일 파일**
- `routeConfig` 배열: plugins/behaviors → navigation/collection 재구성
- import: `Plug`, `Keyboard` → `Compass`, `Layers`
- 페이지 컴포넌트 import 동일 (파일 이동 없음)

**수정: `docs/PROGRESS.md`**
- App Shell 섹션의 ActivityBar 그룹명 업데이트 (Plugins/Behaviors → Navigation/Collection)

**미수정:**
- 페이지 컴포넌트 파일 (PageTreeGrid 등)
- CSS (그룹 수 동일, 레이아웃 변경 불필요)
- 라이브러리 코드 (src/interactive-os/)

## Rationale

- ARIA에서 navigation이 기본, collection 조작은 확장이라는 자연 순서 반영
- "Plugins"라는 그룹명이 사라지고, plugin 데모가 Collection 안에서 자연스럽게 노출
- `core` plugin은 모든 위젯의 필수 기능이므로 별도 데모 불필요 — 삭제
- 최소 변경 (App.tsx 단일 파일)으로 개념적 구조 개선
