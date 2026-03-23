import type { NormalizedData } from '../interactive-os/core/types'

import { Accordion } from '../interactive-os/ui/Accordion'
import { AlertDialog } from '../interactive-os/ui/AlertDialog'
import { Checkbox } from '../interactive-os/ui/Checkbox'
import { Combobox } from '../interactive-os/ui/Combobox'
import { Dialog } from '../interactive-os/ui/Dialog'
import { DisclosureGroup } from '../interactive-os/ui/DisclosureGroup'
import { Grid } from '../interactive-os/ui/Grid'
import { Kanban } from '../interactive-os/ui/Kanban'
import { ListBox } from '../interactive-os/ui/ListBox'
import { MenuList } from '../interactive-os/ui/MenuList'
import { NavList } from '../interactive-os/ui/NavList'
import { RadioGroup } from '../interactive-os/ui/RadioGroup'
import { Slider } from '../interactive-os/ui/Slider'
import { Spinbutton } from '../interactive-os/ui/Spinbutton'
import { SwitchGroup } from '../interactive-os/ui/SwitchGroup'
import { TabList } from '../interactive-os/ui/TabList'
import { Toggle } from '../interactive-os/ui/Toggle'
import { ToggleGroup } from '../interactive-os/ui/ToggleGroup'
import { Toolbar } from '../interactive-os/ui/Toolbar'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { TreeView } from '../interactive-os/ui/TreeView'
import { Toaster } from '../interactive-os/ui/Toaster'
import { createToaster } from '../interactive-os/ui/createToaster'

import {
  makeAccordionData, makeAlertDialogData, makeCheckboxData, makeComboboxData,
  makeDialogData, makeDisclosureGroupData, makeGridData, makeKanbanData,
  makeListBoxData, makeMenuListData, makeNavListData, makeRadioGroupData, makeSliderData,
  makeSpinbuttonData, makeSwitchGroupData, makeTabListData, makeToggleData,
  makeToggleGroupData, makeToolbarData, makeTreeGridData, makeTreeViewData,
} from './showcaseFixtures'

// --- Toast demo ---

const demoToaster = createToaster({ duration: 3000, maxToasts: 3 })
let toastCount = 0
const toastVariants: Array<'default' | 'success' | 'error'> = ['default', 'success', 'error']

function ToasterDemo() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => {
        const variant = toastVariants[toastCount % 3]
        toastCount++
        demoToaster.toast({
          title: `Toast #${toastCount}`,
          description: variant === 'error' ? 'Something went wrong' : variant === 'success' ? 'Operation complete' : 'This is a notification',
          variant,
        })
      }}>
        Add Toast
      </button>
      <Toaster toaster={demoToaster} />
    </div>
  )
}

// --- Component registry ---

export interface ComponentEntry {
  slug: string
  name: string
  description: string
  usage: string
  render: (data: NormalizedData, onChange: (d: NormalizedData) => void) => React.ReactNode
  makeData: () => NormalizedData
}

