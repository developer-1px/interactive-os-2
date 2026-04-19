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
        <div className={ax({
            role: 'cell',
            surface: 'display', textStyle: 'caption' })}>
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
    <div className={ax({
        role: 'cell',
        surface: 'display', textStyle: 'caption' })}>
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
            <div className={ax({ role: 'cell', surface: 'display', layout: 'stack' })}>
              <div className={ax({ layout: 'spread' })}>
                <div className={ax({ textStyle: 'caption' })}>
                  {entry.label}
                </div>
                {entry.axes && entry.axes.length > 0 && (
                  <div className={ax({ layout: 'row' })}>
                    {entry.axes.map((axis) => (
                      <span key={axis} className={ax({
                          role: 'badge',
                        surface: 'display', textStyle: 'caption' })}>
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
          <div className={ax({ role: 'cell', surface: 'display', textStyle: 'caption' })}>
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
      <div className={ax({ layout: 'center' })}>
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
