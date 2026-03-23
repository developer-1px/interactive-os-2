import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'

export function makeListBoxData(): NormalizedData {
  return createStore({
    entities: {
      apple: { id: 'apple', data: { label: 'Apple' } },
      banana: { id: 'banana', data: { label: 'Banana' } },
      cherry: { id: 'cherry', data: { label: 'Cherry' } },
      date: { id: 'date', data: { label: 'Date' } },
      elderberry: { id: 'elderberry', data: { label: 'Elderberry' } },
    },
    relationships: { [ROOT_ID]: ['apple', 'banana', 'cherry', 'date', 'elderberry'] },
  })
}

export function makeTreeGridData(): NormalizedData {
  return createStore({
    entities: {
      src: { id: 'src', data: { name: 'src' } },
      components: { id: 'components', data: { name: 'components' } },
      'app-tsx': { id: 'app-tsx', data: { name: 'App.tsx' } },
      'button-tsx': { id: 'button-tsx', data: { name: 'Button.tsx' } },
      utils: { id: 'utils', data: { name: 'utils' } },
      'helpers-ts': { id: 'helpers-ts', data: { name: 'helpers.ts' } },
      'index-ts': { id: 'index-ts', data: { name: 'index.ts' } },
    },
    relationships: {
      [ROOT_ID]: ['src'],
      src: ['components', 'utils', 'app-tsx'],
      components: ['button-tsx'],
      utils: ['helpers-ts', 'index-ts'],
    },
  })
}

export function makeAccordionData(): NormalizedData {
  return createStore({
    entities: {
      q1: { id: 'q1', data: { label: 'What is interactive-os?' } },
      q2: { id: 'q2', data: { label: 'How does the store work?' } },
      q3: { id: 'q3', data: { label: 'What are behaviors?' } },
    },
    relationships: { [ROOT_ID]: ['q1', 'q2', 'q3'] },
  })
}

export function makeAlertDialogData(): NormalizedData {
  return createStore({
    entities: {
      message: { id: 'message', data: { label: 'Are you sure you want to delete this item?' } },
      confirm: { id: 'confirm', data: { label: 'Confirm' } },
      cancel: { id: 'cancel', data: { label: 'Cancel' } },
    },
    relationships: { [ROOT_ID]: ['message', 'confirm', 'cancel'] },
  })
}

export function makeTabListData(): NormalizedData {
  return createStore({
    entities: {
      overview: { id: 'overview', data: { label: 'Overview' } },
      api: { id: 'api', data: { label: 'API' } },
      examples: { id: 'examples', data: { label: 'Examples' } },
    },
    relationships: { [ROOT_ID]: ['overview', 'api', 'examples'] },
  })
}

export function makeToggleData(): NormalizedData {
  return createStore({
    entities: {
      darkMode: { id: 'darkMode', data: { label: 'Dark Mode' } },
    },
    relationships: { [ROOT_ID]: ['darkMode'] },
  })
}

export function makeToggleGroupData(): NormalizedData {
  return createStore({
    entities: {
      bold: { id: 'bold', data: { label: 'Bold' } },
      italic: { id: 'italic', data: { label: 'Italic' } },
      underline: { id: 'underline', data: { label: 'Underline' } },
    },
    relationships: { [ROOT_ID]: ['bold', 'italic', 'underline'] },
  })
}

export function makeComboboxData(): NormalizedData {
  return createStore({
    entities: {
      red: { id: 'red', data: { label: 'Red' } },
      green: { id: 'green', data: { label: 'Green' } },
      blue: { id: 'blue', data: { label: 'Blue' } },
      yellow: { id: 'yellow', data: { label: 'Yellow' } },
      purple: { id: 'purple', data: { label: 'Purple' } },
    },
    relationships: { [ROOT_ID]: ['red', 'green', 'blue', 'yellow', 'purple'] },
  })
}

export function makeCheckboxData(): NormalizedData {
  return createStore({
    entities: {
      terms: { id: 'terms', data: { label: 'Accept terms' } },
      newsletter: { id: 'newsletter', data: { label: 'Subscribe to newsletter' } },
      updates: { id: 'updates', data: { label: 'Receive product updates' } },
    },
    relationships: { [ROOT_ID]: ['terms', 'newsletter', 'updates'] },
  })
}

export function makeDialogData(): NormalizedData {
  return createStore({
    entities: {
      confirm: { id: 'confirm', data: { label: 'Confirm' } },
      cancel: { id: 'cancel', data: { label: 'Cancel' } },
      details: { id: 'details', data: { label: 'View Details' } },
    },
    relationships: { [ROOT_ID]: ['confirm', 'cancel', 'details'] },
  })
}

