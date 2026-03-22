import styles from './PageAgentViewer.module.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Eye, EyeOff, Circle } from 'lucide-react'
import { Aria } from '../interactive-os/components/aria'
import { listbox } from '../interactive-os/behaviors/listbox'
import { core, FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Entity } from '../interactive-os/core/types'
import { CodeBlock } from './viewer/CodeBlock'
import { MarkdownViewer } from './viewer/MarkdownViewer'
import { MdxViewer } from './viewer/MdxViewer'
import { FileIcon } from './viewer/FileIcon'
import { Breadcrumb } from './viewer/Breadcrumb'
import { DEFAULT_ROOT } from './viewer/types'

// --- Types ---

interface AgentOp {
  ts: string
  tool: string
  file: string
}

interface ModifiedFile {
  file: string
  count: number
}

// --- Behaviors ---

const modifiedListbox = { ...listbox, followFocus: true }

// --- Helpers ---

function parseOps(lines: string[]): { modified: ModifiedFile[]; reads: AgentOp[] } {
  const modifiedMap = new Map<string, number>()
  const modifiedOrder: string[] = []
  const reads: AgentOp[] = []

  for (const line of lines) {
    if (!line.trim()) continue
    let op: AgentOp
    try {
      op = JSON.parse(line)
    } catch {
      continue
    }
    if (op.tool === 'Edit' || op.tool === 'Write') {
      const prev = modifiedMap.get(op.file) ?? 0
      modifiedMap.set(op.file, prev + 1)
      // Move to front (most recent first)
      const idx = modifiedOrder.indexOf(op.file)
      if (idx !== -1) modifiedOrder.splice(idx, 1)
      modifiedOrder.unshift(op.file)
    } else if (op.tool === 'Read') {
      reads.push(op)
    }
  }

  const modified = modifiedOrder.map((file) => ({ file, count: modifiedMap.get(file)! }))
  return { modified, reads: reads.slice(-200) }
}

function buildModifiedStore(files: ModifiedFile[], selectedFile: string | null): NormalizedData {
  const entities: Record<string, Entity> = {}
  const childIds: string[] = []

  for (const f of files) {
    entities[f.file] = { id: f.file, data: { file: f.file, count: f.count } }
    childIds.push(f.file)
  }

  if (selectedFile && entities[selectedFile]) {
    entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: selectedFile }
  }

  return createStore({ entities, relationships: { [ROOT_ID]: childIds } })
}

