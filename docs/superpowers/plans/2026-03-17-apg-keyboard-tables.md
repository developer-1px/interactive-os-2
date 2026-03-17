# APG Keyboard Interaction Tables Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add W3C APG keyboard interaction reference tables to all 14 Navigation/Collection pattern demo pages as static English-text conformance evidence.

**Architecture:** One shared `ApgKeyboardTable` component renders a 2-column table (Key | Function) with a source link. Each page imports its APG data from a co-located data file and renders the table below the demo card.

**Tech Stack:** React, TypeScript, CSS (existing App.css variables)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/pages/ApgKeyboardTable.tsx` | Shared table component |
| Create | `src/pages/apg-data.ts` | All 14 patterns' APG keyboard data |
| Modify | `src/App.css` | Table styles (`.apg-table`, `.apg-source`) |
| Modify | `src/pages/PageAccordion.tsx` | Add APG table |
| Modify | `src/pages/PageDisclosure.tsx` | Add APG table |
| Modify | `src/pages/PageSwitch.tsx` | Add APG table |
| Modify | `src/pages/PageTabs.tsx` | Add APG table |
| Modify | `src/pages/PageRadioGroup.tsx` | Add APG table |
| Modify | `src/pages/PageMenu.tsx` | Add APG table |
| Modify | `src/pages/PageToolbar.tsx` | Add APG table |
| Modify | `src/pages/PageDialog.tsx` | Add APG table |
| Modify | `src/pages/PageAlertDialog.tsx` | Add APG table |
| Modify | `src/pages/PageTreeView.tsx` | Add APG table |
| Modify | `src/pages/PageTreeGrid.tsx` | Add APG table |
| Modify | `src/pages/PageListbox.tsx` | Add APG table |
| Modify | `src/pages/PageGrid.tsx` | Add APG table |
| Modify | `src/pages/PageCombobox.tsx` | Add APG table |

---

### Task 1: Create APG data file

**Files:**
- Create: `src/pages/apg-data.ts`

- [ ] **Step 1: Create the data file with all 14 patterns**

```ts
// src/pages/apg-data.ts

export interface ApgKeyboardEntry {
  key: string
  description: string
}

export interface ApgPatternData {
  pattern: string
  url: string
  entries: ApgKeyboardEntry[]
}

export const apgAccordion: ApgPatternData = {
  pattern: 'Accordion',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
  entries: [
    { key: 'Enter or Space', description: 'When focus is on the accordion header for a collapsed panel, expands the associated panel. If the implementation allows only one panel to be expanded, and if another panel is expanded, collapses that panel. When focus is on the accordion header for an expanded panel, collapses the panel if the implementation supports collapsing. Some implementations require one panel to be expanded at all times and allow only one panel to be expanded; so, they do not support a collapse function.' },
    { key: 'Tab', description: 'Moves focus to the next focusable element; all focusable elements in the accordion are included in the page Tab sequence.' },
    { key: 'Shift + Tab', description: 'Moves focus to the previous focusable element; all focusable elements in the accordion are included in the page Tab sequence.' },
    { key: 'Down Arrow (Optional)', description: 'If focus is on an accordion header, moves focus to the next accordion header. If focus is on the last accordion header, either does nothing or moves focus to the first accordion header.' },
    { key: 'Up Arrow (Optional)', description: 'If focus is on an accordion header, moves focus to the previous accordion header. If focus is on the first accordion header, either does nothing or moves focus to the last accordion header.' },
    { key: 'Home (Optional)', description: 'When focus is on an accordion header, moves focus to the first accordion header.' },
    { key: 'End (Optional)', description: 'When focus is on an accordion header, moves focus to the last accordion header.' },
  ],
}

export const apgDisclosure: ApgPatternData = {
  pattern: 'Disclosure',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
  entries: [
    { key: 'Enter', description: 'Activates the disclosure control and toggles the visibility of the disclosure content.' },
    { key: 'Space', description: 'Activates the disclosure control and toggles the visibility of the disclosure content.' },
  ],
}

