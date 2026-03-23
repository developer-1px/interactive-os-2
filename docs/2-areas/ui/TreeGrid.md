# TreeGrid

> Hierarchical tree with grid-like keyboard navigation and expand/collapse.

## Demo

```tsx render
<ShowcaseDemo slug="tree-grid" />
```

## Usage

```tsx
import { TreeGrid } from 'interactive-os/ui/TreeGrid'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    src: { id: 'src', data: { name: 'src' } },
    components: { id: 'components', data: { name: 'components' } },
    'app-tsx': { id: 'app-tsx', data: { name: 'App.tsx' } },
  },
  relationships: {
    __root__: ['src'],
    src: ['components', 'app-tsx'],
  },
})

<TreeGrid data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 트리그리드 항목 데이터 |
| plugins | Plugin[] | [core(), history()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |
| enableEditing | boolean | — | Delete, F2, Alt+↑↓←/→ 리오더+인덴트 활성화 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="tree-grid" />
```

## Accessibility

- pattern: treegrid
- role: treegrid
- childRole: row > gridcell

## Internals

### DOM 구조

```
div[role=treegrid] container
  └─ div[role=row] row
       └─ div[role=gridcell] cell
```

### CSS

- 방식: CSS Modules
- 파일: TreeView.module.css (TreeView와 공유)
