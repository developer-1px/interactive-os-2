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

// --- File icon ---

function fileIcon(name: string, type: string, expanded?: boolean) {
  if (type === 'directory') return expanded ? '📂' : '📁'
  const ext = name.split('.').pop()
  if (ext === 'ts' || ext === 'tsx') return '🟦'
  if (ext === 'md') return '📝'
  if (ext === 'json') return '📋'
  if (ext === 'css') return '🎨'
  return '📄'
}

// --- Main viewer page ---

export default function PageViewer() {
  const [initialStore, setInitialStore] = useState<NormalizedData | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const recorder = useMemo(() => createRecorder(), [])
  const selectedFileRef = useRef<string | null>(null)

  // Load file tree on mount
  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then((tree) => {
      setInitialStore(treeToStore(tree))
      setLoading(false)
    })
  }, [])

  // Watch for focus changes → load file (no setStore — Aria manages its own state)
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

  if (loading || !initialStore) return <div style={{ padding: 16, color: '#787774', fontFamily: 'var(--mono)', fontSize: 10 }}>Loading...</div>

  const filename = selectedFile?.split('/').pop() ?? ''
  const isMarkdown = filename.endsWith('.md')

  return (
    <div style={{ display: 'flex', height: '100%', flex: 1, flexDirection: 'column' }}>
      {/* Recorder toolbar */}
      <div style={{ padding: '2px 8px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, background: 'var(--bg-surface)' }}>
        <button
          onClick={toggleRecording}
          style={{
            background: recording ? '#DC2626' : 'var(--bg-deep)',
            color: recording ? '#fff' : 'var(--text-secondary)',
            border: recording ? 'none' : '1px solid var(--border-mid)',
            borderRadius: 2,
            padding: '1px 8px',
            cursor: 'pointer',
            fontSize: 9,
            fontFamily: 'var(--mono)',
            fontWeight: 500,
          }}
        >
          {recording ? 'STOP' : 'REC'}
        </button>
        {recording && <span style={{ color: '#DC2626', fontSize: 9, fontFamily: 'var(--mono)' }}>Recording...</span>}
      </div>
      <div style={{ display: 'flex', flex: 1, gap: 0, overflow: 'hidden' }}>
      {/* File tree panel */}
      <div style={{ width: 220, minWidth: 220, borderRight: '1px solid var(--border-dim)', overflow: 'auto', padding: '2px 0', background: 'var(--bg-surface)' }}>
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
            return (
              <div style={{
                padding: `1px 6px 1px ${(state.level ?? 1) * 10}px`,
                background: isActive ? 'var(--accent-mid)' : state.focused ? 'var(--bg-focus)' : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontFamily: 'var(--mono)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                <span style={{ fontSize: 10, width: 12, textAlign: 'center', flexShrink: 0 }}>
                  {fileIcon(data.name, data.type, state.expanded)}
                </span>
                <span style={{ opacity: data.type === 'directory' ? 0.7 : 1 }}>
                  {data.name}
                </span>
              </div>
            )
          }} />
        </Aria>
      </div>

      {/* Content panel */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 14px' }}>
        {selectedFile ? (
          <>
            <div style={{
              padding: '5px 0',
              borderBottom: '1px solid var(--border-dim)',
              fontSize: 9.5,
              color: 'var(--text-muted)',
              fontFamily: 'var(--mono)',
            }}>
              {selectedFile}
            </div>
            <div style={{ paddingTop: 8 }}>
              {isMarkdown
                ? <MarkdownViewer content={fileContent} />
                : <CodeBlock code={fileContent} filename={filename} />
              }
            </div>
          </>
        ) : (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 10 }}>
            Select a file to view.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
