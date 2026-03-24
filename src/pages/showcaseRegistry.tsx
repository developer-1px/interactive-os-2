/* eslint-disable react-refresh/only-export-components */
// ② 2026-03-25-registry-md-ssot-prd.md
import type { NormalizedData } from '../interactive-os/store/types'

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

// --- Component registry (render-only) ---

export interface ComponentEntry {
  slug: string
  render: (data: NormalizedData, onChange: (d: NormalizedData) => void) => React.ReactNode
  makeData: () => NormalizedData
  testPath?: string
}

export const components: ComponentEntry[] = [
  {
    slug: 'accordion',
    makeData: makeAccordionData,
    render: (data, onChange) => <Accordion data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/accordion-keyboard.integration.test',
  },
  {
    slug: 'alert-dialog',
    makeData: makeAlertDialogData,
    render: (data, onChange) => <AlertDialog data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/alertdialog-keyboard.integration.test',
  },
  {
    slug: 'combobox',
    makeData: makeComboboxData,
    render: (data, onChange) => <Combobox data={data} onChange={onChange} placeholder="Pick a color..." />,
    testPath: 'src/interactive-os/__tests__/combobox-keyboard.integration.test',
  },
  {
    slug: 'checkbox',
    makeData: makeCheckboxData,
    render: (data, onChange) => <Checkbox data={data} onChange={onChange} />,
  },
  {
    slug: 'disclosure-group',
    makeData: makeDisclosureGroupData,
    render: (data, onChange) => <DisclosureGroup data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/disclosure-keyboard.integration.test',
  },
  {
    slug: 'dialog',
    makeData: makeDialogData,
    render: (data, onChange) => <Dialog data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/dialog-keyboard.integration.test',
  },
  {
    slug: 'grid',
    makeData: makeGridData,
    testPath: 'src/interactive-os/__tests__/grid-keyboard.integration.test',
    render: (data, onChange) => (
      <Grid
        data={data}
        onChange={onChange}
        columns={[
          { key: 'id', header: 'ID' },
          { key: 'title', header: 'Title' },
          { key: 'priority', header: 'Priority' },
        ]}
        aria-label="Issue tracker"
      />
    ),
  },
  {
    slug: 'kanban',
    makeData: makeKanbanData,
    render: (data, onChange) => <Kanban data={data} onChange={onChange} aria-label="Project board" />,
    testPath: 'src/interactive-os/__tests__/kanban-keyboard.integration.test',
  },
  {
    slug: 'listbox',
    makeData: makeListBoxData,
    render: (data, onChange) => <ListBox data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/listbox-keyboard.integration.test',
  },
  {
    slug: 'menu-list',
    makeData: makeMenuListData,
    render: (data, onChange) => <MenuList data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/menu-keyboard.integration.test',
  },
  {
    slug: 'navlist',
    makeData: makeNavListData,
    render: (data, onChange) => <NavList data={data} onChange={onChange} onActivate={() => {}} />,
    testPath: 'src/interactive-os/__tests__/navlist.integration.test',
  },
  {
    slug: 'radio-group',
    makeData: makeRadioGroupData,
    render: (data, onChange) => <RadioGroup data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/radiogroup-keyboard.integration.test',
  },
  {
    slug: 'slider',
    makeData: makeSliderData,
    render: (data, onChange) => <Slider data={data} onChange={onChange} min={0} max={100} step={1} />,
    testPath: 'src/interactive-os/__tests__/slider-keyboard.integration.test',
  },
  {
    slug: 'spinbutton',
    makeData: makeSpinbuttonData,
    render: (data, onChange) => <Spinbutton data={data} onChange={onChange} min={0} max={99} step={1} />,
    testPath: 'src/interactive-os/__tests__/spinbutton-keyboard.integration.test',
  },
  {
    slug: 'switch-group',
    makeData: makeSwitchGroupData,
    render: (data, onChange) => <SwitchGroup data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/switch-keyboard.integration.test',
  },
  {
    slug: 'tab-list',
    makeData: makeTabListData,
    render: (data, onChange) => <TabList data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/tablist.integration.test',
  },
  {
    slug: 'toaster',
    makeData: makeListBoxData,
    render: () => <ToasterDemo />,
  },
  {
    slug: 'toggle',
    makeData: makeToggleData,
    render: (data, onChange) => <Toggle data={data} onChange={onChange} />,
  },
  {
    slug: 'toggle-group',
    makeData: makeToggleGroupData,
    render: (data, onChange) => <ToggleGroup data={data} onChange={onChange} />,
  },
  {
    slug: 'toolbar',
    makeData: makeToolbarData,
    render: (data, onChange) => <Toolbar data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/toolbar-keyboard.integration.test',
  },
  {
    slug: 'tree-grid',
    makeData: makeTreeGridData,
    render: (data, onChange) => <TreeGrid data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/treegrid-keyboard.integration.test',
  },
  {
    slug: 'tree-view',
    makeData: makeTreeViewData,
    render: (data, onChange) => <TreeView data={data} onChange={onChange} />,
    testPath: 'src/interactive-os/__tests__/treeview.integration.test',
  },
]
