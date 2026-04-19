// ② 2026-04-05-writer-tree-crud-prd.md
// @useState-hatch — viewMode/sizes: view-only state, no axis equivalent
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWriterData, useWriterDirty, writerState } from './writerStore'
import { mdToStore, storeToMd } from './writerTransform'
import { expandCommands } from '@os/axis/expand'
import { useWriterChatSync, sendWriterMessage, getSessionForFile } from './writerChatBridge'
import { requestAnalysis, type AnalysisResult } from './writerAnalyze'
import { writerCommands } from './writerCommands'
import { writerPlugins, writerItemOptions } from './writerKeys'
import { MarkdownPreview } from '@os/ui/MarkdownPreview'
import { showcaseMdConfig } from '../showcase/mdConfig'
import WriterFileBrowser from './WriterFileBrowser'
import { PyramidView, buildPyramids } from './PyramidView'
import { SlideView, buildSlides } from './SlideView'
import { ChatPane } from '../chat/ChatPane'
import { WriterTreeGrid } from '@os/ui/WriterTreeGrid'
import { SplitPane } from '@os/ui/SplitPane'
import { RouteModal } from '@os/ui/RouteModal'
import type { PaneSize } from '@os/ui/SplitPane'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import type { RouteKeyMap } from '@os/primitives/defineRouteKey'
import { Panel } from '@os/ui/panels'
import { Toolbar } from '@os/ui/Toolbar'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import './PageWriter.css'

/** Prose preview — reuses the shared MarkdownPreview with storeToMd() */
function ProseView({ data: storeData }: { data: NormalizedData }) {
  const md = useMemo(() => storeToMd(storeData), [storeData])
  return <MarkdownPreview content={md} config={showcaseMdConfig} />
}

