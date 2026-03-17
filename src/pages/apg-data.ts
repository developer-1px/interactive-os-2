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
