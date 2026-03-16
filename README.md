# interactive-os

Keyboard-first ARIA framework with plugin architecture for React.

What ProseMirror did for text editors, interactive-os does for ARIA components — compose keyboard navigation, focus management, and CRUD operations through plugins.

## Why

Existing libraries (React Aria, react-complex-tree) handle navigation and display. But **editing** — copy/paste, undo/redo, inline rename, drag-and-drop — requires gluing together separate tools. interactive-os provides a unified Command-driven engine where all operations are undoable and composable.

## Quick Start

```tsx
import { Aria } from 'interactive-os/components/aria'
import { treegrid } from 'interactive-os/behaviors/treegrid'
import { core } from 'interactive-os/plugins/core'
import { history } from 'interactive-os/plugins/history'
import { createStore } from 'interactive-os/core/normalized-store'

const data = createStore({
  entities: {
    src: { id: 'src', name: 'src', type: 'folder' },
    app: { id: 'app', name: 'App.tsx', type: 'file' },
  },
  relationships: {
    __root__: ['src'],
    src: ['app'],
  },
})

function FileTree() {
  const [store, setStore] = useState(data)

  return (
    <Aria
      behavior={treegrid}
      data={store}
      plugins={[core(), history()]}
      onChange={setStore}
    >
      <Aria.Node render={(node, state) => (
        <span style={{ paddingLeft: (state.level ?? 1) * 16 }}>
          {state.expanded !== undefined && (state.expanded ? '▼' : '▶')}
          {node.name as string}
        </span>
      )} />
    </Aria>
  )
}
```

## Architecture

```
┌─────────────────────────────────────────────┐
│  <Aria> + <Aria.Node>                        │  Compound Components
│  render slot, auto ARIA attributes           │
├─────────────────────────────────────────────┤
│  Behavior Layer                              │  treegrid, listbox, tabs,
│  keyMap + focusStrategy + ariaAttributes     │  disclosure, accordion, menu
├─────────────────────────────────────────────┤
│  Plugins                                     │  core, history, crud,
│  Command producers + middleware              │  clipboard, rename
├─────────────────────────────────────────────┤
│  Command Engine                              │
│  dispatch + middleware pipeline              │
├─────────────────────────────────────────────┤
│  Normalized Store                            │
│  entities + relationships                    │
└─────────────────────────────────────────────┘
```

## Core Concepts

### Normalized Data

All data follows a single format — entities (data) separated from relationships (structure):

```ts
{
  entities: { 'node-1': { id: 'node-1', name: 'src' } },
  relationships: { '__root__': ['node-1'] }
}
```

### Commands

Every operation is a Command with `execute()` and `undo()`. Undo/redo is built into the architecture:

```ts
interface Command {
  type: string
  execute(store: NormalizedData): NormalizedData
  undo(store: NormalizedData): NormalizedData
}
```

### Plugins

Plugins produce Commands and/or act as middleware in the dispatch pipeline:

```ts
plugins: [core(), crud(), history(), clipboard(), rename()]
```

### Behaviors

Behavior objects define keyboard mappings, focus strategy, and ARIA attributes per role:

```ts
import { treegrid } from 'interactive-os/behaviors/treegrid'
```

## Behaviors

| Behavior | Role | Navigation | Use case |
|----------|------|------------|----------|
| `treegrid` | treegrid | Vertical + tree | File explorers, nested data |
| `listbox` | listbox | Vertical flat | Selection lists, dropdowns |
| `tabs` | tablist | Horizontal | Tab panels |
| `accordion` | region | Vertical | Collapsible sections |
| `menu` | menu | Vertical + submenu | Navigation menus |
| `disclosure` | button | Toggle only | Show/hide panels |

## Plugins

| Plugin | Commands | Purpose |
|--------|----------|---------|
| `core()` | focus, select, expand/collapse | Required for all behaviors |
| `history()` | undo, redo | Command stack with snapshots |
| `crud()` | create, delete | Entity CRUD with subtree support |
| `clipboard()` | copy, cut, paste | Copy clones, cut moves |
| `rename()` | startRename, confirmRename, cancelRename | Inline field editing |
| `dnd()` | moveUp, moveDown, moveIn, moveOut, moveTo | Keyboard reordering |

## Adding Editing Keys

Behaviors ship with navigation keys only. Add editing via `keyMap` override:

```tsx
import { crudCommands } from 'interactive-os/plugins/crud'
import { clipboardCommands } from 'interactive-os/plugins/clipboard'
import { undoCommand, redoCommand } from 'interactive-os/plugins/history'

<Aria
  behavior={treegrid}
  keyMap={{
    'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected),
    'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
    'Delete': (ctx) => crudCommands.remove(ctx.focused),
    'Mod+Z': () => undoCommand(),
    'Mod+Shift+Z': () => redoCommand(),
  }}
  plugins={[core(), crud(), clipboard(), history()]}
/>
```

`Mod` resolves to `Ctrl` on Windows/Linux and `Cmd` on macOS.

## Reference Components

Pre-built components for common use cases:

```tsx
import { TreeGrid } from 'interactive-os/ui/tree-grid'
import { ListBox } from 'interactive-os/ui/list-box'
import { TabList } from 'interactive-os/ui/tab-list'
import { Accordion } from 'interactive-os/ui/accordion'
import { MenuList } from 'interactive-os/ui/menu-list'
import { DisclosureGroup } from 'interactive-os/ui/disclosure-group'

<TreeGrid data={treeData} enableEditing onChange={setData} />
<ListBox data={listData} />
<TabList data={tabData} />
<Accordion data={accordionData} />
<MenuList data={menuData} />
<DisclosureGroup data={disclosureData} />
```

## Design Principles

- **Keyboard > Mouse** — Desktop-level keyboard interaction on the web
- **Plugin composition** — Build what you need from primitives
- **Command pattern** — Every operation is undoable
- **Headless** — Zero styling, full control over rendering
- **LLM-friendly** — Pit of success API where correct usage converges to one pattern
- **OCP** — Add behaviors without modifying framework code

## License

MIT
