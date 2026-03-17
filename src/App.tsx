import { useCallback, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Database, Cog, Compass, Layers, Eye, Map } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './App.css'

import { Aria } from './interactive-os/components/aria'
import { tabs } from './interactive-os/behaviors/tabs'
import { listbox } from './interactive-os/behaviors/listbox'
import { core } from './interactive-os/plugins/core'
import { createStore } from './interactive-os/core/createStore'
import { ROOT_ID } from './interactive-os/core/types'
import type { AriaBehavior } from './interactive-os/behaviors/types'
import type { NormalizedData } from './interactive-os/core/types'

import PageTreeGrid from './pages/PageTreeGrid'
import PageListbox from './pages/PageListbox'
import PageTabs from './pages/PageTabs'
import PageMenu from './pages/PageMenu'
import PageAccordion from './pages/PageAccordion'
import PageDisclosure from './pages/PageDisclosure'
import PageDialog from './pages/PageDialog'
import PageCombobox from './pages/PageCombobox'
import PageToolbar from './pages/PageToolbar'
import PageGrid from './pages/PageGrid'
import PageRadioGroup from './pages/PageRadioGroup'
import PageAlertDialog from './pages/PageAlertDialog'
import PageSwitch from './pages/PageSwitch'
import PageTreeView from './pages/PageTreeView'
import PageTabsCrud from './pages/PageTabsCrud'
import PageViewer from './pages/PageViewer'
import Placeholder from './pages/Placeholder'

// --- Vertical tabs behavior (ActivityBar is a vertical tablist) ---

const verticalTabs: AriaBehavior = {
  ...tabs,
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
}

// --- Route config → NormalizedData helper ---

function toStore(items: { id: string; label: string }[]): NormalizedData {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const ids: string[] = []
  for (const item of items) {
    entities[item.id] = { id: item.id, data: { label: item.label } }
    ids.push(item.id)
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ids } })
}

// --- Route config ---

interface RouteItem {
  path: string
  label: string
  status: 'ready' | 'wip' | 'placeholder'
  component: React.ComponentType | null
}

interface RouteGroup {
  id: string
  label: string
  icon: LucideIcon
  basePath: string
  items: RouteItem[]
}

const routeConfig: RouteGroup[] = [
  {
    id: 'store',
    label: 'Store',
    icon: Database,
    basePath: '/store/explorer',
    items: [
      { path: 'explorer', label: 'Explorer', status: 'placeholder', component: null },
      { path: 'operations', label: 'Operations', status: 'placeholder', component: null },
    ],
  },
  {
    id: 'engine',
    label: 'Engine',
    icon: Cog,
    basePath: '/engine/pipeline',
    items: [
      { path: 'pipeline', label: 'Pipeline', status: 'placeholder', component: null },
      { path: 'history', label: 'History', status: 'placeholder', component: null },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    icon: Compass,
    basePath: '/navigation/accordion',
    items: [
      { path: 'accordion', label: 'Accordion', status: 'ready', component: PageAccordion },
      { path: 'disclosure', label: 'Disclosure', status: 'ready', component: PageDisclosure },
      { path: 'switch', label: 'Switch', status: 'ready', component: PageSwitch },
      { path: 'tabs', label: 'Tabs', status: 'ready', component: PageTabs },
      { path: 'radiogroup', label: 'RadioGroup', status: 'ready', component: PageRadioGroup },
      { path: 'menu', label: 'Menu', status: 'ready', component: PageMenu },
      { path: 'toolbar', label: 'Toolbar', status: 'ready', component: PageToolbar },
      { path: 'dialog', label: 'Dialog', status: 'ready', component: PageDialog },
      { path: 'alertdialog', label: 'AlertDialog', status: 'ready', component: PageAlertDialog },
      { path: 'treeview', label: 'Tree View', status: 'ready', component: PageTreeView },
    ],
  },
  {
    id: 'collection',
    label: 'Collection',
    icon: Layers,
    basePath: '/collection/treegrid',
    items: [
      { path: 'treegrid', label: 'TreeGrid', status: 'ready', component: PageTreeGrid },
      { path: 'listbox', label: 'Listbox', status: 'ready', component: PageListbox },
      { path: 'grid', label: 'Grid', status: 'ready', component: PageGrid },
      { path: 'tabs', label: 'Tabs', status: 'ready', component: PageTabsCrud },
      { path: 'combobox', label: 'Combobox', status: 'wip', component: PageCombobox },
      { path: 'crud', label: 'CRUD', status: 'placeholder', component: null },
      { path: 'clipboard', label: 'Clipboard', status: 'placeholder', component: null },
      { path: 'history', label: 'History', status: 'placeholder', component: null },
      { path: 'dnd', label: 'DnD', status: 'placeholder', component: null },
      { path: 'rename', label: 'Rename', status: 'placeholder', component: null },
    ],
  },
  {
    id: 'vision',
    label: 'Vision',
    icon: Map,
    basePath: '/vision/architecture',
    items: [
      { path: 'architecture', label: 'Architecture', status: 'placeholder', component: null },
    ],
  },
]

// --- ActivityBar nav items (includes standalone pages) ---

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
}

