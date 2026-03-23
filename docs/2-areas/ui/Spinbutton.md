# Spinbutton

> Numeric input with increment/decrement buttons and keyboard control.

## Demo

```tsx render
<ShowcaseDemo slug="spinbutton" />
```

## Usage

```tsx
import { Spinbutton } from 'interactive-os/ui/Spinbutton'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    quantity: { id: 'quantity', data: { label: 'Quantity' } },
  },
  relationships: { __root__: ['quantity'] },
})

<Spinbutton data={data} onChange={setData} min={0} max={99} step={1} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 스핀버튼 데이터 |
| min | number | — | 최솟값 |
| max | number | — | 최댓값 |
| step | number | — | 증감 단위 |
| plugins | Plugin[] | [core(), history()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| label | string | — | 접근성 라벨 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="spinbutton" />
```

## Accessibility

- pattern: `spinbutton({min, max, step})`
- role: spinbutton
- childRole: —

## Internals

### DOM 구조

```
div.spinbutton-item container
  └─ div.spinbutton-group
       ├─ button (−)
       ├─ input / div.spinbutton-value
       └─ button (+)
```

### Features

- 편집 모드: click -> input 전환
- 유효성 검증: min/max 범위 체크
- aria-disabled: min/max 도달 시 버튼 비활성화

### CSS

- 방식: Global CSS
- 파일: 전역 스타일
