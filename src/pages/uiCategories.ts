// ② 2026-03-24-ui-docs-ssot-prd.md
// src/pages/uiCategories.ts
export interface UiCategory {
  label: string
  slugs: string[]
}

export const uiCategories: UiCategory[] = [
  {
    label: 'Navigation',
    slugs: ['navlist', 'tab-list', 'menu-list', 'toolbar', 'accordion', 'disclosure-group'],
  },
  {
    label: 'Selection',
    slugs: ['listbox', 'combobox', 'radio-group', 'checkbox', 'switch-group', 'toggle', 'toggle-group'],
  },
  {
    label: 'Data',
    slugs: ['tree-grid', 'grid', 'tree-view', 'kanban'],
  },
  {
    label: 'Input',
    slugs: ['slider', 'spinbutton'],
  },
  {
    label: 'Feedback',
    slugs: ['dialog', 'alert-dialog', 'toaster', 'tooltip'],
  },
]

export const slugToMdFile: Record<string, string> = {
  'accordion': 'Accordion',
  'alert-dialog': 'AlertDialog',
  'checkbox': 'Checkbox',
  'combobox': 'Combobox',
  'dialog': 'Dialog',
  'disclosure-group': 'DisclosureGroup',
  'grid': 'Grid',
  'kanban': 'Kanban',
  'listbox': 'ListBox',
  'menu-list': 'MenuList',
  'navlist': 'NavList',
  'radio-group': 'RadioGroup',
  'slider': 'Slider',
  'spinbutton': 'Spinbutton',
  'switch-group': 'SwitchGroup',
  'tab-list': 'TabList',
  'toaster': 'Toaster',
  'toggle': 'Toggle',
  'toggle-group': 'ToggleGroup',
  'toolbar': 'Toolbar',
  'tooltip': 'Tooltip',
  'tree-grid': 'TreeGrid',
  'tree-view': 'TreeView',
}