const navItems: NavItem[] = [
  { id: 'viewer', label: 'Viewer', icon: Eye, path: '/viewer' },
  ...routeConfig.map((g) => ({ id: g.id, label: g.label, icon: g.icon, path: g.basePath })),
]

// --- Pre-computed stores ---

const activityBarStore = toStore(navItems.map((n) => ({ id: n.id, label: n.label })))

const sidebarStores = Object.fromEntries(
  routeConfig.map((g) => [
    g.id,
    toStore(g.items.map((item) => ({ id: item.path, label: item.label }))),
  ])
)

// --- Lookup maps ---

const navPaths = Object.fromEntries(navItems.map((n) => [n.id, n.path]))

// --- Sidebar (only for routeConfig groups) ---

function Sidebar({ activeGroup }: { activeGroup: RouteGroup }) {
  const navigate = useNavigate()

  const handleSidebarChange = useCallback((store: NormalizedData) => {
    const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
    if (focusedId) {
      navigate(`/${activeGroup.id}/${focusedId}`)
    }
  }, [navigate, activeGroup.id])

  const sidebarStore = useMemo(() => sidebarStores[activeGroup.id], [activeGroup.id])

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
      <Aria
        key={activeGroup.id}
        behavior={listbox}
        data={sidebarStore}
        plugins={[core()]}
        onChange={handleSidebarChange}
        aria-label={`${activeGroup.label} pages`}
      >
        <Aria.Node render={(node, state) => {
          const item = activeGroup.items.find((i) => i.path === node.id)
          return (
            <div className={`sidebar-link${state.focused ? ' sidebar-link--active' : ''}`}>
              {(node.data as { label: string }).label}
              {item?.status === 'wip' && <span className="badge-wip">wip</span>}
              {item?.status === 'placeholder' && <span className="badge-wip">soon</span>}
            </div>
          )
        }} />
      </Aria>
    </nav>
  )
}

// --- App (shared ActivityBar + route-dependent content) ---

function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeGroup = routeConfig.find((g) => pathname.startsWith('/' + g.id))
  const isViewer = pathname === '/viewer' || pathname.startsWith('/viewer/')

  const handleActivityBarChange = useCallback((store: NormalizedData) => {
    const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
    if (focusedId && navPaths[focusedId]) {
      navigate(navPaths[focusedId])
    }
  }, [navigate])

  return (
    <div className="page">
      <nav className="activity-bar">
        <div className="activity-bar__logo">
          <div className="logo-mark" />
        </div>
        <Aria
          behavior={verticalTabs}
          data={activityBarStore}
          plugins={[core()]}
          onChange={handleActivityBarChange}
          aria-label="Layer navigation"
        >
          <Aria.Node render={(node, state) => {
            const nav = navItems.find((n) => n.id === node.id)!
            const Icon = nav.icon
            return (
              <div className={`activity-bar__item${state.focused ? ' activity-bar__item--active' : ''}`}>
                <Icon size={15} />
                <span className="activity-bar__label">{nav.label}</span>
              </div>
            )
          }} />
        </Aria>
      </nav>
      {isViewer ? (
        <PageViewer />
      ) : (
        <>
          {activeGroup && <Sidebar activeGroup={activeGroup} />}
          <main className="content">
            <Routes>
              <Route path="/" element={<Navigate to="/viewer" replace />} />
              {routeConfig.map((group) => (
                <Route
                  key={group.id}
                  path={`/${group.id}`}
                  element={<Navigate to={group.basePath} replace />}
                />
              ))}
              {routeConfig.flatMap((group) =>
                group.items.map((item) => (
                  <Route
                    key={`${group.id}/${item.path}`}
                    path={`/${group.id}/${item.path}`}
                    element={
                      item.component ? (
                        <item.component />
                      ) : (
                        <Placeholder group={group.label} label={item.label} />
                      )
                    }
                  />
                ))
              )}
              <Route path="*" element={<Navigate to="/viewer" replace />} />
            </Routes>
          </main>
        </>
      )}
    </div>
  )
}

export default App
