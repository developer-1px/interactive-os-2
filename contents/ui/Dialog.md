# Dialog

> Focus-trapping container for modal interactions with keyboard navigation.

## Demo

```tsx render
<ShowcaseDemo slug="dialog" />
```

## Usage

```tsx
import { Dialog } from 'interactive-os/ui/Dialog'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    confirm: { id: 'confirm', data: { label: 'Confirm' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
  },
  relationships: { __root__: ['confirm', 'cancel'] },
})

<Dialog data={data} onChange={setData} />
```

## Props

| prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| data | NormalizedData | — | 다이얼로그 항목 데이터 |
| plugins | Plugin[] | [core()] | 플러그인 배열 |
| onChange | (data: NormalizedData) => void | — | 데이터 변경 콜백 |
| renderItem | (props, item, state) => ReactElement | defaultRenderItem | 항목 커스텀 렌더러 |

## Keyboard

```tsx render
<ApgKeyboardTable slug="dialog" />
```

## Accessibility

- pattern: dialog
- role: dialog
- childRole: group

## Internals

### DOM 구조

```
div[role=dialog] container
  └─ div[role=group] item
```

### CSS

- 방식: CSS Modules
- 파일: Dialog.module.css
