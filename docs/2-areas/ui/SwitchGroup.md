# SwitchGroup

> Toggle switches that can be independently turned on or off.

## Demo

```tsx render
<ShowcaseDemo slug="switch-group" />
```

## Usage

```tsx
import { SwitchGroup } from 'interactive-os/ui/SwitchGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    wifi: { id: 'wifi', data: { label: 'Wi-Fi' } },
    bluetooth: { id: 'bluetooth', data: { label: 'Bluetooth' } },
  },
  relationships: { __root__: ['wifi', 'bluetooth'] },
})

<SwitchGroup data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | AriaData | — | 스위치 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: AriaData) => void | — | 데이터 변경 콜백 |
| renderItem | (item, state) => ReactNode | — | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="switch-group" />
```

## Accessibility

- pattern: switchBehavior
- role: group
- childRole: (div)

## Internals

### DOM 구조

```
div[role=group] container
  └─ div item
       └─ indicator (●/○, expanded=checked)
```

### CSS

- 방식: Global CSS
- 파일: 전역 스타일
