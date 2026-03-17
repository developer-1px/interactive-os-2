import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import mermaid from 'mermaid'
import { codeToHtml } from 'shiki'
import { Aria } from '../interactive-os/components/aria'
import { treegrid } from '../interactive-os/behaviors/treegrid'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Entity } from '../interactive-os/core/types'
import { createRecorder } from '../interactive-os/devtools/recorder'

// --- Types ---

interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

// --- Mermaid init ---

mermaid.initialize({ startOnLoad: false, theme: 'dark' })

// --- Data fetching ---

const DEFAULT_ROOT = '/Users/user/Desktop/aria/src'

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

const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  json: 'json', css: 'css', html: 'html', yaml: 'yaml', yml: 'yaml',
  sh: 'bash', bash: 'bash', py: 'python', md: 'markdown',
}

function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const [html, setHtml] = useState('')
  const ext = filename.split('.').pop() ?? ''
  const lang = EXT_TO_LANG[ext] ?? 'text'

  useEffect(() => {
    let cancelled = false
    codeToHtml(code, { lang, theme: 'github-dark' }).then((result) => {
      if (!cancelled) setHtml(result)
    })
    return () => { cancelled = true }
  }, [code, lang])

  if (!html) return <pre style={{ padding: 16, overflow: 'auto' }}><code>{code}</code></pre>
  return <div dangerouslySetInnerHTML={{ __html: html }} style={{ overflow: 'auto', fontSize: 13 }} />
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
        remarkPlugins={[remarkGfm]}
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

export default function ViewerPage() {
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

  if (loading || !initialStore) return <div style={{ padding: 32 }}>Loading file tree...</div>

  const filename = selectedFile?.split('/').pop() ?? ''
  const isMarkdown = filename.endsWith('.md')

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, flexDirection: 'column' }}>
      {/* Recorder toolbar */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={toggleRecording}
          style={{
            background: recording ? '#d32f2f' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          {recording ? '⏹ STOP → Copy JSON' : '⏺ REC'}
        </button>
        {recording && <span style={{ color: '#f44336', fontSize: 12 }}>Recording...</span>}
      </div>
      <div style={{ display: 'flex', flex: 1, gap: 0, overflow: 'hidden' }}>
      {/* File tree panel */}
      <div style={{ width: 280, minWidth: 280, borderRight: '1px solid #333', overflow: 'auto', padding: '8px 0' }}>
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
                paddingLeft: (state.level ?? 1) * 14,
                padding: '3px 8px 3px ' + ((state.level ?? 1) * 14) + 'px',
                background: isActive ? '#264f78' : state.focused ? '#2a2d2e' : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>
                  {fileIcon(data.name, data.type, state.expanded)}
                </span>
                <span style={{ opacity: data.type === 'directory' ? 0.8 : 1 }}>
                  {data.name}
                </span>
              </div>
            )
          }} />
        </Aria>
      </div>

      {/* Content panel */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
        {selectedFile ? (
          <>
            <div style={{
              padding: '12px 0',
              borderBottom: '1px solid #333',
              fontSize: 12,
              color: '#888',
              fontFamily: 'monospace',
            }}>
              {selectedFile}
            </div>
            <div style={{ paddingTop: 16 }}>
              {isMarkdown
                ? <MarkdownViewer content={fileContent} />
                : <CodeBlock code={fileContent} filename={filename} />
              }
            </div>
          </>
        ) : (
          <div style={{ padding: 32, color: '#666' }}>
            Select a file from the tree to view its contents.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
