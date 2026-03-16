import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
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

const patterns = [
  { path: 'treegrid', label: 'TreeGrid', status: 'ready' },
  { path: 'listbox', label: 'Listbox', status: 'ready' },
  { path: 'tabs', label: 'Tabs', status: 'ready' },
  { path: 'menu', label: 'Menu', status: 'ready' },
  { path: 'accordion', label: 'Accordion', status: 'ready' },
  { path: 'disclosure', label: 'Disclosure', status: 'ready' },
  { path: 'dialog', label: 'Dialog', status: 'wip' },
  { path: 'combobox', label: 'Combobox', status: 'wip' },
  { path: 'toolbar', label: 'Toolbar', status: 'wip' },
  { path: 'grid', label: 'Grid', status: 'wip' },
]

function App() {
  return (
    <div className="page">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-mark" />
            <h1>interactive-os</h1>
          </div>
          <span className="version">v0.1.0</span>
        </div>
        <div className="sidebar-section-title">APG Patterns</div>
        <ul className="sidebar-nav">
          {patterns.map((p) => (
            <li key={p.path}>
              <NavLink
                to={`/${p.path}`}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                }
              >
                {p.label}
                {p.status === 'wip' && <span className="badge-wip">wip</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/treegrid" replace />} />
          <Route path="/treegrid" element={<TreeGridPage />} />
          <Route path="/listbox" element={<ListboxPage />} />
          <Route path="/tabs" element={<TabsPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/accordion" element={<AccordionPage />} />
          <Route path="/disclosure" element={<DisclosurePage />} />
          <Route path="/dialog" element={<DialogPage />} />
          <Route path="/combobox" element={<ComboboxPage />} />
          <Route path="/toolbar" element={<ToolbarPage />} />
          <Route path="/grid" element={<GridPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
