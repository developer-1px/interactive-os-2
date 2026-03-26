# RadioGroup

> Single-select group where only one option can be active at a time.

## Demo

```tsx render
<ShowcaseDemo slug="radio-group" />
```

## Usage

```tsx
import { RadioGroup } from 'interactive-os/ui/RadioGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    small: { id: 'small', data: { label: 'Small' } },
    medium: { id: 'medium', data: { label: 'Medium' } },
    large: { id: 'large', data: { label: 'Large' } },
  },
  relationships: { __root__: ['small', 'medium', 'large'] },
})

<RadioGroup data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 라디오 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="radio-group" />
```

## Accessibility

- pattern: radiogroup
- role: radiogroup
- childRole: radio

## Internals

### DOM 구조

```
div[role=radiogroup] container
  └─ div[role=radio, aria-checked] item
       └─ indicator (◉/○)
```

### CSS

- 방식: Global CSS
- 파일: 전역 스타일