export const apgSwitch: ApgPatternData = {
  pattern: 'Switch',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/',
  entries: [
    { key: 'Space', description: 'When focus is on the switch, changes the state of the switch.' },
    { key: 'Enter (Optional)', description: 'When focus is on the switch, changes the state of the switch.' },
  ],
}

export const apgTabs: ApgPatternData = {
  pattern: 'Tabs',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
  entries: [
    { key: 'Tab', description: 'When focus moves into the tab list, places focus on the active tab element. When the tab list contains the focus, moves focus to the next element in the page tab sequence outside the tablist, which is the tabpanel unless the first element containing meaningful content inside the tabpanel is focusable.' },
    { key: 'Left Arrow', description: 'Moves focus to the previous tab. If focus is on the first tab, moves focus to the last tab. Optionally, activates the newly focused tab.' },
    { key: 'Right Arrow', description: 'Moves focus to the next tab. If focus is on the last tab element, moves focus to the first tab. Optionally, activates the newly focused tab.' },
    { key: 'Space or Enter', description: 'Activates the tab if it was not activated automatically on focus.' },
    { key: 'Home (Optional)', description: 'Moves focus to the first tab. Optionally, activates the newly focused tab.' },
    { key: 'End (Optional)', description: 'Moves focus to the last tab. Optionally, activates the newly focused tab.' },
    { key: 'Shift + F10', description: 'If the tab has an associated popup menu, opens the menu.' },
    { key: 'Delete (Optional)', description: 'If deletion is allowed, deletes (closes) the current tab element and its associated tab panel, sets focus on the tab following the tab that was closed, and optionally activates the newly focused tab.' },
  ],
}

export const apgRadioGroup: ApgPatternData = {
  pattern: 'Radio Group',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
  entries: [
    { key: 'Tab and Shift + Tab', description: 'Move focus into and out of the radio group. When focus moves into a radio group: If a radio button is checked, focus is set on the checked button. If none of the radio buttons are checked, focus is set on the first radio button in the group.' },
    { key: 'Space', description: 'Checks the focused radio button if it is not already checked.' },
    { key: 'Right Arrow and Down Arrow', description: 'Move focus to the next radio button in the group, uncheck the previously focused button, and check the newly focused button. If focus is on the last button, focus moves to the first button.' },
    { key: 'Left Arrow and Up Arrow', description: 'Move focus to the previous radio button in the group, uncheck the previously focused button, and check the newly focused button. If focus is on the first button, focus moves to the last button.' },
  ],
}

export const apgMenu: ApgPatternData = {
  pattern: 'Menu',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
  entries: [
    { key: 'Enter', description: 'When focus is on a menuitem that has a submenu, opens the submenu and places focus on its first item. Otherwise, activates the item and closes the menu.' },
    { key: 'Space', description: 'When focus is on a menuitemcheckbox, changes the state without closing the menu. When focus is on a menuitemradio that is not checked, without closing the menu, checks the focused menuitemradio and unchecks any other checked menuitemradio element in the same group. When focus is on a menuitem that has a submenu, opens the submenu and places focus on its first item. When focus is on a menuitem that does not have a submenu, activates the menuitem and closes the menu.' },
    { key: 'Down Arrow', description: 'When focus is in a menu, moves focus to the next item, optionally wrapping from the last to the first.' },
    { key: 'Up Arrow', description: 'When focus is in a menu, moves focus to the previous item, optionally wrapping from the first to the last.' },
    { key: 'Right Arrow', description: 'When focus is on a menuitem that has a submenu, opens the submenu and places focus on its first item.' },
    { key: 'Left Arrow', description: 'Closes the current submenu and returns focus to the parent menuitem.' },
    { key: 'Home', description: 'If arrow key wrapping is not supported, moves focus to the first item in the current menu or menubar.' },
    { key: 'End', description: 'If arrow key wrapping is not supported, moves focus to the last item in the current menu or menubar.' },
    { key: 'Escape', description: 'Close the menu that contains focus and return focus to the element or context from which the menu was opened.' },
    { key: 'Any printable character (Optional)', description: 'Move focus to the next item in the current menu whose label begins with that printable character.' },
  ],
}

