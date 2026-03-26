# Checkbox

> A group of checkboxes that can be independently checked or unchecked.

## Demo

```tsx render
<ShowcaseDemo slug="checkbox" />
```

## Usage

```tsx
import { Checkbox } from 'interactive-os/ui/Checkbox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    terms: { id: 'terms', data: { label: 'Accept terms' } },
    newsletter: { id: 'newsletter', data: { label: 'Subscribe to newsletter' } },
  },
  relationships: { __root__: ['terms', 'newsletter'] },
})

<Checkbox data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | NormalizedData | — | 체크박스 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: NormalizedData) => void | — | 데이터 변경 콜백 |
| renderItem | (props, item, state) => ReactElement | defaultRenderItem | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="checkbox" />
```

## Accessibility

- pattern: switch
- role: switch
- childRole: switch
- aria-checked: expanded 상태에 연동

## Internals

### DOM 구조

```
div[role=switch] container
  └─ div[role=switch][aria-checked] item
       ├─ span.box / span.boxChecked (체크 인디케이터)
       └─ span (label)
```

### CSS

- 방식: CSS Modules
- 파일: Checkbox.module.css