export function makeDisclosureGroupData(): NormalizedData {
  return createStore({
    entities: {
      general: { id: 'general', data: { label: 'General Settings' } },
      appearance: { id: 'appearance', data: { label: 'Appearance' } },
      keyboard: { id: 'keyboard', data: { label: 'Keyboard Shortcuts' } },
    },
    relationships: { [ROOT_ID]: ['general', 'appearance', 'keyboard'] },
  })
}

export function makeGridData(): NormalizedData {
  return createStore({
    entities: {
      r1: { id: 'r1', data: { cells: ['Alice', 'Engineer', 'NYC'] } },
      r2: { id: 'r2', data: { cells: ['Bob', 'Designer', 'SF'] } },
      r3: { id: 'r3', data: { cells: ['Carol', 'PM', 'London'] } },
    },
    relationships: { [ROOT_ID]: ['r1', 'r2', 'r3'] },
  })
}

export function makeKanbanData(): NormalizedData {
  return createStore({
    entities: {
      todo: { id: 'todo', data: { title: 'To Do' } },
      doing: { id: 'doing', data: { title: 'In Progress' } },
      done: { id: 'done', data: { title: 'Done' } },
      t1: { id: 't1', data: { title: 'Design mockups' } },
      t2: { id: 't2', data: { title: 'Write tests' } },
      t3: { id: 't3', data: { title: 'Implement API' } },
      t4: { id: 't4', data: { title: 'Deploy v1' } },
    },
    relationships: {
      [ROOT_ID]: ['todo', 'doing', 'done'],
      todo: ['t1', 't2'],
      doing: ['t3'],
      done: ['t4'],
    },
  })
}

export function makeMenuListData(): NormalizedData {
  return createStore({
    entities: {
      cut: { id: 'cut', data: { label: 'Cut' } },
      copy: { id: 'copy', data: { label: 'Copy' } },
      paste: { id: 'paste', data: { label: 'Paste' } },
      selectAll: { id: 'selectAll', data: { label: 'Select All' } },
    },
    relationships: { [ROOT_ID]: ['cut', 'copy', 'paste', 'selectAll'] },
  })
}

export function makeRadioGroupData(): NormalizedData {
  return createStore({
    entities: {
      small: { id: 'small', data: { label: 'Small' } },
      medium: { id: 'medium', data: { label: 'Medium' } },
      large: { id: 'large', data: { label: 'Large' } },
    },
    relationships: { [ROOT_ID]: ['small', 'medium', 'large'] },
  })
}

export function makeSliderData(): NormalizedData {
  return createStore({
    entities: {
      volume: { id: 'volume', data: { label: 'Volume' } },
    },
    relationships: { [ROOT_ID]: ['volume'] },
  })
}

export function makeSpinbuttonData(): NormalizedData {
  return createStore({
    entities: {
      quantity: { id: 'quantity', data: { label: 'Quantity' } },
    },
    relationships: { [ROOT_ID]: ['quantity'] },
  })
}

export function makeSwitchGroupData(): NormalizedData {
  return createStore({
    entities: {
      wifi: { id: 'wifi', data: { label: 'Wi-Fi' } },
      bluetooth: { id: 'bluetooth', data: { label: 'Bluetooth' } },
      airplane: { id: 'airplane', data: { label: 'Airplane Mode' } },
    },
    relationships: { [ROOT_ID]: ['wifi', 'bluetooth', 'airplane'] },
  })
}

export function makeToolbarData(): NormalizedData {
  return createStore({
    entities: {
      bold: { id: 'bold', data: { label: 'Bold' } },
      italic: { id: 'italic', data: { label: 'Italic' } },
      underline: { id: 'underline', data: { label: 'Underline' } },
    },
    relationships: { [ROOT_ID]: ['bold', 'italic', 'underline'] },
  })
}

export function makeNavListData(): NormalizedData {
  return createStore({
    entities: {
      home: { id: 'home', data: { label: 'Home' } },
      products: { id: 'products', data: { label: 'Products' } },
      about: { id: 'about', data: { label: 'About' } },
      settings: { id: 'settings', data: { label: 'Settings' } },
      help: { id: 'help', data: { label: 'Help' } },
    },
    relationships: {
      [ROOT_ID]: ['home', 'products', 'about', 'settings', 'help'],
    },
  })
}

export function makeTreeViewData(): NormalizedData {
  return createStore({
    entities: {
      docs: { id: 'docs', data: { name: 'docs' } },
      readme: { id: 'readme', data: { name: 'README.md' } },
      guide: { id: 'guide', data: { name: 'guide.md' } },
      api: { id: 'api', data: { name: 'api' } },
      ref: { id: 'ref', data: { name: 'reference.md' } },
    },
    relationships: {
      [ROOT_ID]: ['docs'],
      docs: ['readme', 'guide', 'api'],
      api: ['ref'],
    },
  })
}