function buildReadStore(reads: AgentOp[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const childIds: string[] = []

  for (let i = 0; i < reads.length; i++) {
    const id = `read-${i}`
    entities[id] = { id, data: { ts: reads[i].ts, file: reads[i].file } }
    childIds.push(id)
  }

  return createStore({ entities, relationships: { [ROOT_ID]: childIds } })
}

async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/fs/file?path=${encodeURIComponent(path)}`)
  return res.text()
}

// --- Component ---

export default function PageAgentViewer() {
  const [modifiedFiles, setModifiedFiles] = useState<ModifiedFile[]>([])
  const [readStream, setReadStream] = useState<AgentOp[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [followMode, setFollowMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [fetchCounter, setFetchCounter] = useState(0)

  const streamBodyRef = useRef<HTMLDivElement>(null)
  const loadedFileRef = useRef<string | null>(null)
  const followModeRef = useRef(followMode)
  useEffect(() => { followModeRef.current = followMode }, [followMode])

  // --- Initial fetch ---
  useEffect(() => {
    fetch('/api/agent-ops/latest')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n').filter(Boolean)
        const { modified, reads } = parseOps(lines)
        setModifiedFiles(modified)
        setReadStream(reads)
        if (modified.length > 0) {
          setSelectedFile(modified[0].file)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // --- SSE ---
  useEffect(() => {
    const es = new EventSource('/api/agent-ops/stream')

    es.onmessage = (event) => {
      let op: AgentOp
      try {
        op = JSON.parse(event.data)
      } catch {
        return
      }

      if (op.tool === 'Edit' || op.tool === 'Write') {
        setModifiedFiles((prev) => {
          const idx = prev.findIndex((f) => f.file === op.file)
          if (idx !== -1) {
            const updated = { file: op.file, count: prev[idx].count + 1 }
            const next = [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)]
            return next
          }
          return [{ file: op.file, count: 1 }, ...prev]
        })
        if (followModeRef.current) {
          setSelectedFile(op.file)
          setFetchCounter(c => c + 1)
        }
      } else if (op.tool === 'Read') {
        setReadStream((prev) => {
          const next = [...prev, op]
          return next.length > 200 ? next.slice(-200) : next
        })
      }
    }

    es.onerror = () => {
      // On reconnect, re-fetch to fill any gap
      es.addEventListener('open', function refetch() {
        es.removeEventListener('open', refetch)
        fetch('/api/agent-ops/latest')
          .then((res) => res.text())
          .then((text) => {
            const lines = text.split('\n').filter(Boolean)
            const { modified, reads } = parseOps(lines)
            setModifiedFiles(modified)
            setReadStream(reads)
          })
      })
    }

    return () => es.close()
  }, [])

  // --- File content loading ---
  useEffect(() => {
    if (!selectedFile) return
    loadedFileRef.current = selectedFile
    fetchFile(selectedFile).then(setFileContent).catch(() => setFileContent(''))
  }, [selectedFile, fetchCounter])

  // --- Auto-scroll read stream ---
  useEffect(() => {
    const el = streamBodyRef.current
    if (el) el.scrollTo(0, el.scrollHeight)
  }, [readStream.length])

  // --- Derived stores ---
  const modifiedStore = useMemo(
    () => buildModifiedStore(modifiedFiles, selectedFile),
    [modifiedFiles, selectedFile],
  )

  const readStore = useMemo(
    () => buildReadStore(readStream),
    [readStream],
  )

  // --- Handlers ---
  const handleModifiedChange = useCallback((newStore: NormalizedData) => {
    const focusedId = (newStore.entities[FOCUS_ID]?.focusedId as string) ?? ''
    if (focusedId && newStore.entities[focusedId]) {
      setSelectedFile(focusedId)
    }
  }, [])

  const handleReadActivate = useCallback((nodeId: string) => {
    const idx = parseInt(nodeId.replace('read-', ''), 10)
    setReadStream((prev) => {
      if (idx >= 0 && idx < prev.length) {
        setSelectedFile(prev[idx].file)
      }
      return prev
    })
  }, [])

  // --- Derived values ---
  const filename = selectedFile?.split('/').pop() ?? ''
  const isMdx = filename.endsWith('.mdx')
  const isMarkdown = !isMdx && filename.endsWith('.md')
  const ext = filename.split('.').pop() ?? ''
  const lineCount = fileContent ? fileContent.split('\n').length : 0

  if (loading) {
    return (
      <div className={styles.avLoading}>
        <Circle size={14} strokeWidth={2} />
        <span>Connecting to agent...</span>
      </div>
    )
  }

  return (
    <div className={styles.av}>
      {/* Left panel — modified files */}
      <div className={styles.avModified}>
        <div className={styles.avModifiedHeader}>
          <span className={styles.avModifiedTitle}>Modified</span>
          <button
            className={`${styles.avFollowBtn}${followMode ? ` ${styles.avFollowBtnActive}` : ''}`}
            onClick={() => setFollowMode((f) => !f)}
            title={followMode ? 'Follow mode on' : 'Follow mode off'}
          >
            {followMode ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
        <div className={styles.avModifiedBody}>
          <Aria
            behavior={modifiedListbox}
            data={modifiedStore}
            plugins={[core()]}
            onChange={handleModifiedChange}
            aria-label="Modified files"
          >
            <Aria.Item render={(node) => {
              const data = node.data as { file: string; count: number }
              const name = data.file.split('/').pop() ?? ''
              const relPath = data.file.replace(DEFAULT_ROOT + '/', '')
              return (
                <div className={styles.avModifiedItem}>
                  <FileIcon name={name} type="file" />
                  <span>{relPath}</span>
                  {data.count > 1 && <span className={styles.avModifiedBadge}>&times;{data.count}</span>}
                </div>
              )
            }} />
          </Aria>
        </div>
      </div>

      {/* Center panel — file content */}
      <div className={styles.avContent}>
        <div className={styles.avContentHeader}>
          <div className={styles.avContentHeaderLeft}>
            {selectedFile && <Breadcrumb path={selectedFile} root={DEFAULT_ROOT} />}
          </div>
          <div className={styles.avContentHeaderRight}>
            {selectedFile && (
              <div className={styles.avContentMeta}>
                <FileIcon name={filename} type="file" />
                <span>{ext.toUpperCase()}</span>
                <span className={styles.avContentMetaSep} />
                <span>{lineCount} lines</span>
              </div>
            )}
          </div>
        </div>
        {selectedFile ? (
          <div className={styles.avContentBody}>
            {isMdx
              ? <MdxViewer filePath={selectedFile} />
              : isMarkdown
                ? <MarkdownViewer content={fileContent} />
                : <CodeBlock code={fileContent} filename={filename} />}
          </div>
        ) : (
          <div className={styles.avEmpty}>
            <Circle size={24} strokeWidth={1} className={styles.avEmptyIcon} />
            <span>Waiting for agent activity...</span>
          </div>
        )}
      </div>

      {/* Right panel — read stream */}
      <div className={styles.avStream}>
        <div className={styles.avStreamHeader}>
          <span className={styles.avStreamTitle}>Read Stream</span>
        </div>
        <div className={styles.avStreamBody} ref={streamBodyRef}>
          <Aria
            behavior={listbox}
            data={readStore}
            plugins={[core()]}
            onActivate={handleReadActivate}
            aria-label="Read stream"
          >
            <Aria.Item render={(node) => {
              const data = node.data as { ts: string; file: string }
              const time = new Date(data.ts).toLocaleTimeString('en-US', { hour12: false })
              const relPath = data.file.replace(DEFAULT_ROOT + '/', '')
              return (
                <div className={styles.avStreamItem}>
                  <span className={styles.avStreamTs}>{time}</span>
                  <span className={styles.avStreamPath}>{relPath}</span>
                </div>
              )
            }} />
          </Aria>
        </div>
      </div>
    </div>
  )
}
