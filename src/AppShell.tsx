import { useState, useCallback, useMemo, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon, Presentation, Component, Eye, Activity, Palette } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Aria } from './interactive-os/primitives/aria'
import { toolbar } from './interactive-os/pattern/toolbar'
import { core, FOCUS_ID } from './interactive-os/plugins/core'
import { FileViewerModal } from './interactive-os/ui/FileViewerModal'
import { createStore } from './interactive-os/store/createStore'
import { ROOT_ID } from './interactive-os/store/types'
import type { AriaPattern } from './interactive-os/pattern/types'
import type { NormalizedData } from './interactive-os/store/types'
import { Tooltip } from './interactive-os/ui/Tooltip'
import { ReproRecorderOverlay } from './interactive-os/devtools/ReproRecorderOverlay'
import { routeConfig } from './routeConfig'

import './styles/tokens.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/app.css'

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
  followFocus: true,
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

const externalNavItems: NavItem[] = [
  { id: 'cms', label: 'CMS', icon: Presentation, path: '/' },
  { id: 'ui-showcase', label: 'UI', icon: Component, path: '/ui' },
  { id: 'viewer', label: 'Viewer', icon: Eye, path: '/viewer' },
  { id: 'agent', label: 'Agent', icon: Activity, path: '/agent' },
  { id: 'theme-creator', label: 'Theme', icon: Palette, path: '/internals/theme' },
]

const internalNavItems: NavItem[] = routeConfig.map((g) => ({
  id: g.id,
  label: g.label,
  icon: g.icon,
  path: g.basePath,
}))

const navItems: NavItem[] = [...externalNavItems, ...internalNavItems]

// --- Pre-computed stores ---

const EXTERNAL_IDS = externalNavItems.map((n) => n.id)
const INTERNAL_IDS = internalNavItems.map((n) => n.id)
const UTIL_IDS = ['theme']

const activityBarStore = toStore([
  ...navItems.map((n) => ({ id: n.id, label: n.label })),
  { id: 'theme', label: 'Theme', followFocus: false },
])

const navPaths = Object.fromEntries(navItems.map((n) => [n.id, n.path]))

// --- Shared ActivityBar item renderer ---

const renderNavItem = (props: Record<string, unknown>, node: { id: string }, state: { focused: boolean }) => {
  const nav = navItems.find((n) => n.id === node.id)!
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
  const activeGroup = routeConfig.find((g) => pathname.startsWith('/' + g.id))
  if (activeGroup) return activeGroup.id

  const sorted = [...externalNavItems].sort((a, b) => b.path.length - a.path.length)
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
          plugins={[core()]}
          onActivate={handleActivityBarActivate}
          aria-label="Layer navigation"
          autoFocus={false}
        >
          <div role="group" aria-label="External">
            <Aria.Item asChild ids={EXTERNAL_IDS} render={renderNavItem} />
          </div>
          <div role="separator" className="activity-bar__separator" />
          <div role="group" aria-label="Internal">
            <Aria.Item asChild ids={INTERNAL_IDS} render={renderNavItem} />
          </div>
          <div role="group" aria-label="Util" className="activity-bar__util">
            <Aria.Item asChild ids={UTIL_IDS} render={(props, node, state) => {
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
      <Outlet />
      <FileViewerModal
        filePath={previewFile?.path ?? null}
        highlightLines={previewFile?.line ? new Set([previewFile.line]) : undefined}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}
