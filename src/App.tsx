import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Database, Cog, Plug, Keyboard, Layout, Map } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './App.css'

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

function App() {
  const { pathname } = useLocation()
  const activeGroup = routeConfig.find((g) => pathname.startsWith('/' + g.id)) ?? routeConfig[4]

  return (
    <div className="page">
      <nav className="activity-bar">
        <div className="activity-bar__logo">
          <div className="logo-mark" />
        </div>
        {routeConfig.map((group) => {
          const Icon = group.icon
          const isActive = group.id === activeGroup.id
          return (
            <NavLink
              key={group.id}
              to={group.basePath}
              className={`activity-bar__item${isActive ? ' activity-bar__item--active' : ''}`}
            >
              <Icon size={20} />
              <span className="activity-bar__label">{group.label}</span>
            </NavLink>
          )
        })}
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
        <ul className="sidebar-nav">
          {activeGroup.items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={`/${activeGroup.id}/${item.path}`}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                }
              >
                {item.label}
                {item.status === 'wip' && <span className="badge-wip">wip</span>}
                {item.status === 'placeholder' && <span className="badge-wip">soon</span>}
              </NavLink>
            </li>
          ))}
        </ul>
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
