import './PageViewer.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Fuse from 'fuse.js'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import { codeToHtml } from 'shiki'
import { MermaidBlock } from './MermaidBlock'
import { Aria } from '../interactive-os/components/aria'
import { treegrid } from '../interactive-os/behaviors/treegrid'
import { combobox } from '../interactive-os/behaviors/combobox'
import { core, selectionCommands } from '../interactive-os/plugins/core'
import { combobox as comboboxPlugin, comboboxCommands } from '../interactive-os/plugins/combobox'
import { useAria } from '../interactive-os/hooks/useAria'
import { createStore, getChildren } from '../interactive-os/core/createStore'
import { ROOT_ID, createBatchCommand } from '../interactive-os/core/types'
import type { NormalizedData, Entity } from '../interactive-os/core/types'
import { createRecorder } from '../interactive-os/devtools/createRecorder'
import {
  Folder, FolderOpen, FileText, FileCode, FileType,
  File, ChevronRight, ChevronDown, Circle, PanelLeft,
  Braces, Palette, Terminal, Image, Settings, Search,
} from 'lucide-react'

// --- Types ---

interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

interface FileNodeData {
  name: string
  type: 'file' | 'directory'
  path: string
}

// --- Data fetching ---

const DEFAULT_ROOT = '/Users/user/Desktop/aria'

async function fetchTree(root: string): Promise<TreeNode[]> {
  const res = await fetch(`/api/fs/tree?root=${encodeURIComponent(root)}`)
  return res.json()
}

async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/fs/file?path=${encodeURIComponent(path)}`)
  return res.text()
}

// --- Export structure fetching ---

interface ExportedSymbol {
  kind: 'function' | 'interface' | 'type' | 'const' | 'class'
  name: string
  signature?: string
  properties?: { name: string; type: string }[]
  value?: string
}

interface ExportsData {
  file: string
  symbols: ExportedSymbol[]
}

async function fetchExports(filePath: string): Promise<ExportsData | null> {
  try {
    const res = await fetch(`/api/fs/exports?path=${encodeURIComponent(filePath)}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function isSourceFile(filename: string): boolean {
  const ext = filename.split('.').pop() ?? ''
  return ['ts', 'tsx', 'js', 'jsx'].includes(ext)
}

