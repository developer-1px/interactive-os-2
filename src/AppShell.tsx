// ② 2026-03-26-unified-navigation-prd.md
import { useState, useCallback, useMemo, useEffect, type HTMLAttributes } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Sun, Moon, Presentation, Component, Eye, FolderCode, Activity, Palette, ShieldAlert, Languages, Map,
  MessageSquare, Database, Cog, Axe, Puzzle, Box, Layers, Wrench, BookOpen, Lightbulb, FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Aria } from './interactive-os/primitives/aria'
import { toolbar } from './interactive-os/pattern/examples/toolbar'
import { FOCUS_ID } from './interactive-os/axis/navigate'
import { FileViewerModal } from './interactive-os/ui/FileViewerModal'
import { createStore } from './interactive-os/store/createStore'
import { ROOT_ID } from './interactive-os/store/types'
import type { AriaPattern, NodeState } from './interactive-os/pattern/types'
import type { NormalizedData } from './interactive-os/store/types'
import { selectionFollowsFocusMiddleware } from './interactive-os/axis/select'
import { Tooltip } from './interactive-os/ui/Tooltip'
import { ReproRecorderOverlay } from './devtools/rec/ReproRecorderOverlay'
import { ComponentInspector } from './devtools/inspector/ComponentInspector'

import './styles/palette.css'       // L0: OKLCH color palette
import './styles/reset.css'        // L1: Browser initialization
import './styles/tokens.css'       // L2: Design token values
import './styles/structure.css'    // L2.5: Atomic layout classes
import './styles/surface.css'      // L3: Surface elevation bundles
import './styles/interactive.css'  // L4: Interaction policy (hover, focus, disabled...)
import './interactive-os/ui/indicators/indicators.css'  // L4: Indicator part classes
import './styles/layout.css'       // App layout (sidebar, page grid)
import './styles/app.css'          // App-level utilities

// --- contents/_meta.yaml auto-import ---

const metaModules = import.meta.glob<{ default: string }>('/contents/_meta.yaml', {
  query: '?raw',
  eager: true,
})

function parseRootMetaOrder(): string[] {
  const mod = metaModules['/contents/_meta.yaml']
  if (!mod) return []
  const order: string[] = []
  let inOrder = false
  for (const line of mod.default.split('\n')) {
    if (line.match(/^order:\s*$/)) { inOrder = true; continue }
    if (inOrder) {
      const m = line.match(/^\s+-\s+(.+)/)
      if (m) order.push(m[1].trim())
      else if (!line.match(/^\s*$/)) break
    }
  }
  return order
}

const contentsOrder = parseRootMetaOrder()

// --- Layer icon mapping ---

const LAYER_ICONS: Record<string, LucideIcon> = {
  overview: BookOpen,
  vision: Lightbulb,
  store: Database,
  engine: Cog,
  axis: Axe,
  pattern: Layers,
  plugins: Puzzle,
  primitives: Box,
  ui: Component,
  devtools: Wrench,
}

const LAYER_LABELS: Record<string, string> = {
  store: 'L1 Store',
  engine: 'L2 Engine',
  axis: 'L3 Axis',
  pattern: 'L4 Pattern',
  plugins: 'L5 Plugins',
  primitives: 'L6 Primitives',
  ui: 'L7 UI',
}

// --- Vertical toolbar behavior ---

const verticalToolbar: AriaPattern = {
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
  selectionFollowsFocus: true,
  activationFollowsSelection: true,
  middleware: selectionFollowsFocusMiddleware(),
}

// --- Helper ---

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

// --- Nav items ---

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
}

