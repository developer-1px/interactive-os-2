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

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="alert-dialog" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
