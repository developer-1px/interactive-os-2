# tree

> 계층 구조를 탐색하는 트리 뷰

## Demo

```tsx render
<ShowcaseDemo slug="tree-view" />
```

## 스펙

| 속성 | 값 |
|------|-----|
| role | tree |
| childRole | treeitem |
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
| ArrowDown | 다음 보이는 항목으로 이동 |
| ArrowUp | 이전 보이는 항목으로 이동 |
| ArrowRight | 접힌 노드 펼치기 / 첫 자식으로 이동 |
| ArrowLeft | 펼친 노드 접기 / 부모로 이동 |
| Home | 첫 번째 항목으로 이동 |
| End | 마지막 보이는 항목으로 이동 |
| Enter | 현재 항목 활성화 |
| Space | 현재 항목 선택 토글 |
| * | 같은 레벨 모든 형제 펼치기 |

## ARIA 속성

| 속성 | 값 |
|------|-----|
| aria-selected | state.selected |
| aria-expanded | state.expanded |
| aria-level | depth (1-based) |
| aria-posinset | sibling index (1-based) |
| aria-setsize | sibling count |

## 관련

- UI: TreeView
- 그룹: Navigation
