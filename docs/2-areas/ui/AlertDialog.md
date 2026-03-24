# AlertDialog

> Modal dialog requiring explicit user confirmation before proceeding — no implicit dismiss.

## Demo

```tsx render
<ShowcaseDemo slug="alert-dialog" />
```

## Usage

```tsx
import { AlertDialog } from 'interactive-os/ui/AlertDialog'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    message: { id: 'message', data: { label: 'Are you sure?' } },
    confirm: { id: 'confirm', data: { label: 'Confirm' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
  },
  relationships: { __root__: ['message', 'confirm', 'cancel'] },
})

<AlertDialog data={data} onChange={setData} />
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
<ApgKeyboardTable slug="alert-dialog" />
```

## Accessibility

- pattern: alertdialog
- role: alertdialog
- childRole: group
- aria-modal: true

## Internals

### DOM 구조

```
div[role=alertdialog][aria-modal=true] container
  └─ div[role=group] item
```

### CSS

- 방식: CSS Modules
- 파일: AlertDialog.module.css
