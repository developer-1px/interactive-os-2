// ② 2026-03-27-component-creator-prd.md

import React, { Suspense, useMemo } from 'react'
import type { RegistryEntry } from './componentRegistry'
import { getSampleData } from './sampleData'
import styles from './PageComponentCreator.module.css'

interface ComponentCanvasProps {
  entry: RegistryEntry
}

export function ComponentCanvas({ entry }: ComponentCanvasProps) {
  const LazyComponent = useMemo(
    () => React.lazy(async () => {
      const Component = await entry.loadComponent()
      return { default: Component }
    }),
    [entry],
  )

  return (
    <Suspense fallback={<div className={`flex-row items-center justify-center flex-1`}>Loading...</div>}>
      <div className={styles.canvas}>
        <ComponentInstance Component={LazyComponent} name={entry.name} />
      </div>
    </Suspense>
  )
}

interface ComponentInstanceProps {
  Component: React.ComponentType<Record<string, unknown>>
  name: string
}

/** Default props by component name — sensible defaults for Canvas rendering */
const DEFAULT_PROPS: Record<string, Record<string, unknown>> = {
  Button: { children: 'Button' },
  TextInput: { placeholder: 'Type here...' },
  Combobox: { placeholder: 'Search...' },
  Slider: { min: 0, max: 100, step: 1 },
  Spinbutton: { min: 0, max: 100, step: 1, label: 'Value' },
  Grid: { columns: [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
  ]},
}

/** Components that need NormalizedData (Aria-based) */
const NEEDS_DATA = new Set([
  'Accordion', 'Checkbox', 'Dialog', 'DisclosureGroup', 'Grid',
  'ListBox', 'MenuList', 'NavList', 'RadioGroup', 'SwitchGroup',
  'TabList', 'Toggle', 'ToggleGroup', 'TreeGrid', 'TreeView',
  'AlertDialog', 'Kanban', 'Slider', 'Spinbutton', 'Combobox',
])

function ComponentInstance({ Component, name }: ComponentInstanceProps) {
  const props: Record<string, unknown> = {
    ...(DEFAULT_PROPS[name] ?? {}),
  }

  if (NEEDS_DATA.has(name)) {
    props.data = getSampleData(name)
  }

  return <Component {...props} />
}
