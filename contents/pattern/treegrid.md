# treegrid

> 계층 구조 + 셀 탐색이 결합된 트리 그리드

## APG Examples

### #66 Treegrid Email Inbox

```tsx render
<TreegridEmail />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | treegrid |
| childRole | row |
| focusStrategy | roving tabindex |
| selectionMode | multiple, extended |

## 축 조합

`composePattern(identity, ...axes)` 호출:
- select(multiple, extended)
- activate()
- expand(arrow)
- navigate(vertical)

## 키맵 요약

| 키 | 동작 |
|---|------|
| ArrowDown | 다음 행으로 이동 |
| ArrowUp | 이전 행으로 이동 |
| ArrowRight | 접힌 행 펼치기 / 다음 셀로 이동 |
| ArrowLeft | 펼친 행 접기 / 이전 셀로 이동 |
| Home | 현재 행의 첫 셀로 이동 |
| End | 현재 행의 마지막 셀로 이동 |
| Enter | 현재 항목 활성화 |
| Space | 현재 항목 선택 토글 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-selected | state.selected |
| aria-expanded | state.expanded |
| aria-level | depth (1-based) |
| aria-posinset | sibling index (1-based) |
| aria-setsize | sibling count |

## 관련

- UI: TreeGrid
- 그룹: Collection
