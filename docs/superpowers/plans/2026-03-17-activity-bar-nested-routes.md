# ActivityBar + Nested Routes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat sidebar with a VS Code-style ActivityBar + context sidebar, grouping routes by architecture layer.

**Architecture:** Single `routeConfig` array drives ActivityBar, Sidebar, and Routes. Existing page files stay in place; only route paths change. New layer pages render a shared Placeholder component.

**Tech Stack:** React, react-router-dom v7, Lucide React icons, CSS (existing design system)

**Spec:** `docs/superpowers/specs/2026-03-17-activity-bar-nested-routes-design.md`

---

## Chunk 1: Implementation

**Note:** Spec lists `src/pages/vision-architecture.tsx` as a new file. Intentionally deferred — the generic Placeholder component covers all placeholder pages including vision/architecture. A dedicated vision page will be created when mermaid rendering is implemented.

### Task 1: Create Placeholder component

**Files:**
- Create: `src/pages/placeholder.tsx`

- [ ] **Step 1: Create `src/pages/placeholder.tsx`**

```tsx
function Placeholder({ group, label }: { group: string; label: string }) {
  return (
    <div className="wip-placeholder">
      <div style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        {group}
      </div>
      <div style={{ fontSize: 16, marginBottom: 12 }}>{label}</div>
      <div>Coming soon</div>
    </div>
  )
}

export default Placeholder
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/placeholder.tsx
git commit -m "feat: add Placeholder component for upcoming layer pages"
```

---

### Task 2: Rewrite App.tsx with routeConfig + ActivityBar + Sidebar

**Files:**
- Rewrite: `src/App.tsx`

- [ ] **Step 1: Rewrite `src/App.tsx`**

Replace the entire file. Key changes:
- Import Lucide icons: `Database, Cog, Plug, Keyboard, Layout, Map`
- Import all existing page components (same imports, unchanged)
- Import `Placeholder` from `./pages/placeholder`
- Define `routeConfig: RouteGroup[]` with 6 groups (store, engine, plugins, behaviors, components, vision)
  - `behaviors` group: 13 items with `status: 'ready'` (combobox: `'wip'`), each with its page component
  - `components` group: 1 item (viewer, `status: 'ready'`, ViewerPage)
  - `store`, `engine`, `plugins`, `vision` groups: items with `status: 'placeholder'`, `component: null`
- Derive active group from `useLocation().pathname` via `pathname.startsWith('/' + group.id)`
- Render 3-column layout:
  1. `<nav className="activity-bar">` — map `routeConfig` to icon buttons, each wraps `<NavLink to={group.basePath}>`
  2. `<nav className="sidebar">` — header (logo + version) + section title (active group label) + item list
  3. `<main className="content">` — `<Routes>` with:
     - `<Route path="/" element={<Navigate to="/components/viewer" replace />} />`
     - Per group: `<Route path="/{group.id}" element={<Navigate to={group.basePath} replace />} />`
     - Per item: `<Route path="/{group.id}/{item.path}" element={item.component ? <item.component /> : <Placeholder group={group.label} label={item.label} />} />`
     - `<Route path="*" element={<Navigate to="/components/viewer" replace />} />`

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm build`
Expected: No TypeScript errors

- [ ] **Step 3: Add ActivityBar styles to `src/App.css`**

Insert after the `.page::after` block (line ~86) and before the logo section:

```css
/* --- Activity Bar --- */

.activity-bar {
  width: 48px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-dim);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  position: sticky;
  top: 0;
  height: 100svh;
  overflow-y: auto;
  gap: 2px;
}

.activity-bar__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 40px;
  margin-bottom: 8px;
}

.activity-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--text-muted);
  text-decoration: none;
  border-left: 2px solid transparent;
  border-radius: 0;
  transition: color 0.1s;
  gap: 2px;
}

.activity-bar__item:hover {
  color: var(--text-secondary);
}

.activity-bar__item--active {
  color: var(--accent);
  border-left-color: var(--accent);
}

.activity-bar__label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Commit App.tsx + App.css together**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: rewrite App shell with ActivityBar + layer-grouped nested routes"
```

---

### Task 3: Verify and final commit

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: 0 errors

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All 298 tests pass (no demo page tests exist, so library tests unaffected)

- [ ] **Step 3: Run build**

Run: `pnpm build:lib`
Expected: Clean build

- [ ] **Step 4: Manual verification checklist**

With `pnpm dev` running, verify:
- [ ] `/` → redirects to `/components/viewer`
- [ ] ActivityBar highlights correct group based on URL
- [ ] `/behaviors/treegrid` renders TreeGrid demo
- [ ] `/behaviors/combobox` shows "wip" badge
- [ ] `/store/explorer` shows Placeholder with "Store" / "Explorer"
- [ ] `/store` → redirects to `/store/explorer`
- [ ] Unknown URL (e.g., `/xyz`) → redirects to `/components/viewer`
- [ ] Logo appears in both ActivityBar (mark only) and Sidebar (full)
