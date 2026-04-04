// ② 2026-04-04-writer-chat-prd.md
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWriterData, useWriterDirty, writerState } from './writerStore'
import { mdToStore, storeToMd } from './writerTransform'
import { expandCommands } from '@os/axis/expand'
import { useWriterChatSync, sendWriterMessage, getSessionForFile } from './writerChatBridge'
import { requestAnalysis } from './writerAnalyze'
import type { SentenceRole } from './writerSchema'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import WriterFileBrowser from './WriterFileBrowser'
import { ChatPane } from '../chat/ChatPane'
import { TreeGrid } from '@os/ui/TreeGrid'
import { Aria } from '@os/primitives/aria'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { dnd } from '@os/plugins/dnd'
import { rename, renameCommands } from '@os/plugins/rename'
import { clipboard } from '@os/plugins/clipboard'
import { crudCommands } from '@os/plugins/crud'
import { getParent, getChildren } from '@os/store/createStore'
import { definePlugin } from '@os/plugins/definePlugin'
import { AriaRoute } from '@os/primitives/AriaRoute'
import type { RouteKeyMap } from '@os/primitives/AriaRoute'
import { ExpandIndicator } from '@os/ui/indicators'
import type { NormalizedData } from '@os/store/types'
import { ax } from '@styles/ax'
import { createBatchCommand, type Plugin } from '@os/engine/types'
import type { NodeState } from '@os/pattern/types'
import styles from './PageWriter.module.css'

const headingStyle = ['display', 'page', 'section', 'label', 'label', 'label'] as const


const roleLabel: Record<SentenceRole, string> = {
  fact: '사실',
  interpretation: '해석',
  evidence: '근거',
  opinion: '의견',
}

const roleText: Record<SentenceRole, 'accent' | 'warning' | 'success' | 'danger'> = {
  fact: 'accent',
  interpretation: 'warning',
  evidence: 'success',
  opinion: 'danger',
}

function RoleBadge({ role }: { role: SentenceRole }) {
  return (
    <span className={`${ax({ textStyle: 'caption', text: roleText[role] })} ${styles.roleBadge}`}>
      {roleLabel[role]}
    </span>
  )
}

/** Prose preview — reuses the shared MarkdownViewer with storeToMd() */
function ProseView({ data: storeData }: { data: NormalizedData }) {
  const md = useMemo(() => storeToMd(storeData), [storeData])
  return <MarkdownViewer content={md} />
}

const writerRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const data = node.data as Record<string, unknown> | undefined
  const content = (data?.content as string) ?? ''
  const type = data?.type as string
  const level = data?.level as number | undefined
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1
  const depthStyle = { paddingLeft: `calc(${depth} * var(--space-md) + var(--space-xs))` }
  const surface = state.selected ? 'action' as const : 'ghost' as const

  if (type === 'document') {
    return (
      <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{data?.path as string || 'Untitled'}</span>
      </div>
    )
  }

  if (type === 'heading' && level) {
    const marginCls = level === 1 ? styles.headingL1 : styles.heading
    return (
      <div {...props} className={`${ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} ${marginCls}`} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <Aria.Editable field="content" selection="end"><span className={ax({ textStyle: headingStyle[level - 1], text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      </div>
    )
  }

  if (type === 'paragraph') {
    return (
      <div {...props} className={`${ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} ${styles.paragraph}`} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>¶{state.index + 1}</span>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{(data?.ordered as boolean) ? 'ol' : 'ul'}</span>
      </div>
    )
  }

  if (type === 'listItem') {
    return (
      <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
        <ExpandIndicator hasChildren={false} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{state.index + 1}</span>
        <Aria.Editable field="content" selection="end"><span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      </div>
    )
  }

  if (type === 'hr') {
    return <div {...props} className={`${ax({ surface, padding: 'xs' })} ${styles.hr}`} style={depthStyle} />
  }

  // sentence
  const role = data?.role as SentenceRole | undefined
  return (
    <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
      <ExpandIndicator hasChildren={false} />
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{state.index + 1}</span>
      <Aria.Editable field="content" selection="end"><span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      {role && <RoleBadge role={role} />}
    </div>
  )
}

let _insertCounter = 0

function writerKeys(): Plugin {
  type Ctx = {
    focused: string
    getEntity: (id: string) => { data?: Record<string, unknown> } | undefined
    getStore: () => { entities: Record<string, { data?: Record<string, unknown> } | undefined>; relationships: Record<string, string[]> }
  }
  return definePlugin({
    name: 'writerKeys',
    keyMap: {
      'Enter': (ctx: Ctx) => renameCommands.startRename(ctx.focused),
      'Mod+Enter': (ctx: Ctx) => {
        const store = ctx.getStore() as import('@os/store/types').NormalizedData
        const entity = ctx.getEntity(ctx.focused)
        const d = entity?.data as Record<string, unknown> | undefined
        if (!d) return undefined
        const type = d.type as string
        const parentId = getParent(store, ctx.focused)
        if (!parentId) return undefined
        const siblings = getChildren(store, parentId)
        const idx = siblings.indexOf(ctx.focused)
        const newId = `wi${++_insertCounter}`

        let newData: Record<string, unknown>
        if (type === 'heading') {
          newData = { type: 'heading', level: d.level, content: '' }
        } else if (type === 'sentence') {
          newData = { type: 'sentence', content: '' }
        } else if (type === 'listItem') {
          newData = { type: 'listItem', content: '' }
        } else {
          return undefined
        }

        return createBatchCommand([
          crudCommands.create({ id: newId, data: newData }, parentId, idx + 1),
          renameCommands.startRename(newId),
        ])
      },
    },
  })
}

// ② 2026-04-04-clipboard-serialize-prd.md
const writerPlugins: Plugin[] = [
  crud(),
  clipboard({
    serialize: (subtree) => storeToMd(subtree),
    deserialize: (text) => mdToStore(text),
  }),
  dnd(),
  history(),
  rename(),
  writerKeys(),
]

export default function PageWriter() {
  const [data, setData] = useWriterData()
  const dirty = useWriterDirty()
  const [prose, setProse] = useState(false)
  const [sizes, setSizes] = useState<PaneSize[]>([0.15, 'flex', 0.30])

  const location = useLocation()
  const navigate = useNavigate()

  // Extract file path from URL: /writer/path/to/file.md → path/to/file.md
  const urlFilePath = location.pathname.replace(/^\/writer\/?/, '') || undefined

  // File-specific persistent chat session
  const currentFile = writerState.getFilePath()
  const [chatSessionId, setChatSessionId] = useState(() => getSessionForFile(currentFile))

  // Update chat session when file changes
  useEffect(() => {
    setChatSessionId(getSessionForFile(currentFile))
  }, [currentFile])

  // Sync AI responses → writerState
  useWriterChatSync(chatSessionId)

  const loadDocument = useCallback((store: ReturnType<typeof mdToStore>, filePath?: string) => {
    writerState.setFilePath(filePath)
    setData(expandCommands.expandAll.reduce(store))
    writerState.markClean()
  }, [setData])

  // Load file from URL on mount
  useEffect(() => {
    if (urlFilePath && urlFilePath !== writerState.getFilePath()) {
      fetch(`/api/writer/read?file=${encodeURIComponent(urlFilePath)}`)
        .then(res => { if (!res.ok) throw new Error(); return res.text() })
        .then(md => loadDocument(mdToStore(md, urlFilePath), urlFilePath))
        .catch(() => console.error('Failed to load file from URL:', urlFilePath))
    }
  }, [urlFilePath]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(`/api/writer/read?file=${encodeURIComponent(filePath)}`)
      if (!res.ok) throw new Error(await res.text())
      const md = await res.text()
      loadDocument(mdToStore(md, filePath), filePath)
      navigate(`/writer/${filePath}`, { replace: true })
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [loadDocument, navigate])

  const handleNew = useCallback(() => {
    loadDocument(mdToStore(''))
  }, [loadDocument])

  const handleSave = useCallback(async () => {
    let filePath = writerState.getFilePath()
    if (!filePath) {
      const name = prompt('Save as (relative to docs/):')
      if (!name) return
      filePath = name.endsWith('.md') ? name : `${name}.md`
      writerState.setFilePath(filePath)
    }
    const md = writerState.getMd()
    try {
      const res = await fetch('/api/writer/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filePath, content: md }),
      })
      if (!res.ok) throw new Error(await res.text())
      writerState.markClean()
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }, [])

  // Auto-save on edit (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    if (!dirty) return
    const filePath = writerState.getFilePath()
    if (!filePath) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const md = writerState.getMd()
      try {
        const res = await fetch('/api/writer/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: filePath, content: md }),
        })
        if (res.ok) writerState.markClean()
      } catch { /* silent */ }
    }, 500)
    return () => clearTimeout(saveTimerRef.current)
  }, [dirty, data])

  const handleAnalyze = useCallback(() => {
    requestAnalysis(chatSessionId)
  }, [chatSessionId])

  const writerKeyMap: RouteKeyMap = useMemo(() => ({
    'Mod+S': () => {
      handleSave()
      return { type: 'writer:save' }
    },
    'Mod+\\': () => {
      setProse(p => !p)
      return { type: 'writer:toggle-prose' }
    },
  }), [handleSave])

  return (
    <AriaRoute keyMap={writerKeyMap} label="Writer">
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.1} noScroll={[0, 1, 2]}>
        <div className={ax({ layout: 'fill', surface: 'sunken' })}>
          <div className={ax({ layout: 'spread', padding: 'sm' })}>
            <span className={ax({ text: 'muted' })}>Files</span>
          </div>
          <div className={ax({ layout: 'scroll' })}>
            <WriterFileBrowser onFileSelect={handleFileSelect} />
          </div>
        </div>

        <div className={ax({ layout: 'fill' })}>
          <div className={ax({ layout: 'bar', gap: 'sm', padding: 'sm' })}>
            <button onClick={handleNew} className={ax({ controlSize: 'sm', padding: 'sm', content: 'text', surface: 'ghost' })}>New</button>
            <button onClick={handleSave} disabled={!dirty} className={ax({ controlSize: 'sm', padding: 'sm', content: 'text', surface: 'ghost' })}>
              Save{dirty ? ' *' : ''}
            </button>
            <button onClick={handleAnalyze} className={ax({ controlSize: 'sm', padding: 'sm', content: 'text', surface: 'ghost' })}>Analyze</button>
            {urlFilePath && <span className={ax({ text: 'muted' })}>{urlFilePath}</span>}
          </div>

          <div className={ax({ layout: 'scroll', width: 'prose', padding: 'md' })}>
            {prose ? (
              <ProseView data={data} />
            ) : (
              <TreeGrid
                data={data}
                plugins={writerPlugins}
                onChange={setData}
                renderItem={writerRenderItem}
                aria-label="Document structure"
              />
            )}
          </div>
        </div>

        <div className={ax({ layout: 'fill', surface: 'sunken' })}>
          <div className={ax({ layout: 'spread', padding: 'sm' })}>
            <span className={ax({ text: 'muted' })}>Chat</span>
          </div>
          <ChatPane sessionId={chatSessionId} onSend={sendWriterMessage} />
        </div>
      </SplitPane>
    </AriaRoute>
  )
}
