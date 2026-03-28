import React, { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../store/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'

import { alert } from '../pattern/roles/alert'
import { checkboxMixed } from '../pattern/roles/checkboxMixed'
import { feed } from '../pattern/roles/feed'
import { link } from '../pattern/roles/link'
import { listboxGrouped } from '../pattern/roles/listboxGrouped'
import { menuActivedescendant } from '../pattern/roles/menuActivedescendant'
import { meter } from '../pattern/roles/meter'
import { radiogroupActivedescendant } from '../pattern/roles/radiogroupActivedescendant'
import { table } from '../pattern/roles/table'
import { tabsManual } from '../pattern/roles/tabsManual'
import { windowSplitter } from '../pattern/roles/windowSplitter'

import styles from './PatternDemo.module.css'

interface PatternEntry {
  pattern: AriaPattern
  data: NormalizedData
  label: string
}

function flatData(items: Array<{ id: string; label: string }>): NormalizedData {
  return createStore({
    entities: Object.fromEntries(items.map(i => [i.id, { id: i.id, data: { label: i.label } }])),
    relationships: { [ROOT_ID]: items.map(i => i.id) },
  })
}

function nestedData(
  groups: Array<{ id: string; label: string; children: Array<{ id: string; label: string }> }>,
): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }
  for (const g of groups) {
    entities[g.id] = { id: g.id, data: { label: g.label } }
    relationships[ROOT_ID].push(g.id)
    relationships[g.id] = g.children.map(c => c.id)
    for (const c of g.children) {
      entities[c.id] = { id: c.id, data: { label: c.label } }
    }
  }
  return createStore({ entities, relationships })
}

function threeLevel(
  groups: Array<{ id: string; label: string; rows: Array<{ id: string; label: string; cells: Array<{ id: string; label: string }> }> }>,
): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }
  for (const g of groups) {
    entities[g.id] = { id: g.id, data: { label: g.label } }
    relationships[ROOT_ID].push(g.id)
    relationships[g.id] = g.rows.map(r => r.id)
    for (const r of g.rows) {
      entities[r.id] = { id: r.id, data: { label: r.label } }
      relationships[r.id] = r.cells.map(c => c.id)
      for (const c of r.cells) {
        entities[c.id] = { id: c.id, data: { label: c.label } }
      }
    }
  }
  return createStore({ entities, relationships })
}

function valueData(label: string): NormalizedData {
  return createStore({
    entities: {
      handle: { id: 'handle', data: { label, value: 0, min: 0, max: 100 } },
    },
    relationships: { [ROOT_ID]: ['handle'] },
  })
}

const registry: Record<string, PatternEntry> = {
  alert:         { pattern: alert, data: flatData([{ id: 'msg', label: 'Operation completed successfully.' }]), label: 'Alert' },
  checkboxMixed: { pattern: checkboxMixed, data: nestedData([{ id: 'all', label: 'Select All', children: [{ id: 'opt1', label: 'Read' }, { id: 'opt2', label: 'Write' }, { id: 'opt3', label: 'Execute' }] }]), label: 'Checkbox Mixed' },
  feed:          { pattern: feed, data: flatData([{ id: 'a1', label: 'Article: New Release' }, { id: 'a2', label: 'Article: Update Notes' }, { id: 'a3', label: 'Article: Migration Guide' }]), label: 'Feed' },
  link:          { pattern: link, data: flatData([{ id: 'home', label: 'Home' }, { id: 'about', label: 'About' }, { id: 'contact', label: 'Contact' }]), label: 'Link' },
  listboxGrouped: { pattern: listboxGrouped, data: nestedData([{ id: 'citrus', label: 'Citrus', children: [{ id: 'orange', label: 'Orange' }, { id: 'lemon', label: 'Lemon' }] }, { id: 'berry', label: 'Berries', children: [{ id: 'straw', label: 'Strawberry' }, { id: 'blue', label: 'Blueberry' }] }]), label: 'Listbox Grouped' },
  menuActivedescendant: { pattern: menuActivedescendant, data: flatData([{ id: 'cut', label: 'Cut' }, { id: 'copy', label: 'Copy' }, { id: 'paste', label: 'Paste' }]), label: 'Menu (activedescendant)' },
  meter:         { pattern: meter, data: valueData('CPU Usage'), label: 'Meter' },
  radiogroupActivedescendant: { pattern: radiogroupActivedescendant, data: flatData([{ id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }]), label: 'Radio Group (activedescendant)' },
  table:         { pattern: table, data: threeLevel([{ id: 'tbody', label: 'Data', rows: [{ id: 'r1', label: 'Row 1', cells: [{ id: 'c1a', label: 'Alice' }, { id: 'c1b', label: 'Engineer' }] }, { id: 'r2', label: 'Row 2', cells: [{ id: 'c2a', label: 'Bob' }, { id: 'c2b', label: 'Designer' }] }] }]), label: 'Table' },
  tabsManual:    { pattern: tabsManual, data: flatData([{ id: 'tab1', label: 'Overview' }, { id: 'tab2', label: 'Activity' }, { id: 'tab3', label: 'Settings' }]), label: 'Tabs Manual' },
  windowSplitter: { pattern: windowSplitter({ min: 0, max: 100, step: 1 }), data: valueData('Panel Size'), label: 'Window Splitter' },
}

function getStateLabel(state: NodeState): string | null {
  const parts: string[] = []
  if (state.selected) parts.push('selected')
  if (state.expanded === true) parts.push('expanded')
  if (state.expanded === false) parts.push('collapsed')
  if (state.checked === true) parts.push('checked')
  if (state.checked === 'mixed') parts.push('mixed')
  if (state.valueCurrent !== undefined) parts.push(`${state.valueCurrent}`)
  return parts.length > 0 ? parts.join(', ') : null
}

function getItemClass(state: NodeState): string {
  if (state.focused && state.selected) return `${styles.item} ${styles.itemFocusedSelected}`
  if (state.focused) return `${styles.item} ${styles.itemFocused}`
  if (state.selected) return `${styles.item} ${styles.itemSelected}`
  return styles.item
}

const defaultRender = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const data = node.data as Record<string, unknown> | undefined
  const label = (data?.label as string) ?? (data?.name as string) ?? (node.id as string)
  const stateLabel = getStateLabel(state)
  const indent = (state.level ?? 1) > 1 ? { paddingLeft: `calc(var(--space-lg) * ${(state.level ?? 1) - 1})` } : undefined

  return (
    <div {...props} className={getItemClass(state)} style={indent}>
      <span>{label}</span>
      {stateLabel && <span className={styles.badge}>{stateLabel}</span>}
    </div>
  )
}

export function PatternDemo({ example }: { example: string }) {
  const entry = registry[example]

  if (!entry) {
    return <div style={{ color: 'var(--tone-destructive-base)' }}>Unknown example: {example}</div>
  }

  return <PatternDemoInner entry={entry} />
}

function PatternDemoInner({ entry }: { entry: PatternEntry }) {
  const [data, setData] = useState(() => entry.data)
  const onChange = useCallback((next: NormalizedData) => setData(next), [])
  const pattern = useMemo(() => entry.pattern, [entry.pattern])

  return (
    <div className={styles.container}>
      <Aria
        pattern={pattern}
        data={data}
        plugins={[]}
        onChange={onChange}
        aria-label={entry.label}
      >
        <Aria.Item render={defaultRender} />
      </Aria>
    </div>
  )
}