export const apgToolbar: ApgPatternData = {
  pattern: 'Toolbar',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
  entries: [
    { key: 'Tab and Shift + Tab', description: 'Move focus into and out of the toolbar. When focus moves into a toolbar: If focus is moving into the toolbar for the first time, focus is set on the first control that is not disabled. If the toolbar has previously contained focus, focus is optionally set on the control that last had focus. Otherwise, it is set on the first control that is not disabled.' },
    { key: 'Left Arrow', description: 'Moves focus to the previous control. Optionally, focus movement may wrap from the first element to the last element.' },
    { key: 'Right Arrow', description: 'Moves focus to the next control. Optionally, focus movement may wrap from the last element to the first element.' },
    { key: 'Home (Optional)', description: 'Moves focus to first element.' },
    { key: 'End (Optional)', description: 'Moves focus to last element.' },
  ],
}

export const apgDialog: ApgPatternData = {
  pattern: 'Dialog (Modal)',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
  entries: [
    { key: 'Tab', description: 'Moves focus to the next tabbable element inside the dialog. If focus is on the last tabbable element inside the dialog, moves focus to the first tabbable element inside the dialog.' },
    { key: 'Shift + Tab', description: 'Moves focus to the previous tabbable element inside the dialog. If focus is on the first tabbable element inside the dialog, moves focus to the last tabbable element inside the dialog.' },
    { key: 'Escape', description: 'Closes the dialog.' },
  ],
}

export const apgAlertDialog: ApgPatternData = {
  pattern: 'Alert Dialog',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/',
  entries: [
    // APG spec: "See the keyboard interaction section for the modal dialog pattern."
    { key: 'Tab', description: 'Moves focus to the next tabbable element inside the dialog. If focus is on the last tabbable element inside the dialog, moves focus to the first tabbable element inside the dialog.' },
    { key: 'Shift + Tab', description: 'Moves focus to the previous tabbable element inside the dialog. If focus is on the first tabbable element inside the dialog, moves focus to the last tabbable element inside the dialog.' },
    { key: 'Escape', description: 'Closes the dialog.' },
  ],
}

export const apgTreeView: ApgPatternData = {
  pattern: 'Tree View',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/',
  entries: [
    { key: 'Right Arrow', description: 'When focus is on a closed node, opens the node; focus does not move. When focus is on a open node, moves focus to the first child node. When focus is on an end node, does nothing.' },
    { key: 'Left Arrow', description: 'When focus is on an open node, closes the node. When focus is on a child node that is also either an end node or a closed node, moves focus to its parent node. When focus is on a root node that is also either an end node or a closed node, does nothing.' },
    { key: 'Down Arrow', description: 'Moves focus to the next node that is focusable without opening or closing a node.' },
    { key: 'Up Arrow', description: 'Moves focus to the previous node that is focusable without opening or closing a node.' },
    { key: 'Home', description: 'Moves focus to the first node in the tree without opening or closing a node.' },
    { key: 'End', description: 'Moves focus to the last node in the tree that is focusable without opening a node.' },
    { key: 'Enter', description: 'Activates a node, i.e., performs its default action. For parent nodes, one possible default action is to open or close the node. In single-select trees where selection does not follow focus, the default action is typically to select the focused node.' },
    { key: 'Space', description: 'Toggles the selection state of the focused node.' },
    { key: 'Type-ahead', description: 'Focus moves to the next node with a name that starts with the typed character. Type multiple characters in rapid succession: focus moves to the next node with a name that starts with the string of characters typed.' },
    { key: '* (Optional)', description: 'Expands all siblings that are at the same level as the current node.' },
  ],
}

