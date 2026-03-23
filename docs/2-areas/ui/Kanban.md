# Kanban

> 칸반 보드 — useAria() + AriaInternalContext 직접 사용 (lower-level)

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 칸반 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| aria-label | string | — | 보드 접근성 라벨 |

## behavior 대응

- pattern: kanban
- role: (커스텀 — useAria() + AriaInternalContext 직접 사용)
- childRole: (column > card)

## DOM 구조

```
div.kanban-board(row) container
  └─ div.kanban-column
       ├─ header FocusDiv
       ├─ cards FocusDiv
       └─ Aria.Editable
```

## CSS

- 방식: Global CSS
- 파일: kanban.css
