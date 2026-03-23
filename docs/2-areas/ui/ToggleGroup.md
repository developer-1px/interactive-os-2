# ToggleGroup

> Row of toggle buttons where multiple can be active simultaneously — like Bold/Italic/Underline.

## Demo

```tsx render
<ShowcaseDemo slug="toggle-group" />
```

## Usage

```tsx
import { ToggleGroup } from 'interactive-os/ui/ToggleGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
  },
  relationships: { __root__: ['bold', 'italic', 'underline'] },
})

<ToggleGroup data={data} onChange={setData} />
```

## Props

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="toggle-group" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