export const apgTreeGrid: ApgPatternData = {
  pattern: 'Treegrid',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/',
  entries: [
    { key: 'Enter', description: 'If cell-only focus is enabled and focus is on the first cell with the aria-expanded property, opens or closes the child rows. Otherwise, performs the default action for the cell.' },
    { key: 'Tab', description: 'If the row containing focus contains focusable elements, moves focus to the next input in the row. If focus is on the last focusable element in the row, moves focus out of the treegrid widget to the next focusable element.' },
    { key: 'Right Arrow', description: 'If focus is on a collapsed row, expands the row. If focus is on an expanded row or is on a row that does not have child rows, moves focus to the first cell in the row. If focus is on the right-most cell in a row, focus does not move. If focus is on any other cell, moves focus one cell to the right.' },
    { key: 'Left Arrow', description: 'If focus is on an expanded row, collapses the row. If focus is on a collapsed row or on a row that does not have child rows, focus does not move. If focus is on the first cell in a row and row focus is supported, moves focus to the row. If focus is on any other cell, moves focus one cell to the left.' },
    { key: 'Down Arrow', description: 'If focus is on a row, moves focus one row down. If focus is on the last row, focus does not move. If focus is on a cell, moves focus one cell down. If focus is on the bottom cell in the column, focus does not move.' },
    { key: 'Up Arrow', description: 'If focus is on a row, moves focus one row up. If focus is on the first row, focus does not move. If focus is on a cell, moves focus one cell up. If focus is on the top cell in the column, focus does not move.' },
    { key: 'Home', description: 'If focus is on a row, moves focus to the first row. If focus is on a cell, moves focus to the first cell in the row.' },
    { key: 'End', description: 'If focus is on a row, moves focus to the last row. If focus is on a cell, moves focus to the last cell in the row.' },
    { key: 'Control + Home', description: 'Moves focus to the first row (when on a row) or to the cell in the first row in the same column (when on a cell).' },
    { key: 'Control + End', description: 'Moves focus to the last row (when on a row) or to the cell in the last row in the same column (when on a cell).' },
  ],
}

export const apgListbox: ApgPatternData = {
  pattern: 'Listbox',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
  entries: [
    { key: 'Down Arrow', description: 'Moves focus to the next option. Optionally, in a single-select listbox, selection may also move with focus.' },
    { key: 'Up Arrow', description: 'Moves focus to the previous option. Optionally, in a single-select listbox, selection may also move with focus.' },
    { key: 'Home (Optional)', description: 'Moves focus to first option. Optionally, in a single-select listbox, selection may also move with focus. Supporting this key is strongly recommended for lists with more than five options.' },
    { key: 'End (Optional)', description: 'Moves focus to last option. Optionally, in a single-select listbox, selection may also move with focus. Supporting this key is strongly recommended for lists with more than five options.' },
    { key: 'Type a character', description: 'Focus moves to the next item with a name that starts with the typed character.' },
    { key: 'Space', description: 'Changes the selection state of the focused option.' },
    { key: 'Shift + Down Arrow (Optional)', description: 'Moves focus to and toggles the selected state of the next option.' },
    { key: 'Shift + Up Arrow (Optional)', description: 'Moves focus to and toggles the selected state of the previous option.' },
    { key: 'Shift + Space (Optional)', description: 'Selects contiguous items from the most recently selected item to the focused item.' },
    { key: 'Control + A (Optional)', description: 'Selects all options in the list. Optionally, if all options are selected, it may also unselect all options.' },
  ],
}

export const apgGrid: ApgPatternData = {
  pattern: 'Grid',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/',
  entries: [
    { key: 'Right Arrow', description: 'Moves focus one cell to the right. If focus is on the right-most cell in the row, focus does not move.' },
    { key: 'Left Arrow', description: 'Moves focus one cell to the left. If focus is on the left-most cell in the row, focus does not move.' },
    { key: 'Down Arrow', description: 'Moves focus one cell down. If focus is on the bottom cell in the column, focus does not move.' },
    { key: 'Up Arrow', description: 'Moves focus one cell up. If focus is on the top cell in the column, focus does not move.' },
    { key: 'Home', description: 'Moves focus to the first cell in the row that contains focus.' },
    { key: 'End', description: 'Moves focus to the last cell in the row that contains focus.' },
    { key: 'Control + Home', description: 'Moves focus to the first cell in the first row.' },
    { key: 'Control + End', description: 'Moves focus to the last cell in the last row.' },
  ],
}

