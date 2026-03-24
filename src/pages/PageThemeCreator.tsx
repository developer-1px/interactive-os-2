import { useState, useCallback } from 'react'
import styles from './PageThemeCreator.module.css'
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
  makeListBoxData, makeMenuListData, makeNavListData, makeRadioGroupData,
  makeSliderData, makeSpinbuttonData, makeSwitchGroupData, makeTabListData,
  makeToggleData, makeToggleGroupData, makeToolbarData, makeTreeGridData,
  makeTreeViewData,
} from './showcaseFixtures'

/* ── Token definitions ── */

interface TokenControl {
  variable: string
  label: string
  defaultValue: string
  type: 'color' | 'text'
}

const surfaceTokens: TokenControl[] = [
  { variable: '--surface-base', label: 'base', defaultValue: '#09090B', type: 'color' },
  { variable: '--surface-sunken', label: 'sunken', defaultValue: '#18181B', type: 'color' },
  { variable: '--surface-default', label: 'default', defaultValue: '#1F1F23', type: 'color' },
  { variable: '--surface-raised', label: 'raised', defaultValue: '#27272A', type: 'color' },
  { variable: '--surface-overlay', label: 'overlay', defaultValue: '#3F3F46', type: 'color' },
]

const semanticTokens: TokenControl[] = [
  { variable: '--primary', label: 'primary', defaultValue: '#5B5BD6', type: 'color' },
  { variable: '--focus', label: 'focus', defaultValue: '#5B5BD6', type: 'color' },
  { variable: '--selection', label: 'selection', defaultValue: '#1A3A2A', type: 'color' },
  { variable: '--destructive', label: 'destructive', defaultValue: '#E5484D', type: 'color' },
]

const layoutTokens: TokenControl[] = [
  { variable: '--radius', label: 'radius', defaultValue: '6px', type: 'text' },
]

const allTokens = [...surfaceTokens, ...semanticTokens, ...layoutTokens]

function getComputedToken(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

/* ── Scenario cards ── */

const noop = () => {}
const demoToaster = createToaster({ duration: 3000, maxToasts: 3 })
let toastCount = 0
const toastVariants: Array<'default' | 'success' | 'error'> = ['default', 'success', 'error']

function BoardCard() {
  const [data, setData] = useState(makeKanbanData)
  return (
    <div className={`${styles.card} ${styles.cardWide}`} data-surface="raised">
      <Kanban data={data} onChange={setData} aria-label="Project board" />
    </div>
  )
}

function PreferencesCard() {
  const [switchData, setSwitchData] = useState(makeSwitchGroupData)
  const [radioData, setRadioData] = useState(makeRadioGroupData)
  const [sliderData, setSliderData] = useState(makeSliderData)
  const [checkboxData, setCheckboxData] = useState(makeCheckboxData)
  return (
    <div className={styles.card} data-surface="default">
      <div className={styles.stack}>
        <SwitchGroup data={switchData} onChange={setSwitchData} />
        <RadioGroup data={radioData} onChange={setRadioData} />
        <Slider data={sliderData} onChange={setSliderData} min={0} max={100} step={1} />
        <Checkbox data={checkboxData} onChange={setCheckboxData} />
      </div>
    </div>
  )
}

function DataViewCard() {
  const [gridData, setGridData] = useState(makeGridData)
  const [tabData, setTabData] = useState(makeTabListData)
  const [comboData, setComboData] = useState(makeComboboxData)
  return (
    <div className={`${styles.card} ${styles.cardWide}`} data-surface="sunken">
      <div className={styles.stack}>
        <div className={styles.row}>
          <TabList data={tabData} onChange={setTabData} />
          <Combobox data={comboData} onChange={setComboData} placeholder="Filter..." />
        </div>
        <Grid
          data={gridData}
          onChange={setGridData}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'role', header: 'Role' },
            { key: 'city', header: 'City' },
          ]}
          aria-label="Team members"
        />
      </div>
    </div>
  )
}

function ExplorerCard() {
  const [treeData, setTreeData] = useState(makeTreeViewData)
  const [toolbarData, setToolbarData] = useState(makeToolbarData)
  return (
    <div className={styles.card} data-surface="default">
      <div className={styles.stack}>
        <Toolbar data={toolbarData} onChange={setToolbarData} />
        <TreeView data={treeData} onChange={setTreeData} />
      </div>
    </div>
  )
}

function HierarchyCard() {
  const [data, setData] = useState(makeTreeGridData)
  return (
    <div className={styles.card} data-surface="raised">
      <TreeGrid data={data} onChange={setData} />
    </div>
  )
}

