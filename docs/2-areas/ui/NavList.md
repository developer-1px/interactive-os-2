# NavList

> Vertical navigation list with keyboard navigation and followFocus activation.

## Demo

```tsx render
<ShowcaseDemo slug="navlist" />
```

## Usage

```tsx
import { NavList } from 'interactive-os/ui/NavList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    home: { id: 'home', data: { label: 'Home' } },
    about: { id: 'about', data: { label: 'About' } },
  },
  relationships: { __root__: ['home', 'about'] },
})

<NavList data={data} onActivate={(id) => navigate(id)} />
```

## Props

| prop | type | default | description |
|------|------|---------|-------------|

## Keyboard

```tsx render
<ApgKeyboardTable slug="navlist" />
```

## Accessibility

<!-- TODO -->

## Internals

<!-- TODO -->
