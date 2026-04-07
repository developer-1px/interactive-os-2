// @useState-hatch
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ax } from '@styles/ax'
import './PageIncidentInterface.css'
import {
  AlertTriangle, GitCommit, Zap, Activity,
  CheckCircle, Loader, Bot,
  User, Clock, Eye, Image, Terminal,
} from 'lucide-react'
import { BlockLog, BlockMetric, BlockCause, BlockSimilar, BlockBlast, BlockActions } from './incidentBlocks'
import { useStreamFeed } from '@os/ui/useStreamFeed'
import { useTypewriter } from '@os/ui/useTypewriter'
import { StreamFeed, StreamCursor } from '@os/ui/StreamFeed'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { ROOT_ID } from '@os/store/types'
import { ListBox } from '@os/ui/ListBox'
import { Toolbar } from '@os/ui/Toolbar'
import { Composer } from '@os/ui/Composer'
import { PanelHeader } from '@os/ui/PanelHeader'

// ═══════════════════════════════════════════
// Mock data
// ═══════════════════════════════════════════

interface ServiceInfo {
  name: string
  status: 'critical' | 'warning' | 'healthy'
  latency: string
  errorRate: string
}

const SERVICES: ServiceInfo[] = [
  { name: 'payment-api', status: 'critical', latency: '2.4s', errorRate: '12%' },
  { name: 'order-service', status: 'warning', latency: '890ms', errorRate: '3.2%' },
  { name: 'checkout-web', status: 'warning', latency: '1.1s', errorRate: '5.1%' },
  { name: 'notification-svc', status: 'healthy', latency: '45ms', errorRate: '0.1%' },
  { name: 'user-service', status: 'healthy', latency: '32ms', errorRate: '0%' },
]

interface TimelineEvent {
  id: string
  time: string
  type: 'deploy' | 'alert' | 'config' | 'metric' | 'recovery'
  title: string
  detail: string
  severity: 'critical' | 'warning' | 'info'
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 'ev-1', time: '14:20', type: 'config', title: 'Config 변경', detail: 'pool_size: 100 → 50', severity: 'info' },
  { id: 'ev-2', time: '14:25', type: 'deploy', title: 'PR #3421 머지', detail: 'config cleanup — pool_size 축소', severity: 'warning' },
  { id: 'ev-3', time: '14:30', type: 'metric', title: 'Connection 포화', detail: 'active: 48/50, pending: 5', severity: 'warning' },
  { id: 'ev-4', time: '14:32', type: 'alert', title: 'P1 Alert 발생', detail: 'payment-api latency > 2000ms', severity: 'critical' },
  { id: 'ev-5', time: '14:33', type: 'metric', title: 'Pool 고갈', detail: 'active: 50/50, pending: 23', severity: 'critical' },
  { id: 'ev-6', time: '14:35', type: 'alert', title: '전파 감지', detail: 'order-service, checkout-web 영향', severity: 'critical' },
  { id: 'ev-7', time: '14:38', type: 'recovery', title: 'Rollback 시작', detail: 'pool_size: 50 → 200', severity: 'info' },
  { id: 'ev-8', time: '14:41', type: 'recovery', title: '정상화 확인', detail: 'latency < 100ms, error 0%', severity: 'info' },
]

// ═══════════════════════════════════════════
// Message types & sequence
// ═══════════════════════════════════════════

interface Msg {
  id: string
  type: 'user' | 'agent' | 'system' | 'tool'
  text: string
  toolName?: string
  block?: () => React.ReactNode
  delay: number
}

