import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'

export function makeListBoxData(): NormalizedData {
  return createStore({
    entities: {
      recent: { id: 'recent', data: { label: 'Deploy v2.4.1 to staging' } },
      review: { id: 'review', data: { label: 'PR #287 approved by jkim' } },
      merge: { id: 'merge', data: { label: 'Merged feature/auth-flow' } },
      alert: { id: 'alert', data: { label: 'CI pipeline failed on main' } },
      resolve: { id: 'resolve', data: { label: 'Resolved: memory leak in worker' } },
    },
    relationships: { [ROOT_ID]: ['recent', 'review', 'merge', 'alert', 'resolve'] },
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
      q1: { id: 'q1', data: { label: 'How does the store work?' } },
      q2: { id: 'q2', data: { label: 'What are behaviors?' } },
      q3: { id: 'q3', data: { label: 'How do plugins extend axes?' } },
    },
    relationships: { [ROOT_ID]: ['q1', 'q2', 'q3'] },
  })
}

export function makeAlertDialogData(): NormalizedData {
  return createStore({
    entities: {
      message: { id: 'message', data: { label: 'Are you sure you want to delete this item?' } },
      confirm: { id: 'confirm', data: { label: 'Delete' } },
      cancel: { id: 'cancel', data: { label: 'Cancel' } },
    },
    relationships: { [ROOT_ID]: ['message', 'confirm', 'cancel'] },
  })
}

export function makeTabListData(): NormalizedData {
  return createStore({
    entities: {
      overview: { id: 'overview', data: { label: 'Overview' } },
      activity: { id: 'activity', data: { label: 'Activity' } },
      settings: { id: 'settings', data: { label: 'Settings' } },
    },
    relationships: { [ROOT_ID]: ['overview', 'activity', 'settings'] },
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
      bug: { id: 'bug', data: { label: 'Bug' } },
      feature: { id: 'feature', data: { label: 'Feature' } },
      docs: { id: 'docs', data: { label: 'Documentation' } },
      refactor: { id: 'refactor', data: { label: 'Refactor' } },
      perf: { id: 'perf', data: { label: 'Performance' } },
    },
    relationships: { [ROOT_ID]: ['bug', 'feature', 'docs', 'refactor', 'perf'] },
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
      r1: { id: 'r1', data: { cells: ['AUTH-142', 'Login timeout on Safari', 'Critical'] } },
      r2: { id: 'r2', data: { cells: ['UI-891', 'Dark mode contrast', 'Medium'] } },
      r3: { id: 'r3', data: { cells: ['API-356', 'Rate limit exceeded', 'High'] } },
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
      t1: { id: 't1', data: { title: 'Migrate auth to OAuth 2.1' } },
      t2: { id: 't2', data: { title: 'Add rate limiting middleware' } },
      t3: { id: 't3', data: { title: 'Implement SSE for notifications' } },
      t4: { id: 't4', data: { title: 'Deploy v2.4.1' } },
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
      notifications: { id: 'notifications', data: { label: 'Push notifications' } },
      sounds: { id: 'sounds', data: { label: 'Sound effects' } },
      analytics: { id: 'analytics', data: { label: 'Usage analytics' } },
    },
    relationships: { [ROOT_ID]: ['notifications', 'sounds', 'analytics'] },
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
      projects: { id: 'projects', data: { label: 'Projects' } },
      members: { id: 'members', data: { label: 'Members' } },
      settings: { id: 'settings', data: { label: 'Settings' } },
      help: { id: 'help', data: { label: 'Help & Feedback' } },
    },
    relationships: {
      [ROOT_ID]: ['home', 'projects', 'members', 'settings', 'help'],
    },
  })
}

export function makeTreeViewData(): NormalizedData {
  return createStore({
    entities: {
      docs: { id: 'docs', data: { name: 'docs' } },
      readme: { id: 'readme', data: { name: 'README.md' } },
      guide: { id: 'guide', data: { name: 'getting-started.md' } },
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
