import { Database, Cog, Axe, Compass, Puzzle, Layers, Box, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
import PageTreeNav from './pages/PageTreeNav'
import PageListboxNav from './pages/PageListboxNav'
import PageComboboxNav from './pages/PageComboboxNav'
import PageTabsCrud from './pages/PageTabsCrud'
import PageGridCollection from './pages/PageGridCollection'
import PageKanban from './pages/PageKanban'
import PageI18nDataTable from './pages/PageI18nDataTable'
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
    id: 'internals/axis',
    label: 'Axis',
    icon: Axe,
    basePath: '/internals/axis/navigate',
    items: [
      { path: 'navigate', label: 'navigate()', status: 'ready', md: 'axes/navigate' },
      { path: 'select', label: 'select()', status: 'ready', md: 'axes/select' },
      { path: 'activate', label: 'activate()', status: 'ready', md: 'axes/activate' },
      { path: 'expand', label: 'expand()', status: 'ready', md: 'axes/expand' },
      { path: 'dismiss', label: 'dismiss()', status: 'ready', md: 'axes/dismiss' },
      { path: 'edit', label: 'edit()', status: 'ready', md: 'axes/edit' },
      { path: 'tab', label: 'tab()', status: 'ready', md: 'axes/tab' },
    ],
  },
  {
    id: 'internals/pattern',
    label: 'Pattern',
    icon: Compass,
    basePath: '/internals/pattern/accordion',
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
      { path: 'tree', label: 'Tree', status: 'ready', component: PageTreeNav },
      { path: 'listbox', label: 'Listbox', status: 'ready', component: PageListboxNav },
      { path: 'grid', label: 'Grid', status: 'ready', component: PageGrid },
      { path: 'combobox', label: 'Combobox', status: 'ready', component: PageComboboxNav },
    ],
  },
  {
    id: 'internals/plugin',
    label: 'Plugin',
    icon: Puzzle,
    basePath: '/internals/plugin/crud',
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
    id: 'internals/collection',
    label: 'Collection',
    icon: Layers,
    basePath: '/internals/collection/treegrid',
    items: [
      { path: 'treegrid', label: 'TreeGrid', status: 'ready', component: PageTreeGrid },
      { path: 'listbox', label: 'Listbox', status: 'ready', component: PageListbox },
      { path: 'grid', label: 'Grid', status: 'ready', component: PageGridCollection },
      { path: 'tabs', label: 'Tabs', status: 'ready', component: PageTabsCrud },
      { path: 'combobox', label: 'Combobox', status: 'ready', component: PageCombobox },
      { path: 'kanban', label: 'Kanban', status: 'ready', component: PageKanban },
      { path: 'i18n', label: 'i18n DataTable', status: 'ready', component: PageI18nDataTable },
    ],
  },
  {
    id: 'internals/components',
    label: 'Components',
    icon: Box,
    basePath: '/internals/components/aria',
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
      { path: 'core', label: 'Core', status: 'ready', component: PageAreaViewer },
      { path: 'axes', label: 'Axes', status: 'ready', component: PageAreaViewer },
      { path: 'patterns', label: 'Patterns', status: 'ready', component: PageAreaViewer },
      { path: 'plugins', label: 'Plugins', status: 'ready', component: PageAreaViewer },
      { path: 'hooks', label: 'Hooks', status: 'ready', component: PageAreaViewer },
      { path: 'ui', label: 'UI', status: 'ready', component: PageAreaViewer },
    ],
  },
]