const MESSAGES: Msg[] = [
  { id: 'user1', type: 'user', text: 'payment-api 장애 분석해줘', delay: 0 },
  { id: 'alert', type: 'system', text: 'P1 — Payment API latency > 2000ms  ·  INC-1284  ·  14:32 KST', delay: 600 },
  { id: 'tool-log', type: 'tool', text: 'queryLogs("payment-api", "order-service", "checkout-web")', toolName: 'queryLogs', delay: 800 },
  { id: 'log', type: 'agent', text: '3개 서비스에서 로그를 수집했습니다. pool exhausted 에러가 반복되고 있습니다.', block: BlockLog, delay: 1400 },
  { id: 'tool-metric', type: 'tool', text: 'getMetrics("payment-api", ["connections", "pending", "latency"])', toolName: 'getMetrics', delay: 600 },
  { id: 'metric', type: 'agent', text: 'Connection pool 고갈 패턴입니다.', block: BlockMetric, delay: 1400 },
  { id: 'tool-git', type: 'tool', text: 'getRecentChanges("payment-api", hours=2)', toolName: 'getRecentChanges', delay: 600 },
  { id: 'cause', type: 'agent', text: '원인: PR #3421이 pool_size를 100에서 50으로 줄였습니다.', block: BlockCause, delay: 1500 },
  { id: 'tool-similar', type: 'tool', text: 'searchIncidents("pool exhaustion", similarity=0.7)', toolName: 'searchIncidents', delay: 600 },
  { id: 'similar', type: 'agent', text: '유사 인시던트 INC-847과 92% 일치합니다.', block: BlockSimilar, delay: 1200 },
  { id: 'tool-blast', type: 'tool', text: 'getServiceDependencies("payment-api")', toolName: 'getServiceDependencies', delay: 600 },
  { id: 'blast', type: 'agent', text: '영향 범위: 3개 서비스 영향, 2개 정상.', block: BlockBlast, delay: 1000 },
  { id: 'decide', type: 'agent', text: '분석 완료. pool_size 복원으로 3분 내 정상화 예상. 행동을 선택하세요.', block: BlockActions, delay: 800 },
]

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function AgentMessage({ msg, active }: { msg: Msg; active: boolean }) {
  const { displayed, done } = useTypewriter(msg.text, active)
  return (
    <div className={ax({ layout: 'bar', gap: 'sm' })}>
      <div className={`${ax({ layout: 'center', tone: 'accent' })} incident-avatar`}><Bot size={14} /></div>
      <div className={ax({ layout: 'column', flex: '1', gap: 'sm' })}>
        <div className={ax({ textStyle: 'caption', text: 'primary' })}>
          {displayed}
          {!done && <StreamCursor />}
        </div>
        {done && msg.block && <msg.block />}
      </div>
    </div>
  )
}

