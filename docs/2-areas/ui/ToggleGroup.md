# ToggleGroup

> Row of toggle buttons where multiple can be active simultaneously — like Bold/Italic/Underline.

## Demo

```tsx render
<ShowcaseDemo slug="toggle-group" />
```

## Usage

```tsx
import { ToggleGroup } from 'interactive-os/ui/ToggleGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
  },
  relationships: { __root__: ['bold', 'italic', 'underline'] },
})

<ToggleGroup data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | NormalizedData | — | 토글 그룹 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: NormalizedData) => void | — | 데이터 변경 콜백 |
| renderItem | (props, item, state) => ReactElement | defaultRenderItem | 항목 커스텀 렌더러 |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | 배치 방향 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="toggle-group" />
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
  └─ div[role=button] item
       ├─ span  indicator (● / ○)
       └─ span  label
```

### CSS

- 방식: CSS Modules
- 파일: ToggleGroup.module.css