function InputGroupCard() {
  const [spinData, setSpinData] = useState(makeSpinbuttonData)
  const [toggleData, setToggleData] = useState(makeToggleData)
  const [groupData, setGroupData] = useState(makeToggleGroupData)
  return (
    <div className={styles.card} data-surface="outlined">
      <div className={styles.stack}>
        <Spinbutton data={spinData} onChange={setSpinData} min={0} max={99} step={1} />
        <Toggle data={toggleData} onChange={setToggleData} />
        <ToggleGroup data={groupData} onChange={setGroupData} />
      </div>
    </div>
  )
}

function SidebarCard() {
  const [navData, setNavData] = useState(makeNavListData)
  const [accordionData, setAccordionData] = useState(makeAccordionData)
  return (
    <div className={styles.card} data-surface="sunken">
      <div className={styles.stack}>
        <NavList data={navData} onChange={setNavData} onActivate={noop} />
        <Accordion data={accordionData} onChange={setAccordionData} />
      </div>
    </div>
  )
}

function ActionsCard() {
  const [listData, setListData] = useState(makeListBoxData)
  return (
    <div className={styles.card} data-surface="default">
      <div className={styles.stack}>
        <button
          className={styles.toastTrigger}
          onClick={() => {
            const variant = toastVariants[toastCount % 3]
            toastCount++
            demoToaster.toast({
              title: `Toast #${toastCount}`,
              description: variant === 'error' ? 'Something went wrong' : variant === 'success' ? 'Operation complete' : 'Notification',
              variant,
            })
          }}
        >
          Add Toast
        </button>
        <Toaster toaster={demoToaster} />
        <ListBox data={listData} onChange={setListData} />
      </div>
    </div>
  )
}

function ConfirmCard() {
  const [dialogData, setDialogData] = useState(makeDialogData)
  const [alertData, setAlertData] = useState(makeAlertDialogData)
  return (
    <div className={styles.card} data-surface="overlay">
      <div className={styles.stack}>
        <Dialog data={dialogData} onChange={setDialogData} />
        <AlertDialog data={alertData} onChange={setAlertData} />
      </div>
    </div>
  )
}

function MenuCard() {
  const [disclosureData, setDisclosureData] = useState(makeDisclosureGroupData)
  const [menuData, setMenuData] = useState(makeMenuListData)
  return (
    <div className={styles.card} data-surface="raised">
      <div className={styles.stack}>
        <DisclosureGroup data={disclosureData} onChange={setDisclosureData} />
        <MenuList data={menuData} onChange={setMenuData} />
      </div>
    </div>
  )
}

/* ── Main ── */

export default function PageThemeCreator() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const token of allTokens) {
      const computed = getComputedToken(token.variable)
      initial[token.variable] = computed || token.defaultValue
    }
    return initial
  })

  const handleChange = useCallback((variable: string, value: string) => {
    document.documentElement.style.setProperty(variable, value)
    setValues(prev => ({ ...prev, [variable]: value }))
  }, [])

  const handleReset = useCallback(() => {
    for (const token of allTokens) {
      document.documentElement.style.removeProperty(token.variable)
    }
    const fresh: Record<string, string> = {}
    for (const token of allTokens) {
      const computed = getComputedToken(token.variable)
      fresh[token.variable] = computed || token.defaultValue
    }
    setValues(fresh)
  }, [])

  const renderTokenRow = (token: TokenControl) => (
    <div key={token.variable} className={styles.tokenRow}>
      {token.type === 'color' ? (
        <>
          <input
            type="color"
            className={styles.swatch}
            value={values[token.variable]}
            onChange={e => handleChange(token.variable, e.target.value)}
          />
          <span className={styles.label}>{token.label}</span>
          <input
            type="text"
            className={styles.hex}
            value={values[token.variable]}
            onChange={e => handleChange(token.variable, e.target.value)}
          />
        </>
      ) : (
        <>
          <span className={styles.label}>{token.label}</span>
          <input
            type="text"
            className={styles.radiusInput}
            value={values[token.variable]}
            onChange={e => handleChange(token.variable, e.target.value)}
          />
        </>
      )}
    </div>
  )

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <h3 className={styles.heading}>Surface</h3>
        {surfaceTokens.map(renderTokenRow)}

        <h3 className={styles.heading}>Color</h3>
        {semanticTokens.map(renderTokenRow)}

        <h3 className={styles.heading}>Layout</h3>
        {layoutTokens.map(renderTokenRow)}

        <button className={styles.reset} onClick={handleReset}>Reset</button>
      </div>

      <div className={styles.preview} data-surface="base">
        <div className={styles.grid}>
          <BoardCard />
          <PreferencesCard />
          <DataViewCard />
          <ExplorerCard />
          <HierarchyCard />
          <InputGroupCard />
          <SidebarCard />
          <ActionsCard />
          <ConfirmCard />
          <MenuCard />
        </div>
      </div>
    </div>
  )
}