export const apgCombobox: ApgPatternData = {
  pattern: 'Combobox',
  url: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
  entries: [
    { key: 'Tab', description: 'The combobox is in the page Tab sequence.' },
    { key: 'Down Arrow', description: 'If the popup is available, moves focus into the popup: If the autocomplete behavior automatically selected a suggestion before Down Arrow was pressed, focus is placed on the suggestion following the automatically selected suggestion. Otherwise, places focus on the first focusable element in the popup.' },
    { key: 'Up Arrow (Optional)', description: 'If the popup is available, places focus on the last focusable element in the popup.' },
    { key: 'Escape', description: 'Dismisses the popup if it is visible. Optionally, if the popup is hidden before Escape is pressed, clears the combobox.' },
    { key: 'Enter', description: 'If the combobox is editable and an autocomplete suggestion is selected in the popup, accepts the suggestion either by placing the input cursor at the end of the accepted value in the combobox or by performing a default action on the value.' },
    { key: 'Alt + Down Arrow (Optional)', description: 'If the popup is available but not displayed, displays the popup without moving focus.' },
    { key: 'Alt + Up Arrow (Optional)', description: 'If the popup is displayed: returns focus to the combobox and closes the popup.' },
  ],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/user/Desktop/aria && npx tsc --noEmit src/pages/apg-data.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/apg-data.ts
git commit -m "feat: add W3C APG keyboard interaction data for 14 patterns"
```

---

### Task 2: Create ApgKeyboardTable component + CSS

**Files:**
- Create: `src/pages/ApgKeyboardTable.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Create the component**

```tsx
// src/pages/ApgKeyboardTable.tsx
import type { ApgPatternData } from './apg-data'

export function ApgKeyboardTable({ pattern, url, entries }: ApgPatternData) {
  return (
    <div className="apg-table-wrap">
      <table className="apg-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i}>
              <td><kbd>{entry.key}</kbd></td>
              <td>{entry.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="apg-source">
        Source: <a href={url} target="_blank" rel="noopener noreferrer">W3C APG — {pattern}</a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add CSS styles to App.css**

Add after the `.page-keys` block (around line 294):

```css
/* --- APG Reference Table --- */

.apg-table-wrap {
  margin-top: 12px;
}

.apg-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--sans);
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--text-primary);
}

.apg-table thead th {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-mid);
}

.apg-table tbody td {
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-dim);
  vertical-align: top;
}

.apg-table tbody td:first-child {
  white-space: nowrap;
  width: 1%;
}

.apg-table tbody td:first-child kbd {
  font-size: 9px;
  background: none;
  border: none;
  border-bottom-width: 0;
  padding: 0;
  color: var(--text-bright);
  font-weight: 500;
}

.apg-table tbody tr:last-child td {
  border-bottom: none;
}

.apg-source {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-muted);
}

.apg-source a {
  color: var(--accent);
  text-decoration: none;
}

.apg-source a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/user/Desktop/aria && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/pages/ApgKeyboardTable.tsx src/App.css
git commit -m "feat: add ApgKeyboardTable component + styles"
```

---

### Task 3: Add APG tables to Navigation pages (10 pages)

**Files:**
- Modify: `src/pages/PageAccordion.tsx`
- Modify: `src/pages/PageDisclosure.tsx`
- Modify: `src/pages/PageSwitch.tsx`
- Modify: `src/pages/PageTabs.tsx`
- Modify: `src/pages/PageRadioGroup.tsx`
- Modify: `src/pages/PageMenu.tsx`
- Modify: `src/pages/PageToolbar.tsx`
- Modify: `src/pages/PageDialog.tsx`
- Modify: `src/pages/PageAlertDialog.tsx`
- Modify: `src/pages/PageTreeView.tsx`

For each page, add two imports and one JSX element. The pattern is identical:

```tsx
// Add imports at top:
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgXxx } from './apg-data'  // pattern-specific import

