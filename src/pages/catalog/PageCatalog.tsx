// ② flatlayout-nav-catalog-prd.md
// /catalog route — auto-discovered component demos via FlatLayout

import React, { useContext, useEffect, useMemo } from 'react'
import type { NormalizedData } from '@os/store/types'
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { FlatLayout } from '@os/ui/FlatLayout'
import { NavLayoutContext } from '@os/ui/NavLayoutContext'
import { TreeView } from '@os/ui/TreeView'
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

// ── Nav Widget ──

function CatalogNavWidget({ navData, nodeIdToIndex }: Record<string, unknown>) {
  const { setActiveIndex } = useContext(NavLayoutContext)
  const data = navData as NormalizedData
  const map = nodeIdToIndex as Record<string, number>

  return (
    <TreeView
      data={data}
      selectable
      selectionFollowsFocus
      activateOnClick
      onActivate={(nodeId: string) => {
        const idx = map[nodeId]
        if (typeof idx === 'number') setActiveIndex(idx)
      }}
      aria-label="Component Catalog"
    />
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
            <div className={ax({ surface: 'display', padding: 'md', shape: 'md', layout: 'stack', gap: 'sm', border: 'default', scroll: 'hidden' })}>
              <div className={ax({ layout: 'spread', gap: 'sm' })}>
                <div className={ax({ textStyle: 'caption', text: 'secondary', content: 'text' })}>
                  {entry.label}
                </div>
                {entry.axes && entry.axes.length > 0 && (
                  <div className={ax({ layout: 'row', gap: 'xs' })}>
                    {entry.axes.map((axis) => (
                      <span key={axis} className={ax({ surface: 'sunken', padding: 'xs', shape: 'sm', textStyle: 'caption', text: 'muted' })}>
                        {axis}
                      </span>
                    ))}
                  </div>
                )}
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
          <div className={ax({ surface: 'display', padding: 'md', shape: 'md', text: 'muted', textStyle: 'caption', border: 'default' })}>
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
      __nav__: CatalogNavWidget,
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
    <FlatLayout
      data={layoutData}
      registry={registry}
      aria-label="Component Catalog"
    />
  )
}