function escapeMermaid(text: string): string {
  return text
    .replace(/~/g, '∼')
    .replace(/[<>]/g, m => m === '<' ? '‹' : '›')
    .replace(/"/g, "'")
}

function generateClassDiagram(data: ExportsData, filename: string): string {
  if (data.symbols.length === 0) return ''

  const lines: string[] = ['classDiagram']
  const moduleName = filename.replace(/\.[^.]+$/, '')

  // Group by kind
  const interfaces = data.symbols.filter(s => s.kind === 'interface' || s.kind === 'type' && s.properties?.length)
  const types = data.symbols.filter(s => s.kind === 'type' && !s.properties?.length)
  const functions = data.symbols.filter(s => s.kind === 'function')
  const consts = data.symbols.filter(s => s.kind === 'const')
  const classes = data.symbols.filter(s => s.kind === 'class')

  // Render interfaces/types with properties as classes
  for (const sym of [...interfaces, ...classes]) {
    lines.push(`  class ${sym.name} {`)
    if (sym.properties) {
      for (const prop of sym.properties) {
        lines.push(`    +${escapeMermaid(prop.name)} ${escapeMermaid(prop.type)}`)
      }
    }
    lines.push('  }')
    if (sym.kind === 'interface') {
      lines.push(`  <<interface>> ${sym.name}`)
    }
  }

  // Render functions as a module class
  if (functions.length > 0 || consts.length > 0) {
    lines.push(`  class ${moduleName} {`)
    for (const fn of functions) {
      lines.push(`    +${escapeMermaid(fn.name)}${escapeMermaid(fn.signature ?? '()')}`)
    }
    for (const c of consts) {
      lines.push(`    +${escapeMermaid(c.name)} ${escapeMermaid(c.value ?? '')}`)
    }
    lines.push('  }')
    lines.push(`  <<module>> ${moduleName}`)
  }

  // Type aliases without properties → note
  for (const t of types) {
    lines.push(`  class ${t.name} {`)
    lines.push(`    ${escapeMermaid(t.value ?? '...')}`)
    lines.push('  }')
    lines.push(`  <<type>> ${t.name}`)
  }

  // Relationships: if a function returns or takes an interface type
  const typeNames = new Set([...interfaces, ...classes, ...types].map(s => s.name))
  for (const fn of functions) {
    const sig = fn.signature ?? ''
    for (const typeName of typeNames) {
      if (sig.includes(typeName)) {
        lines.push(`  ${moduleName} ..> ${typeName} : uses`)
      }
    }
  }

  return lines.join('\n')
}

// --- Convert tree to normalized store ---

function treeToStore(nodes: TreeNode[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  function walk(items: TreeNode[], parentId: string) {
    for (const node of items) {
      entities[node.id] = { id: node.id, data: { name: node.name, type: node.type, path: node.id } }
      if (!relationships[parentId]) relationships[parentId] = []
      relationships[parentId].push(node.id)
      if (node.children && node.children.length > 0) {
        walk(node.children, node.id)
      }
    }
  }

  walk(nodes, ROOT_ID)
  return createStore({ entities, relationships })
}

// --- Theme detection (single observer shared across all CodeBlock instances) ---

function getShikiTheme(): string {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'github-light'
    : 'github-dark'
}

const themeListeners = new Set<() => void>()
let shikiThemeCache = getShikiTheme()

if (typeof MutationObserver !== 'undefined') {
  const themeObserver = new MutationObserver(() => {
    shikiThemeCache = getShikiTheme()
    themeListeners.forEach(fn => fn())
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

function useShikiTheme(): string {
  const [theme, setTheme] = useState(shikiThemeCache)
  useEffect(() => {
    const cb = () => setTheme(getShikiTheme())
    themeListeners.add(cb)
    return () => { themeListeners.delete(cb) }
  }, [])
  return theme
}

// --- Shiki code highlighting ---

const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  json: 'json', css: 'css', html: 'html', yaml: 'yaml', yml: 'yaml',
  sh: 'bash', bash: 'bash', py: 'python', md: 'markdown',
}

function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const [html, setHtml] = useState('')
  const [highlightToken, setHighlightToken] = useState<string | null>(null)
  const currentTheme = useShikiTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const ext = filename.split('.').pop() ?? ''
  const lang = EXT_TO_LANG[ext] ?? 'text'

  useEffect(() => {
    let cancelled = false
    codeToHtml(code, {
      lang,
      theme: currentTheme,
      transformers: [{
        line(node, line) {
          node.properties['data-line'] = line
        },
        span(node) {
          const text = (node.children?.[0] as { type: string; value: string })?.value
          if (text && IDENTIFIER_RE.test(text)) {
            node.properties['data-token'] = text
            const existing = node.properties['class'] ?? ''
            node.properties['class'] = existing ? `${existing} code-token` : 'code-token'
          }
        },
      }],
    }).then((result) => {
      if (!cancelled) setHtml(result)
    })
    return () => { cancelled = true }
  }, [code, lang, currentTheme])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const token = target.getAttribute('data-token')
    if (token) {
      setHighlightToken((prev) => prev === token ? null : token)
    } else {
      setHighlightToken(null)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const tokens = container.querySelectorAll('.code-token')
    for (const el of tokens) {
      if (highlightToken && el.getAttribute('data-token') === highlightToken) {
        (el as HTMLElement).classList.add('code-token--highlighted')
      } else {
        (el as HTMLElement).classList.remove('code-token--highlighted')
      }
    }
  }, [highlightToken, html])

  if (!html) return <pre className="code-block code-block--loading"><code>{code}</code></pre>
  return (
    <div
      ref={containerRef}
      className="code-block"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  )
}

// --- Dependency graph ---

function ExportDiagram({ filePath }: { filePath: string }) {
  const [mermaidCode, setMermaidCode] = useState<string | null>(null)
  const filename = filePath.split('/').pop() ?? ''

  useEffect(() => {
    let cancelled = false
    fetchExports(filePath).then(data => {
      if (cancelled || !data) { setMermaidCode(null); return }
      const code = generateClassDiagram(data, filename)
      setMermaidCode(code || null)
    })
    return () => { cancelled = true }
  }, [filePath, filename])

  if (!mermaidCode) return null

  return (
    <div className="vw-dep-graph">
      <MermaidBlock code={mermaidCode} />
    </div>
  )
}

// --- Markdown viewer ---

function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="viewer-markdown">
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        children={content}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? '')
            const codeStr = String(children).replace(/\n$/, '')

            if (match?.[1] === 'mermaid') {
              return <MermaidBlock code={codeStr} />
            }

            if (match) {
              return <CodeBlock code={codeStr} filename={`x.${match[1]}`} />
            }

            return <code className={className} {...props}>{children}</code>
          },
        }}
      />
    </div>
  )
}

