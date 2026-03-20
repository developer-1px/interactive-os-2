import './PageViewer.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Fuse from 'fuse.js'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import mermaid from 'mermaid'
import { codeToHtml } from 'shiki'
import { Aria } from '../interactive-os/components/aria'
import { treegrid } from '../interactive-os/behaviors/treegrid'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
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

// --- Mermaid init ---

mermaid.initialize({ startOnLoad: false, theme: 'default' })

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

// --- Import graph fetching ---

interface ImportInfo {
  path: string
  layer: string
}

interface ImportsData {
  file: string
  layer: string
  imports: ImportInfo[]
  importedBy: ImportInfo[]
}

async function fetchImports(filePath: string, root: string): Promise<ImportsData | null> {
  try {
    const res = await fetch(`/api/fs/imports?path=${encodeURIComponent(filePath)}&root=${encodeURIComponent(root)}`)
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

function generateMermaid(data: ImportsData, root: string): string {
  const toLabel = (filePath: string) => {
    const rel = filePath.startsWith(root) ? filePath.slice(root.length + 1) : filePath
    // Use __sep__ for / and __dot__ for . to avoid collisions
    return rel.replace(/\//g, '__sep__').replace(/\./g, '__dot__')
  }

  const escapeDisplay = (text: string) =>
    text.replace(/"/g, '#quot;').replace(/]/g, '#93;')

  const toDisplay = (filePath: string) => {
    const rel = filePath.startsWith(root) ? filePath.slice(root.length + 1) : filePath
    const parts = rel.split('/')
    const display = parts.length > 2 ? parts.slice(-2).join('/') : rel
    return escapeDisplay(display)
  }

  // Collect all nodes grouped by layer
  const layers = new Map<string, { id: string; display: string; filePath: string; isCurrent: boolean }[]>()

  const addNode = (filePath: string, layer: string, isCurrent: boolean) => {
    if (!layers.has(layer)) layers.set(layer, [])
    const nodes = layers.get(layer)!
    const id = toLabel(filePath)
    if (!nodes.some(n => n.id === id)) {
      nodes.push({ id, display: toDisplay(filePath), filePath, isCurrent })
    }
  }

  // Current file
  addNode(data.file, data.layer, true)

  // Imports
  for (const imp of data.imports) {
    addNode(imp.path, imp.layer, false)
  }

  // ImportedBy
  for (const imp of data.importedBy) {
    addNode(imp.path, imp.layer, false)
  }

  const lines: string[] = ['graph LR']

  // Subgraphs by layer
  for (const [layer, nodes] of layers) {
    lines.push(`  subgraph ${layer}`)
    for (const node of nodes) {
      lines.push(`    ${node.id}["${node.display}"]`)
    }
    lines.push('  end')
  }

  // Edges: imports (current → dependency)
  const currentId = toLabel(data.file)
  for (const imp of data.imports) {
    lines.push(`  ${toLabel(imp.path)} --> ${currentId}`)
  }

  // Edges: importedBy (current → consumer)
  for (const imp of data.importedBy) {
    lines.push(`  ${currentId} --> ${toLabel(imp.path)}`)
  }

  // Style current node
  lines.push(`  style ${currentId} fill:#f9a825,stroke:#f57f17,stroke-width:2px`)

  // Click handlers
  for (const [, nodes] of layers) {
    for (const node of nodes) {
      if (!node.isCurrent) {
        lines.push(`  click ${node.id} href "${node.filePath}" _self`)
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

// --- Mermaid renderer ---

let mermaidCounter = 0

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    const id = `mermaid-${++mermaidCounter}`
    mermaid.render(id, code).then(({ svg }) => setSvg(svg)).catch(() => setSvg(''))
  }, [code])

  if (!svg) return <pre><code>{code}</code></pre>
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
}

// --- Dependency graph ---

function DependencyGraph({ filePath, root, onNavigate }: {
  filePath: string
  root: string
  onNavigate: (path: string) => void
}) {
  const [mermaidCode, setMermaidCode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetchImports(filePath, root).then(data => {
      if (cancelled || !data) { setMermaidCode(null); return }
      const totalNodes = data.imports.length + data.importedBy.length
      if (totalNodes === 0) { setMermaidCode(null); return }
      setMermaidCode(generateMermaid(data, root))
    })
    return () => { cancelled = true }
  }, [filePath, root])

  // Intercept mermaid click events to navigate
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (href && href.startsWith('/')) {
        e.preventDefault()
        e.stopPropagation()
        onNavigate(href)
      }
    }
    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [onNavigate, mermaidCode])

  if (!mermaidCode) return null

  return (
    <div ref={containerRef} className="vw-dep-graph">
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
  const [focusIndex, setFocusIndex] = useState(0)

  const files = useMemo(() => flattenFiles(fileStore, root), [fileStore, root])
  const fuse = useMemo(() => new Fuse(files, {
    keys: ['name', 'relativePath'],
    threshold: 0.4,
  }), [files])

  const results = useMemo(() => {
    if (!query.trim()) return files.slice(0, MAX_RESULTS)
    return fuse.search(query).slice(0, MAX_RESULTS).map(r => r.item)
  }, [query, fuse, files])

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll focused item into view
  useEffect(() => {
    if (results.length === 0) return
    const focused = results[focusIndex]
    if (!focused) return
    const el = document.getElementById(`qo-${focused.id}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusIndex, results])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'Enter': {
        e.preventDefault()
        const focused = results[focusIndex]
        if (focused) onSelect(focused.path)
        onClose()
        break
      }
      case 'ArrowDown':
        e.preventDefault()
        setFocusIndex(i => i < results.length - 1 ? i + 1 : 0)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusIndex(i => i > 0 ? i - 1 : results.length - 1)
        break
      case 'Home':
        e.preventDefault()
        setFocusIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusIndex(Math.max(0, results.length - 1))
        break
    }
  }

  const focusedId = results[focusIndex]?.id

  return (
    <div className="qo-backdrop" onClick={handleBackdropClick}>
      <div className="qo-dialog" role="dialog" aria-label="Quick Open">
        <div className="qo-input-row">
          <Search size={12} strokeWidth={1.5} className="qo-input-icon" />
          <input
            ref={inputRef}
            className="qo-input"
            type="text"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-haspopup="listbox"
            aria-controls="qo-listbox"
            aria-activedescendant={focusedId ? `qo-${focusedId}` : undefined}
            placeholder="파일 검색..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setFocusIndex(0) }}
            onKeyDown={handleInputKeyDown}
            aria-label="파일 검색"
          />
          <kbd className="qo-shortcut">ESC</kbd>
        </div>
        {results.length > 0 ? (
          <div className="qo-results" role="listbox" id="qo-listbox">
            {results.map((file, i) => (
              <div
                key={file.id}
                id={`qo-${file.id}`}
                role="option"
                aria-selected={i === focusIndex}
                className={`qo-item${i === focusIndex ? ' qo-item--focused' : ''}`}
                onClick={() => {
                  onSelect(file.path)
                  onClose()
                }}
              >
                <FileIcon name={file.name} type="file" />
                <span className="qo-item__name">{file.name}</span>
                <span className="qo-item__path">{file.relativePath}</span>
              </div>
            ))}
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

  // Cmd+P / Ctrl+P → Quick Open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setQuickOpenVisible(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
              {!isMarkdown && isSourceFile(filename) && (
                <DependencyGraph
                  filePath={selectedFile}
                  root={DEFAULT_ROOT}
                  onNavigate={selectFile}
                />
              )}
              {isMarkdown
                ? <MarkdownViewer content={fileContent} />
                : <CodeBlock code={fileContent} filename={filename} />
              }
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
  )
}
