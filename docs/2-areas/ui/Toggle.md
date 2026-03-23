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

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="toggle" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
