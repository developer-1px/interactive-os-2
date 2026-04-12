// @useState-hatch — useStreamFeed 페이지 소유 필요
// FlatLayout gap 발견 실험 — command + shared store 기반 위젯 통신
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
} from '../../experiments/incidentWidgets'

// ── Blocks (채팅 메시지에 첨부되는 리치 콘텐츠) ──

function BlockLog() {
  return (
    <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}>
      <div className={ax({ layout: 'column', textStyle: 'code', gap: 'xs' })}>
        <div className={ax({ layout: 'bar', gap: 'sm' })}><span className={ax({ text: 'muted' })}>14:35:12</span><span className={ax({ weight: 'semi', tone: 'danger' })}>ERROR</span><span>pool exhausted</span></div>
        <div className={ax({ layout: 'bar', gap: 'sm' })}><span className={ax({ text: 'muted' })}>14:35:14</span><span className={ax({ weight: 'semi', tone: 'warning' })}>WARN</span><span>active: 50/50, pending: 23</span></div>
      </div>
    </div>
  )
}

function BlockCause() {
  return (
    <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <span className={ax({ tone: 'danger' })}><GitCommit size={12} /></span>
        <span className={ax({ textStyle: 'caption', weight: 'medium', flex: '1' })}>PR #3421 — pool_size: 100 → 50</span>
        <span className={ax({ textStyle: 'caption', weight: 'semi', tone: 'danger' })}>연관 87%</span>
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

  // 레이아웃 선언 — 정적 구조 + ChatZone만 동적 props
  const layoutData = useMemo(() => definePage({
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
      chat: {
        data: {
          type: 'widget', widget: 'ChatZone',
          props: { items, isStreaming, feedRef, onReplay: replay },
        },
      },
      // shared state node — widgets read/write via useFlatLayout + commands
      // type 'state'는 layoutRenderers에 없으므로 렌더링되지 않음 (데이터 전용 노드)
      shared: { data: { type: 'state', selectedEventId: null, chatItemCount: 0 } },
    },
  }), [items, isStreaming, feedRef, replay])

  return (
    <FlatLayout
      data={layoutData}
      registry={registry}
      plugins={incidentPlugins}
      onChange={() => {}}
      aria-label="Incident analysis (FlatLayout experiment)"
    />
  )
}
