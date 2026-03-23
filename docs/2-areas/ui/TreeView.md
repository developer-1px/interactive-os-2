# TreeView

> Hierarchical tree with expand/collapse, used for navigation outlines.

## Demo

```tsx render
<ShowcaseDemo slug="tree-view" />
```

## Usage

```tsx
import { TreeView } from 'interactive-os/ui/TreeView'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    docs: { id: 'docs', data: { name: 'docs' } },
    readme: { id: 'readme', data: { name: 'README.md' } },
    guide: { id: 'guide', data: { name: 'guide.md' } },
  },
  relationships: {
    __root__: ['docs'],
    docs: ['readme', 'guide'],
  },
})

<TreeView data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 트리 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="tree-view" />
```

## Accessibility

- pattern: tree
- role: tree
- childRole: treeitem

## Internals

### DOM 구조

```
div[role=tree] container
  └─ div[role=treeitem, aria-level] item
       ├─ chevron (▾/▸)
       └─ (recursive renderNodes)
```

### CSS

- 방식: CSS Modules
- 파일: TreeView.module.css