export default function PageWriter() {
  const [data, setData] = useWriterData()
  const dirty = useWriterDirty()
  // @useState-hatch view mode: tree/prose/pyramid (view-only state, no axis equivalent)
  type ViewMode = 'tree' | 'prose' | 'pyramid' | 'slides'
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  // @useState-hatch — slideIndex: view-only navigation state for slides mode
  const [slideIndex, setSlideIndex] = useState(0)
  const [sizes, setSizes] = useState<PaneSize[]>([0.15, 'flex', 0.30])

  const location = useLocation()
  const navigate = useNavigate()

  // Extract file path from URL: /writer/path/to/file.md → path/to/file.md
  const urlFilePath = location.pathname.replace(/^\/writer\/?/, '') || undefined

  // File-specific persistent chat session (derived — no state needed)
  const currentFile = writerState.getFilePath()
  const chatSessionId = useMemo(() => getSessionForFile(currentFile), [currentFile])

  // Sync AI responses → writerState (analysis results applied via command reducer)
  const handleAnalysisResult = useCallback((result: AnalysisResult) => {
    const current = writerState.getData()
    const next = writerCommands.setAnalysis.handler(current, { analysis: result })
    if (next !== current) setData(next)
  }, [setData])
  useWriterChatSync(chatSessionId, handleAnalysisResult)

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
      // No path set — default to timestamped draft under docs/0-inbox/
      // (open a file from the browser to save at a chosen location)
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      filePath = `0-inbox/writer-draft-${ts}.md`
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

  const toolbarData = useMemo(() => createStore({
    entities: {
      new: { id: 'new', data: { label: 'New', icon: 'add' } },
      save: { id: 'save', data: { label: dirty ? 'Save *' : 'Save' } },
      analyze: { id: 'analyze', data: { label: 'Analyze', icon: 'search' } },
    },
    relationships: { [ROOT_ID]: ['new', 'save', 'analyze'] },
  }), [dirty])

  const handleToolbarActivate = useCallback((nodeId: string) => {
    if (nodeId === 'new') handleNew()
    else if (nodeId === 'save') handleSave()
    else if (nodeId === 'analyze') handleAnalyze()
  }, [handleNew, handleSave, handleAnalyze])

  const slideCount = useMemo(() => buildSlides(data).length, [data])
  const pyramidCount = useMemo(() => buildPyramids(data).length, [data])

  const writerKeyMap: RouteKeyMap = useMemo(() => ({
    'Mod+S': defineRouteKey('writer:save', () => handleSave(), 'Writer'),
    'Mod+\\': defineRouteKey('writer:toggle-view', () => { setViewMode(m => m === 'tree' ? 'prose' : m === 'prose' ? 'pyramid' : m === 'pyramid' ? 'slides' : 'tree'); setSlideIndex(0) }, 'Writer'),
    ...(viewMode === 'slides' || viewMode === 'pyramid' ? {
      'Escape': defineRouteKey('writer:fullscreen-exit', () => setViewMode('tree'), 'Writer'),
    } : {}),
    ...(viewMode === 'slides' ? {
      'ArrowRight': defineRouteKey('writer:slide-next', () => setSlideIndex(i => Math.min(i + 1, slideCount - 1)), 'Writer'),
      'ArrowDown': defineRouteKey('writer:slide-next-alt', () => setSlideIndex(i => Math.min(i + 1, slideCount - 1)), 'Writer'),
      'ArrowLeft': defineRouteKey('writer:slide-prev', () => setSlideIndex(i => Math.max(i - 1, 0)), 'Writer'),
      'ArrowUp': defineRouteKey('writer:slide-prev-alt', () => setSlideIndex(i => Math.max(i - 1, 0)), 'Writer'),
    } : {}),
    ...(viewMode === 'pyramid' ? {
      'ArrowRight': defineRouteKey('writer:pyramid-next', () => setSlideIndex(i => Math.min(i + 1, pyramidCount - 1)), 'Writer'),
      'ArrowDown': defineRouteKey('writer:pyramid-next-alt', () => setSlideIndex(i => Math.min(i + 1, pyramidCount - 1)), 'Writer'),
      'ArrowLeft': defineRouteKey('writer:pyramid-prev', () => setSlideIndex(i => Math.max(i - 1, 0)), 'Writer'),
      'ArrowUp': defineRouteKey('writer:pyramid-prev-alt', () => setSlideIndex(i => Math.max(i - 1, 0)), 'Writer'),
    } : {}),
  }), [handleSave, viewMode, slideCount, pyramidCount])

  return (
    <AriaRoute keyMap={writerKeyMap} label="Writer">
      <RouteModal active={viewMode === 'slides'} label="Slide view">
        <SlideView data={data} slideIndex={slideIndex} slideCount={slideCount} />
      </RouteModal>
      <RouteModal active={viewMode === 'pyramid'} label="Pyramid view">
        <PyramidView data={data} slideIndex={slideIndex} />
      </RouteModal>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.1}>
        <Panel header="Files" surface="sunken">
          <WriterFileBrowser onFileSelect={handleFileSelect} />
        </Panel>

        <Panel scroll={false}>
          <div className={ax({ layout: 'bar' })}>
            <Toolbar data={toolbarData} onActivate={handleToolbarActivate} aria-label="Writer toolbar" />
            {urlFilePath && <span className={ax({ textStyle: 'caption' })}>{urlFilePath}</span>}
            <span className={ax({ textStyle: 'caption' })}>
              {{ tree: 'Tree', prose: 'Prose', pyramid: 'Pyramid', slides: 'Slides' }[viewMode]}
            </span>
          </div>

          <ScrollArea className={ax({ })}>
            {viewMode === 'prose' ? (
              <ProseView data={data} />
            ) : (
              <WriterTreeGrid
                data={data}
                plugins={writerPlugins}
                onChange={setData}
                editKeyDown={writerItemOptions.editKeyDown}
                aria-label="Document structure"
              />
            )}
          </ScrollArea>
        </Panel>

        <Panel header="Chat" surface="sunken" scroll={false}>
          <ChatPane sessionId={chatSessionId} onSend={sendWriterMessage} />
        </Panel>
      </SplitPane>
    </AriaRoute>
  )
}
