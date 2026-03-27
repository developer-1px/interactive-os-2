// ② 2026-03-25-design-primitives-preview-prd.md
import { useState, useCallback } from 'react'
import styles from './PageThemeCreator.module.css'
import { Button } from '../interactive-os/ui/Button'
import { TextInput } from '../interactive-os/ui/TextInput'
import { Accordion } from '../interactive-os/ui/Accordion'
import { Breadcrumb } from '../interactive-os/ui/Breadcrumb'
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
import { Tooltip } from '../interactive-os/ui/Tooltip'
import { createToaster } from '../interactive-os/ui/createToaster'

import {
  makeAccordionData, makeAlertDialogData, makeCheckboxData, makeComboboxData,
  makeDialogData, makeDisclosureGroupData, makeGridData, makeKanbanData,
  makeListBoxData, makeMenuListData, makeNavListData, makeRadioGroupData,
  makeSliderData, makeSpinbuttonData, makeSwitchGroupData, makeTabListData,
  makeToggleData, makeToggleGroupData, makeToolbarData, makeTreeGridData,
  makeTreeViewData,
} from './showcaseFixtures'

/* ══ Specimen data ══ */

const surfaceModes = ['action', 'input', 'display', 'overlay'] as const

const shapeLevels = [
  { name: 'xs', radius: '6px', py: '6px', px: '12px' },
  { name: 'sm', radius: '6px', py: '6px', px: '16px' },
  { name: 'md', radius: '10px', py: '0', px: '12px' },
  { name: 'lg', radius: '12px', py: '20px', px: '20px' },
  { name: 'xl', radius: '20px', py: '24px', px: '24px' },
  { name: 'pill', radius: '9999px' },
] as const

const typeLevels = [
  { name: 'hero', desc: '40 · 330 · Serif · 1.5' },
  { name: 'display', desc: '32 · 400 · Serif · 1.3' },
  { name: 'page', desc: '24 · 500 · Serif · 1.3' },
  { name: 'section', desc: '16 · 600 · Sans · 1.4' },
  { name: 'body', desc: '14 · 430 · Sans · 1.4' },
  { name: 'caption', desc: '12 · 430 · Sans · 1.33' },
] as const

const toneNames = ['primary', 'destructive', 'success', 'warning', 'neutral'] as const
const toneAxes = ['base', 'hover', 'dim', 'mid', 'bright', 'foreground'] as const
const toneHasMidBright = new Set(['primary'])

const motionLevels = [
  { name: 'instant', desc: '75ms' },
  { name: 'normal', desc: '150ms' },
  { name: 'enter', desc: '150ms (decel)' },
] as const

const weightLevels = [
  { name: 'light', value: 330 },
  { name: 'regular', value: 400 },
  { name: 'book', value: 430 },
  { name: 'medium', value: 500 },
  { name: 'semi', value: 600 },
] as const

const leadingLevels = [
  { name: 'tight', value: 1.3 },
  { name: 'snug', value: 1.4 },
  { name: 'normal', value: 1.5 },
  { name: 'relaxed', value: 1.75 },
  { name: 'code', value: 1.6 },
] as const

const textColorLevels = ['bright', 'primary', 'secondary', 'muted'] as const
const borderLevels = ['subtle', 'default', 'strong'] as const
const spacingLevels = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const

/* ══ Specimens ══ */

