# Grid

> Two-dimensional data grid with row/cell keyboard navigation.

## Demo

```tsx render
<ShowcaseDemo slug="grid" />
```

## Usage

```tsx
import { Grid } from 'interactive-os/ui/Grid'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    r1: { id: 'r1', data: { cells: ['Alice', 'Engineer', 'NYC'] } },
    r2: { id: 'r2', data: { cells: ['Bob', 'Designer', 'SF'] } },
  },
  relationships: { __root__: ['r1', 'r2'] },
})

<Grid
  data={data}
  onChange={setData}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
    { key: 'city', header: 'City' },
  ]}
/>
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 그리드 행 데이터 |
| columns | ColumnDef[] | — | 컬럼 정의 배열 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderCell | (cell, row, col) => ReactNode | — | 셀 커스텀 렌더러 |
| aria-label | string | — | 그리드 접근성 라벨 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="grid" />
```

## Accessibility

- pattern: `grid({columns})`
- role: grid
- childRole: row > gridcell

## Internals

### DOM 구조

```
div[role=grid] container
  └─ div[role=row] row
       └─ Aria.Cell[role=gridcell, aria-colindex] cell
```

### CSS

- 방식: CSS Modules
- 파일: Grid.module.css
