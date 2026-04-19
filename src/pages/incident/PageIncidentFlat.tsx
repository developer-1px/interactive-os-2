// @useState-hatch — useStreamFeed 페이지 소유 필요
// FlatLayout Pull model — IncidentProvider + useFlatLayout shared state
import { useCallback, useMemo, useRef, useEffect } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { useStreamFeed } from '@os/ui/useStreamFeed'
import { incidentPlugin } from './incidentPlugin'
import type { Msg } from './incidentData'
import { GitCommit } from 'lucide-react'
import { ax } from '@styles/ax'
import {
  MonitoringBarWidget,
  TimelinePanelWidget,
  CapturePanelWidget,
  ChatZoneWidget,
} from './incidentWidgets'
import { IncidentProvider } from './incidentContext'

// ── Blocks (채팅 메시지에 첨부되는 리치 콘텐츠) ──

function BlockLog() {
  return (
    <div className={ax({ role: 'cell', surface: 'display' })}>
      <div className={ax({ layout: 'stack', textStyle: 'code' })}>
        <div className={ax({ layout: 'bar' })}><span className={ax({ })}>14:35:12</span><span className={ax({ role: 'item', tone: 'danger' })}>ERROR</span><span>pool exhausted</span></div>
        <div className={ax({ layout: 'bar' })}><span className={ax({ })}>14:35:14</span><span className={ax({ role: 'item', tone: 'warning' })}>WARN</span><span>active: 50/50, pending: 23</span></div>
      </div>
    </div>
  )
}

function BlockCause() {
  return (
    <div className={ax({ role: 'cell', surface: 'display' })}>
      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ role: 'item', tone: 'danger' })}><GitCommit size={12} /></span>
        <span className={ax({ textStyle: 'caption', flex: '1' })}>PR #3421 — pool_size: 100 → 50</span>
        <span className={ax({ role: 'item', textStyle: 'caption', tone: 'danger' })}>연관 87%</span>
      </div>
    </div>
  )
}

const MESSAGES: Msg[] = [
  { id: 'user1', type: 'user', text: 'payment-api 장애 분석해줘', delay: 0 },
  { id: 'alert', type: 'system', text: 'P1 — Payment API latency > 2000ms', delay: 600 },
  { id: 'tool-log', type: 'tool', text: 'queryLogs("payment-api")', toolName: 'queryLogs', delay: 800 },
  { id: 'log', type: 'agent', text: 'pool exhausted 에러가 반복됩니다.', block: BlockLog, delay: 1400 },
  { id: 'tool-git', type: 'tool', text: 'getRecentChanges("payment-api")', toolName: 'getRecentChanges', delay: 600 },
  { id: 'cause', type: 'agent', text: '원인: PR #3421이 pool_size를 줄였습니다.', block: BlockCause, delay: 1500 },
]

// ── Registry ──

const registry = createWidgetRegistry({
  MonitoringBar: MonitoringBarWidget,
  TimelinePanel: TimelinePanelWidget,
  CapturePanel: CapturePanelWidget,
  ChatZone: ChatZoneWidget,
})

const incidentPlugins = [incidentPlugin()]

const incidentLayout = definePage({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: [0.05, 'flex'], resizable: false },
      children: ['monitor-bar', 'workspace'],
    },
    'monitor-bar': { data: { type: 'widget', widget: 'MonitoringBar' } },
    workspace: {
      data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex', 0.3], resizable: false },
      children: ['timeline', 'capture', 'chat'],
    },
    timeline: { data: { type: 'widget', widget: 'TimelinePanel' } },
    capture: { data: { type: 'widget', widget: 'CapturePanel' } },
    chat: { data: { type: 'widget', widget: 'ChatZone' } },
    // shared state node — widgets read/write via useFlatLayout + commands
    shared: { data: { type: 'state', selectedEventId: null, chatItemCount: 0 } },
  },
})

// ── Page ──

export default function PageIncidentFlat() {
  const { items, isStreaming, feedRef, addItems, clear } = useStreamFeed<Msg>({
    getDelay: (msg) => msg.delay,
  })

  const didPlayRef = useRef(false)
  useEffect(() => {
    if (!didPlayRef.current) {
      didPlayRef.current = true
      addItems(MESSAGES)
    }
  }, [addItems])

  const replay = useCallback(() => {
    clear()
    addItems(MESSAGES)
  }, [clear, addItems])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const incidentCtx = useMemo(() => ({
    items, isStreaming, feedRef, onReplay: replay,
  }), [items, isStreaming, replay]) // feedRef는 useRef — stable identity

  return (
    <IncidentProvider value={incidentCtx}>
      <FlatLayout
        data={incidentLayout}
        registry={registry}
        plugins={incidentPlugins}
        onChange={() => {}}
        aria-label="Incident analysis (FlatLayout experiment)"
      />
    </IncidentProvider>
  )
}