export const components: ComponentEntry[] = [
  {
    slug: 'accordion',
    name: 'Accordion',
    description: 'Vertically stacked headers that expand/collapse content sections.',
    makeData: makeAccordionData,
    render: (data, onChange) => <Accordion data={data} onChange={onChange} />,
    usage: `import { Accordion } from 'interactive-os/ui/Accordion'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    q1: { id: 'q1', data: { label: 'What is interactive-os?' } },
    q2: { id: 'q2', data: { label: 'How does the store work?' } },
  },
  relationships: { __root__: ['q1', 'q2'] },
})

<Accordion data={data} onChange={setData} />`,
  },
  {
    slug: 'alert-dialog',
    name: 'AlertDialog',
    description: 'Modal dialog requiring explicit user confirmation before proceeding — no implicit dismiss.',
    makeData: makeAlertDialogData,
    render: (data, onChange) => <AlertDialog data={data} onChange={onChange} />,
    usage: `import { AlertDialog } from 'interactive-os/ui/AlertDialog'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    message: { id: 'message', data: { label: 'Are you sure?' } },
    confirm: { id: 'confirm', data: { label: 'Confirm' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
  },
  relationships: { __root__: ['message', 'confirm', 'cancel'] },
})

<AlertDialog data={data} onChange={setData} />`,
  },
  {
    slug: 'combobox',
    name: 'Combobox',
    description: 'Input with a filterable dropdown list of options.',
    makeData: makeComboboxData,
    render: (data, onChange) => <Combobox data={data} onChange={onChange} placeholder="Pick a color..." />,
    usage: `import { Combobox } from 'interactive-os/ui/Combobox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    red: { id: 'red', data: { label: 'Red' } },
    blue: { id: 'blue', data: { label: 'Blue' } },
  },
  relationships: { __root__: ['red', 'blue'] },
})

<Combobox data={data} onChange={setData} placeholder="Pick a color..." />`,
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    description: 'A group of checkboxes that can be independently checked or unchecked.',
    makeData: makeCheckboxData,
    render: (data, onChange) => <Checkbox data={data} onChange={onChange} />,
    usage: `import { Checkbox } from 'interactive-os/ui/Checkbox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    terms: { id: 'terms', data: { label: 'Accept terms' } },
    newsletter: { id: 'newsletter', data: { label: 'Subscribe to newsletter' } },
  },
  relationships: { __root__: ['terms', 'newsletter'] },
})

<Checkbox data={data} onChange={setData} />`,
  },
  {
    slug: 'disclosure-group',
    name: 'DisclosureGroup',
    description: 'A group of items that can independently expand or collapse.',
    makeData: makeDisclosureGroupData,
    render: (data, onChange) => <DisclosureGroup data={data} onChange={onChange} />,
    usage: `import { DisclosureGroup } from 'interactive-os/ui/DisclosureGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    general: { id: 'general', data: { label: 'General Settings' } },
    appearance: { id: 'appearance', data: { label: 'Appearance' } },
  },
  relationships: { __root__: ['general', 'appearance'] },
})

<DisclosureGroup data={data} onChange={setData} />`,
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    description: 'Focus-trapping container for modal interactions with keyboard navigation.',
    makeData: makeDialogData,
    render: (data, onChange) => <Dialog data={data} onChange={onChange} />,
    usage: `import { Dialog } from 'interactive-os/ui/Dialog'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    confirm: { id: 'confirm', data: { label: 'Confirm' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
  },
  relationships: { __root__: ['confirm', 'cancel'] },
})

<Dialog data={data} onChange={setData} />`,
  },
  {
    slug: 'grid',
    name: 'Grid',
    description: 'Two-dimensional data grid with row/cell keyboard navigation.',
    makeData: makeGridData,
    render: (data, onChange) => (
      <Grid
        data={data}
        onChange={onChange}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'role', header: 'Role' },
          { key: 'city', header: 'City' },
        ]}
        aria-label="Team members"
      />
    ),
    usage: `import { Grid } from 'interactive-os/ui/Grid'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    r1: { id: 'r1', data: { cells: ['Alice', 'Engineer', 'NYC'] } },
    r2: { id: 'r2', data: { cells: ['Bob', 'Designer', 'SF'] } },
  },
  relationships: { __root__: ['r1', 'r2'] },
})

<Grid
  data={data}
  onChange={setData}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
    { key: 'city', header: 'City' },
  ]}
/>`,
  },
  {
    slug: 'kanban',
    name: 'Kanban',
    description: 'Board layout with columns and cards, spatial keyboard navigation.',
    makeData: makeKanbanData,
    render: (data, onChange) => <Kanban data={data} onChange={onChange} aria-label="Project board" />,
    usage: `import { Kanban } from 'interactive-os/ui/Kanban'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    todo: { id: 'todo', data: { title: 'To Do' } },
    t1: { id: 't1', data: { title: 'Design mockups' } },
  },
  relationships: {
    __root__: ['todo'],
    todo: ['t1'],
  },
})

<Kanban data={data} onChange={setData} aria-label="Board" />`,
  },
  {
    slug: 'listbox',
    name: 'ListBox',
    description: 'Single-selection list with keyboard navigation and focus management.',
    makeData: makeListBoxData,
    render: (data, onChange) => <ListBox data={data} onChange={onChange} />,
    usage: `import { ListBox } from 'interactive-os/ui/ListBox'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    apple: { id: 'apple', data: { label: 'Apple' } },
    banana: { id: 'banana', data: { label: 'Banana' } },
    cherry: { id: 'cherry', data: { label: 'Cherry' } },
  },
  relationships: { __root__: ['apple', 'banana', 'cherry'] },
})

<ListBox data={data} onChange={setData} />`,
  },
  {
    slug: 'menu-list',
    name: 'MenuList',
    description: 'Vertical menu with keyboard navigation and activation.',
    makeData: makeMenuListData,
    render: (data, onChange) => <MenuList data={data} onChange={onChange} />,
    usage: `import { MenuList } from 'interactive-os/ui/MenuList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    cut: { id: 'cut', data: { label: 'Cut' } },
    copy: { id: 'copy', data: { label: 'Copy' } },
    paste: { id: 'paste', data: { label: 'Paste' } },
  },
  relationships: { __root__: ['cut', 'copy', 'paste'] },
})

<MenuList data={data} onChange={setData} />`,
  },
  {
    slug: 'navlist',
    name: 'NavList',
    description: 'Vertical navigation list with keyboard navigation and followFocus activation.',
    makeData: makeNavListData,
    render: (data, onChange) => <NavList data={data} onChange={onChange} onActivate={() => {}} />,
    usage: `import { NavList } from 'interactive-os/ui/NavList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    home: { id: 'home', data: { label: 'Home' } },
    about: { id: 'about', data: { label: 'About' } },
  },
  relationships: { __root__: ['home', 'about'] },
})

<NavList data={data} onActivate={(id) => navigate(id)} />`,
  },
  {
    slug: 'radio-group',
    name: 'RadioGroup',
    description: 'Single-select group where only one option can be active at a time.',
    makeData: makeRadioGroupData,
    render: (data, onChange) => <RadioGroup data={data} onChange={onChange} />,
    usage: `import { RadioGroup } from 'interactive-os/ui/RadioGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    small: { id: 'small', data: { label: 'Small' } },
    medium: { id: 'medium', data: { label: 'Medium' } },
    large: { id: 'large', data: { label: 'Large' } },
  },
  relationships: { __root__: ['small', 'medium', 'large'] },
})

<RadioGroup data={data} onChange={setData} />`,
  },
  {
    slug: 'slider',
    name: 'Slider',
    description: 'Continuous value selector with track and thumb, keyboard + pointer input.',
    makeData: makeSliderData,
    render: (data, onChange) => <Slider data={data} onChange={onChange} min={0} max={100} step={1} />,
    usage: `import { Slider } from 'interactive-os/ui/Slider'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    volume: { id: 'volume', data: { label: 'Volume' } },
  },
  relationships: { __root__: ['volume'] },
})

<Slider data={data} onChange={setData} min={0} max={100} step={1} />`,
  },
  {
    slug: 'spinbutton',
    name: 'Spinbutton',
    description: 'Numeric input with increment/decrement buttons and keyboard control.',
    makeData: makeSpinbuttonData,
    render: (data, onChange) => <Spinbutton data={data} onChange={onChange} min={0} max={99} step={1} />,
    usage: `import { Spinbutton } from 'interactive-os/ui/Spinbutton'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    quantity: { id: 'quantity', data: { label: 'Quantity' } },
  },
  relationships: { __root__: ['quantity'] },
})

<Spinbutton data={data} onChange={setData} min={0} max={99} step={1} />`,
  },
  {
    slug: 'switch-group',
    name: 'SwitchGroup',
    description: 'Toggle switches that can be independently turned on or off.',
    makeData: makeSwitchGroupData,
    render: (data, onChange) => <SwitchGroup data={data} onChange={onChange} />,
    usage: `import { SwitchGroup } from 'interactive-os/ui/SwitchGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    wifi: { id: 'wifi', data: { label: 'Wi-Fi' } },
    bluetooth: { id: 'bluetooth', data: { label: 'Bluetooth' } },
  },
  relationships: { __root__: ['wifi', 'bluetooth'] },
})

<SwitchGroup data={data} onChange={setData} />`,
  },
  {
    slug: 'tab-list',
    name: 'TabList',
    description: 'Horizontal tab bar with keyboard navigation and selection.',
    makeData: makeTabListData,
    render: (data, onChange) => <TabList data={data} onChange={onChange} />,
    usage: `import { TabList } from 'interactive-os/ui/TabList'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    overview: { id: 'overview', data: { label: 'Overview' } },
    api: { id: 'api', data: { label: 'API' } },
    examples: { id: 'examples', data: { label: 'Examples' } },
  },
  relationships: { __root__: ['overview', 'api', 'examples'] },
})

<TabList data={data} onChange={setData} />`,
  },
  {
    slug: 'toaster',
    name: 'Toaster',
    description: 'Ephemeral notifications with auto-dismiss, queue management, and aria-live.',
    makeData: makeListBoxData,
    render: () => <ToasterDemo />,
    usage: `import { Toaster } from 'interactive-os/ui/Toaster'
import { createToaster } from 'interactive-os/ui/createToaster'

const toaster = createToaster({ duration: 5000, maxToasts: 5 })

// trigger from anywhere
toaster.toast({ title: 'Saved', variant: 'success' })
toaster.toast({ title: 'Error', description: 'Network failed', variant: 'error' })

// mount once at app root
<Toaster toaster={toaster} />`,
  },
  {
    slug: 'toggle',
    name: 'Toggle',
    description: 'A single button that can be pressed or unpressed — a standalone on/off switch.',
    makeData: makeToggleData,
    render: (data, onChange) => <Toggle data={data} onChange={onChange} />,
    usage: `import { Toggle } from 'interactive-os/ui/Toggle'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    darkMode: { id: 'darkMode', data: { label: 'Dark Mode' } },
  },
  relationships: { __root__: ['darkMode'] },
})

<Toggle data={data} onChange={setData} />`,
  },
  {
    slug: 'toggle-group',
    name: 'ToggleGroup',
    description: 'Row of toggle buttons where multiple can be active simultaneously — like Bold/Italic/Underline.',
    makeData: makeToggleGroupData,
    render: (data, onChange) => <ToggleGroup data={data} onChange={onChange} />,
    usage: `import { ToggleGroup } from 'interactive-os/ui/ToggleGroup'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
  },
  relationships: { __root__: ['bold', 'italic', 'underline'] },
})

<ToggleGroup data={data} onChange={setData} />`,
  },
  {
    slug: 'toolbar',
    name: 'Toolbar',
    description: 'Horizontal (or vertical) row of action buttons with roving focus and toggle state.',
    makeData: makeToolbarData,
    render: (data, onChange) => <Toolbar data={data} onChange={onChange} />,
    usage: `import { Toolbar } from 'interactive-os/ui/Toolbar'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    bold: { id: 'bold', data: { label: 'Bold' } },
    italic: { id: 'italic', data: { label: 'Italic' } },
    underline: { id: 'underline', data: { label: 'Underline' } },
  },
  relationships: { __root__: ['bold', 'italic', 'underline'] },
})

<Toolbar data={data} onChange={setData} />`,
  },
  {
    slug: 'tree-grid',
    name: 'TreeGrid',
    description: 'Hierarchical tree with grid-like keyboard navigation and expand/collapse.',
    makeData: makeTreeGridData,
    render: (data, onChange) => <TreeGrid data={data} onChange={onChange} />,
    usage: `import { TreeGrid } from 'interactive-os/ui/TreeGrid'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    src: { id: 'src', data: { name: 'src' } },
    components: { id: 'components', data: { name: 'components' } },
    'app-tsx': { id: 'app-tsx', data: { name: 'App.tsx' } },
  },
  relationships: {
    __root__: ['src'],
    src: ['components', 'app-tsx'],
  },
})

<TreeGrid data={data} onChange={setData} />`,
  },
  {
    slug: 'tree-view',
    name: 'TreeView',
    description: 'Hierarchical tree with expand/collapse, used for navigation outlines.',
    makeData: makeTreeViewData,
    render: (data, onChange) => <TreeView data={data} onChange={onChange} />,
    usage: `import { TreeView } from 'interactive-os/ui/TreeView'
import { createStore } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    docs: { id: 'docs', data: { name: 'docs' } },
    readme: { id: 'readme', data: { name: 'README.md' } },
    guide: { id: 'guide', data: { name: 'guide.md' } },
  },
  relationships: {
    __root__: ['docs'],
    docs: ['readme', 'guide'],
  },
})

<TreeView data={data} onChange={setData} />`,
  },
]