function SurfaceSpecimen() {
  return (
    <div className={styles.specimen}>
      <h3 className={styles.specimenTitle}>Surface</h3>
      <div className={styles.swatchRow4}>
        {surfaceModes.map(mode => (
          <div key={mode} className={styles.swatchItem}>
            <div className={styles.surfaceSwatch} data-surface={mode} />
            <span className={styles.swatchLabel}>{mode}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShapeSpecimen() {
  return (
    <div className={styles.specimen}>
      <h3 className={styles.specimenTitle}>Shape</h3>
      <div className={styles.swatchRow6}>
        {shapeLevels.map(level => (
          <div key={level.name} className={styles.swatchItem}>
            <div
              className={styles.shapeBox}
              style={{
                borderRadius: `var(--shape-${level.name}-radius)`,
                ...('py' in level ? { padding: `var(--shape-${level.name}-py) var(--shape-${level.name}-px)` } : {}),
              }}
            >
              Aa
            </div>
            <span className={styles.swatchLabel}>{level.name}</span>
            <span className={styles.swatchMeta}>{level.radius}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TypeSpecimen() {
  return (
    <div className={styles.specimen}>
      <h3 className={styles.specimenTitle}>Type</h3>
      <div className={styles.typeStack}>
        {typeLevels.map(level => (
          <div key={level.name} className={styles.typeRow}>
            <span
              className={styles.typeSample}
              style={{
                fontSize: `var(--type-${level.name}-size)`,
                fontWeight: `var(--type-${level.name}-weight)`,
                fontFamily: `var(--type-${level.name}-family)`,
                lineHeight: `var(--type-${level.name}-line-height)`,
              }}
            >
              {level.name}
            </span>
            <span className={styles.swatchMeta}>{level.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToneSpecimen() {
  return (
    <div className={styles.specimen}>
      <h3 className={styles.specimenTitle}>Tone</h3>
      <div className={styles.toneGrid}>
        <div className={styles.toneHeaderRow}>
          <span className={styles.toneCorner} />
          {toneAxes.map(axis => (
            <span key={axis} className={styles.toneHeader}>{axis}</span>
          ))}
        </div>
        {toneNames.map(tone => (
          <div key={tone} className={styles.toneRow}>
            <span className={styles.toneRowLabel}>{tone}</span>
            {toneAxes.map(axis => {
              const hasTone = axis !== 'mid' && axis !== 'bright' || toneHasMidBright.has(tone)
              return (
                <span key={axis} className={styles.toneCell}>
                  {hasTone ? (
                    <span
                      className={styles.toneSwatch}
                      style={{ background: `var(--tone-${tone}-${axis})` }}
                    />
                  ) : (
                    <span className={styles.toneEmpty}>—</span>
                  )}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function MotionSpecimen() {
  const [active, setActive] = useState<string | null>(null)

  const handleClick = useCallback((name: string) => {
    setActive(name)
    setTimeout(() => setActive(null), 600)
  }, [])

  return (
    <div className={styles.specimen}>
      <h3 className={styles.specimenTitle}>Motion</h3>
      <div className={styles.swatchRow3}>
        {motionLevels.map(level => (
          <div key={level.name} className={styles.swatchItem}>
            <div
              className={styles.motionTrack}
              onClick={() => handleClick(level.name)}
            >
              <div
                className={styles.motionBox}
                style={{
                  transitionDuration: `var(--motion-${level.name}-duration)`,
                  transitionTimingFunction: `var(--motion-${level.name}-easing)`,
                  transform: active === level.name ? 'translateX(calc(100% - 48px))' : 'translateX(0)',
                }}
              />
            </div>
            <span className={styles.swatchLabel}>{level.name}</span>
            <span className={styles.swatchMeta}>{level.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function IndependentAxesSpecimen() {
  return (
    <div className={styles.specimen}>
      <h3 className={styles.specimenTitle}>Independent Axes</h3>

      <h4 className={styles.subTitle}>Weight</h4>
      <div className={styles.swatchRow5}>
        {weightLevels.map(w => (
          <div key={w.name} className={styles.swatchItem}>
            <span className={styles.weightSample} style={{ fontWeight: `var(--weight-${w.name})` }}>Ag</span>
            <span className={styles.swatchLabel}>{w.name}</span>
            <span className={styles.swatchMeta}>{w.value}</span>
          </div>
        ))}
      </div>

      <h4 className={styles.subTitle}>Line-height</h4>
      <div className={styles.swatchRow5}>
        {leadingLevels.map(l => (
          <div key={l.name} className={styles.swatchItem}>
            <span className={styles.leadingSample} style={{ lineHeight: `var(--leading-${l.name})` }}>
              Line 1<br />Line 2<br />Line 3
            </span>
            <span className={styles.swatchLabel}>{l.name}</span>
            <span className={styles.swatchMeta}>{l.value}</span>
          </div>
        ))}
      </div>

      <h4 className={styles.subTitle}>Text Color</h4>
      <div className={styles.swatchRow6}>
        {textColorLevels.map(level => (
          <div key={level} className={styles.swatchItem}>
            <span className={styles.colorSample} style={{ color: `var(--text-${level})` }}>Aa</span>
            <span className={styles.swatchLabel}>{level}</span>
          </div>
        ))}
      </div>

      <h4 className={styles.subTitle}>Border</h4>
      <div className={styles.swatchRow3}>
        {borderLevels.map(level => (
          <div key={level} className={styles.swatchItem}>
            <div className={styles.borderSwatch} style={{ borderColor: `var(--border-${level})` }} />
            <span className={styles.swatchLabel}>{level}</span>
          </div>
        ))}
      </div>

      <h4 className={styles.subTitle}>Spacing</h4>
      <div className={styles.spacingRow}>
        {spacingLevels.map(level => (
          <div key={level} className={styles.spacingItem}>
            <div className={styles.spacingBar} style={{ width: `var(--space-${level})` }} />
            <span className={styles.swatchLabel}>{level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Scenario cards (unchanged) ══ */

const noop = () => {}
const demoToaster = createToaster({ duration: 3000, maxToasts: 3 })
let toastCount = 0
const toastVariants: Array<'default' | 'success' | 'error'> = ['default', 'success', 'error']

function BoardCard() {
  const [data, setData] = useState(makeKanbanData)
  return (
    <div className={`${styles.card} ${styles.cardWide}`} data-surface="display">
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
    <div className={styles.card} data-surface="display">
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
    <div className={`${styles.card} ${styles.cardWide}`} data-surface="display">
      <div className={styles.stack}>
        <div className={styles.row}>
          <TabList data={tabData} onChange={setTabData} />
          <div className={styles.fill}>
            <Combobox data={comboData} onChange={setComboData} placeholder="Filter by label..." />
          </div>
        </div>
        <Grid
          data={gridData}
          onChange={setGridData}
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'title', header: 'Title' },
            { key: 'priority', header: 'Priority' },
          ]}
          aria-label="Issue tracker"
        />
      </div>
    </div>
  )
}

function ExplorerCard() {
  const [treeData, setTreeData] = useState(makeTreeViewData)
  const [toolbarData, setToolbarData] = useState(makeToolbarData)
  return (
    <div className={styles.card} data-surface="display">
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
    <div className={styles.card} data-surface="display">
      <TreeGrid data={data} onChange={setData} />
    </div>
  )
}

function InputGroupCard() {
  const [spinData, setSpinData] = useState(makeSpinbuttonData)
  const [toggleData, setToggleData] = useState(makeToggleData)
  const [groupData, setGroupData] = useState(makeToggleGroupData)
  return (
    <div className={styles.card} data-surface="display">
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
    <div className={styles.card} data-surface="display">
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
    <div className={styles.card} data-surface="display">
      <div className={styles.stack}>
        <Tooltip content="Cycles through default, success, and error variants">
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
        </Tooltip>
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
    <div className={styles.card} data-surface="display">
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
    <div className={styles.card} data-surface="display">
      <div className={styles.stack}>
        <DisclosureGroup data={disclosureData} onChange={setDisclosureData} />
        <MenuList data={menuData} onChange={setMenuData} />
      </div>
    </div>
  )
}

function FormCard() {
  return (
    <div className={styles.card} data-surface="display">
      <div className={styles.stack}>
        <Breadcrumb path="src/interactive-os/ui/Button.tsx" root="src" />
        <TextInput placeholder="Search components..." />
        <div className={styles.row}>
          <Button variant="accent">Save changes</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </div>
    </div>
  )
}

/* ══ Main ══ */

export default function PageThemeCreator() {
  return (
    <div className={styles.root}>
      <h2 className={styles.pageTitle}>Design System</h2>

      <section className={styles.section}>
        <SurfaceSpecimen />
        <ShapeSpecimen />
        <TypeSpecimen />
        <ToneSpecimen />
        <MotionSpecimen />
        <IndependentAxesSpecimen />
      </section>

      <h2 className={styles.sectionHeading} id="components">Components</h2>

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
        <FormCard />
      </div>
    </div>
  )
}
