import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  Braces, Palette, Terminal, Image, Settings,
} from 'lucide-react'

// --- Types ---

interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
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
  const containerRef = useRef<HTMLDivElement>(null)
  const ext = filename.split('.').pop() ?? ''
  const lang = EXT_TO_LANG[ext] ?? 'text'

  useEffect(() => {
    let cancelled = false
    codeToHtml(code, {
      lang,
      theme: 'github-light',
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
  }, [code, lang])

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

const ICON_SIZE = 13
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

// --- Main viewer page ---

export default function PageViewer() {
  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const [treeCollapsed, setTreeCollapsed] = useState(false)
  const recorder = useMemo(() => createRecorder(), [])
  const selectedFileRef = useRef<string | null>(null)

  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      setInitialStore(treeToStore(tree))
      setLoading(false)
    })
  }, [])

  const handleChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities['__focus__']?.focusedId as string) ?? ''
    const entity = newStore.entities[focusedId]
    if (entity?.data && (entity.data as Record<string, unknown>).type === 'file') {
      const filePath = (entity.data as Record<string, unknown>).path as string
      if (filePath !== selectedFileRef.current) {
        selectedFileRef.current = filePath
        setSelectedFile(filePath)
        fetchFile(filePath).then(setFileContent)
      }
    }
  }, [])

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
      {/* Status bar */}
      <div className="vw-statusbar">
        <div className="vw-statusbar__left">
          <button
            className="vw-statusbar__btn"
            onClick={() => setTreeCollapsed(!treeCollapsed)}
            title={treeCollapsed ? 'Show explorer' : 'Hide explorer'}
          >
            <PanelLeft size={12} strokeWidth={1.5} />
          </button>
          <span className="vw-statusbar__title">Explorer</span>
        </div>
        <div className="vw-statusbar__right">
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
              <Aria.Node render={(node, state) => {
                const data = node.data as { name: string; type: string; path: string }
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
            <>
              <div className="vw-content__header">
                <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />
                <div className="vw-content__meta">
                  <FileIcon name={filename} type="file" />
                  <span>{ext.toUpperCase()}</span>
                  <span className="vw-content__meta-sep" />
                  <span>{lineCount} lines</span>
                </div>
              </div>
              <div className="vw-content__body">
                {isMarkdown
                  ? <MarkdownViewer content={fileContent} />
                  : <CodeBlock code={fileContent} filename={filename} />
                }
              </div>
            </>
          ) : (
            <div className="vw-empty">
              <FileText size={24} strokeWidth={1} className="vw-empty__icon" />
              <span>Select a file to view</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
