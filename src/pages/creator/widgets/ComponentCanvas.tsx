// ② 2026-03-27-component-creator-prd.md

import React, { Component, Suspense, useMemo } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import type { RegistryEntry } from '../componentRegistry'
import { getSampleData } from '../sampleData'
import styles from '../PageComponentCreator.module.css'

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
      <div className={`${styles.canvas} flex-row items-center justify-center flex-1 min-h-0 overflow-auto`}>
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

/** Components that do NOT need NormalizedData (non-Aria simple components) */
const SKIP_DATA = new Set([
  'Breadcrumb', 'Button', 'TextInput',
])

class CanvasErrorBoundary extends Component<{ name: string; children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(err: Error) { return { error: err.message } }
  componentDidCatch(err: Error, info: ErrorInfo) { console.warn(`[Creator] ${this.props.name}:`, err, info) }
  render() {
    if (this.state.error) return <div className={styles.canvasError}>Cannot preview: {this.state.error}</div>
    return this.props.children
  }
}

function ComponentInstance({ Component: Comp, name }: ComponentInstanceProps) {
  const props: Record<string, unknown> = {
    ...(DEFAULT_PROPS[name] ?? {}),
  }

  if (!SKIP_DATA.has(name)) {
    props.data = getSampleData(name)
  }

  return (
    <CanvasErrorBoundary name={name}>
      <Comp {...props} />
    </CanvasErrorBoundary>
  )
}
