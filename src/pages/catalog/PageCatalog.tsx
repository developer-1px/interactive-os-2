// ── PageCatalog ──
// /catalog route — auto-discovered component demos via FlatLayout

import React, { useEffect, useMemo } from 'react'
import type { NormalizedData } from '@os/store/types'
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { FlatLayout } from '@os/ui/FlatLayout'
import { ax } from '@styles/ax'
import { type CatalogData, type CatalogEntry, loadCatalog } from './catalogLoader'
import { buildCatalogLayout } from './catalogLayout'

// ── Error Boundary ──

interface ErrorBoundaryState {
  error: Error | null
}

class DemoErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className={ax({ surface: 'sunken', padding: 'md', text: 'secondary', textStyle: 'caption' })}>
          {this.props.name}: {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}

// ── Section Header Widget ──

function SectionHeaderWidget({ label, count }: Record<string, unknown>) {
  return (
    <div className={ax({ layout: 'spread', width: 'full', padding: 'sm' })}>
      <span className={ax({ textStyle: 'section', text: 'primary' })}>
        {String(label ?? '').toUpperCase()}
      </span>
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>
        {String(count ?? 0)}
      </span>
    </div>
  )
}

// ── Empty State Widget ──

function EmptyStateWidget({ componentName }: Record<string, unknown>) {
  return (
    <div className={ax({ surface: 'sunken', padding: 'sm', text: 'muted', textStyle: 'caption', shape: 'sm' })}>
      {String(componentName ?? 'unknown')}
    </div>
  )
}

// ── Demo Wrapper ──

function createDemoWidget(entry: CatalogEntry) {
  const LazyDemo = React.lazy(async () => {
    const mod = await entry.load()
    const Demo = mod.Demo
    return {
      default: function DemoWidget() {
        return (
          <DemoErrorBoundary name={entry.slug}>
            <div className={ax({ surface: 'display', padding: 'md', shape: 'sm', layout: 'column', gap: 'sm' })}>
              <div className={ax({ textStyle: 'caption', text: 'muted' })}>
                {entry.label}
              </div>
              <Demo />
            </div>
          </DemoErrorBoundary>
        )
      },
    }
  })

  return function CatalogDemoWidget() {
    return (
      <React.Suspense
        fallback={
          <div className={ax({ surface: 'display', padding: 'md', shape: 'sm', text: 'muted', textStyle: 'caption' })}>
            Loading {entry.slug}...
          </div>
        }
      >
        <LazyDemo />
      </React.Suspense>
    )
  }
}

// ── Page Component ──

// @useState-hatch — catalog data is async fetch result, not interactive state
export default function PageCatalog() {
  const [catalog, setCatalog] = React.useState<CatalogData | null>(null)

  useEffect(() => {
    loadCatalog().then(setCatalog)
  }, [])

  const layoutData = useMemo<NormalizedData | null>(() => {
    if (!catalog) return null
    return buildCatalogLayout(catalog)
  }, [catalog])

  const registry = useMemo<WidgetRegistry>(() => {
    if (!catalog) return {}
    const reg: WidgetRegistry = {
      __empty__: EmptyStateWidget,
      __header__: SectionHeaderWidget,
    }

    for (const entries of Object.values(catalog.categories)) {
      for (const entry of entries) {
        reg[entry.slug] = createDemoWidget(entry)
      }
    }

    return reg
  }, [catalog])

  if (!layoutData) {
    return (
      <div className={ax({ layout: 'center', padding: 'lg', text: 'muted' })}>
        Loading catalog...
      </div>
    )
  }

  return (
    <div className={ax({ padding: 'lg', layout: 'column', gap: 'lg', width: 'full' })}>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        <span className={ax({ textStyle: 'page', text: 'primary' })}>Component Catalog</span>
        <span className={ax({ textStyle: 'body', text: 'muted' })}>
          {Object.values(catalog!.categories).reduce((sum, entries) => sum + entries.length, 0)} components
        </span>
      </div>
      <FlatLayout
        data={layoutData}
        registry={registry}
        aria-label="Component Catalog"
      />
    </div>
  )
}
