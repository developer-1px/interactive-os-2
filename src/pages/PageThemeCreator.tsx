import { useState, useCallback } from 'react'
import styles from './PageThemeCreator.module.css'
import type { NormalizedData } from '../interactive-os/core/types'

import { ListBox } from '../interactive-os/ui/ListBox'
import { TreeView } from '../interactive-os/ui/TreeView'
import { TabList } from '../interactive-os/ui/TabList'
import { Accordion } from '../interactive-os/ui/Accordion'
import { Toolbar } from '../interactive-os/ui/Toolbar'
import { RadioGroup } from '../interactive-os/ui/RadioGroup'

import {
  makeListBoxData, makeTreeViewData, makeTabListData,
  makeAccordionData, makeToolbarData, makeRadioGroupData,
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

/* ── Live component card ── */

function DemoCard({ title, badge, children }: {
  title: string
  badge: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.card} data-surface="raised">
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardBadge}>{badge}</span>
      </div>
      <div className={styles.cardBody}>
        {children}
      </div>
    </div>
  )
}

/* ── Stateful component wrappers ── */

function LiveListBox() {
  const [data, setData] = useState<NormalizedData>(makeListBoxData)
  return <ListBox data={data} onChange={setData} />
}

function LiveTreeView() {
  const [data, setData] = useState<NormalizedData>(makeTreeViewData)
  return <TreeView data={data} onChange={setData} />
}

function LiveTabList() {
  const [data, setData] = useState<NormalizedData>(makeTabListData)
  return <TabList data={data} onChange={setData} />
}

function LiveAccordion() {
  const [data, setData] = useState<NormalizedData>(makeAccordionData)
  return <Accordion data={data} onChange={setData} />
}

function LiveToolbar() {
  const [data, setData] = useState<NormalizedData>(makeToolbarData)
  return <Toolbar data={data} onChange={setData} />
}

function LiveRadioGroup() {
  const [data, setData] = useState<NormalizedData>(makeRadioGroupData)
  return <RadioGroup data={data} onChange={setData} />
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
    <div key={token.variable} className={styles.row}>
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

      <div className={styles.preview}>
        <div className={styles.grid}>
          <DemoCard title="ListBox" badge="navigation">
            <LiveListBox />
          </DemoCard>

          <DemoCard title="TreeView" badge="navigation">
            <LiveTreeView />
          </DemoCard>

          <DemoCard title="Tabs" badge="navigation">
            <LiveTabList />
          </DemoCard>

          <DemoCard title="Accordion" badge="navigation">
            <LiveAccordion />
          </DemoCard>

          <DemoCard title="Toolbar" badge="navigation">
            <LiveToolbar />
          </DemoCard>

          <DemoCard title="RadioGroup" badge="value">
            <LiveRadioGroup />
          </DemoCard>
        </div>
      </div>
    </div>
  )
}
