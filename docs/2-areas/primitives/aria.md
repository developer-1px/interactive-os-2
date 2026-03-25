# \<Aria\>

The compound component that wires behavior, data, and plugins together.
Drop in a behavior preset and get keyboard interaction automatically.

```tsx render
<AriaListboxDemo />
```

## Usage

```tsx
<Aria
  behavior={listbox}     // ARIA pattern preset
  data={store}           // NormalizedData
  plugins={[core()]}     // Plugin composition
  onChange={setData}      // State callback
  aria-label="My list"
>
  <Aria.Item render={(node, state) => (
    <div>{node.data.label}</div>
  )} />
</Aria>
```

## NodeState fields

```ts
interface NodeState {
  focused: boolean      // Currently focused node
  selected: boolean     // In selection set
  disabled: boolean     // Interaction disabled
  expanded?: boolean    // For expandable nodes (tree)
  index: number         // Position in siblings
  siblingCount: number  // Total siblings
  level: number         // Nesting depth (1-based)
}
```

## How it works

`<Aria>` creates a command engine internally, wires the behavior's keyMap to keyboard events, and provides node props (role, tabIndex, aria-\*) through `<Aria.Item>`. The `render` callback receives the entity and its computed state — you control the visual output entirely.
