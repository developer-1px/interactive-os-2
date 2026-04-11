// Project data extraction — file counts + backlog parsing + maturity

// ── File counts (compile-time glob) ──

const pageModules = import.meta.glob('/src/pages/**/*', { query: '?raw', eager: false })
const osModules = import.meta.glob('/src/interactive-os/**/*', { query: '?raw', eager: false })

interface FileCounts {
  pages: Record<string, number>
  os: Record<string, number>
}

function countFiles(): FileCounts {
  const pages: Record<string, number> = {}
  for (const path of Object.keys(pageModules)) {
    const match = path.match(/^\/src\/pages\/([^/]+)\//)
    if (!match) continue
    const project = match[1]
    if (project === 'shared') continue
    pages[project] = (pages[project] ?? 0) + 1
  }

  const os: Record<string, number> = {}
  for (const path of Object.keys(osModules)) {
    const match = path.match(/^\/src\/interactive-os\/([^/]+)\//)
    if (!match) continue
    const layer = match[1]
    os[layer] = (os[layer] ?? 0) + 1
  }

  return { pages, os }
}

// ── PROGRESS.md maturity parsing ──

const progressRaw = import.meta.glob('/docs/PROGRESS.md', { query: '?raw', eager: true }) as Record<string, { default: string }>

export type Maturity = 'Concept' | 'Prototype' | 'Validated' | 'Integrated' | 'Production'

interface MaturityEntry {
  module: string
  maturity: Maturity
  gaps: string
}

function parseProgress(): MaturityEntry[] {
  const entry = Object.values(progressRaw)[0]
  if (!entry) return []
  const lines = entry.default.split('\n')
  const entries: MaturityEntry[] = []

  for (const line of lines) {
    const match = line.match(/^\| (.+?) \| (Concept|Prototype|Validated|Integrated|Production) \| (.+?) \|$/)
    if (!match) continue
    const module = match[1].trim().replace(/\*\*/g, '')
    const maturity = match[2].trim() as Maturity
    const gaps = match[3].trim()
    entries.push({ module, maturity, gaps })
  }
  return entries
}

// ── Backlog parsing ──

const backlogRaw = import.meta.glob('/docs/BACKLOGS.md', { query: '?raw', eager: true }) as Record<string, { default: string }>

export interface BacklogItem {
  id: string
  text: string
  priority: string
  done: boolean
  source: string
}

function parseBacklogs(): BacklogItem[] {
  const entry = Object.values(backlogRaw)[0]
  if (!entry) return []
  const lines = entry.default.split('\n')
  const items: BacklogItem[] = []
  let idx = 0

  for (const line of lines) {
    const match = line.match(/^- \[([ x])\] (?:\[([^\]]+)\] )?(.+?)(?:\s*—\s*출처:\s*(.+))?$/)
    if (!match) continue
    const done = match[1] === 'x'
    const priority = match[2] ?? 'P2'
    const text = match[3].trim()
    const source = match[4]?.trim() ?? ''
    items.push({ id: `backlog-${idx++}`, text, priority, done, source })
  }
  return items
}

// ── Project mapping ──

const PROJECT_KEYWORDS: Record<string, string[]> = {
  // Apps (src/pages)
  cms: ['CMS', 'cms', 'landing', 'paste', 'canvas', 'sidebar', 'detail panel', 'cmsStore', 'cmsSchema'],
  writer: ['Writer', 'writer', 'MD 구조', '산문'],
  viewer: ['Viewer', 'viewer', 'Quick Open', 'dep graph', 'lightbox', 'ChatFeed 포팅', 'splitByFilePaths', 'usePacedReveal'],
  chat: ['chat', 'Chat', '채팅', 'ChatFeed', 'Composer', 'WebSocket', 'Agent SDK', '채팅 블록', 'MarkdownBlock', 'ProgressStep', 'Terminal', 'DiffView', 'AgentStep', 'StatCard', 'MetricBar', 'ThinkingBlock', 'FileRef', 'Citation', 'ConfirmAction'],
  showcase: ['showcase', 'Showcase', '쇼케이스', 'treegrid 쇼케이스'],
  creator: ['creator', 'Creator', '컴포넌트 생성'],
  a2ui: ['A2UI', 'a2ui', 'AI→UI'],
  storymap: ['storymap', 'StoryMap', '공간 탐색'],
  replay: ['replay', 'Replay', '리플레이'],
  incident: ['incident', 'Incident', '인시던트', 'CausalChain', 'ServiceMap', 'LogViewer', 'Ops 특화'],
  theme: ['theme', 'Theme', '테마'],
  book: ['book', 'Book'],
  i18n: ['i18n', 'I18n', 'DataTable', '다국어', 'Grid + history undo', 'rename 중 Tab', 'grid-i18n'],
  area: ['area', 'Area'],
  // OS core layers
  os: [
    'Command 직렬화', 'permissions()', 'menubar behavior', '대용량 가상화', '10k+',
    'Select —', 'ContextMenu', 'DatePicker', 'shadcn CLI', 'interactive-os',
    'FOCUS_ID', 'natural-tab-order', 'NavList group', 'completeness',
    'Engine 확장', 'query/mutation/subscription',
    '포인터 드래그 primitive', 'SplitPane',
    'form plugin', 'FormDemo', 'Aria.Editable',
    'UI SDK 카탈로그',
  ],
  harness: ['PRD 스킬', 'harness', 'hook', 'skill', 'Claude Code 플러그인', 'plugin.json', 'viewer-channel을 Claude'],
}

function matchProject(text: string): string {
  for (const [project, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return project
  }
  return '_unmatched'
}

// ── Maturity scoring ──

const MATURITY_ORDER: Maturity[] = ['Concept', 'Prototype', 'Validated', 'Integrated', 'Production']

function maturityScore(m: Maturity): number {
  return MATURITY_ORDER.indexOf(m)
}

function averageMaturity(entries: MaturityEntry[]): Maturity | null {
  if (entries.length === 0) return null
  const avg = entries.reduce((sum, e) => sum + maturityScore(e.maturity), 0) / entries.length
  return MATURITY_ORDER[Math.round(avg)]
}

// ── OS layer maturity keywords (for matching PROGRESS.md entries to layers) ──

const OS_LAYER_MATURITY_KEYWORDS: Record<string, string[]> = {
  store: ['NormalizedData', 'storeToInspectorTree', 'computeStoreDiff', 'createSingleNodeStore'],
  engine: ['dispatch', 'defineCommand', 'Dispatch Logger'],
  axis: ['8축', 'commands (focus'],
  pattern: ['composePattern', 'edit', 'pointer interaction', 'examples/', 'menubar'],
  plugins: ['focusRecovery', 'history', 'crud', 'cellEdit', 'search', 'clipboard', 'zodSchema', 'rename', 'dnd', 'spatial', 'typeahead', 'autoscroll', 'definePlugin'],
  primitives: ['Aria ', 'Aria.Item', 'Aria.Cell', 'Aria.Panel', 'Aria.Trigger', 'KeyMap', 'Keyboard', 'Resizer', 'VirtualCodeBlock', 'shikiUtils'],
  ui: ['indicators/', 'AriaComponentProps', 'ListBox', 'TreeGrid', 'TreeView', 'TabList', 'Accordion', 'Combobox', 'Kanban', 'Slider', 'SpatialView', 'Toaster', 'Tooltip', 'A2UISurface', 'SelectionOverlay', 'DatePicker', 'CalendarGrid'],
}

// ── Public API ──

export interface ProjectInfo {
  id: string
  name: string
  displayName: string
  kind: 'app' | 'os' | 'infra'
  fileCount: number
  backlogs: BacklogItem[]
  openBacklogs: number
  doneBacklogs: number
  maturity: Maturity | null
  maturityEntries: MaturityEntry[]
  path?: string
  hasP0: boolean
}

export function getProjects(): ProjectInfo[] {
  const { pages, os } = countFiles()
  const backlogs = parseBacklogs()
  const maturityEntries = parseProgress()

  // Group backlogs by project
  const backlogsByProject: Record<string, BacklogItem[]> = {}
  for (const item of backlogs) {
    const project = matchProject(item.text + ' ' + item.source)
    if (!backlogsByProject[project]) backlogsByProject[project] = []
    backlogsByProject[project].push(item)
  }

  const projects: ProjectInfo[] = []

  // App projects (src/pages/*)
  const APP_DISPLAY_NAMES: Record<string, string> = {
    cms: 'CMS', viewer: 'Viewer', writer: 'Writer', chat: 'Chat',
    showcase: 'Showcase', creator: 'Creator', a2ui: 'A2UI',
    storymap: 'Story Map', replay: 'Replay', incident: 'Incident',
    theme: 'Theme', book: 'Book', i18n: 'i18n',
    area: 'Area', project: 'Project',
  }

  const APP_PATHS: Record<string, string> = {
    cms: '/', viewer: '/viewer', writer: '/writer', chat: '/chat',
    showcase: '/ui', creator: '/creator', a2ui: '/a2ui',
    storymap: '/storymap', replay: '/replay', incident: '/incident',
    theme: '/internals/theme', book: '/book', i18n: '/i18n',
    project: '/project',
  }

  for (const [name, fileCount] of Object.entries(pages)) {
    const projectBacklogs = backlogsByProject[name] ?? []
    const appMaturity = maturityEntries.filter(e =>
      e.module.toLowerCase().includes(name.toLowerCase()),
    )
    projects.push({
      id: `app:${name}`,
      name,
      displayName: APP_DISPLAY_NAMES[name] ?? name,
      kind: 'app',
      fileCount,
      backlogs: projectBacklogs,
      openBacklogs: projectBacklogs.filter(b => !b.done).length,
      doneBacklogs: projectBacklogs.filter(b => b.done).length,
      maturity: averageMaturity(appMaturity),
      maturityEntries: appMaturity,
      path: APP_PATHS[name],
      hasP0: projectBacklogs.some(b => !b.done && b.priority === 'P0'),
    })
  }

  // OS layer projects (src/interactive-os/*)
  const OS_DISPLAY_NAMES: Record<string, string> = {
    store: 'Store (L1)', engine: 'Engine (L2)', axis: 'Axis (L3)',
    pattern: 'Pattern (L4)', plugins: 'Plugins (L5)', primitives: 'Primitives (L6)', ui: 'UI (L7)',
  }

  const OS_SKIP = new Set(['__tests__', 'misc'])

  for (const [layer, fileCount] of Object.entries(os)) {
    if (OS_SKIP.has(layer)) continue
    const layerKeywords = OS_LAYER_MATURITY_KEYWORDS[layer] ?? []
    const layerMaturity = maturityEntries.filter(e =>
      layerKeywords.some(kw => e.module.includes(kw)),
    )
    projects.push({
      id: `os:${layer}`,
      name: layer,
      displayName: OS_DISPLAY_NAMES[layer] ?? layer,
      kind: 'os',
      fileCount,
      backlogs: [],
      openBacklogs: 0,
      doneBacklogs: 0,
      maturity: averageMaturity(layerMaturity),
      maturityEntries: layerMaturity,
      hasP0: false,
    })
  }

  // OS backlogs → os:ui (largest OS layer)
  const osBacklogs = backlogsByProject['os'] ?? []
  const osUiEntry = projects.find(p => p.id === 'os:ui')
  if (osUiEntry && osBacklogs.length > 0) {
    osUiEntry.backlogs = osBacklogs
    osUiEntry.openBacklogs = osBacklogs.filter(b => !b.done).length
    osUiEntry.doneBacklogs = osBacklogs.filter(b => b.done).length
  }

  // Harness (always show)
  const harnessBacklogs = backlogsByProject['harness'] ?? []
  projects.push({
    id: 'infra:harness',
    name: 'harness',
    displayName: 'Harness',
    kind: 'infra',
    fileCount: 0,
    backlogs: harnessBacklogs,
    openBacklogs: harnessBacklogs.filter(b => !b.done).length,
    doneBacklogs: harnessBacklogs.filter(b => b.done).length,
    maturity: 'Validated',
    maturityEntries: [],
    hasP0: harnessBacklogs.some(b => !b.done && b.priority === 'P0'),
  })

  // Unmatched (only show if there are open items)
  const unmatchedBacklogs = backlogsByProject['_unmatched'] ?? []
  if (unmatchedBacklogs.some(b => !b.done)) {
    projects.push({
      id: 'other:unmatched',
      name: '_unmatched',
      displayName: 'Unmatched',
      kind: 'infra',
      fileCount: 0,
      backlogs: unmatchedBacklogs,
      openBacklogs: unmatchedBacklogs.filter(b => !b.done).length,
      doneBacklogs: unmatchedBacklogs.filter(b => b.done).length,
      maturity: null,
      maturityEntries: [],
      hasP0: unmatchedBacklogs.some(b => !b.done && b.priority === 'P0'),
    })
  }

  // Sort: os first (by layer order), then apps (by fileCount), then infra last
  const kindOrder: Record<string, number> = { os: 0, app: 1, infra: 2 }
  const osOrder = ['store', 'engine', 'axis', 'pattern', 'plugins', 'primitives', 'ui']
  projects.sort((a, b) => {
    const ka = kindOrder[a.kind] ?? 9
    const kb = kindOrder[b.kind] ?? 9
    if (ka !== kb) return ka - kb
    if (a.kind === 'os' && b.kind === 'os') {
      return osOrder.indexOf(a.name) - osOrder.indexOf(b.name)
    }
    return b.fileCount - a.fileCount
  })

  return projects
}
