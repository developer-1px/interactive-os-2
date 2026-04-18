var e=`// ── Catalog Loader ──
// Auto-collects *.demo.tsx files from ui/ via import.meta.glob

import type React from 'react'

export interface DemoMeta {
  slug: string
  category: string
  label: string
  subcategory?: string
  axes?: string[]
}

// Axis composition per ui component (B-axis tags).
// 축: navigate/select/activate/value/popup/expand/tab/edit/dismiss
const UI_AXES: Record<string, string[]> = {
  // Input — activate / value / select
  Button: ['activate'], ButtonToggle: ['activate', 'select'], Link: ['activate'],
  MenuButton: ['activate', 'popup'],
  Checkbox: ['select'], CheckboxMixed: ['select'], Toggle: ['select'],
  RadioGroup: ['navigate', 'select'], RadioGroupActivedescendant: ['navigate', 'select'],
  SwitchGroup: ['navigate', 'select'], ToggleGroup: ['navigate', 'select'],
  Combobox: ['value', 'popup', 'select'], DatePicker: ['value', 'popup'],
  Slider: ['value'], Spinbutton: ['value'], TextInput: ['value', 'edit'],
  Form: ['navigate', 'value'],
  // Navigation — navigate / tab
  Breadcrumb: ['navigate'], NavList: ['navigate'], TocNavList: ['navigate'],
  TabList: ['tab'], TabGroup: ['tab'], ViewerTabList: ['tab'],
  Menubar: ['navigate', 'popup'], MenuList: ['navigate', 'activate'],
  FileTreeView: ['navigate', 'expand'], MillerColumns: ['navigate', 'select'],
  Toolbar: ['navigate', 'activate'], ButtonToolbar: ['navigate', 'activate'],
  // Collection — select / expand / activate
  ListBox: ['navigate', 'select'], ListBoxGrouped: ['navigate', 'select'],
  MenuActivedescendant: ['navigate', 'activate'],
  Table: ['navigate', 'select'], TreeGrid: ['navigate', 'select', 'expand'],
  TreeView: ['navigate', 'select', 'expand'], WriterTreeGrid: ['navigate', 'select', 'expand', 'edit'],
  Kanban: ['navigate', 'select', 'dnd'], Feed: ['navigate'], StreamFeed: ['navigate'],
  SearchResults: ['navigate', 'select'], PipelineGrid: ['navigate'],
  // Overlay — popup / dismiss
  Dialog: ['popup', 'dismiss'], AlertDialog: ['popup', 'dismiss'],
  RouteModal: ['popup', 'dismiss'], Lightbox: ['popup', 'dismiss'],
  FileViewerModal: ['popup', 'dismiss'], QuickOpen: ['popup', 'value'],
  Toaster: ['popup', 'dismiss'], Tooltip: ['popup'],
  // Feedback — display
  Alert: ['display'], Avatar: ['display'], Badge: ['display'], EmptyState: ['display'],
  Kbd: ['display'], Meter: ['display'], Progress: ['display'], Skeleton: ['display'],
  Spinner: ['display'], TerminalOutput: ['display'], Divider: ['display'],
  PropertyRow: ['display'], GroupHeader: ['display'], PanelHeader: ['display'],
  // Viewer — display / expand
  CodeViewer: ['display'], FileIcon: ['display'], FilePreview: ['display'],
  FileViewer: ['display'], MarkdownViewer: ['display'], SpreadReader: ['navigate', 'display'],
  Accordion: ['expand'], DisclosureGroup: ['expand'],
  FilterBar: ['value', 'select'], Composer: ['value', 'edit'],
  // Layout — container
  AriaZone: ['container'], A2UISurface: ['container'], Camera: ['container'],
  FlatLayout: ['container'], Grid: ['container'], ScrollArea: ['container'],
  SpatialView: ['navigate', 'container'], SplitPane: ['container'],
  WindowSplitter: ['container'], Workspace: ['container'],
  SelectionOverlay: ['select'], CalendarGrid: ['navigate', 'select'], PatternDemo: ['display'],
}

// Fallback subcategory for ui/* demos when meta.subcategory is not specified.
// demo 파일이 직접 meta.subcategory를 지정하면 그쪽이 우선한다.
const UI_SUBCATEGORY: Record<string, string> = {
  // Input
  Button: 'Input', ButtonToggle: 'Input', Checkbox: 'Input', CheckboxMixed: 'Input',
  Combobox: 'Input', DatePicker: 'Input', Form: 'Input', Link: 'Input',
  MenuButton: 'Input', RadioGroup: 'Input', RadioGroupActivedescendant: 'Input',
  Slider: 'Input', Spinbutton: 'Input', SwitchGroup: 'Input', TextInput: 'Input',
  Toggle: 'Input', ToggleGroup: 'Input',
  // Navigation
  Breadcrumb: 'Navigation', FileTreeView: 'Navigation', Menubar: 'Navigation',
  MenuList: 'Navigation', MillerColumns: 'Navigation', NavList: 'Navigation',
  TabGroup: 'Navigation', TabList: 'Navigation', TocNavList: 'Navigation',
  Toolbar: 'Navigation', ButtonToolbar: 'Navigation', ViewerTabList: 'Navigation',
  // Collection
  ListBox: 'Collection', ListBoxGrouped: 'Collection', MenuActivedescendant: 'Collection',
  Table: 'Collection', TreeGrid: 'Collection', TreeView: 'Collection',
  WriterTreeGrid: 'Collection', Kanban: 'Collection', Feed: 'Collection',
  StreamFeed: 'Collection', SearchResults: 'Collection', PipelineGrid: 'Collection',
  // Overlay
  Dialog: 'Overlay', AlertDialog: 'Overlay', RouteModal: 'Overlay', Lightbox: 'Overlay',
  FileViewerModal: 'Overlay', QuickOpen: 'Overlay', Toaster: 'Overlay', Tooltip: 'Overlay',
  // Feedback
  Alert: 'Feedback', Avatar: 'Feedback', Badge: 'Feedback', EmptyState: 'Feedback',
  Kbd: 'Feedback', Meter: 'Feedback', Progress: 'Feedback', Skeleton: 'Feedback',
  Spinner: 'Feedback', TerminalOutput: 'Feedback', Divider: 'Feedback',
  PropertyRow: 'Feedback', GroupHeader: 'Feedback', PanelHeader: 'Feedback',
  // Viewer
  CodeViewer: 'Viewer', FileIcon: 'Viewer', FilePreview: 'Viewer', FileViewer: 'Viewer',
  MarkdownViewer: 'Viewer', SpreadReader: 'Viewer', Accordion: 'Viewer',
  DisclosureGroup: 'Viewer', FilterBar: 'Viewer', Composer: 'Viewer',
  // Layout
  AriaZone: 'Layout', A2UISurface: 'Layout', Camera: 'Layout', FlatLayout: 'Layout',
  Grid: 'Layout', ScrollArea: 'Layout', SpatialView: 'Layout', SplitPane: 'Layout',
  WindowSplitter: 'Layout', Workspace: 'Layout', SelectionOverlay: 'Layout',
  CalendarGrid: 'Layout', PatternDemo: 'Layout',
}

function slugToComponentName(slug: string): string {
  return slug.replace(/(?:^|-)([a-z])/g, (_, c: string) => c.toUpperCase())
}

const ITEM_SUBCATEGORY: Record<string, string> = {
  ListItem: 'Generic', TreeItem: 'Generic', MenuItem: 'Generic', MenubarItem: 'Generic',
  TabItem: 'Generic', TocItem: 'Generic', ToolbarItem: 'Generic',
  ButtonToolbarItem: 'Generic', FileTreeItem: 'Generic', ViewerTabItem: 'Generic',
  EditableListItem: 'Editable', EditableTreeItem: 'Editable', WriterItem: 'Editable',
  IssueRow: 'Specialized',
}

const CELL_SUBCATEGORY: Record<string, string> = {
  TextCell: 'Display', BadgeCell: 'Display', CodeCell: 'Display',
  VisualCell: 'Display', SummaryCell: 'Display', DocLinkCell: 'Display',
  EditableCell: 'Editable',
  PhaseCell: 'Semantic', TierCell: 'Semantic', SearchableCell: 'Semantic',
}

const INDICATOR_SUBCATEGORY: Record<string, string> = {
  CheckIndicator: 'State', RadioIndicator: 'State', IndeterminateIndicator: 'State',
  SwitchIndicator: 'State', StatusIndicator: 'State', ExpandIndicator: 'State',
  SortIndicator: 'State', DirectionIndicator: 'State',
  ProgressIndicator: 'Progress', SpinnerIndicator: 'Progress', SkeletonIndicator: 'Progress',
  StepIndicator: 'Progress', PageIndicator: 'Progress', IncrementIndicator: 'Progress',
  AddIndicator: 'Affordance', CloseIndicator: 'Affordance',
  GripIndicator: 'Affordance', OverflowIndicator: 'Affordance',
  BadgeIndicator: 'Decoration', FileTypeIndicator: 'Decoration',
  SeparatorIndicator: 'Decoration', TreeConnector: 'Decoration',
}

const SUBCATEGORY_TABLES: Record<string, Record<string, string>> = {
  ui: UI_SUBCATEGORY,
  item: ITEM_SUBCATEGORY,
  cell: CELL_SUBCATEGORY,
  indicator: INDICATOR_SUBCATEGORY,
}

function resolveSubcategory(category: string, slug: string, meta?: DemoMeta): string | undefined {
  if (meta?.subcategory) return meta.subcategory
  const table = SUBCATEGORY_TABLES[category]
  return table?.[slugToComponentName(slug)]
}

export interface DemoModule {
  meta: DemoMeta
  Demo: () => React.ReactNode
}

export interface CatalogEntry {
  slug: string
  label: string
  category: string
  subcategory?: string
  axes?: string[]
  load: () => Promise<DemoModule>
}

export interface CatalogData {
  categories: Record<string, CatalogEntry[]>
  missing: string[]
}

// Lazy demo modules
const demoModules = {
  ...import.meta.glob<DemoModule>('/src/interactive-os/ui/**/*.demo.tsx', { eager: false }),
  ...import.meta.glob<DemoModule>('/src/pages/**/*.demo.tsx', { eager: false }),
}

// All ui component files (keys only)
const uiComponents = import.meta.glob(
  '/src/interactive-os/ui/*.tsx',
  { eager: false },
)

function extractComponentName(path: string): string {
  return path.split('/').pop()?.replace('.tsx', '') ?? ''
}

function extractDemoSlug(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace('.demo.tsx', '')
}

export async function loadCatalog(): Promise<CatalogData> {
  const categories: Record<string, CatalogEntry[]> = {}
  const demoSlugs = new Set<string>()

  // Build entries from demo modules
  for (const [path, loader] of Object.entries(demoModules)) {
    const slug = extractDemoSlug(path)
    demoSlugs.add(slug)

    // Peek at meta by loading the module
    const mod = await loader()
    const meta = mod.meta
    const category = meta?.category ?? 'Uncategorized'

    if (!categories[category]) {
      categories[category] = []
    }

    const finalSlug = meta?.slug ?? slug
    categories[category].push({
      slug: finalSlug,
      label: meta?.label ?? slug,
      category,
      subcategory: resolveSubcategory(category, finalSlug, meta),
      axes: meta?.axes ?? (category === 'ui' ? UI_AXES[slugToComponentName(finalSlug)] : undefined),
      load: loader,
    })
  }

  // Find components without demos
  const allComponentNames = Object.keys(uiComponents)
    .map(extractComponentName)
    .filter(name => name && !name.startsWith('_') && !name.includes('.demo') && !name.includes('.module'))

  const missing = allComponentNames.filter(name => {
    const slug = name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
    return !demoSlugs.has(slug) && !demoSlugs.has(name)
  })

  return { categories, missing }
}
`;export{e as default};