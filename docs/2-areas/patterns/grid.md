# grid

> 행과 열로 구성된 2D 그리드 탐색

## 스펙

| 속성 | 값 |
|------|-----|
| role | grid |
| childRole | row |
| focusStrategy | roving tabindex |
| selectionMode | single, multiple |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- select()
- `navigate(grid:{columns})`

Options:
- columns (required): 그리드 열 수

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowDown | 아래 행으로 이동 |
| ArrowUp | 위 행으로 이동 |
| ArrowRight | 다음 셀로 이동 |
| ArrowLeft | 이전 셀로 이동 |
| Home | 현재 행의 첫 셀로 이동 |
| End | 현재 행의 마지막 셀로 이동 |
| Ctrl+Home | 첫 행 첫 셀로 이동 |
| Ctrl+End | 마지막 행 마지막 셀로 이동 |
| PageDown | 한 페이지 아래로 이동 |
| PageUp | 한 페이지 위로 이동 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-rowindex | row index (1-based) |
| aria-selected | state.selected |
| aria-colindex | cell column index (1-based, on cells) |

## 관련

- UI: Grid
- 그룹: Collection
