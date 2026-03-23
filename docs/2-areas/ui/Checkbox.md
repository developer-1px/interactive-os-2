# Checkbox

> A group of checkboxes that can be independently checked or unchecked.

## Demo

```tsx render
<ShowcaseDemo slug="checkbox" />
```

## Usage

```tsx
import { Checkbox } from 'interactive-os/ui/Checkbox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    terms: { id: 'terms', data: { label: 'Accept terms' } },
    newsletter: { id: 'newsletter', data: { label: 'Subscribe to newsletter' } },
  },
  relationships: { __root__: ['terms', 'newsletter'] },
})

<Checkbox data={data} onChange={setData} />
```

## Props

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="checkbox" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
