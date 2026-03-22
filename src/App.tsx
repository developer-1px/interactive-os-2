import { useState, useCallback, useMemo, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Database, Cog, Axe, Compass, Puzzle, Layers, Eye, Box, Sun, Moon, Presentation, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './styles/tokens.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/app.css'

import { Aria } from './interactive-os/components/aria'
import { toolbar } from './interactive-os/behaviors/toolbar'
import { listbox } from './interactive-os/behaviors/listbox'
import { core, FOCUS_ID } from './interactive-os/plugins/core'
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
import PageSlider from './pages/PageSlider'
import PageSpinbutton from './pages/PageSpinbutton'
import PageAlertDialog from './pages/PageAlertDialog'
import PageSwitch from './pages/PageSwitch'
import PageTreeView from './pages/PageTreeView'
import PageTreeGridNav from './pages/PageTreeGridNav'
import PageListboxNav from './pages/PageListboxNav'
import PageComboboxNav from './pages/PageComboboxNav'
import PageTabsCrud from './pages/PageTabsCrud'
import PageGridCollection from './pages/PageGridCollection'
import PageKanban from './pages/PageKanban'
import PageCrud from './pages/PageCrud'
import PageClipboard from './pages/PageClipboard'
import PageHistoryDemo from './pages/PageHistoryDemo'
import PageDnd from './pages/PageDnd'
import PageTypeahead from './pages/PageTypeahead'
import PageRename from './pages/PageRename'
import PageAriaComponent from './pages/PageAriaComponent'
import PageCell from './pages/PageCell'
import PageHooks from './pages/PageHooks'
import PageStoreInspector from './pages/PageStoreInspector'
import PageEnginePipeline from './pages/PageEnginePipeline'
import PageEngineHistory from './pages/PageEngineHistory'
import PageViewer from './pages/PageViewer'
import Placeholder from './pages/Placeholder'
import CmsLayout from './pages/cms/CmsLayout'
import PageAreaViewer from './pages/PageAreaViewer'
import { AreaSidebar } from './pages/AreaSidebar'
import { Tooltip } from './interactive-os/ui/Tooltip'
import PageNavigate from './pages/axis/PageNavigate'
import PageSelect from './pages/axis/PageSelect'
import PageActivate from './pages/axis/PageActivate'
import PageExpand from './pages/axis/PageExpand'
import PageTrap from './pages/axis/PageTrap'

// --- Vertical toolbar behavior (ActivityBar: navigation + utility in one roving group) ---

const verticalToolbar: AriaBehavior = {
  ...toolbar,
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  followFocus: true,
}

// --- Route config → NormalizedData helper ---

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
    basePath: '/store/inspector',
    items: [
      { path: 'inspector', label: 'Inspector', status: 'ready', component: PageStoreInspector },
    ],
  },
  {
    id: 'engine',
    label: 'Engine',
    icon: Cog,
    basePath: '/engine/pipeline',
    items: [
      { path: 'pipeline', label: 'Pipeline', status: 'ready', component: PageEnginePipeline },
      { path: 'history', label: 'History', status: 'ready', component: PageEngineHistory },
    ],
  },
  {
    id: 'axis',
    label: 'Axis',
    icon: Axe,
    basePath: '/axis/navigate',
    items: [
      { path: 'navigate', label: 'navigate()', status: 'ready', component: PageNavigate },
      { path: 'select', label: 'select()', status: 'ready', component: PageSelect },
      { path: 'activate', label: 'activate()', status: 'ready', component: PageActivate },
      { path: 'expand', label: 'expand()', status: 'ready', component: PageExpand },
      { path: 'trap', label: 'trap()', status: 'ready', component: PageTrap },
    ],
  },
  {
    id: 'pattern',
    label: 'Pattern',
    icon: Compass,
    basePath: '/pattern/accordion',
    items: [
      { path: 'accordion', label: 'Accordion', status: 'ready', component: PageAccordion },
      { path: 'disclosure', label: 'Disclosure', status: 'ready', component: PageDisclosure },
      { path: 'switch', label: 'Switch', status: 'ready', component: PageSwitch },
      { path: 'tabs', label: 'Tabs', status: 'ready', component: PageTabs },
      { path: 'radiogroup', label: 'RadioGroup', status: 'ready', component: PageRadioGroup },
      { path: 'slider', label: 'Slider', status: 'ready', component: PageSlider },
      { path: 'spinbutton', label: 'Spinbutton', status: 'ready', component: PageSpinbutton },
      { path: 'menu', label: 'Menu', status: 'ready', component: PageMenu },
      { path: 'toolbar', label: 'Toolbar', status: 'ready', component: PageToolbar },
      { path: 'dialog', label: 'Dialog', status: 'ready', component: PageDialog },
      { path: 'alertdialog', label: 'AlertDialog', status: 'ready', component: PageAlertDialog },
      { path: 'treeview', label: 'Tree View', status: 'ready', component: PageTreeView },
      { path: 'treegrid', label: 'TreeGrid', status: 'ready', component: PageTreeGridNav },
      { path: 'listbox', label: 'Listbox', status: 'ready', component: PageListboxNav },
      { path: 'grid', label: 'Grid', status: 'ready', component: PageGrid },
      { path: 'combobox', label: 'Combobox', status: 'ready', component: PageComboboxNav },
    ],
  },
  {
    id: 'plugin',
    label: 'Plugin',
    icon: Puzzle,
    basePath: '/plugin/crud',
    items: [
      { path: 'crud', label: 'CRUD', status: 'ready', component: PageCrud },
      { path: 'clipboard', label: 'Clipboard', status: 'ready', component: PageClipboard },
      { path: 'history', label: 'History', status: 'ready', component: PageHistoryDemo },
      { path: 'dnd', label: 'DnD', status: 'ready', component: PageDnd },
      { path: 'rename', label: 'Rename', status: 'ready', component: PageRename },
      { path: 'typeahead', label: 'Typeahead', status: 'ready', component: PageTypeahead },
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
      { path: 'grid', label: 'Grid', status: 'ready', component: PageGridCollection },
      { path: 'tabs', label: 'Tabs', status: 'ready', component: PageTabsCrud },
      { path: 'combobox', label: 'Combobox', status: 'ready', component: PageCombobox },
      { path: 'kanban', label: 'Kanban', status: 'ready', component: PageKanban },
    ],
  },
  {
    id: 'components',
    label: 'Components',
    icon: Box,
    basePath: '/components/aria',
    items: [
      { path: 'aria', label: 'Aria', status: 'ready', component: PageAriaComponent },
      { path: 'cell', label: 'Cell', status: 'ready', component: PageCell },
      { path: 'hooks', label: 'Hooks', status: 'ready', component: PageHooks },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    icon: BookOpen,
    basePath: '/area/overview',
    items: [
      { path: 'overview', label: 'Overview', status: 'ready', component: PageAreaViewer },
      { path: 'core', label: 'Core', status: 'ready', component: PageAreaViewer },
      { path: 'axes', label: 'Axes', status: 'ready', component: PageAreaViewer },
      { path: 'patterns', label: 'Patterns', status: 'ready', component: PageAreaViewer },
      { path: 'plugins', label: 'Plugins', status: 'ready', component: PageAreaViewer },
      { path: 'hooks', label: 'Hooks', status: 'ready', component: PageAreaViewer },
      { path: 'ui', label: 'UI', status: 'ready', component: PageAreaViewer },
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
  { id: 'cms', label: 'CMS', icon: Presentation, path: '/' },
  { id: 'viewer', label: 'Viewer', icon: Eye, path: '/viewer' },
  ...routeConfig.map((g) => ({ id: g.id, label: g.label, icon: g.icon, path: g.basePath })),
]

// --- Pre-computed stores ---

const activityBarStore = toStore([
  ...navItems.map((n) => ({ id: n.id, label: n.label })),
  { id: 'theme', label: 'Theme', followFocus: false },
])

const sidebarStores = Object.fromEntries(
  routeConfig.map((g) => [
    g.id,
    toStore(g.items.map((item) => ({ id: item.path, label: item.label }))),
  ])
)

// --- Lookup maps ---

const navPaths = Object.fromEntries(navItems.map((n) => [n.id, n.path]))

// --- Sidebar (only for routeConfig groups) ---

function Sidebar({ activeGroup, activeItemPath }: { activeGroup: RouteGroup; activeItemPath?: string }) {
  const navigate = useNavigate()

  const handleSidebarChange = useCallback((store: NormalizedData) => {
    const focusedId = (store.entities['__focus__']?.focusedId as string) ?? ''
    if (focusedId) {
      navigate(`/${activeGroup.id}/${focusedId}`)
    }
  }, [navigate, activeGroup.id])

  // URL → Sidebar focus binding (CRUD two-way)
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
      <Aria
        key={activeGroup.id}
        behavior={listbox}
        data={sidebarStore}
        plugins={[core()]}
        onChange={handleSidebarChange}
        aria-label={`${activeGroup.label} pages`}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
        <Aria.Item render={(node, _state) => {
          const item = activeGroup.items.find((i) => i.path === node.id)
          return (
            <div className="sidebar-link">
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('theme')
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') !== theme) {
      document.documentElement.setAttribute('data-theme', theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeGroup = routeConfig.find((g) => pathname.startsWith('/' + g.id))
  const isViewer = pathname === '/viewer' || pathname.startsWith('/viewer/')
  const isCms = pathname === '/'

  // URL → ActivityBar focus binding (CRUD two-way)
  const activityBarFocusId = activeGroup?.id ?? (isViewer ? 'viewer' : isCms ? 'cms' : undefined)
  const activityBarData = useMemo(() => {
    if (!activityBarFocusId) return activityBarStore
    return {
      ...activityBarStore,
      entities: {
        ...activityBarStore.entities,
        [FOCUS_ID]: { id: FOCUS_ID, focusedId: activityBarFocusId },
      },
    }
  }, [activityBarFocusId])

  const handleActivityBarActivate = useCallback((nodeId: string) => {
    if (nodeId === 'theme') {
      setTheme(t => t === 'dark' ? 'light' : 'dark')
    } else if (navPaths[nodeId]) {
      navigate(navPaths[nodeId])
    }
  }, [navigate])

  return (
    <div className="page">
      <nav className="activity-bar">
        <div className="activity-bar__logo">
          <div className="logo-mark" />
        </div>
        <Aria
          behavior={verticalToolbar}
          data={activityBarData}
          plugins={[core()]}
          onActivate={handleActivityBarActivate}
          aria-label="Layer navigation"
        >
          <Aria.Item render={(node, state) => {
            if (node.id === 'theme') {
              const ThemeIcon = theme === 'dark' ? Sun : Moon
              return (
                <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
                  <div className={`activity-bar__item activity-bar__theme-toggle${state.focused ? ' activity-bar__item--active' : ''}`}>
                    <ThemeIcon size={13} />
                  </div>
                </Tooltip>
              )
            }
            const nav = navItems.find((n) => n.id === node.id)!
            const Icon = nav.icon
            return (
              <Tooltip content={nav.label}>
                <div className={`activity-bar__item${state.focused ? ' activity-bar__item--active' : ''}`}>
                  <Icon size={16} />
                </div>
              </Tooltip>
            )
          }} />
        </Aria>
      </nav>
      {isCms ? (
        <CmsLayout />
      ) : isViewer ? (
        <PageViewer />
      ) : (
        <>
          {activeGroup && (activeGroup.id === 'area'
            ? <AreaSidebar />
            : <Sidebar activeGroup={activeGroup} activeItemPath={pathname.split('/')[2]} />
          )}
          <main className="content">
            <Routes>
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
              <Route path="/area/*" element={<PageAreaViewer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </>
      )}
    </div>
  )
}

export default App
