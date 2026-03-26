# Accordion

> Vertically stacked headers that expand/collapse content sections.

## Demo

```tsx render
<ShowcaseDemo slug="accordion" />
```

## Usage

```tsx
import { Accordion } from 'interactive-os/ui/Accordion'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    q1: { id: 'q1', data: { label: 'What is interactive-os?' } },
    q2: { id: 'q2', data: { label: 'How does the store work?' } },
  },
  relationships: { __root__: ['q1', 'q2'] },
})

<Accordion data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 아코디언 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="accordion" />
```

## Accessibility

- pattern: accordion
- role: region
- childRole: (내부 FocusScrollDiv)

## Internals

### DOM 구조

```
div[role=region] container
  └─ FocusScrollDiv
       └─ span.accordion-inner
            ├─ chevron (+/−)
            └─ label
```

### CSS

- 방식: Global CSS
- 파일: 전역 스타일