const appNavItems: NavItem[] = [
  { id: 'cms', label: 'CMS', icon: Presentation, path: '/' },
  { id: 'i18n', label: 'i18n', icon: Languages, path: '/i18n' },
  { id: 'ui-showcase', label: 'UI Showcase', icon: Eye, path: '/ui' },
  { id: 'viewer', label: 'Viewer', icon: FolderCode, path: '/viewer' },
  { id: 'agent', label: 'Agent', icon: Activity, path: '/agent' },
  { id: 'incident', label: 'Incident', icon: ShieldAlert, path: '/incident' },
  { id: 'theme-creator', label: 'Theme', icon: Palette, path: '/internals/theme' },
  { id: 'creator', label: 'Creator', icon: Component, path: '/creator' },
  { id: 'storymap', label: 'Story Map', icon: Map, path: '/storymap' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
]

const internalsNavItems: NavItem[] = contentsOrder.map((layer) => ({
  id: `internals/${layer}`,
  label: LAYER_LABELS[layer] ?? layer.charAt(0).toUpperCase() + layer.slice(1),
  icon: LAYER_ICONS[layer] ?? FileText,
  path: `/internals/${layer}`,
}))

const navItems: NavItem[] = [...appNavItems, ...internalsNavItems]

// --- Pre-computed stores ---

const APP_IDS = appNavItems.map((n) => n.id)
const INTERNALS_IDS = internalsNavItems.map((n) => n.id)
const UTIL_IDS = ['theme']

const activityBarStore = toStore([
  ...navItems.map((n) => ({ id: n.id, label: n.label })),
  { id: 'theme', label: 'Theme' },
])

const navPaths = Object.fromEntries(navItems.map((n) => [n.id, n.path]))

// --- Shared ActivityBar item renderer ---

const renderNavItem = (props: HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => {
  const nav = navItems.find((n) => n.id === (node.id as string))!
  const Icon = nav.icon
  return (
    <Tooltip content={nav.label}>
      <div {...props} className={`activity-bar__item${state.focused ? ' activity-bar__item--active' : ''}`}>
        <Icon size={16} />
      </div>
    </Tooltip>
  )
}

// --- URL → store focus ID ---

function resolveActivityBarFocusId(pathname: string): string | undefined {
  // Check internals layers
  if (pathname.startsWith('/internals/')) {
    const rest = pathname.slice('/internals/'.length)
    const layer = rest.split('/')[0]
    if (layer && layer !== 'theme') {
      return `internals/${layer}`
    }
  }

  // Check app nav items (longest path match first)
  const sorted = [...appNavItems].sort((a, b) => b.path.length - a.path.length)
  for (const nav of sorted) {
    if (nav.path === '/') {
      if (pathname === '/') return nav.id
    } else if (pathname.startsWith(nav.path)) {
      return nav.id
    }
  }
  return undefined
}

// --- AppShell ---

export default function AppShell() {
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

  const [previewFile, setPreviewFile] = useState<{ path: string; line?: number } | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fileName: string; lineNumber?: number }
      if (detail?.fileName) {
        setPreviewFile({ path: detail.fileName, line: detail.lineNumber })
      }
    }
    window.addEventListener('inspector:open-source', handler)
    return () => window.removeEventListener('inspector:open-source', handler)
  }, [])

  const { pathname } = useLocation()
  const navigate = useNavigate()

  // URL → store focus sync (drives --active indicator via state.focused)
  const activityBarFocusId = resolveActivityBarFocusId(pathname)
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
      <ReproRecorderOverlay />
      <nav className="activity-bar">
        <div className="activity-bar__logo">
          <div className="logo-mark" />
        </div>
        <Aria
          behavior={verticalToolbar}
          data={activityBarData}
          plugins={[]}
          onActivate={handleActivityBarActivate}
          aria-label="Navigation"
          autoFocus={false}
        >
          <div role="group" aria-label="Apps">
            <Aria.Item asChild ids={APP_IDS} render={renderNavItem} />
          </div>
          <div role="separator" className="activity-bar__separator" />
          <div role="group" aria-label="Internals">
            <Aria.Item asChild ids={INTERNALS_IDS} render={renderNavItem} />
          </div>
          <div role="group" aria-label="Util" className="activity-bar__util">
            <Aria.Item asChild ids={UTIL_IDS} render={(props, _node, state) => {
              const ThemeIcon = theme === 'dark' ? Sun : Moon
              return (
                <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
                  <div {...props} className={`activity-bar__item activity-bar__theme-toggle${state.focused ? ' activity-bar__item--active' : ''}`}>
                    <ThemeIcon size={16} />
                  </div>
                </Tooltip>
              )
            }} />
          </div>
        </Aria>
      </nav>
      <div className="page-content">
        <Outlet />
      </div>
      <FileViewerModal
        filePath={previewFile?.path ?? null}
        highlightLines={previewFile?.line ? new Set([previewFile.line]) : undefined}
        onClose={() => setPreviewFile(null)}
      />
      <ComponentInspector />
    </div>
  )
}
