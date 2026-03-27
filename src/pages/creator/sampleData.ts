// ② 2026-03-27-component-creator-prd.md

/**
 * Sample NormalizedData datasets for Component Creator Canvas.
 * All components share the same NormalizedData format —
 * a few sample datasets cover every component type.
 */

import { createStore } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { NormalizedData } from '../../interactive-os/store/types'

/** Flat list — ListBox, RadioGroup, Checkbox, MenuList, SwitchGroup, Toggle, ToggleGroup */
export const flatList: NormalizedData = createStore({
  entities: {
    apple: { id: 'apple', data: { label: 'Apple' } },
    banana: { id: 'banana', data: { label: 'Banana' } },
    cherry: { id: 'cherry', data: { label: 'Cherry' } },
    date: { id: 'date', data: { label: 'Date' } },
    elderberry: { id: 'elderberry', data: { label: 'Elderberry' } },
  },
  relationships: {
    [ROOT_ID]: ['apple', 'banana', 'cherry', 'date', 'elderberry'],
  },
})

/** Grouped list — Accordion, DisclosureGroup, NavList */
export const groupedList: NormalizedData = createStore({
  entities: {
    fruits: { id: 'fruits', data: { label: 'Fruits', type: 'group' } },
    apple: { id: 'apple', data: { label: 'Apple' } },
    banana: { id: 'banana', data: { label: 'Banana' } },
    vegs: { id: 'vegs', data: { label: 'Vegetables', type: 'group' } },
    carrot: { id: 'carrot', data: { label: 'Carrot' } },
    daikon: { id: 'daikon', data: { label: 'Daikon' } },
  },
  relationships: {
    [ROOT_ID]: ['fruits', 'vegs'],
    fruits: ['apple', 'banana'],
    vegs: ['carrot', 'daikon'],
  },
})

/** Tree — TreeView, TreeGrid */
export const treeData: NormalizedData = createStore({
  entities: {
    src: { id: 'src', data: { label: 'src', type: 'folder' } },
    components: { id: 'components', data: { label: 'components', type: 'folder' } },
    'button-tsx': { id: 'button-tsx', data: { label: 'Button.tsx', type: 'file' } },
    'input-tsx': { id: 'input-tsx', data: { label: 'Input.tsx', type: 'file' } },
    utils: { id: 'utils', data: { label: 'utils', type: 'folder' } },
    'helpers-ts': { id: 'helpers-ts', data: { label: 'helpers.ts', type: 'file' } },
    'readme-md': { id: 'readme-md', data: { label: 'README.md', type: 'file' } },
  },
  relationships: {
    [ROOT_ID]: ['src', 'readme-md'],
    src: ['components', 'utils'],
    components: ['button-tsx', 'input-tsx'],
    utils: ['helpers-ts'],
  },
})

/** Tabbed — TabList, TabGroup */
export const tabData: NormalizedData = createStore({
  entities: {
    general: { id: 'general', data: { label: 'General' } },
    appearance: { id: 'appearance', data: { label: 'Appearance' } },
    keyboard: { id: 'keyboard', data: { label: 'Keyboard' } },
  },
  relationships: {
    [ROOT_ID]: ['general', 'appearance', 'keyboard'],
  },
})

/** Grid — Grid (flat rows with fields) */
export const gridData: NormalizedData = createStore({
  entities: {
    row1: { id: 'row1', data: { name: 'Alice', role: 'Engineer', status: 'Active' } },
    row2: { id: 'row2', data: { name: 'Bob', role: 'Designer', status: 'Away' } },
    row3: { id: 'row3', data: { name: 'Carol', role: 'PM', status: 'Active' } },
  },
  relationships: {
    [ROOT_ID]: ['row1', 'row2', 'row3'],
  },
})

/** Dialog — minimal single-item */
export const dialogData: NormalizedData = createStore({
  entities: {
    dialog: { id: 'dialog', data: { label: 'Confirm', message: 'Are you sure?' } },
  },
  relationships: {
    [ROOT_ID]: ['dialog'],
  },
})

/**
 * Pick the best sample dataset for a component by name.
 * Components without specific needs get flatList as default.
 */
export function getSampleData(componentName: string): NormalizedData {
  const map: Record<string, NormalizedData> = {
    // Flat list components
    ListBox: flatList,
    RadioGroup: flatList,
    Checkbox: flatList,
    MenuList: flatList,
    SwitchGroup: flatList,
    Toggle: flatList,
    ToggleGroup: flatList,
    // Grouped components
    Accordion: groupedList,
    DisclosureGroup: groupedList,
    NavList: groupedList,
    // Tree components
    TreeView: treeData,
    TreeGrid: treeData,
    // Tab components
    TabList: tabData,
    // Grid
    Grid: gridData,
    // Dialog
    Dialog: dialogData,
    AlertDialog: dialogData,
  }
  return map[componentName] ?? flatList
}
