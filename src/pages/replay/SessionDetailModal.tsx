// SessionDetail 위젯 + 모달 컴포넌트
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createDomainContext } from '@os/layout'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { showcaseMdConfig } from '../showcase/mdConfig'
import { FilePreview } from '@os/ui/FilePreview'
import { TabList } from '@os/ui/TabList'
import { PanelHeader } from '@os/ui/PanelHeader'
import { CloseIndicator } from '@os/ui/indicators'
import { useOverlay } from '@os/overlay/useOverlay'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import type { SessionCard } from './sessionCardExtractor'

// ── Helpers ──

function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath
}

function buildTabData(files: string[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const ids: string[] = []
  for (const f of files) {
    entities[f] = { id: f, label: basename(f) }
    ids.push(f)
  }
  return { entities, relationships: { [ROOT_ID]: ids } }
}

// ── Session Detail Context (Pull model) ──

interface SessionDetailContextValue {
  content: string
  files: string[]
}

const [SessionDetailProvider, useSessionDetail] = createDomainContext<SessionDetailContextValue>('SessionDetail')

// ── Widgets ──

function ChatViewerWidget() {
  const { content } = useSessionDetail()
  return (
    <div className={ax({ flex: '1', scroll: 'y' })}>
      <MarkdownViewer content={content} codeVariant="compact" config={showcaseMdConfig} />
    </div>
  )
}

function FilePanelWidget() {
  const { files } = useSessionDetail()
  const fileList = files
  // @useState-hatch — activeFilePath: modal-local file selection, not OS axis material
  const [activeFilePath, setActiveFilePath] = useState<string | null>(fileList?.[0] ?? null)
  // @useState-hatch — fileContent: modal-local file fetch state, not OS store material
  const [fileContent, setFileContent] = useState<string | null>(null)
  // @useState-hatch — fileError: modal-local file fetch error, not OS store material
  const [fileError, setFileError] = useState<string | null>(null)

  const tabData = useMemo(() => fileList ? buildTabData(fileList) : null, [fileList])
  const handleTabActivate = useCallback((nodeId: string) => { setActiveFilePath(nodeId) }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeFilePath) { setFileContent(null); setFileError(null); return }
    let cancelled = false
    setFileContent(null)
    setFileError(null)
    fetch(`/api/fs/file?path=${encodeURIComponent(activeFilePath)}`)
      .then(res => { if (!res.ok) throw new Error('File not found'); return res.text() })
      .then(text => { if (!cancelled) setFileContent(text) })
      .catch(() => { if (!cancelled) setFileError('File not found') })
    return () => { cancelled = true }
  }, [activeFilePath])

  if (!fileList || fileList.length === 0 || !tabData) {
    return <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption', layout: 'center', flex: '1' })}>No files modified</div>
  }

  return (
    <>
      <TabList data={tabData} onActivate={handleTabActivate} aria-label="Modified files" />
      <div className={ax({ flex: '1', scroll: 'y' })}>
        {fileError && <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption' })}>{fileError}</div>}
        {fileContent !== null && activeFilePath && <FilePreview content={fileContent} filename={basename(activeFilePath)} />}
        {fileContent === null && !fileError && <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'caption' })}>Loading...</div>}
      </div>
    </>
  )
}

// ── Registry & Layout ──

const sessionDetailRegistry = createWidgetRegistry({
  ChatViewer: ChatViewerWidget,
  FilePanel: FilePanelWidget,
})

const sessionDetailLayout = definePage({
  entities: {
    root: { data: { type: 'split', direction: 'horizontal', sizes: [0.35, 'flex'] }, children: ['chat', 'files'] },
    chat: { data: { type: 'widget', widget: 'ChatViewer' } },
    files: { data: { type: 'widget', widget: 'FilePanel' } },
  },
})

// ── Modal ──

export function SessionDetailModal({ card, onClose }: { card: SessionCard | null; onClose: () => void }) {
  const { isOpen, open, close, contentRef } = useOverlay({ type: 'modal' })

  // card → overlay sync
  useEffect(() => {
    if (card && !isOpen) open()
    if (!card && isOpen) close()
  }, [!!card]) // eslint-disable-line react-hooks/exhaustive-deps -- open/close stable, track card presence only

  // overlay close (ESC/backdrop) → parent sync
  useEffect(() => {
    if (!isOpen && card) onClose()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps -- onClose identity irrelevant

  const md = card
    ? card.allMessages.map(m => m.role === 'user' ? `> **User:** ${m.text}` : m.text).join('\n\n---\n\n')
    : ''

  const detailCtx = useMemo<SessionDetailContextValue | null>(() => {
    if (!card) return null
    return { content: md, files: card.touchedFiles }
  }, [card, md])

  return (
    <dialog
      ref={contentRef as React.RefObject<HTMLDialogElement>}
      className={`kanban-detail-dialog ${ax({ surface: 'overlay', width: 'full', shape: 'xl', layout: 'stack', scroll: 'hidden' })}`}
      aria-label="Session detail"
    >
      <PanelHeader axes={{ layout: 'spread' }}>
        {card && (
          <div className={ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'muted' })}>
            <span className={ax({ text: 'bright', weight: 'medium' })}>{card.label}</span>
            <span>{card.allMessages.length} messages</span>
            <span>{card.toolCount} tools</span>
            {card.lastSkill && <span>/{card.lastSkill}</span>}
          </div>
        )}
        <Button icon onClick={close}>
          <CloseIndicator />
        </Button>
      </PanelHeader>
      <div className={ax({ flex: '1', layout: 'fill' })}>
        {card && detailCtx && (
          <SessionDetailProvider value={detailCtx}>
            <FlatLayout data={sessionDetailLayout} registry={sessionDetailRegistry} aria-label="Session detail" />
          </SessionDetailProvider>
        )}
      </div>
    </dialog>
  )
}
