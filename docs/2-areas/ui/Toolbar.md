# Toolbar

> Horizontal (or vertical) row of action buttons with roving focus and toggle state.

## Demo

```tsx render
<ShowcaseDemo slug="toolbar" />
```

## Usage

```tsx
import { Toolbar } from 'interactive-os/ui/Toolbar'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
  },
  relationships: { __root__: ['bold', 'italic', 'underline'] },
})

<Toolbar data={data} onChange={setData} />
```

## Props

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="toolbar" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
