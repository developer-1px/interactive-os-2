import { useCallback, useMemo, type HTMLAttributes } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sun, Moon, Presentation, Component, Eye, FolderCode, Palette, ShieldAlert, Languages, Map,
  MessageSquare, Database, Cog, Axe, Puzzle, Box, Layers, Wrench, BookOpen, Lightbulb, FileText, Bird, BookText, Play, Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Aria } from '@os/primitives/aria'
import { toolbar } from '@os/pattern/roles/toolbar'
import { FOCUS_ID } from '@os/axis/navigate'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { AriaPattern, NodeState } from '@os/pattern/types'
import type { NormalizedData } from '@os/store/types'
import { selectionFollowsFocusMiddleware } from '@os/axis/select'
import { Tooltip } from '@os/ui/Tooltip'
import { SeparatorIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'

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

// --- Vertical toolbar pattern ---

const verticalToolbar: AriaPattern = {
  ...toolbar(),
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
  { id: 'incident', label: 'Incident', icon: ShieldAlert, path: '/incident' },
  { id: 'theme-creator', label: 'Theme', icon: Palette, path: '/internals/theme' },
  { id: 'creator', label: 'Creator', icon: Component, path: '/creator' },
  { id: 'storymap', label: 'Story Map', icon: Map, path: '/storymap' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
  { id: 'book', label: 'Book', icon: BookText, path: '/book' },
  { id: 'birdseye', label: 'Birdseye', icon: Bird, path: '/birdseye' },
  { id: 'replay', label: 'Replay', icon: Play, path: '/replay' },
  { id: 'inspector', label: 'Inspector', icon: Search, path: '/inspector' },
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
    <Tooltip content={nav.label} placement="right">
      <div {...props} className={ax({ surface: 'ghost', layout: 'center', controlSize: 'md', shape: 'xl', text: state.focused ? 'bright' : 'muted' })}>
        {state.focused && <span className="item-indicator--active-rail" />}
        <Icon className={ax({ icon: 'sm' })} />
      </div>
    </Tooltip>
  )
}

// --- URL → store focus ID ---

function resolveActivityBarFocusId(pathname: string): string | undefined {
  if (pathname.startsWith('/internals/')) {
    const rest = pathname.slice('/internals/'.length)
    const layer = rest.split('/')[0]
    if (layer && layer !== 'theme') {
      return `internals/${layer}`
    }
  }

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

// --- ActivityBar ---

interface ActivityBarProps {
  theme: 'dark' | 'light'
  onThemeToggle: () => void
}

export function ActivityBar({ theme, onThemeToggle }: ActivityBarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

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

  const handleActivate = useCallback((nodeId: string) => {
    if (nodeId === 'theme') {
      onThemeToggle()
    } else if (navPaths[nodeId]) {
      navigate(navPaths[nodeId])
    }
  }, [navigate, onThemeToggle])

  return (
    <nav className={ax({ layout: 'scroll', padding: 'xs' })}>
      <div className={ax({ layout: 'center', controlSize: 'md' })}>
        <div className="logo-mark" />
      </div>
      <Aria
        pattern={verticalToolbar}
        data={activityBarData}
        plugins={[]}
        onActivate={handleActivate}
        aria-label="Navigation"
        autoFocus={false}
      >
        <div role="group" aria-label="Apps">
          <Aria.Item asChild ids={APP_IDS} render={renderNavItem} />
        </div>
        <SeparatorIndicator />
        <div role="group" aria-label="Internals">
          <Aria.Item asChild ids={INTERNALS_IDS} render={renderNavItem} />
        </div>
        <div className={ax({ flex: '1' })} />
        <div role="group" aria-label="Util">
          <Aria.Item asChild ids={UTIL_IDS} render={(props, _node, state) => {
            const ThemeIcon = theme === 'dark' ? Sun : Moon
            return (
              <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} placement="right">
                <div {...props} className={ax({ surface: 'ghost', layout: 'center', controlSize: 'md', shape: 'xl', text: state.focused ? 'bright' : 'muted' })}>
                  {state.focused && <span className="item-indicator--active-rail" />}
                  <ThemeIcon className={ax({ icon: 'sm' })} />
                </div>
              </Tooltip>
            )
          }} />
        </div>
      </Aria>
    </nav>
  )
}
