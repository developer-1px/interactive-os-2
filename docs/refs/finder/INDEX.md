# Finder Reference Index

> macOS Finder 스샷을 design-loop의 reference로 사용. 각 png가 viewer의 어떤 zone과 매핑되는지, 어떤 ax 영역을 후보로 갖는지 명시.

## Files

| File | Zones | View Mode | Notes |
|------|-------|-----------|-------|
| `01-list-view-full-toolbar.png` | sidebar, toolbar(full), column-header, treegrid | List | 4 view-mode 토글 풀 노출 |
| `02-list-view-search.png` | toolbar(search-active) | List | 검색 활성 시 view-mode 축소 (progressive disclosure) |
| `03-column-view-preview.png` | sidebar, miller-columns, preview | Column | preview = thumbnail + 정보 표 + bottom action bar |

## Zone × ax 단서 매핑

| Zone | 핵심 시각 단서 | 추정 ax 영역 |
|------|------------|-----------|
| sidebar | 그룹 라벨 caption + tone-dim, row 작은 아이콘+텍스트, hover bg subtle, 최상단 그룹 위에 약한 separator | NavList + ListItem + groupLabel ax |
| toolbar | overlay glass cluster, view-mode 토글 4개 그룹, search expanded variable width, sort menu 분리 | FinderToolbar control-group.overlay |
| column-header | 굵기 약한 헤더 + sort affordance, divider thin, "오늘"/"어제" 그룹 sticky | TreeGrid header (현재 SortBarWidget) |
| treegrid | row 작은 아이콘 (16px), 텍스트 1줄, 종류/시간 caption tone-dim, row hover subtle | TreeGrid + FileIcon |
| preview | thumbnail surface raised, 정보 표 caption(label) × body(value), bottom action bar (회전/마크업/기타) | FilePanel (도메인) |
| miller-columns | column 좁고 밀집, 선택 강조 강한 selected bg, divider very thin | MillerColumns |

## Heuristics (Refactoring UI 7원리 + Nielsen 압축)

1. **위계** — primary text vs secondary tone-dim. 같은 row 안에서도 이름 강 / 종류·시간 약
2. **대비** — actionable surface(toolbar 클러스터) raised/overlay, container(sidebar/treegrid) base
3. **정렬** — flex bar 끝맞춤, gap 일관 (xs/sm/md 3단)
4. **일관성** — 같은 의미 = 같은 ax 조합. group label 모두 caption + tone-dim
5. **여백** — padding 콘텐츠 ≥ 입력 ≥ 바. row padding tight (xs)
6. **색 절약** — accent 1채널(selection blue), neutral 다수
7. **깊이** — overlay/raised는 actionable에만 (Liquid Glass target = 누르는 것)

#kind/note
