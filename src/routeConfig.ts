import { Database, Cog, Axe, Puzzle, Box, Layers, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
import PageEngineCommand from './pages/PageEngineCommand'
import PageEngineDiff from './pages/PageEngineDiff'
import PageAreaViewer from './pages/PageAreaViewer'

export interface RouteItem {
  path: string
  label: string
  status: 'ready' | 'wip' | 'placeholder'
  component?: React.ComponentType | null
  md?: string
}

export interface RouteGroup {
  id: string
  label: string
  icon: LucideIcon
  basePath: string
  items: RouteItem[]
}

export const routeConfig: RouteGroup[] = [
  {
    id: 'internals/store',
    label: 'Store',
    icon: Database,
    basePath: '/internals/store/inspector',
    items: [
      { path: 'inspector', label: 'Inspector', status: 'ready', component: PageStoreInspector },
    ],
  },
  {
    id: 'internals/engine',
    label: 'Engine',
    icon: Cog,
    basePath: '/internals/engine/command',
    items: [
      { path: 'command', label: 'Command', status: 'ready', component: PageEngineCommand },
      { path: 'diff', label: 'Diff', status: 'ready', component: PageEngineDiff },
    ],
  },
  {
    id: 'internals/plugins',
    label: 'Plugins',
    icon: Puzzle,
    basePath: '/internals/plugins/crud',
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
    id: 'internals/axis',
    label: 'Axis',
    icon: Axe,
    basePath: '/internals/axis/navigate',
    items: [
      { path: 'navigate', label: 'navigate()', status: 'ready', md: 'axis/navigate' },
      { path: 'select', label: 'select()', status: 'ready', md: 'axis/select' },
      { path: 'activate', label: 'activate()', status: 'ready', md: 'axis/activate' },
      { path: 'expand', label: 'expand()', status: 'ready', md: 'axis/expand' },
      { path: 'dismiss', label: 'dismiss()', status: 'ready', md: 'axis/dismiss' },
      { path: 'tab', label: 'tab()', status: 'ready', md: 'axis/tab' },
    ],
  },
  {
    id: 'internals/pattern',
    label: 'Pattern',
    icon: Layers,
    basePath: '/internals/pattern/edit',
    items: [
      { path: 'edit', label: 'edit()', status: 'ready', md: 'pattern/edit' },
    ],
  },
  {
    id: 'internals/primitives',
    label: 'Primitives',
    icon: Box,
    basePath: '/internals/primitives/aria',
    items: [
      { path: 'aria', label: 'Aria', status: 'ready', component: PageAriaComponent },
      { path: 'cell', label: 'Cell', status: 'ready', component: PageCell },
      { path: 'hooks', label: 'Hooks', status: 'ready', component: PageHooks },
    ],
  },
  {
    id: 'internals/area',
    label: 'Area',
    icon: BookOpen,
    basePath: '/internals/area/overview',
    items: [
      { path: 'vision', label: 'Vision', status: 'ready', component: PageAreaViewer },
      { path: 'overview', label: 'Overview', status: 'ready', component: PageAreaViewer },
      { path: 'store', label: 'Store', status: 'ready', component: PageAreaViewer },
      { path: 'engine', label: 'Engine', status: 'ready', component: PageAreaViewer },
      { path: 'plugins', label: 'Plugins', status: 'ready', component: PageAreaViewer },
      { path: 'axis', label: 'Axis', status: 'ready', component: PageAreaViewer },
      { path: 'pattern', label: 'Pattern', status: 'ready', component: PageAreaViewer },
      { path: 'primitives', label: 'Primitives', status: 'ready', component: PageAreaViewer },
      { path: 'ui', label: 'UI', status: 'ready', component: PageAreaViewer },
    ],
  },
]
