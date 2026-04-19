// @useState-hatch — userSelectedId: derived from activeSessions, needs OS select axis migration
// ② 2026-04-03-viewer-command-prd.md
import { useState, useEffect, useMemo, useRef, type RefObject } from 'react'
import { connectSession, disconnectSession, useTimeline, useSessionMeta } from '../finder/finderStore'
import { timelineToMessages } from '../finder/timelineTransform'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { TabList } from '@os/ui/TabList'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import { ax } from '@styles/ax'
import { useActiveSessions } from './useActiveSessions'
import { createFileState } from './fileState'
import { processToolEvents } from './toolToCommands'
import { chatRenderers } from './replayRenderers'
import type { UseViewerTabsReturn } from './useViewerTabs'
import type { FilePlayerHandle } from '@os/ui/workspaceTypes'

interface LiveSessionPanelProps {
  viewerTabs: UseViewerTabsReturn
  fileViewerRef: RefObject<FilePlayerHandle | null>
}

export function LiveSessionPanel({ viewerTabs, fileViewerRef }: LiveSessionPanelProps) {
  const activeSessions = useActiveSessions()
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null)

  const selectedId = activeSessions.length === 0
    ? null
    : (userSelectedId && activeSessions.find(s => s.id === userSelectedId))
      ? userSelectedId
      : activeSessions[0].id

  const tabData: NormalizedData = useMemo(() => {
    if (activeSessions.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(activeSessions.map(s => [s.id, { id: s.id, data: { label: s.label } }]))
    return createStore({ entities, relationships: { __root__: activeSessions.map(s => s.id) } })
  }, [activeSessions])

  return (
    <div className={ax({ layout: 'fill' })}>
      {activeSessions.length > 0 ? (
        <div className={ax({ flex: 'none' })}>
          <TabList
            data={tabData}
            initialFocus={selectedId ?? undefined}
            onActivate={(nodeId) => setUserSelectedId(nodeId)}
            aria-label="Live sessions"
          />
        </div>
      ) : (
        <div className={ax({ layout: 'bar', flex: 'none' })}>
          <span className={ax({ textStyle: 'caption' })}>활성 세션 없음</span>
        </div>
      )}

      {selectedId && (
        <LiveFeed
          key={selectedId}
          sessionId={selectedId}
          viewerTabs={viewerTabs}
          fileViewerRef={fileViewerRef}
        />
      )}
    </div>
  )
}

function LiveFeed({ sessionId, viewerTabs, fileViewerRef }: {
  sessionId: string
  viewerTabs: UseViewerTabsReturn
  fileViewerRef: RefObject<FilePlayerHandle | null>
}) {
  useEffect(() => {
    connectSession(sessionId, true)
    return () => disconnectSession(sessionId)
  }, [sessionId])

  const timeline = useTimeline(sessionId)
  const { agentStatus, fetchError, initialLoading } = useSessionMeta(sessionId)
  const messages = useMemo(() => timelineToMessages(timeline), [timeline])

  const processedRef = useRef(0)
  const fsRef = useRef(createFileState())
  const fetchedRef = useRef(new Set<string>())

  useEffect(() => {
    if (timeline.length === 0 || timeline.length <= processedRef.current) return

    const newEvents = timeline.slice(processedRef.current)
    processedRef.current = timeline.length

    const getRef = () => fileViewerRef.current

    processToolEvents(newEvents, fsRef.current, fetchedRef.current, viewerTabs, getRef)
  }, [timeline, viewerTabs, fileViewerRef])

  return (
    <>
      {fetchError ? (
        <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption' })}>
          Failed to load: {fetchError}
        </div>
      ) : initialLoading ? (
        <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption' })}>
          Loading...
        </div>
      ) : messages.length === 0 ? (
        <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption' })}>
          에이전트 활동 대기중...
        </div>
      ) : (
        <ChatFeed
          messages={messages}
          blockRenderers={chatRenderers}
          isStreaming={agentStatus === 'running'}
          streamingLabel="Thinking"
          className={ax({ flex: '1' })}
        />
      )}
    </>
  )
}
