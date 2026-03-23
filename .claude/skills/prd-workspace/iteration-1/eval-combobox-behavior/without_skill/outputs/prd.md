# PRD: Combobox Behavior in Aria Engine

## 1. Motivation

The aria engine needs a combobox behavior that composes with the existing axis system (`composePattern`). A combobox is fundamentally different from other behaviors: the container element is an `<input>`, not a wrapper `<div>`. This means `containerProps` from `useAria` must be spread directly onto the `<input>`, making the `<Aria>` component unsuitable (it wraps children in its own container). The listbox popup lives outside `data-aria-container`, requiring explicit coordination between the input (focus owner) and the listbox (visual display).

The combobox behavior already exists in the codebase (`src/interactive-os/behaviors/combobox.ts`, `src/interactive-os/plugins/combobox.ts`, `src/interactive-os/ui/Combobox.tsx`). This PRD defines the canonical specification for the behavior, ensuring completeness and alignment with WAI-ARIA Combobox pattern.

## 2. Interface

### 2.1 Behavior API

```ts
// behaviors/combobox.ts
import { combobox } from '../behaviors/combobox'

const behavior = combobox({ selectionMode: 'single' | 'multiple' })
```

The behavior is consumed exclusively via `useAria`:

```tsx
const aria = useAria({
  behavior: combobox({ selectionMode }),
  data: normalizedData,
  plugins: [core(), comboboxPlugin()],
  onChange,
})

// containerProps spread onto <input>, NOT onto a wrapper div
<input
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  {...aria.containerProps}
/>

// Listbox is a separate DOM node, outside data-aria-container
{isOpen && (
  <div role="listbox">
    {children.map(id => <div {...aria.getNodeProps(id)} />)}
  </div>
)}
```

### 2.2 Plugin API (combobox plugin)

```ts
// plugins/combobox.ts
comboboxCommands.open()          // Command: set __combobox__.isOpen = true
comboboxCommands.close()         // Command: set __combobox__.isOpen = false
comboboxCommands.setFilter(text) // Command: set __combobox__.filterText = text
comboboxCommands.create(label)   // Command: add new entity + append to root
```

### 2.3 Store Meta-Entity

```ts
// __combobox__ meta-entity in NormalizedData.entities
{
  id: '__combobox__',
  isOpen: boolean,
  filterText: string,
}
```

## 3. Deliverables

| # | Deliverable | File | Status |
|---|---|---|---|
| D1 | Combobox behavior (composePattern) | `src/interactive-os/behaviors/combobox.ts` | Exists |
| D2 | Combobox plugin (commands + meta-entity) | `src/interactive-os/plugins/combobox.ts` | Exists |
| D3 | Combobox UI component | `src/interactive-os/ui/Combobox.tsx` | Exists |
| D4 | Integration tests | `src/interactive-os/__tests__/combobox-keyboard.integration.test.tsx` | Exists |
| D5 | Demo pages | `src/pages/PageCombobox.tsx`, `src/pages/PageComboboxNav.tsx` | Exists |

## 4. Boundaries

### 4.1 Architecture Constraints

- **useAria hook only**: `<Aria>` component is NOT used. The combobox needs `containerProps` spread onto `<input>`, which is impossible with `<Aria>`'s container wrapper. This is Knowledge K1.
- **aria-activedescendant focus strategy**: The `<input>` retains DOM focus at all times. Options never receive `tabIndex`. Focus navigation is communicated via `aria-activedescendant` on the input.
- **Listbox outside data-aria-container**: The listbox dropdown is a separate DOM element that does NOT live inside `data-aria-container`. The engine's DOM focus sync (`document.querySelector('[data-node-id]')`) must still find option nodes for `getNodeProps`. This is Knowledge K2.
- **Event interception on input**: Because the input has DOM focus, keyboard events (ArrowDown, ArrowUp, Enter, Escape, Home, End) fire on the input. The behavior's `keyMap` is dispatched via `containerProps.onKeyDown`.
- **Editable vs read-only**: When `editable=true`, the input accepts free text and fires `onChange` to update `filterText`. Printable character keys must NOT be intercepted by the keyMap. When `editable=false` (read-only select), the input shows the selected label and is `readOnly`.
- **Meta-entity ID `__combobox__`**: Registered in `META_ENTITY_IDS` set in `useAria.ts` so it survives external data sync.

### 4.2 Composition Model

The combobox behavior uses `composePattern` with two axes:

1. **popupToggle axis**: ArrowDown (open when closed, fallthrough to nav when open), Enter (select+close when open, open when closed), Escape (close), Backspace (remove last token in multi-select when filterText is empty).
2. **navV axis**: ArrowDown/ArrowUp (focusNext/focusPrev), Home/End (focusFirst/focusLast). Standard vertical navigation.

