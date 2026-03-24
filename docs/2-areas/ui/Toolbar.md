# Toolbar

> Horizontal (or vertical) row of action buttons with roving focus and toggle state.

## Demo

```tsx render
<ShowcaseDemo slug="toolbar" />
```

## Usage

```tsx
import { Toolbar } from 'interactive-os/ui/Toolbar'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
  },
  relationships: { __root__: ['bold', 'italic', 'underline'] },
})

<Toolbar data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | NormalizedData | — | 툴바 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: NormalizedData) => void | — | 데이터 변경 콜백 |
| onActivate | (nodeId: string) => void | — | 항목 활성화 콜백 |
| renderItem | (props, item, state) => ReactElement | defaultRenderItem | 항목 커스텀 렌더러 |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | 배치 방향 (vertical 시 Arrow Up/Down 키맵으로 전환) |

## Keyboard

```tsx render
<ApgKeyboardTable slug="toolbar" />
```

## Accessibility

- pattern: toolbar
- role: toolbar
- childRole: button
- aria-pressed: selected 상태에 연동

## Internals

### DOM 구조

```
div[role=toolbar] container
  └─ span[role=button] item
```

### CSS

- 방식: CSS Modules
- 파일: Toolbar.module.css
