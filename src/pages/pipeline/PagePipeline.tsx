// @useState-hatch -- cellFocus: cell-level followFocus preview; sizes: SplitPane local; mdContent: lazy-loaded markdown file content
import { useCallback, useState, useMemo, useEffect } from 'react'
import { useStore } from '@os/store/useStore'
import { PipelineGrid } from '@os/ui/PipelineGrid'
import type { CellFocusInfo } from '@os/ui/PipelineGrid'
import { PanelHeader } from '@os/ui/PanelHeader'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { Panel } from '@os/ui/panels'
import { FilePreview } from '@os/ui/FilePreview'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { showcaseMdConfig } from '../showcase/mdConfig'
import { TabList } from '@os/ui/TabList'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { urlSync, getInitialTabFromUrl } from '@os/plugins/urlSync'
import { ALL_PROJECTS, buildPipelineStore, getCellPreview, loadMarkdown } from './pipelineStore'
import type { PreviewContent } from './pipelineStore'

const SIZES: PaneSize[] = [0.55, 0.45]

// ── Tab store for projects ──

function buildProjectTabs() {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  for (const id of ALL_PROJECTS) {
    entities[id] = { id, data: { label: id } }
  }
  return createStore({ entities, relationships: { [ROOT_ID]: ALL_PROJECTS } })
}

const projectTabStore = buildProjectTabs()
const initialTab = getInitialTabFromUrl() ?? ALL_PROJECTS[0] ?? 'cms'

// ── Preview renderers ──

function ImagePreview({ src, caption }: { src: string; caption?: string }) {
  return (
    <div className={ax({ layout: 'column', gap: 'sm', padding: 'md' })}>
      <FilePreview content="" filename="image.png" src={src} />
      {caption && (
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{caption}</span>
      )}
    </div>
  )
}

function SummaryPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className={ax({ layout: 'column', gap: 'sm', padding: 'md' })}>
      <span className={ax({ textStyle: 'label', weight: 'semi', text: 'bright' })}>{title}</span>
      <MarkdownViewer content={body} prose={false} codeVariant="compact" config={showcaseMdConfig} />
    </div>
  )
}

function FileListPreview({ title, files }: { title: string; files: { label: string; path: string }[] }) {
  return (
    <div className={ax({ layout: 'column', gap: 'sm', padding: 'md' })}>
      <span className={ax({ textStyle: 'label', weight: 'semi', text: 'bright' })}>{title}</span>
      {files.map((f) => (
        <div key={f.path} className={ax({ layout: 'column', gap: 'xs' })}>
          <span className={ax({ textStyle: 'body', tone: 'accent' })}>{f.label}</span>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>{f.path}</span>
        </div>
      ))}
    </div>
  )
}

// @useState-hatch -- mdContent: async lazy-loaded markdown file content
function MarkdownDocPreview({ path, fallback }: { path: string; fallback: string }) {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    loadMarkdown(path).then(md => { if (md) setContent(md) })
  }, [path])

  const filename = path.split('/').pop() ?? path

  return (
    <div className={ax({ layout: 'column', gap: 'sm', padding: 'md' })}>
      <span className={ax({ textStyle: 'caption', tone: 'accent' })}>{path}</span>
      <FilePreview content={content ?? fallback} filename={filename} />
    </div>
  )
}

function EmptyPreview({ message }: { message: string }) {
  return (
    <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'body' })}>
      {message}
    </div>
  )
}

function PreviewPanel({ content }: { content: PreviewContent | null }) {
  if (!content) return <EmptyPreview message="Select a cell to preview" />

  switch (content.type) {
    case 'image': return <ImagePreview src={content.src} caption={content.caption} />
    case 'summary': return <SummaryPreview title={content.title} body={content.body} />
    case 'fileList': return <FileListPreview title={content.title} files={content.files} />
    case 'markdown': return <MarkdownDocPreview path={content.path} fallback={content.fallback} />
    case 'empty': return <EmptyPreview message={content.message} />
  }
}

// @useState-hatch -- activeProject: derived from tab selection via urlSync hash
export default function PagePipeline() {
  const [activeProject, setActiveProject] = useState(initialTab)

  const projectData = useMemo(() => buildPipelineStore(activeProject), [activeProject])
  const [data, setData] = useStore(projectData.store)
  const columns = projectData.columns

  // Sync store when project changes (useStore only reads initial value)
  useEffect(() => { setData(projectData.store) }, [projectData.store, setData])

  const [cellFocus, setCellFocus] = useState<CellFocusInfo | null>(null)
  const [sizes, setSizes] = useState<PaneSize[]>(SIZES)

  const handleTabActivate = useCallback((nodeId: string) => {
    setActiveProject(nodeId)
  }, [])

  const handleActivate = useCallback((_nodeId: string) => {}, [])

  const handleCellFocus = useCallback((info: CellFocusInfo | null) => {
    setCellFocus(info)
  }, [])

  const preview = cellFocus ? getCellPreview(data, cellFocus.rowId, cellFocus.colKey) : null
  const rowLabel = cellFocus ? (data.entities[cellFocus.rowId]?.data as Record<string, unknown>)?.label as string ?? '' : ''
  const colLabel = cellFocus ? columns.find(c => c.key === cellFocus.colKey)?.header ?? cellFocus.colKey : ''
  const panelTitle = cellFocus ? `${rowLabel} / ${colLabel}` : 'Preview'

  return (
    <div className={ax({ layout: 'column', flex: '1' })}>
      <PanelHeader>
        <TabList
          data={projectTabStore}
          plugins={[urlSync()]}
          onActivate={handleTabActivate}
          initialFocus={activeProject}
          aria-label="Projects"
        />
        <span className={ax({ flex: '1' })} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          {projectData.projectName}
        </span>
      </PanelHeader>

      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.3}>
        <ScrollArea className={ax({ flex: '1' })}>
          <PipelineGrid
            data={data}
            columns={columns}
            onChange={setData}
            onActivate={handleActivate}
            onCellFocus={handleCellFocus}
            header
            aria-label="Project pipeline"
          />
        </ScrollArea>

        <Panel header={panelTitle} surface="display">
          <ScrollArea className={ax({ flex: '1' })}>
            <PreviewPanel content={preview} />
          </ScrollArea>
        </Panel>
      </SplitPane>
    </div>
  )
}