Axis priority: popupToggle runs first. If it returns `undefined`, navV handles the key. This is the standard `composePattern` fallthrough behavior.

### 4.3 Selection Behavior

| Mode | Enter | Close on select | Display |
|---|---|---|---|
| `single` | `selectionCommands.select(focused) + comboboxCommands.close()` | Yes | Input shows selected label |
| `multiple` | `ctx.toggleSelect()` | No (stays open) | Token chips + input |

### 4.4 Filtering (editable mode)

- Filter is stored in `__combobox__.filterText` via `comboboxCommands.setFilter(text)`.
- Filtering is done in the UI layer (Combobox component), not the behavior/engine. The engine sees all items; the component filters `visibleChildren` by case-insensitive substring match.
- Typing opens the dropdown if closed.
- Backspace in `multiple` mode with empty `filterText` removes the last selected token.

### 4.5 Blur Behavior

- When the input loses focus (`onBlur`), the dropdown closes (`comboboxCommands.close()`).
- `onMouseDown` on the listbox calls `e.preventDefault()` to prevent the input from losing focus when clicking an option.

### 4.6 Grouped Options

- Groups use nested store structure: root -> group entities (with `data.type = 'group'`) -> option entities.
- The behavior engine operates on a flattened store (`flattenGroups`). On `onChange`, the component restores the group structure (`restoreGroups`) before propagating to the caller.
- Groups are rendered with `role="group"` and `aria-label`.

### 4.7 Creatable Options

- When `creatable=true`, `filterText` is non-empty, and no options match: a "Create X" option appears.
- Create option navigation is handled in the UI layer (not the behavior keyMap), using a sentinel ID `__create_option__`.
- ArrowDown from last visible item focuses the create option; Enter on it calls `comboboxCommands.create(label)`.

## 5. Prohibitions

- **DO NOT use `<Aria>` component** for combobox. The input must receive `containerProps` directly.
- **DO NOT give options `tabIndex`**. Focus stays on the input; options are navigated via `aria-activedescendant`.
- **DO NOT intercept printable character keys** in the behavior keyMap when the input is editable. Let the browser handle text input natively.
- **DO NOT move DOM focus to options**. The `useAria` effect that syncs DOM focus is skipped for `aria-activedescendant` strategy (`if (behavior.focusStrategy.type === 'aria-activedescendant') return`).
- **DO NOT filter items in the engine/behavior layer**. Filtering is a UI concern. The engine always has the full item list.
- **DO NOT store selected label in the engine**. The display value is derived from the selected entity's `data.label` in the UI layer.

## 6. Verification

### 6.1 ARIA Roles and Attributes

| Element | Role | Key Attributes |
|---|---|---|
| Input | `combobox` | `aria-expanded`, `aria-haspopup="listbox"`, `aria-activedescendant` |
| Dropdown container | `listbox` | - |
| Each option | `option` | `aria-selected`, `data-node-id` |
| Group wrapper | `group` | `aria-label` |

### 6.2 Keyboard Interaction Tests

| Test | Key | Expected Result |
|---|---|---|
| T1 | ArrowDown (closed) | Opens dropdown, `aria-expanded=true`, `aria-activedescendant` points to first option |
| T2 | ArrowDown (open) | Moves `aria-activedescendant` to next option |
| T3 | ArrowUp (open) | Moves `aria-activedescendant` to previous option |
| T4 | Enter (closed) | Opens dropdown |
| T5 | Enter (open, single) | Selects focused option, closes dropdown, input shows label |
| T6 | Enter (open, multiple) | Toggles selection on focused option, dropdown stays open |
| T7 | Escape (open) | Closes dropdown without changing selection |
| T8 | Home (open) | `aria-activedescendant` moves to first option |
| T9 | End (open) | `aria-activedescendant` moves to last option |
| T10 | Typing (editable) | Updates `filterText`, filters visible options, opens dropdown if closed |
| T11 | Backspace (editable) | Deletes character normally (browser handles it) |
| T12 | Backspace (multiple, empty filter) | Removes last selected token |
| T13 | Blur | Closes dropdown |
| T14 | Options have no tabIndex | All `[role="option"]` elements lack `tabindex` attribute |

### 6.3 Integration Test File

All tests in `src/interactive-os/__tests__/combobox-keyboard.integration.test.tsx` must pass. Tests use `userEvent.keyboard()` to simulate real keyboard interaction and verify DOM/ARIA state changes.

### 6.4 Verification Commands

```bash
npx vitest run src/interactive-os/__tests__/combobox-keyboard.integration.test.tsx
```
