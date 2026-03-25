import { Database, Cog, Axe, Puzzle, Box, Layers, BookOpen, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
      { path: 'inspector', label: 'Inspector', status: 'ready', component: PageAreaViewer },
    ],
  },
  {
    id: 'internals/engine',
    label: 'Engine',
    icon: Cog,
    basePath: '/internals/engine/command',
    items: [
      { path: 'command', label: 'Command', status: 'ready', component: PageAreaViewer },
      { path: 'diff', label: 'Diff', status: 'ready', component: PageAreaViewer },
    ],
  },
  {
    id: 'internals/plugins',
    label: 'Plugins',
    icon: Puzzle,
    basePath: '/internals/plugins/crud',
    items: [
      { path: 'crud', label: 'CRUD', status: 'ready', component: PageAreaViewer },
      { path: 'clipboard', label: 'Clipboard', status: 'ready', component: PageAreaViewer },
      { path: 'history', label: 'History', status: 'ready', component: PageAreaViewer },
      { path: 'dnd', label: 'DnD', status: 'ready', component: PageAreaViewer },
      { path: 'rename', label: 'Rename', status: 'ready', component: PageAreaViewer },
      { path: 'typeahead', label: 'Typeahead', status: 'ready', component: PageAreaViewer },
    ],
  },
  {
    id: 'internals/axis',
    label: 'Axis',
    icon: Axe,
    basePath: '/internals/axis/navigate',
    items: [
      { path: 'navigate', label: 'navigate()', status: 'ready', component: PageAreaViewer },
      { path: 'select', label: 'select()', status: 'ready', component: PageAreaViewer },
      { path: 'activate', label: 'activate()', status: 'ready', component: PageAreaViewer },
      { path: 'expand', label: 'expand()', status: 'ready', component: PageAreaViewer },
      { path: 'dismiss', label: 'dismiss()', status: 'ready', component: PageAreaViewer },
      { path: 'tab', label: 'tab()', status: 'ready', component: PageAreaViewer },
    ],
  },
  {
    id: 'internals/pattern',
    label: 'Pattern',
    icon: Layers,
    basePath: '/internals/pattern/edit',
    items: [
      { path: 'edit', label: 'edit()', status: 'ready', component: PageAreaViewer },
    ],
  },
  {
    id: 'internals/primitives',
    label: 'Primitives',
    icon: Box,
    basePath: '/internals/primitives/aria',
    items: [
      { path: 'aria', label: 'Aria', status: 'ready', component: PageAreaViewer },
      { path: 'cell', label: 'Cell', status: 'ready', component: PageAreaViewer },
      { path: 'hooks', label: 'Hooks', status: 'ready', component: PageAreaViewer },
    ],
  },
  {
    id: 'devtools',
    label: 'Devtools',
    icon: Wrench,
    basePath: '/devtools/rec',
    items: [
      { path: 'rec', label: 'REC', status: 'ready', component: PageAreaViewer },
      { path: 'inspector', label: 'Inspector', status: 'ready', component: PageAreaViewer },
      { path: 'test-runner', label: 'Test Runner', status: 'ready', component: PageAreaViewer },
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
