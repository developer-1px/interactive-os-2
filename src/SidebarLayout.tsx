import { useCallback, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FOCUS_ID } from './interactive-os/plugins/core'
import { NavList } from './interactive-os/ui/NavList'
import { createStore } from './interactive-os/core/createStore'
import { ROOT_ID } from './interactive-os/core/types'
import type { NormalizedData } from './interactive-os/core/types'
import { AreaSidebar } from './pages/AreaSidebar'
import { routeConfig, type RouteGroup } from './routeConfig'

// --- Pre-computed sidebar stores ---

function toStore(items: { id: string; [key: string]: unknown }[]): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const ids: string[] = []
  for (const item of items) {
    const { id, ...data } = item
    entities[id] = { id, data }
    ids.push(id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

const sidebarStores = Object.fromEntries(
  routeConfig.map((g) => [
    g.id,
    toStore(g.items.map((item) => ({ id: item.path, label: item.label }))),
  ])
)

// --- Sidebar ---

function Sidebar({ activeGroup, activeItemPath }: { activeGroup: RouteGroup; activeItemPath?: string }) {
  const navigate = useNavigate()

  const handleActivate = useCallback((nodeId: string) => {
    navigate(`/${activeGroup.id}/${nodeId}`)
  }, [navigate, activeGroup.id])

  const sidebarStore = useMemo(() => {
    const base = sidebarStores[activeGroup.id]
    if (!activeItemPath || !base.entities[activeItemPath]) return base
    return {
      ...base,
      entities: {
        ...base.entities,
        [FOCUS_ID]: { id: FOCUS_ID, focusedId: activeItemPath },
      },
    }
  }, [activeGroup.id, activeItemPath])

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-mark" />
          <h1>interactive-os</h1>
        </div>
        <span className="version">v0.1.0</span>
      </div>
      <div className="sidebar-section-title">{activeGroup.label}</div>
      <NavList
        key={activeGroup.id}
        data={sidebarStore}
        onActivate={handleActivate}
        renderItem={(node) => {
          const item = activeGroup.items.find((i) => i.path === node.id)
          return (
            <div className="sidebar-link">
              {(node.data as { label: string }).label}
              {item?.status === 'wip' && <span className="badge-wip">wip</span>}
              {item?.status === 'placeholder' && <span className="badge-wip">soon</span>}
            </div>
          )
        }}
        aria-label={`${activeGroup.label} pages`}
      />
    </nav>
  )
}

// --- SidebarLayout ---

export default function SidebarLayout() {
  const { pathname } = useLocation()
  const activeGroup = routeConfig.find((g) => pathname.startsWith('/' + g.id))

  if (!activeGroup) return <Outlet />

  const activeItemPath = pathname.slice(('/' + activeGroup.id + '/').length)

  return (
    <>
      {activeGroup.id === 'internals/area'
        ? <AreaSidebar />
        : <Sidebar activeGroup={activeGroup} activeItemPath={activeItemPath} />
      }
      <main className="content">
        <Outlet />
      </main>
    </>
  )
}
