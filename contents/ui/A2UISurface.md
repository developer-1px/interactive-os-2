# A2UI Surface

> Renders A2UI protocol JSON payloads using interactive-os UI components with full ARIA keyboard support.

## Demo

```tsx render
<A2UISurfaceDemo />
```

## Architecture

A2UI (Agent-to-UI) is a declarative protocol where AI agents emit JSON describing UI components. A2UISurface transforms this JSON into our native UI components, automatically gaining keyboard navigation and screen reader support through the axis system.

```
A2UI JSON (flat component list)
  → a2uiAdapter: flatList → NormalizedData
  → A2UISurface: componentMap → React tree
    → ListBox, TabList, Slider, Button...
      → axis system adds ↑↓←→ keyboard navigation
```

## Supported A2UI Components

| A2UI Type | Our Component | Keyboard |
|-----------|--------------|----------|
| Text | MarkdownViewer | — |
| Row / Column | ax() layout | — |
| Card | ax() surface | — |
| Button | Button | Enter/Space |
| List | ListBox | ↑↓ navigate, Space select |
| Tabs | TabList | ←→ navigate |
| TextField | TextInput | standard input |
| CheckBox | Checkbox | Space toggle |
| Slider | Slider | ←→ adjust |
| ChoicePicker | RadioGroup | ↑↓ navigate |
| DateTimeInput | TextInput (date) | standard input |
| Modal | ax() overlay | — |
| Divider | hr | — |
| Image | img | — |
| *Unknown* | Fallback (JSON preview) | — |

## Usage

```tsx
import { A2UISurface } from 'interactive-os/ui/A2UISurface'

const payload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'list'] },
    { id: 'title', component: 'Text', text: 'Hello', variant: 'h2' },
    { id: 'list', component: 'List', children: ['a', 'b'] },
    { id: 'a', component: 'Text', text: 'Item A', label: 'Item A' },
    { id: 'b', component: 'Text', text: 'Item B', label: 'Item B' },
  ],
}

<A2UISurface payload={payload} />
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `payload` | `A2UIPayload` | A2UI JSON with `components` array and optional `dataModel` |
| `componentMap` | `A2UIComponentMap` | Override or extend the default component map |
