import { useCallback, useMemo, type HTMLAttributes } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sun, Moon, Layers, Presentation, Component, FolderCode, Palette, ShieldAlert, Languages,
  MessageSquare, BookText, Play, PenLine, Kanban, GitBranch,
  Mail, ListTree, Boxes, Braces, FileStack, BookMarked, Ruler, Compass,
  ListChecks, FlaskConical,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Aria } from '@os/primitives/aria'
import { key } from '@os/axis/types'
import { toolbar } from '@os/pattern/roles/toolbar'
import { FOCUS_ID } from '@os/axis/navigate'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { AriaPattern, NodeState } from '@os/pattern/types'
import type { NormalizedData } from '@os/store/types'
import { selectionFollowsFocusMiddleware } from '@os/axis/select'
import { Tooltip } from '@os/ui/Tooltip'
import { ax } from '@styles/ax'
import type { Theme } from './hooks/useTheme'

// --- Vertical toolbar pattern ---

const verticalToolbar: AriaPattern = {
  ...toolbar(),
  keyMap: {
    ArrowDown: key(['core:focus'], (ctx) => ctx.focusNext()),
    ArrowUp: key(['core:focus'], (ctx) => ctx.focusPrev()),
    Home: key(['core:focus'], (ctx) => ctx.focusFirst()),
    End: key(['core:focus'], (ctx) => ctx.focusLast()),
    Enter: key(['core:activate'], (ctx) => ctx.activate()),
    Space: key(['core:activate'], (ctx) => ctx.activate()),
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
  // --- 완성도 높음 / 자주 사용 ---
  { id: 'cms', label: 'CMS', icon: Presentation, path: '/' },
  { id: 'slides', label: 'Slides', icon: FileStack, path: '/slides' },
  { id: 'finder', label: 'Finder', icon: FolderCode, path: '/finder' },
  { id: 'book', label: 'Book', icon: BookText, path: '/book' },
  { id: 'project', label: 'Project', icon: Kanban, path: '/project' },
  { id: 'catalog', label: 'Catalog', icon: Boxes, path: '/catalog' },
  { id: 'cmux', label: 'cmux', icon: MessageSquare, path: '/cmux' },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch, path: '/pipeline' },
  { id: 'features', label: 'Features', icon: ListTree, path: '/features' },
  { id: 'ax-principles', label: 'AX Principles', icon: Compass, path: '/ax-principles' },
  // --- 보조 / 진행중 ---
  { id: 'creator', label: 'Creator', icon: Component, path: '/creator' },
  { id: 'json-editor', label: 'JSON', icon: Braces, path: '/json-editor' },
  { id: 'i18n', label: 'i18n', icon: Languages, path: '/i18n' },
  { id: 'incident', label: 'Incident', icon: ShieldAlert, path: '/incident' },
  { id: 'theme-creator', label: 'Theme', icon: Palette, path: '/internals/theme' },
  { id: 'stories', label: 'Stories', icon: BookMarked, path: '/stories' },
  { id: 'studio', label: 'Studio', icon: FlaskConical, path: '/studio' },
  { id: 'todo', label: 'Todo', icon: ListChecks, path: '/todo' },
  { id: 'keyline-test', label: 'Keyline Test', icon: Ruler, path: '/test/keyline' },
  // --- 미완성 / 데모 미생성 ---
  { id: 'replay', label: 'Replay', icon: Play, path: '/replay' },
  { id: 'writer', label: 'Writer', icon: PenLine, path: '/writer' },
]

const showcaseNavItems: NavItem[] = [
  { id: 'gmail', label: 'Gmail', icon: Mail, path: '/showcase/gmail' },
]

const navItems: NavItem[] = [...appNavItems, ...showcaseNavItems]

// --- Pre-computed stores ---

const APP_IDS = appNavItems.map((n) => n.id)
const SHOWCASE_IDS = showcaseNavItems.map((n) => n.id)
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
      <div {...props} className={ax({ role: 'control', surface: state.focused ? 'action' : 'ghost', layout: 'center', content: 'icon' })}>
        {state.focused && <span className="item-indicator--active-rail" />}
        <Icon className={ax.raw({ icon: 'sm' })} />
      </div>
    </Tooltip>
  )
}

// --- URL → store focus ID ---

function resolveActivityBarFocusId(pathname: string): string | undefined {
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
  theme: Theme
  onThemeToggle: () => void
}

// 3-cycle: dark → light → lifted → dark
const THEME_ICON: Record<Theme, LucideIcon> = {
  dark: Sun,       // dark 상태에서는 다음 상태(light) 아이콘 노출
  light: Layers,   // light 상태에서는 다음 상태(lifted) 아이콘 노출
  lifted: Moon,    // lifted 상태에서는 다음 상태(dark) 아이콘 노출
}

const THEME_NEXT_LABEL: Record<Theme, string> = {
  dark: 'light',
  light: 'lifted',
  lifted: 'dark',
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
    <nav className={ax({ layout: 'scroll' }) + ' ' + ax.raw({ padding: 'xs' })}>
      <div className={ax({ role: 'control', surface: 'ghost', layout: 'center' })}>
        <div className="logo-mark" />
      </div>
      <Aria
        pattern={verticalToolbar}
        data={activityBarData}
        plugins={[]}
        onActivate={handleActivate}
        aria-label="Navigation"
        autoFocus={false}
        className={ax({ layout: 'stack', flex: '1' })}
      >
        <div role="group" aria-label="Apps">
          <Aria.Item asChild ids={APP_IDS} render={renderNavItem} />
        </div>
        <div role="separator" className={ax.raw({ border: 'top' })} />
        <div role="group" aria-label="Showcase">
          <Aria.Item asChild ids={SHOWCASE_IDS} render={renderNavItem} />
        </div>
        <div className={ax({ flex: '1' })} />
        <div role="group" aria-label="Util">
          <Aria.Item asChild ids={UTIL_IDS} render={(props, _node, state) => {
            const ThemeIcon = THEME_ICON[theme]
            return (
              <Tooltip content={`Switch to ${THEME_NEXT_LABEL[theme]} theme`} placement="right">
                <div {...props} className={ax({ role: 'control', surface: state.focused ? 'action' : 'ghost', layout: 'center', content: 'icon' })}>
                  {state.focused && <span className="item-indicator--active-rail" />}
                  <ThemeIcon className={ax.raw({ icon: 'sm' })} />
                </div>
              </Tooltip>
            )
          }} />
        </div>
      </Aria>
    </nav>
  )
}