// --- File icon component ---

const ICON_SIZE = 12
const ICON_STROKE = 1.5

function FileIcon({ name, type, expanded }: { name: string; type: string; expanded?: boolean }) {
  if (type === 'directory') {
    return expanded
      ? <FolderOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--folder" />
      : <Folder size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--folder" />
  }
  const ext = name.split('.').pop()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--ts" />
    case 'js':
    case 'jsx':
      return <FileCode size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--js" />
    case 'json':
      return <Braces size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--json" />
    case 'md':
      return <FileType size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--md" />
    case 'css':
      return <Palette size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--css" />
    case 'sh':
    case 'bash':
      return <Terminal size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--sh" />
    case 'png':
    case 'jpg':
    case 'svg':
    case 'gif':
      return <Image size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--img" />
    case 'yaml':
    case 'yml':
    case 'toml':
      return <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon vw-icon--config" />
    default:
      return <File size={ICON_SIZE} strokeWidth={ICON_STROKE} className="vw-icon" />
  }
}

// --- Breadcrumb ---

function Breadcrumb({ path, root }: { path: string; root: string }) {
  const relative = path.startsWith(root) ? path.slice(root.length + 1) : path
  const segments = relative.split('/')
  return (
    <div className="vw-breadcrumb">
      {segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && <ChevronRight size={10} strokeWidth={2} className="vw-breadcrumb__sep" />}
          <span className={i === segments.length - 1 ? 'vw-breadcrumb__current' : 'vw-breadcrumb__segment'}>{seg}</span>
        </span>
      ))}
    </div>
  )
}

// --- Flatten file entities for search ---

interface FileEntry {
  id: string
  name: string
  path: string
  relativePath: string
}

function flattenFiles(store: NormalizedData, root: string): FileEntry[] {
  const files: FileEntry[] = []
  for (const entity of Object.values(store.entities)) {
    if (!entity.data) continue
    const data = entity.data as FileNodeData
    if (data.type === 'file') {
      files.push({
        id: entity.id,
        name: data.name,
        path: data.path,
        relativePath: data.path.startsWith(root) ? data.path.slice(root.length + 1) : data.path,
      })
    }
  }
  return files
}

// --- Quick Open component ---

const MAX_RESULTS = 12

