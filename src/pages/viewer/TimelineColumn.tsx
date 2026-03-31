// ② 2026-03-27-chat-module-prd.md
import styles from './TimelineColumn.module.css'
import { useEffect, useMemo } from 'react'
import { Circle, Loader, X } from 'lucide-react'
import { connectSession, disconnectSession, useTimeline, useSessionMeta } from './viewerStore'
import { timelineToMessages } from './timelineAdapter'
import { ChatFeed } from '../../interactive-os/ui/chat/ChatFeed'
import { Composer } from '../../interactive-os/ui/Composer'
import { ToolGroupBlock } from './ToolGroupBlock'
import type { BlockRendererMap } from '../../interactive-os/ui/chat/types'

interface TimelineColumnProps {
  sessionId: string
  sessionLabel: string
  isLive: boolean
  onClose: () => void
  onFileClick: (filePath: string, editRanges?: string[]) => void
}

// Viewer-specific block renderers (extends chat defaults)
const viewerRenderers: BlockRendererMap = {
  tool_group: ToolGroupBlock,
}

export function TimelineColumn({ sessionId, sessionLabel, isLive, onClose, onFileClick: _onFileClick }: TimelineColumnProps) {
  // --- Store connection ---
  useEffect(() => {
    connectSession(sessionId, isLive)
    return () => disconnectSession(sessionId)
  }, [sessionId, isLive])

  const timeline = useTimeline(sessionId)
  const { agentStatus, fetchError, initialLoading } = useSessionMeta(sessionId)

  // --- Convert timeline events to chat messages ---
  const messages = useMemo(() => timelineToMessages(timeline), [timeline])

  // Streaming: agent is running
  const showStreaming = isLive && agentStatus === 'running'
  const streamingLabel = 'Thinking'

  return (
    <div className={`${styles.tc} flex-col flex-1 h-full min-h-0`}>
      <div className={`${styles.tcHeader} flex-row items-center shrink-0 ${isLive && agentStatus === 'idle' ? styles.tcHeaderIdle : ''}`}>
        {isLive && (
          <span className={`${agentStatus === 'idle' ? styles.tcIdle : styles.tcLive} shrink-0`}><Circle size={8} fill="currentColor" /></span>
        )}
        <span className={`${styles.tcLabel} truncate`}>{sessionLabel}</span>
        {isLive && (
          <span className={`${styles.tcHeaderStatus} shrink-0`}>
            {agentStatus === 'running' ? '진행중' : agentStatus === 'idle' ? '입력 대기' : ''}
          </span>
        )}
        <button className={`${styles.tcClose} border-none cursor-pointer`} onClick={onClose}><X size={14} /></button>
      </div>

      {fetchError ? (
        <div className={`${styles.tcEmpty} text-center`}>Failed to load: {fetchError}</div>
      ) : initialLoading ? (
        <div className={`${styles.tcLoading} flex-row items-center justify-center`}>
          <Loader size={14} className={styles.tcLoadingSpinner} />
          <span>Loading timeline...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className={`${styles.tcEmpty} text-center`}>Waiting for agent activity...</div>
      ) : (
        <ChatFeed
          messages={messages}
          blockRenderers={viewerRenderers}
          isStreaming={showStreaming}
          streamingLabel={streamingLabel}
          className={`${styles.tcBody} flex-1 overflow-y-auto overflow-x-hidden`}
        />
      )}

      {isLive && agentStatus === 'idle' && (
        <Composer disabled placeholder="Send a message... (channel 미연결)" />
      )}
    </div>
  )
}
