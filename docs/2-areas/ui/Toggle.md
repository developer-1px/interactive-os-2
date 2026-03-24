# Toggle

> A single button that can be pressed or unpressed — a standalone on/off switch.

## Demo

```tsx render
<ShowcaseDemo slug="toggle" />
```

## Usage

```tsx
import { Toggle } from 'interactive-os/ui/Toggle'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    darkMode: { id: 'darkMode', data: { label: 'Dark Mode' } },
  },
  relationships: { __root__: ['darkMode'] },
})

<Toggle data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | NormalizedData | — | 토글 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: NormalizedData) => void | — | 데이터 변경 콜백 |
| renderItem | (props, item, state) => ReactElement | defaultRenderItem | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="toggle" />
```

## Accessibility

- pattern: switchPattern
- role: switch
- childRole: switch
- aria-checked: expanded 상태에 연동

## Internals

### DOM 구조

```
div[role=switch] container
  └─ div[role=switch] item
       ├─ span  label
       └─ span  indicator (On/Off)
```

### CSS

- 방식: CSS Modules
- 파일: Toggle.module.css