// Add after closing </div> of the .card div:
<ApgKeyboardTable {...apgXxx} />
```

- [ ] **Step 1: Add to PageAccordion.tsx**

Import `apgAccordion`, add `<ApgKeyboardTable {...apgAccordion} />` after the card div.

- [ ] **Step 2: Add to PageDisclosure.tsx**

Import `apgDisclosure`, add `<ApgKeyboardTable {...apgDisclosure} />`.

- [ ] **Step 3: Add to PageSwitch.tsx**

Import `apgSwitch`, add `<ApgKeyboardTable {...apgSwitch} />`.

- [ ] **Step 4: Add to PageTabs.tsx**

Import `apgTabs`, add `<ApgKeyboardTable {...apgTabs} />`.

- [ ] **Step 5: Add to PageRadioGroup.tsx**

Import `apgRadioGroup`, add `<ApgKeyboardTable {...apgRadioGroup} />`.

- [ ] **Step 6: Add to PageMenu.tsx**

Import `apgMenu`, add `<ApgKeyboardTable {...apgMenu} />`.

- [ ] **Step 7: Add to PageToolbar.tsx**

Import `apgToolbar`, add `<ApgKeyboardTable {...apgToolbar} />`.

- [ ] **Step 8: Add to PageDialog.tsx**

Import `apgDialog`, add `<ApgKeyboardTable {...apgDialog} />`.

- [ ] **Step 9: Add to PageAlertDialog.tsx**

Import `apgAlertDialog`, add `<ApgKeyboardTable {...apgAlertDialog} />`.

- [ ] **Step 10: Add to PageTreeView.tsx**

Import `apgTreeView`, add `<ApgKeyboardTable {...apgTreeView} />`.

- [ ] **Step 11: Verify build**

Run: `cd /Users/user/Desktop/aria && pnpm build`
Expected: Build succeeds

- [ ] **Step 12: Commit**

```bash
git add src/pages/Page*.tsx
git commit -m "feat: add APG keyboard tables to Navigation pages"
```

---

### Task 4: Add APG tables to Collection pages (4 pages)

**Files:**
- Modify: `src/pages/PageTreeGrid.tsx`
- Modify: `src/pages/PageListbox.tsx`
- Modify: `src/pages/PageGrid.tsx`
- Modify: `src/pages/PageCombobox.tsx`

Same pattern as Task 3.

- [ ] **Step 1: Add to PageTreeGrid.tsx**

Import `apgTreeGrid`, add `<ApgKeyboardTable {...apgTreeGrid} />`.

- [ ] **Step 2: Add to PageListbox.tsx**

Import `apgListbox`, add `<ApgKeyboardTable {...apgListbox} />`.

- [ ] **Step 3: Add to PageGrid.tsx**

Import `apgGrid`, add `<ApgKeyboardTable {...apgGrid} />`.

- [ ] **Step 4: Add to PageCombobox.tsx**

Import `apgCombobox`, add `<ApgKeyboardTable {...apgCombobox} />`.

- [ ] **Step 5: Verify build + dev server**

Run: `cd /Users/user/Desktop/aria && pnpm build && pnpm dev`
Expected: Build succeeds, dev server starts, all 14 pages show APG tables

- [ ] **Step 6: Commit**

```bash
git add src/pages/Page*.tsx
git commit -m "feat: add APG keyboard tables to Collection pages"
```

---

### Task 5: Visual verification + final commit

- [ ] **Step 1: Run all tests**

Run: `cd /Users/user/Desktop/aria && pnpm test`
Expected: All 317+ tests pass

- [ ] **Step 2: Run lint**

Run: `cd /Users/user/Desktop/aria && pnpm lint`
Expected: 0 errors

- [ ] **Step 3: Verify dev server renders tables**

Run: `cd /Users/user/Desktop/aria && pnpm dev`
Manually check at least 3 pages (one simple like Switch, one medium like Tabs, one complex like TreeGrid) to confirm tables render correctly with proper styling.

- [ ] **Step 4: Update PROGRESS.md**

Add entry under ⑧ App Shell:
```
- [x] APG Keyboard Tables — W3C 원문 키보드 인터랙션 표 14개 패턴 페이지 렌더링
```
