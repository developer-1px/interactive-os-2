// ② 2026-04-04-writer-chat-prd.md
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWriterData, useWriterDirty, writerState } from './writerStore'
import { mdToStore } from './writerTransform'
import { expandCommands } from '@os/axis/expand'
import { useWriterChatSync, sendWriterMessage, getSessionForFile } from './writerChatBridge'
import WriterPreview from './WriterPreview'
import WriterFileBrowser from './WriterFileBrowser'
import { ChatPane } from '../chat/ChatPane'
import { TreeGrid } from '@os/ui/TreeGrid'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { dnd } from '@os/plugins/dnd'
import { rename } from '@os/plugins/rename'
import { AriaRoute } from '@os/primitives/AriaRoute'
import type { RouteKeyMap } from '@os/primitives/AriaRoute'
import { ExpandIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'
import type { Plugin } from '@os/engine/types'
import type { NodeState } from '@os/pattern/types'

const headingStyle = ['display', 'page', 'section', 'label', 'label', 'label'] as const

const writerRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const data = node.data as Record<string, unknown> | undefined
  const content = (data?.content as string) ?? ''
  const type = data?.type as string
  const level = data?.level as number | undefined
  const hasChildren = state.expanded !== undefined

  if (type === 'document') {
    return (
      <div {...props} className={ax({ surface: 'ghost', padding: 'xs', layout: 'row', gap: 'xs' })}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{data?.path as string || 'Untitled'}</span>
      </div>
    )
  }

  if (type === 'heading' && level) {
    return (
      <div {...props} className={ax({ surface: 'ghost', padding: 'xs', layout: 'row', gap: 'xs' })}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: headingStyle[level - 1], text: state.focused ? 'primary' : 'secondary' })}>{content}</span>
      </div>
    )
  }

  // paragraph
  return (
    <div {...props} className={ax({ surface: 'ghost', padding: 'xs', layout: 'row', gap: 'xs' })}>
      <span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'muted' })}>{content}</span>
    </div>
  )
}

const writerPlugins: Plugin[] = [
  crud(),
  dnd(),
  history(),
  rename(),
]

export default function PageWriter() {
  const [data, setData] = useWriterData()
  const dirty = useWriterDirty()
  const [view, setView] = useState<'tree' | 'preview'>('tree')
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

  const writerKeyMap: RouteKeyMap = useMemo(() => ({
    'Mod+S': () => {
      handleSave()
      return { type: 'writer:save' }
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
            {urlFilePath && <span className={ax({ text: 'muted' })}>{urlFilePath}</span>}
            <div className={ax({ layout: 'fill' })} />
            <button
              onClick={() => setView(v => v === 'tree' ? 'preview' : 'tree')}
              className={ax({ controlSize: 'sm', padding: 'sm', content: 'text', surface: 'ghost' })}
            >
              {view === 'tree' ? 'Preview' : 'Edit'}
            </button>
          </div>

          <div className={ax({ layout: 'scroll' })}>
            {view === 'tree' ? (
              <TreeGrid
                data={data}
                plugins={writerPlugins}
                onChange={setData}
                enableEditing
                renderItem={writerRenderItem}
                aria-label="Document structure"
              />
            ) : (
              <WriterPreview data={data} />
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
