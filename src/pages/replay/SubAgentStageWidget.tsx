// ② docs/1-projects/replay/prds/subagent-viewer-prd.md §3
import { useCallback, useMemo, useRef } from 'react'
import type { ReactElement } from 'react'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { FileViewerHandle, ViewerTab } from '@os/ui/viewerTypes'
import { ax } from '@styles/ax'
import { ReplayProvider, type ReplayContextValue } from './replayContext'
import { ReplayStageWidget } from './replayWidgets'
import { SubAgentProvider } from './subAgentContext'
import { useViewerTabs } from './useViewerTabs'
import type { SubAgentMatchKey, SubAgentSession } from './subAgentTypes'
import { timelineToMessages } from '../viewer/timelineTransform'
import { StatusIndicator } from '@os/ui/indicators'

export interface SubAgentStageWidgetProps {
  session: SubAgentSession
  matchKey: SubAgentMatchKey | null
  parentSessionId: string
}

function tabLabel(tab: ViewerTab): string {
  switch (tab.type) {
    case 'file': {
      const parts = (tab.path ?? 'output').split('/')
      return parts[parts.length - 1] || 'output'
    }
    case 'search': return 'Search'
    case 'terminal': return 'Terminal'
  }
}

/**
 * 고정폭 SubAgent viewer 1개. 헤더(agentType + description) + ReplayStageWidget 재사용.
 * @invariant pages에서 ReplayStageWidget을 직접 여러 번 렌더 금지 (B3) — 이 Widget으로 수렴
 * @invariant 자체 viewerTabs/fileViewer 소유 (부모 viewer와 독립, F4)
 * @invariant 고정폭은 .replay-subagent-viewer CSS 클래스 (B5, 인라인 style 금지)
 */
export function SubAgentStageWidget(props: SubAgentStageWidgetProps): ReactElement {
  const { session, matchKey, parentSessionId } = props
  const orphan = matchKey === null

  // 자체 viewerTabs/fileViewer — 부모와 독립 (F4)
  const viewerTabs = useViewerTabs()
  const fileViewerRef = useRef<FileViewerHandle>(null)
  const { tabs, activeTab, activeTabId, setActiveTab } = viewerTabs

  const viewerTabData: NormalizedData = useMemo(() => {
    if (tabs.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(tabs.map(t => [t.id, { id: t.id, data: { label: tabLabel(t), type: t.type } }]))
    return createStore({ entities, relationships: { __root__: tabs.map(t => t.id) } })
  }, [tabs])

  // SubAgent events → ChatMessage[]
  const messages = useMemo(() => timelineToMessages(session.events), [session.events])

  const noop = useCallback(() => {}, [])

  const replayCtx = useMemo<ReplayContextValue>(() => ({
    selectedId: session.agentHash || `${session.agentType}-${session.description}`,
    setSelectedId: noop,
    sessionEntries: [],
    messages,
    allMessagesCount: messages.length,
    isRunning: false,
    startReplay: noop,
    editingLine: null,
    mode: 'replay',
    liveSessionId: null,
    tabs, activeTab, activeTabId, setActiveTab,
    viewerTabData, fileViewerRef, viewerTabs,
  }), [session.sessionId, noop, messages, tabs, activeTab, activeTabId, setActiveTab, viewerTabData, viewerTabs])

  const subCtx = useMemo(() => ({ session, matchKey, parentSessionId }), [session, matchKey, parentSessionId])

  return (
    <div className={`replay-subagent-viewer ${ax({ layout: 'stack', flex: 'none', surface: 'base' })}`}>
      {/* Header — agentType + description + status badges */}
      <div className={ax({ layout: 'row', gap: 'sm', padding: 'sm', border: 'bottom', flex: 'none' })}>
        <StatusIndicator tone={session.isActive ? 'success' : 'info'} />
        <span className={ax({ textStyle: 'caption', weight: 'semi' })}>{session.agentType}</span>
        <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1', flex: 'auto' })}>{session.description}</span>
        {orphan && (
          <span className={ax({ role: 'badge', surface: 'display', tone: 'warning', padding: 'xs', textStyle: 'caption' })}>orphan</span>
        )}
        {!session.isActive && (
          <span className={ax({ role: 'badge', surface: 'display', tone: 'neutral', padding: 'xs', textStyle: 'caption' })}>완료</span>
        )}
      </div>

      {/* Stage body — reuse ReplayStageWidget via independent ReplayProvider */}
      <div className={ax({ flex: 'auto' })}>
        <SubAgentProvider value={subCtx}>
          <ReplayProvider value={replayCtx}>
            <ReplayStageWidget />
          </ReplayProvider>
        </SubAgentProvider>
      </div>
    </div>
  )
}