function Elapsed({ startTime }: { startTime: number | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  if (!startTime) return null
  const sec = ((now - startTime) / 1000).toFixed(1)
  return <span>{sec}s</span>
}

// ═══════════════════════════════════════════
// Monitoring Bar (Toolbar)
// ═══════════════════════════════════════════

const STATUS_CLS: Record<ServiceInfo['status'], string> = {
  critical: 'incident-indicator-critical',
  warning: 'incident-indicator-warning',
  healthy: 'incident-indicator-healthy',
}

function buildToolbarData(services: ServiceInfo[]): NormalizedData {
  const entities: NormalizedData['entities'] = { [ROOT_ID]: { id: ROOT_ID } }
  const children: string[] = []
  for (const svc of services) {
    entities[svc.name] = { id: svc.name, data: { ...svc, label: svc.name } }
    children.push(svc.name)
  }
  return { entities, relationships: { [ROOT_ID]: children } }
}

function MonitoringBar({ services, onActivate }: {
  services: ServiceInfo[]
  onActivate: (id: string) => void
}) {
  const data = useMemo(() => buildToolbarData(services), [services])

  const renderItem = useCallback((
    props: React.HTMLAttributes<HTMLElement>,
    node: Record<string, unknown>,
    state: NodeState,
  ) => {
    const svc = node.data as unknown as ServiceInfo
    if (!svc) return <span {...props} />
    return (
      <span
        {...props}
        className={ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs', textStyle: 'caption', state: state.focused ? 'focused' : undefined })}
      >
        <span className={`incident-indicator ${STATUS_CLS[svc.status]}`} />
        <span className={ax({ weight: 'medium' })}>{svc.name}</span>
        <span className={ax({ textStyle: 'code', text: 'muted' })}>{svc.latency}</span>
      </span>
    )
  }, [])

  return (
    <div className={ax({ surface: 'base', layout: 'bar', gap: 'sm', padding: 'sm', flex: 'none' })}>
      <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'overline' })}><Activity size={12} /><span>Monitor</span></div>
      <Toolbar
        data={data}
        renderItem={renderItem}
        onActivate={onActivate}
        aria-label="Service monitoring"
      />
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <span className={ax({ textStyle: 'code', text: 'muted' })}>INC-1284</span>
        <span className={`${ax({ textStyle: 'code', tone: 'danger', weight: 'semi' })} incident-monitor-meta-live`}>REC</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Timeline (interactive-os ListBox)
// ═══════════════════════════════════════════

const EVENT_ICON: Record<TimelineEvent['type'], React.ReactNode> = {
  deploy: <GitCommit size={12} />,
  alert: <AlertTriangle size={12} />,
  config: <Terminal size={12} />,
  metric: <Activity size={12} />,
  recovery: <CheckCircle size={12} />,
}

const SEVERITY_CLS: Record<TimelineEvent['severity'], string> = {
  critical: 'incident-ev-critical',
  warning: 'incident-ev-warning',
  info: 'incident-ev-info',
}

function buildTimelineData(events: TimelineEvent[], visibleCount: number): NormalizedData {
  const visible = events.slice(0, visibleCount)
  const entities: NormalizedData['entities'] = { [ROOT_ID]: { id: ROOT_ID } }
  const children: string[] = []
  for (const ev of visible) {
    entities[ev.id] = { id: ev.id, data: { ...ev } }
    children.push(ev.id)
  }
  return { entities, relationships: { [ROOT_ID]: children } }
}

function TimelinePanel({ events, visibleCount, selectedId, onSelect }: {
  events: TimelineEvent[]
  visibleCount: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const data = useMemo(() => buildTimelineData(events, visibleCount), [events, visibleCount])

  const renderItem = useCallback((
    props: React.HTMLAttributes<HTMLElement>,
    node: Record<string, unknown>,
    state: NodeState,
  ) => {
    const ev = node.data as unknown as TimelineEvent
    if (!ev) return <div {...props} />
    const isSelected = node.id === selectedId
    return (
      <div
        {...props}
        className={`incident-timeline-item ${SEVERITY_CLS[ev.severity]} ${isSelected ? 'incident-timeline-item-selected' : ''} ${state.focused ? 'incident-timeline-item-focused' : ''}`}
        onClick={(e) => {
          props.onClick?.(e)
          onSelect(node.id as string)
        }}
      >
        <div className={`${ax({ textStyle: 'code' })} incident-timeline-time`}>{ev.time}</div>
        <div className={`incident-timeline-dot ${ax({ layout: 'column' })}`}>
          <span className={`incident-dot ${SEVERITY_CLS[ev.severity]}`} />
          <span className={`incident-dot-line ${ax({ flex: '1' })}`} />
        </div>
        <div className={ax({ layout: 'bar', gap: 'xs', flex: '1' })}>
          <div className="incident-timeline-icon">{EVENT_ICON[ev.type]}</div>
          <div className={ax({ flex: '1' })}>
            <div className={ax({ textStyle: 'body', weight: 'medium' })}>{ev.title}</div>
            <div className={ax({ textStyle: 'caption', text: 'muted' })}>{ev.detail}</div>
          </div>
        </div>
      </div>
    )
  }, [selectedId, onSelect])

  return (
    <div className={`${ax({ surface: 'base', layout: 'column', flex: 'none' })} incident-timeline-panel`}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}><Clock size={12} />Timeline</span>
        <span className={ax({ textStyle: 'code' })}>{visibleCount}/{events.length}</span>
      </PanelHeader>
      {visibleCount > 0 ? (
        <ListBox
          data={data}
          plugins={[]}
          renderItem={renderItem}
          onActivate={onSelect}
          aria-label="Incident timeline"
        />
      ) : (
        <div className={ax({ textStyle: 'caption', text: 'muted', layout: 'center', flex: '1' })}>이벤트 수집 중...</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Capture Comparison
// ═══════════════════════════════════════════

const CAPTURE_STATES: Record<string, { before: string; after: string; aiNote: string }> = {
  'ev-1': { before: 'Config: pool_size=100', after: 'Config: pool_size=50', aiNote: 'pool_size 값이 절반으로 줄었습니다.' },
  'ev-2': { before: 'Deployment: v2.14.1', after: 'Deployment: v2.14.2 (PR #3421)', aiNote: 'PR #3421이 pool 설정을 변경했습니다.' },
  'ev-3': { before: 'Connections: 30/100', after: 'Connections: 48/50', aiNote: '연결 수가 새 상한선에 근접했습니다.' },
  'ev-4': { before: 'Latency p99: 120ms', after: 'Latency p99: 2400ms', aiNote: '응답 시간 20배 급증 — pool 고갈 영향.' },
  'ev-5': { before: 'Active: 48/50, Pending: 5', after: 'Active: 50/50, Pending: 23', aiNote: 'Pool 완전 고갈. 대기 큐 급증 중.' },
  'ev-6': { before: 'order-svc: OK, checkout: OK', after: 'order-svc: ERR +12%, checkout: TIMEOUT', aiNote: '장애가 하위 서비스로 전파되었습니다.' },
  'ev-7': { before: 'pool_size=50', after: 'pool_size=200 (rollback)', aiNote: 'Rollback 적용. 복구 진행 중.' },
  'ev-8': { before: 'Latency p99: 2400ms', after: 'Latency p99: 45ms', aiNote: '완전 정상화. 모든 지표 기준선 복귀.' },
}

function CapturePanel({ selectedEventId }: { selectedEventId: string | null }) {
  const capture = selectedEventId ? CAPTURE_STATES[selectedEventId] : null
  const event = selectedEventId ? TIMELINE_EVENTS.find(e => e.id === selectedEventId) : null

  return (
    <div className={`${ax({ surface: 'sunken', layout: 'fill' })} incident-capture-panel`}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}><Image size={12} />Capture</span>
        {event && <span className={ax({ textStyle: 'code' })}>{event.time}</span>}
      </PanelHeader>
      {capture ? (
        <div className={ax({ layout: 'column', flex: '1', gap: 'md', padding: 'sm' })}>
          <div className={`incident-capture-comparison grid ${ax({ flex: '1', gap: 'sm' })}`}>
            <div className={ax({ surface: 'display', padding: 'md', shape: 'sm', layout: 'column', gap: 'sm' })}>
              <div className={ax({ textStyle: 'overline', text: 'muted' })}>Before</div>
              <div className={ax({ layout: 'column', flex: '1', gap: 'sm' })}>
                <Eye size={16} />
                <span className={ax({ textStyle: 'code', weight: 'semi' })}>{capture.before}</span>
              </div>
            </div>
            <div className={`${ax({ surface: 'display', padding: 'md', shape: 'sm', layout: 'column', gap: 'sm' })} incident-capture-changed`}>
              <div className={ax({ textStyle: 'overline', text: 'muted' })}>After</div>
              <div className={ax({ layout: 'column', flex: '1', gap: 'sm' })}>
                <Eye size={16} />
                <span className={ax({ textStyle: 'code', weight: 'semi' })}>{capture.after}</span>
              </div>
            </div>
          </div>
          <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', tone: 'accent' })}>
            <Bot size={12} />
            <span>{capture.aiNote}</span>
          </div>
        </div>
      ) : (
        <div className={ax({ layout: 'center', flex: '1', textStyle: 'caption', text: 'muted' })}>
          <div className={ax({ layout: 'column', gap: 'sm' })}>
            <Eye size={24} />
            <span>타임라인에서 이벤트를 선택하세요</span>
            <kbd>↑↓</kbd>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Main
// ═══════════════════════════════════════════

export default function PageIncidentInterface() {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  const { items, isStreaming, feedRef, addItems, clear } = useStreamFeed<Msg>({
    getDelay: (msg) => msg.delay,
  })

  // Auto-play on mount
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

  // Track timing
  const prevItemsLenRef = useRef(0)
  const len = items.length

  useEffect(() => {
    if (len >= 1 && prevItemsLenRef.current === 0) {
      queueMicrotask(() => { setStartTime(Date.now()); setEndTime(null) })
    }
    if (len === MESSAGES.length && prevItemsLenRef.current < MESSAGES.length) {
      queueMicrotask(() => setEndTime(Date.now()))
    }
    prevItemsLenRef.current = len
  }, [len])

  const handleReplay = useCallback(() => {
    prevItemsLenRef.current = 0
    setStartTime(null)
    setEndTime(null)
    setSelectedEvent(null)
    replay()
  }, [replay])

  // Progressive timeline reveal synced to chat progress
  const timelineVisible = Math.min(
    TIMELINE_EVENTS.length,
    len <= 2 ? 0 : len <= 4 ? 2 : len <= 6 ? 4 : len <= 8 ? 6 : TIMELINE_EVENTS.length,
  )

  // Auto-select latest event when timeline first appears
  const initialEventId = useMemo(
    () => timelineVisible > 0 ? TIMELINE_EVENTS[timelineVisible - 1]?.id ?? null : null,
    [timelineVisible],
  )

  if (initialEventId && !selectedEvent) setSelectedEvent(initialEventId)

  const handleToolbarActivate = useCallback((_id: string) => {
    // service selection — showcase only
  }, [])

  return (
    <div className={`incident-page grid h-full overflow-hidden`}>
      {/* Zone 1: Monitoring Bar */}
      <MonitoringBar
        services={SERVICES}
        onActivate={handleToolbarActivate}
      />

      {/* Zone 2: Workspace (Timeline + Capture + Chat) */}
      <div className={ax({ layout: 'row', flex: '1' })}>
        <TimelinePanel
          events={TIMELINE_EVENTS}
          visibleCount={timelineVisible}
          selectedId={selectedEvent}
          onSelect={setSelectedEvent}
        />
        <CapturePanel selectedEventId={selectedEvent} />

        <div className={`${ax({ surface: 'sunken', layout: 'column', flex: 'none' })} incident-chat-zone`}>
          <PanelHeader axes={{ layout: 'spread' }}>
            <span className={ax({ layout: 'bar', gap: 'xs' })}><Bot size={12} />AI Analysis</span>
            <span className={ax({ layout: 'bar', gap: 'xs', textStyle: 'code' })}>
              {endTime
                ? <><CheckCircle size={10} /><span>{((endTime - (startTime ?? 0)) / 1000).toFixed(1)}s</span></>
                : startTime
                  ? <><Loader size={10} className={ax({ motion: 'spin' })} /><Elapsed startTime={startTime} /></>
                  : null
              }
            </span>
          </PanelHeader>
          <StreamFeed
            items={items}
            feedRef={feedRef}
            isStreaming={isStreaming}
            className={ax({ flex: '1', gap: 'sm', padding: 'sm' })}
            renderItem={(msg) => {
              if (msg.type === 'user') {
                return (
                  <div className={ax({ layout: 'bar', gap: 'sm' })}>
                    <div className={ax({ flex: '1' })}>
                      <div className={ax({ textStyle: 'caption', weight: 'medium' })}>{msg.text}</div>
                    </div>
                    <div className={`${ax({ layout: 'center' })} incident-user-avatar`}><User size={14} /></div>
                  </div>
                )
              }
              if (msg.type === 'system') {
                return (
                  <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}>
                    <div className={ax({ textStyle: 'caption', weight: 'semi', tone: 'danger' })}>{msg.text}</div>
                  </div>
                )
              }
              if (msg.type === 'tool') {
                return (
                  <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'code' })}>
                    <Zap size={10} />
                    <span className={ax({ weight: 'semi' })}>{msg.toolName}</span>
                    <span className={ax({ text: 'muted', clamp: '1' })}>{msg.text}</span>
                  </div>
                )
              }
              return <AgentMessage msg={msg} active={true} />
            }}
          />
          <Composer
            placeholder="AI에게 질문하세요..."
            disabled={isStreaming}
            onSubmit={handleReplay}
          />
        </div>
      </div>
    </div>
  )
}
