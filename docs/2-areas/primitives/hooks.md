# Hooks

Escape hatches for when the compound component isn't enough. Build custom wrappers or integrate with external state management.

```tsx render
<HooksListDemo />
```

## useAria — internal engine

```ts
const aria = useAria({
  behavior: listbox,
  data: store,
  plugins: [core(), history()],
  onChange: setStore,
})

// aria.dispatch(command)
// aria.getNodeProps(id) → { role, tabIndex, aria-*, onKeyDown, ... }
// aria.getNodeState(id) → { focused, selected, expanded, ... }
// aria.focused → current focused ID
// aria.selected → selected IDs array
```

## useControlledAria — external store

```ts
// When you manage state externally (Redux, Zustand, etc.)
const aria = useControlledAria({
  behavior: treegrid,
  store: externalStore,        // you own this
  onDispatch: (command) => {   // you handle commands
    dispatch(executeCommand(command))
  },
})
```

## useKeyboard — key matching

```ts
import { parseKeyCombo, matchKeyEvent } from 'interactive-os/primitives/useKeyboard'

// Mod = Meta on Mac, Ctrl on Windows/Linux
parseKeyCombo('Mod+Shift+z')
// → { key: 'z', ctrl: false, shift: true, alt: false, meta: true } (Mac)

matchKeyEvent(event, 'Mod+c') // true if Cmd+C (Mac) or Ctrl+C (Win)
```
