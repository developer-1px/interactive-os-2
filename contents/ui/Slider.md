# Slider

> Continuous value selector with track and thumb, keyboard + pointer input.

## Demo

```tsx render
<ShowcaseDemo slug="slider" />
```

## Usage

```tsx
import { Slider } from 'interactive-os/ui/Slider'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    volume: { id: 'volume', data: { label: 'Volume' } },
  },
  relationships: { __root__: ['volume'] },
})

<Slider data={data} onChange={setData} min={0} max={100} step={1} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 슬라이더 데이터 |
| min | number | — | 최솟값 |
| max | number | — | 최댓값 |
| step | number | — | 증감 단위 |
| plugins | Plugin[] | [core(), history()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="slider" />
```

## Accessibility

- pattern: `slider({min, max, step})`
- role: slider
- childRole: —

## Internals

### DOM 구조

```
div.slider-item container
  └─ div.slider-track (click)
       ├─ div.slider-fill
       ├─ div.slider-thumb
       └─ span.slider-value
```

### CSS

- 방식: Global CSS
- 파일: 전역 스타일
