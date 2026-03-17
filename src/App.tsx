import { useCallback, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Database, Cog, Plug, Keyboard, Layout, Map } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './App.css'

import { Aria } from './interactive-os/components/aria'
import { tabs } from './interactive-os/behaviors/tabs'
import { listbox } from './interactive-os/behaviors/listbox'
import { core } from './interactive-os/plugins/core'
import { createStore } from './interactive-os/core/normalized-store'
import { ROOT_ID } from './interactive-os/core/types'
import type { AriaBehavior } from './interactive-os/behaviors/types'
import type { NormalizedData } from './interactive-os/core/types'

import TreeGridPage from './pages/treegrid'
import ListboxPage from './pages/listbox'
import TabsPage from './pages/tabs'
import MenuPage from './pages/menu'
import AccordionPage from './pages/accordion'
import DisclosurePage from './pages/disclosure'
import DialogPage from './pages/dialog'
import ComboboxPage from './pages/combobox'
import ToolbarPage from './pages/toolbar'
import GridPage from './pages/grid'
import RadioGroupPage from './pages/radiogroup'
import AlertDialogPage from './pages/alertdialog'
import SwitchPage from './pages/switch'
import ViewerPage from './pages/viewer'
import Placeholder from './pages/placeholder'

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
    id: 'plugins',
    label: 'Plugins',
    icon: Plug,
    basePath: '/plugins/core',
    items: [
      { path: 'core', label: 'Core', status: 'placeholder', component: null },
      { path: 'crud', label: 'CRUD', status: 'placeholder', component: null },
      { path: 'clipboard', label: 'Clipboard', status: 'placeholder', component: null },
      { path: 'rename', label: 'Rename', status: 'placeholder', component: null },
      { path: 'dnd', label: 'DnD', status: 'placeholder', component: null },
    ],
  },
  {
    id: 'behaviors',
    label: 'Behaviors',
    icon: Keyboard,
    basePath: '/behaviors/treegrid',
    items: [
      { path: 'treegrid', label: 'TreeGrid', status: 'ready', component: TreeGridPage },
      { path: 'listbox', label: 'Listbox', status: 'ready', component: ListboxPage },
      { path: 'tabs', label: 'Tabs', status: 'ready', component: TabsPage },
      { path: 'menu', label: 'Menu', status: 'ready', component: MenuPage },
      { path: 'accordion', label: 'Accordion', status: 'ready', component: AccordionPage },
      { path: 'disclosure', label: 'Disclosure', status: 'ready', component: DisclosurePage },
      { path: 'dialog', label: 'Dialog', status: 'ready', component: DialogPage },
      { path: 'combobox', label: 'Combobox', status: 'wip', component: ComboboxPage },
      { path: 'toolbar', label: 'Toolbar', status: 'ready', component: ToolbarPage },
      { path: 'grid', label: 'Grid', status: 'ready', component: GridPage },
      { path: 'radiogroup', label: 'RadioGroup', status: 'ready', component: RadioGroupPage },
      { path: 'alertdialog', label: 'AlertDialog', status: 'ready', component: AlertDialogPage },
      { path: 'switch', label: 'Switch', status: 'ready', component: SwitchPage },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    icon: Layout,
    basePath: '/components/viewer',
    items: [
      { path: 'viewer', label: 'Viewer', status: 'ready', component: ViewerPage },
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

// --- Pre-computed stores ---

const activityBarStore = toStore(routeConfig.map((g) => ({ id: g.id, label: g.label })))

const sidebarStores = Object.fromEntries(
  routeConfig.map((g) => [
    g.id,
    toStore(g.items.map((item) => ({ id: item.path, label: item.label }))),
  ])
)

// --- Lookup maps ---

const groupBasePaths = Object.fromEntries(routeConfig.map((g) => [g.id, g.basePath]))

function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeGroup = routeConfig.find((g) => pathname.startsWith('/' + g.id))
    ?? routeConfig.find((g) => g.id === 'components')!

  const handleActivityBarChange = useCallback((store: NormalizedData) => {
    const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
    if (focusedId && groupBasePaths[focusedId]) {
      navigate(groupBasePaths[focusedId])
    }
  }, [navigate])

  const handleSidebarChange = useCallback((store: NormalizedData) => {
    const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
    if (focusedId) {
      navigate(`/${activeGroup.id}/${focusedId}`)
    }
  }, [navigate, activeGroup.id])

  const sidebarStore = useMemo(() => sidebarStores[activeGroup.id], [activeGroup.id])

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
            const group = routeConfig.find((g) => g.id === node.id)!
            const Icon = group.icon
            return (
              <div className={`activity-bar__item${state.focused ? ' activity-bar__item--active' : ''}`}>
                <Icon size={20} />
                <span className="activity-bar__label">{group.label}</span>
              </div>
            )
          }} />
        </Aria>
      </nav>
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
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/components/viewer" replace />} />
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
          <Route path="*" element={<Navigate to="/components/viewer" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
