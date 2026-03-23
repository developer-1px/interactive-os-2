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

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="dialog" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
