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
        <div className={ax({ surface: 'sunken', padding: 'md', text: 'secondary' })}>
          {this.props.name}: {this.state.error.message}
        </div>
      )
    }
    return this.props.children
  }
}

// ── Empty State Widget ──

function EmptyStateWidget({ componentName }: Record<string, unknown>) {
  return (
    <div className={ax({ surface: 'sunken', padding: 'md', text: 'muted', textStyle: 'caption' })}>
      No demo: {String(componentName ?? 'unknown')}
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
            <div className={ax({ padding: 'md' })}>
              <div className={ax({ textStyle: 'caption', text: 'muted', padding: 'xs' })}>
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
          <div className={ax({ surface: 'sunken', padding: 'md', text: 'muted' })}>
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
    const reg: WidgetRegistry = { __empty__: EmptyStateWidget }

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
    <FlatLayout
      data={layoutData}
      registry={registry}
      aria-label="Component Catalog"
    />
  )
}