function QuickOpen({
  fileStore,
  root,
  onSelect,
  onClose,
}: {
  fileStore: NormalizedData
  root: string
  onSelect: (filePath: string) => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  const files = useMemo(() => flattenFiles(fileStore, root), [fileStore, root])
  const fuse = useMemo(() => new Fuse(files, {
    keys: ['name', 'relativePath'],
    threshold: 0.4,
  }), [files])

  const results = useMemo(() => {
    if (!query.trim()) return files.slice(0, MAX_RESULTS)
    return fuse.search(query).slice(0, MAX_RESULTS).map(r => r.item)
  }, [query, fuse, files])

  // Convert Fuse.js results to NormalizedData for the combobox behavior
  const comboboxData = useMemo(() => createStore({
    entities: Object.fromEntries(results.map(f => [f.id, { id: f.id, data: f }])),
    relationships: { [ROOT_ID]: results.map(f => f.id) },
  }), [results])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const handleChange = useCallback((newStore: NormalizedData) => {
    // Detect close: __combobox__ isOpen went to false
    const isOpen = (newStore.entities['__combobox__']?.isOpen as boolean) ?? false
    if (!isOpen) {
      // Check if a selection was made
      const selectedIds = (newStore.entities['__selection__']?.selectedIds as string[]) ?? []
      if (selectedIds.length > 0) {
        const selectedEntity = newStore.entities[selectedIds[0]]
        if (selectedEntity?.data) {
          const fileData = selectedEntity.data as FileEntry
          onSelectRef.current(fileData.path)
        }
      }
      onCloseRef.current()
    }
  }, [])

  const aria = useAria({
    behavior: combobox(),
    data: comboboxData,
    plugins: [core(), comboboxPlugin()],
    onChange: handleChange,
  })

  const store = aria.getStore()
  const isOpen = (store.entities['__combobox__']?.isOpen as boolean) ?? false
  const children = getChildren(store, ROOT_ID)

  // Auto-focus input and open combobox on mount
  useEffect(() => {
    inputRef.current?.focus()
    aria.dispatch(comboboxCommands.open())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  return (
    <div className="qo-backdrop" onClick={handleBackdropClick}>
      <div className="qo-dialog" aria-label="Quick Open">
        <div className="qo-input-row">
          <Search size={12} strokeWidth={1.5} className="qo-input-icon" />
          <input
            ref={inputRef}
            className="qo-input"
            type="text"
            placeholder="파일 검색..."
            value={query}
            onChange={(e) => { setQuery(e.target.value) }}
            aria-label="파일 검색"
            {...(aria.containerProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
          <kbd className="qo-shortcut">ESC</kbd>
        </div>
        {isOpen && children.length > 0 ? (
          <div className="qo-results" onMouseDown={e => e.preventDefault()}>
            {children.map(childId => {
              const entity = store.entities[childId]
              if (!entity) return null
              const state = aria.getNodeState(childId)
              const props = aria.getNodeProps(childId)
              const fileData = entity.data as FileEntry
              return (
                <div
                  key={childId}
                  {...(props as React.HTMLAttributes<HTMLDivElement>)}
                  className={`qo-item${state.focused ? ' qo-item--focused' : ''}`}
                  onClick={() => {
                    aria.dispatch(createBatchCommand([
                      selectionCommands.select(childId),
                      comboboxCommands.close(),
                    ]))
                  }}
                >
                  <FileIcon name={fileData.name} type="file" />
                  <span className="qo-item__name">{fileData.name}</span>
                  <span className="qo-item__path">{fileData.relativePath}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="qo-empty">일치하는 파일이 없습니다</div>
        )}
      </div>
    </div>
  )
}

// --- Main viewer page ---

export default function PageViewer() {
  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [treeCollapsed, setTreeCollapsed] = useState(false)
  const [quickOpenVisible, setQuickOpenVisible] = useState(false)
  const recorder = useMemo(() => createRecorder(), [])
  const selectedFileRef = useRef<string | null>(null)
  const contentBodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      setInitialStore(treeToStore(tree))
      setLoading(false)
    })
  }, [])

  const selectFile = useCallback((filePath: string) => {
    if (filePath === selectedFileRef.current) return
    selectedFileRef.current = filePath
    setSelectedFile(filePath)
    contentBodyRef.current?.scrollTo(0, 0)
    fetchFile(filePath).then(setFileContent)
  }, [])

  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as FileNodeData).type === 'file') {
      selectFile((entity.data as FileNodeData).path)
    }
  }, [selectFile])

  const toggleRecording = useCallback(() => {
    if (recording) {
      const data = recorder.stop()
      setRecording(false)
      const json = JSON.stringify(data, null, 2)
      navigator.clipboard.writeText(json).then(() => {
        console.log('Recording copied to clipboard')
        console.log(json)
      })
    } else {
      recorder.start()
      setRecording(true)
    }
  }, [recording, recorder])

  const setQuickOpenVisibleRef = useRef(setQuickOpenVisible)
  setQuickOpenVisibleRef.current = setQuickOpenVisible

  const quickOpenKeyMap = useMemo(() => ({
    'Meta+p': () => { setQuickOpenVisibleRef.current(true); return undefined },
  }), [])

  const emptyData = useMemo(() => createStore({
    entities: {},
    relationships: { [ROOT_ID]: [] },
  }), [])

  const emptyPlugins = useMemo(() => [] as never[], [])

  const handleQuickOpenSelect = selectFile

  if (loading || !initialStore) {
    return (
      <div className="vw-loading">
        <Circle size={14} strokeWidth={2} className="vw-loading__spinner" />
        <span>Loading project...</span>
      </div>
    )
  }

  const filename = selectedFile?.split('/').pop() ?? ''
  const isMarkdown = filename.endsWith('.md')
  const ext = filename.split('.').pop() ?? ''
  const lineCount = fileContent ? fileContent.split('\n').length : 0

  return (
    <Aria
      keyMap={quickOpenKeyMap}
      data={emptyData}
      plugins={emptyPlugins}
    >
    <div className="vw">
      {/* Top bar — single unified bar */}
      <div className="vw-statusbar">
        <div className="vw-statusbar__left">
          <button
            className="vw-statusbar__btn"
            onClick={() => setTreeCollapsed(!treeCollapsed)}
            title={treeCollapsed ? 'Show explorer' : 'Hide explorer'}
          >
            <PanelLeft size={12} strokeWidth={1.5} />
          </button>
          {selectedFile ? (
            <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />
          ) : (
            <span className="vw-statusbar__title">Explorer</span>
          )}
        </div>
        <div className="vw-statusbar__right">
          {selectedFile && (
            <div className="vw-content__meta">
              <FileIcon name={filename} type="file" />
              <span>{ext.toUpperCase()}</span>
              <span className="vw-content__meta-sep" />
              <span>{lineCount} lines</span>
            </div>
          )}
          <button
            className="vw-statusbar__btn"
            onClick={() => setQuickOpenVisible(true)}
            title="Quick Open (Cmd+P)"
          >
            <Search size={12} strokeWidth={1.5} />
          </button>
          <button
            className={`vw-rec${recording ? ' vw-rec--active' : ''}`}
            onClick={toggleRecording}
          >
            <span className="vw-rec__dot" />
            {recording ? 'STOP' : 'REC'}
          </button>
        </div>
      </div>

      {/* Main panels */}
      <div className="vw-panels">
        {/* Tree panel */}
        {!treeCollapsed && (
          <div className="vw-tree">
            <Aria
              behavior={treegrid}
              data={initialStore}
              plugins={[core()]}
              onChange={handleChange}
              aria-label="File tree"
            >
              <Aria.Item render={(node, state) => {
                const data = node.data as FileNodeData
                const isActive = data.path === selectedFile
                const indent = (state.level ?? 1) * 12
                return (
                  <div className={`vw-tree__item${isActive ? ' vw-tree__item--active' : ''}${state.focused ? ' vw-tree__item--focused' : ''}`}>
                    <div className="vw-tree__indent" style={{ width: indent }} />
                    {data.type === 'directory' ? (
                      <span className="vw-tree__chevron">
                        {state.expanded
                          ? <ChevronDown size={11} strokeWidth={2} />
                          : <ChevronRight size={11} strokeWidth={2} />}
                      </span>
                    ) : (
                      <span className="vw-tree__chevron" />
                    )}
                    <FileIcon name={data.name} type={data.type} expanded={state.expanded} />
                    <span className={`vw-tree__name${data.type === 'directory' ? ' vw-tree__name--dir' : ''}`}>
                      {data.name}
                    </span>
                  </div>
                )
              }} />
            </Aria>
          </div>
        )}

        {/* Content panel */}
        <div className="vw-content">
          {selectedFile ? (
            <div className="vw-content__body" ref={contentBodyRef}>
              <div className="vw-content__code">
                {isMarkdown
                  ? <MarkdownViewer content={fileContent} />
                  : <CodeBlock code={fileContent} filename={filename} />
                }
              </div>
              {!isMarkdown && isSourceFile(filename) && (
                <div className="vw-content__graph">
                  <ExportDiagram filePath={selectedFile} />
                </div>
              )}
            </div>
          ) : (
            <div className="vw-empty">
              <FileText size={24} strokeWidth={1} className="vw-empty__icon" />
              <span>Select a file to view</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Open overlay */}
      {quickOpenVisible && initialStore && (
        <QuickOpen
          fileStore={initialStore}
          root={DEFAULT_ROOT}
          onSelect={handleQuickOpenSelect}
          onClose={() => setQuickOpenVisible(false)}
        />
      )}
    </div>
    </Aria>
  )
}
