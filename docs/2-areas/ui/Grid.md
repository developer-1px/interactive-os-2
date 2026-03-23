# Grid

> 2차원 그리드 — 컬럼 정의 기반 셀 렌더링

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 그리드 행 데이터 |
| columns | ColumnDef[] | — | 컬럼 정의 배열 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderCell | (cell, row, col) => ReactNode | — | 셀 커스텀 렌더러 |
| aria-label | string | — | 그리드 접근성 라벨 |

## behavior 대응

- pattern: `grid({columns})`
- role: grid
- childRole: row > gridcell

## DOM 구조

```
div[role=grid] container
  └─ div[role=row] row
       └─ Aria.Cell[role=gridcell, aria-colindex] cell
```

## CSS

- 방식: CSS Modules
- 파일: Grid.module.css
