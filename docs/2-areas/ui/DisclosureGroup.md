# DisclosureGroup

> A group of items that can independently expand or collapse.

## Demo

```tsx render
<ShowcaseDemo slug="disclosure-group" />
```

## Usage

```tsx
import { DisclosureGroup } from 'interactive-os/ui/DisclosureGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    general: { id: 'general', data: { label: 'General Settings' } },
    appearance: { id: 'appearance', data: { label: 'Appearance' } },
  },
  relationships: { __root__: ['general', 'appearance'] },
})

<DisclosureGroup data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="disclosure-group" />
```

## Accessibility

- pattern: disclosure
- role: region
- childRole: (div)

## Internals

### DOM 구조

```
div[role=region] container
  └─ div item
       ├─ chevron (▾/▸)
       └─ [aria-expanded] content
```

### CSS

- 방식: Global CSS
- 파일: 전역 스타일
