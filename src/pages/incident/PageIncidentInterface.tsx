import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ax } from '@styles/ax'
import styles from './PageIncidentInterface.module.css'
import {
  AlertTriangle, GitCommit, Server, Database,
  RotateCcw, Zap, Activity, ChevronDown, Play, Terminal,
  ArrowRight, CheckCircle, Loader, Bot, Send,
  User, Clock, Eye, Image,
} from 'lucide-react'
import { useStreamFeed } from '@os/ui/useStreamFeed'
import { useTypewriter } from '@os/ui/useTypewriter'
import { StreamFeed, StreamCursor } from '@os/ui/StreamFeed'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { Aria } from '@os/primitives/aria'
import { listbox } from '@os/pattern/roles/listbox'

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
// Rich block components (from chat messages)
// ═══════════════════════════════════════════

function BlockLog() {
  return (
    <div className={styles.block}>
      <div className={`${ax({ textStyle: 'code' })} ${styles.logLines} flex-col overflow-x-auto`}>
        <div className={`${styles.logLine} flex-row whitespace-nowrap`}><span className={styles.logTime}>14:35:12</span><span className={`${ax({ weight: 'semi' })} ${styles.logError}`}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5002ms)</span></div>
        <div className={`${styles.logLine} flex-row whitespace-nowrap`}><span className={styles.logTime}>14:35:13</span><span className={`${ax({ weight: 'semi' })} ${styles.logError}`}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5001ms)</span></div>
        <div className={`${styles.logLine} flex-row whitespace-nowrap`}><span className={styles.logTime}>14:35:14</span><span className={`${ax({ weight: 'semi' })} ${styles.logWarn}`}>WARN</span><span>active_connections: 50/50, pending: 23</span></div>
      </div>
    </div>
  )
}

function BlockMetric() {
  return (
    <div className={styles.block}>
      <div className={`${styles.metricGrid} grid`}>
        <div className={`${styles.stat} flex-col`}><div className={`${ax({ textStyle: 'body', weight: 'semi' })} ${styles.statValue}`}>50/50</div><div className={`${ax({ textStyle: 'caption' })} ${styles.statLabel}`}>connections</div><div className={`${styles.barTrack} overflow-hidden`}><div className={`${styles.barFillBad} h-full`} style={{ width: '100%' }} /></div></div>
        <div className={`${styles.stat} flex-col`}><div className={`${ax({ textStyle: 'body', weight: 'semi' })} ${styles.statValue}`}>23</div><div className={`${ax({ textStyle: 'caption' })} ${styles.statLabel}`}>pending</div><div className={`${styles.barTrack} overflow-hidden`}><div className={`${styles.barFillWarn} h-full`} style={{ width: '46%' }} /></div></div>
        <div className={`${styles.stat} flex-col`}><div className={`${ax({ textStyle: 'body', weight: 'semi' })} ${styles.statValue}`}>2.4s</div><div className={`${ax({ textStyle: 'caption' })} ${styles.statLabel}`}>p99 latency</div><div className={`${styles.barTrack} overflow-hidden`}><div className={`${styles.barFillBad} h-full`} style={{ width: '80%' }} /></div></div>
      </div>
    </div>
  )
}

function BlockCause() {
  return (
    <div className={styles.block}>
      <div className={`${styles.causeChain} flex-col`}>
        <div className={`${styles.causeNode} flex-row items-start`}>
          <div className={`${styles.causeIcon} flex-row items-center justify-center shrink-0 ${styles.causeIconBad}`}><GitCommit size={12} /></div>
          <div className="flex-1 min-w-0"><div className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.causeTitle}`}>PR #3421 — config cleanup</div><div className={`${ax({ textStyle: 'caption' })} ${styles.causeDesc}`}>pool_size: 100 → 50</div></div>
          <div className={`${ax({ textStyle: 'caption', weight: 'semi' })} ${styles.causeBadge} whitespace-nowrap`}>87%</div>
        </div>
        <div className={`${styles.causeArrow} text-center`}><ChevronDown size={12} /></div>
        <div className={`${styles.causeNode} flex-row items-start`}>
          <div className={`${styles.causeIcon} flex-row items-center justify-center shrink-0 ${styles.causeIconWarn}`}><Database size={12} /></div>
          <div className="flex-1 min-w-0"><div className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.causeTitle}`}>DB pool 고갈</div><div className={`${ax({ textStyle: 'caption' })} ${styles.causeDesc}`}>max=50, 동시 요청 처리 불가</div></div>
        </div>
        <div className={`${styles.causeArrow} text-center`}><ChevronDown size={12} /></div>
        <div className={`${styles.causeNode} flex-row items-start`}>
          <div className={`${styles.causeIcon} flex-row items-center justify-center shrink-0 ${styles.causeIconBad}`}><AlertTriangle size={12} /></div>
          <div className="flex-1 min-w-0"><div className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.causeTitle}`}>p99 2.4s → 3개 서비스 전파</div></div>
        </div>
      </div>
    </div>
  )
}

function BlockSimilar() {
  return (
    <div className={styles.block}>
      <div className={styles.similarCard}>
        <div className={`${styles.similarHeader} flex-row items-center`}><span className={`${ax({ textStyle: 'caption', weight: 'semi' })} ${styles.similarId}`}>INC-847</span><span className={`${ax({ textStyle: 'caption', weight: 'semi' })} ${styles.matchBadge}`}>92%</span><span className={`${ax({ textStyle: 'caption' })} ${styles.similarTime}`}>2주 전</span></div>
        <div className={`${ax({ textStyle: 'caption' })} ${styles.similarBody}`}>동일: DB pool exhaustion after config change</div>
        <div className={`${ax({ textStyle: 'caption' })} ${styles.similarResolution} flex-row items-center`}><CheckCircle size={12} /><span>해결: pool_size 50→200 (PR #2891) — 3분 정상화</span></div>
      </div>
    </div>
  )
}

const BLAST_SERVICES = [
  { name: 'payment-api', status: 'p99: 2.4s', state: 'bad' as const },
  { name: 'order-service', status: 'error +12%', state: 'warn' as const },
  { name: 'checkout-web', status: 'timeout', state: 'warn' as const },
  { name: 'notification-svc', status: 'healthy', state: 'ok' as const },
  { name: 'user-service', status: 'healthy', state: 'ok' as const },
]

const BLAST_CLS = { bad: styles.svcBad, warn: styles.svcWarn, ok: styles.svcOk } as const

function BlockBlast() {
  return (
    <div className={styles.block}>
      <div className={`${styles.svcList} flex-col`}>
        {BLAST_SERVICES.map((s, i) => (
          <div key={i} className={`${ax({ textStyle: 'caption' })} ${styles.svcItem} flex-row items-center ${BLAST_CLS[s.state]}`}><Server size={12} /><span className={`${ax({ weight: 'medium' })} ${styles.svcName} flex-1`}>{s.name}</span><span className={styles.svcStatus}>{s.status}</span></div>
        ))}
      </div>
    </div>
  )
}

function BlockActions() {
  return (
    <div className={`${styles.actionList} flex-row flex-wrap`}>
      <button className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.action} flex-row items-center cursor-pointer ${styles.actionPrimary}`}><RotateCcw size={14} />Revert PR #3421<kbd className={ax({ textStyle: 'code' })}>1</kbd></button>
      <button className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.action} flex-row items-center cursor-pointer`}><Play size={14} />Rollback v2.14.2<kbd className={ax({ textStyle: 'code' })}>2</kbd></button>
      <button className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.action} flex-row items-center cursor-pointer`}><Terminal size={14} />Scale pool → 200<kbd className={ax({ textStyle: 'code' })}>3</kbd></button>
      <button className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.action} flex-row items-center cursor-pointer`}><ArrowRight size={14} />Runbook<kbd className={ax({ textStyle: 'code' })}>4</kbd></button>
    </div>
  )
}

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

// delay is already on each Msg

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function AgentMessage({ msg, active }: { msg: Msg; active: boolean }) {
  const { displayed, done } = useTypewriter(msg.text, active)
  return (
    <div className={`${styles.agentMsg} flex-row items-start`}>
      <div className={`${styles.avatar} flex-row items-center justify-center shrink-0`}><Bot size={14} /></div>
      <div className={`${styles.bubble} flex-1 min-w-0`}>
        <div className={`${ax({ textStyle: 'caption' })} ${styles.agentLabel}`}>
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
// Monitoring Bar
// ═══════════════════════════════════════════

const STATUS_CLS: Record<ServiceInfo['status'], string> = {
  critical: styles.indicatorCritical,
  warning: styles.indicatorWarning,
  healthy: styles.indicatorHealthy,
}

function MonitoringBar({ services, selectedIndex, onSelect }: {
  services: ServiceInfo[]
  selectedIndex: number
  onSelect: (i: number) => void
}) {
  return (
    <div className={`${styles.monitorBar} flex-row items-center`} role="toolbar" aria-label="Service monitoring">
      <div className={`${ax({ textStyle: 'overline' })} ${styles.monitorLabel} flex-row items-center shrink-0`}><Activity size={12} /><span>Monitor</span></div>
      <div className={`${styles.monitorServices} flex-row items-center flex-1 min-w-0 overflow-x-auto`}>
        {services.map((svc, i) => (
          <button
            key={svc.name}
            className={`${ax({ textStyle: 'caption' })} ${styles.monitorItem} flex-row items-center cursor-pointer whitespace-nowrap ${i === selectedIndex ? styles.monitorItemActive : ''}`}
            onClick={() => onSelect(i)}
            aria-pressed={i === selectedIndex}
          >
            <span className={`${styles.indicator} shrink-0 ${STATUS_CLS[svc.status]}`} />
            <span className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.monitorName}`}>{svc.name}</span>
            <span className={`${ax({ textStyle: 'code' })} ${styles.monitorLatency}`}>{svc.latency}</span>
          </button>
        ))}
      </div>
      <div className={`${styles.monitorMeta} flex-row items-center shrink-0`}>
        <span className={`${ax({ textStyle: 'code' })} ${styles.monitorMetaItem}`}>INC-1284</span>
        <span className={`${ax({ textStyle: 'code' })} ${styles.monitorMetaItem} ${styles.monitorMetaLive}`}>REC</span>
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
  critical: styles.evCritical,
  warning: styles.evWarning,
  info: styles.evInfo,
}

function buildTimelineData(events: TimelineEvent[], visibleCount: number): NormalizedData {
  const visible = events.slice(0, visibleCount)
  const entities: NormalizedData['entities'] = { __root__: { id: '__root__' } }
  const children: string[] = []
  for (const ev of visible) {
    entities[ev.id] = { id: ev.id, data: { ...ev } }
    children.push(ev.id)
  }
  return { entities, relationships: { __root__: children } }
}

function TimelinePanel({ events, visibleCount, selectedId, onSelect }: {
  events: TimelineEvent[]
  visibleCount: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const pattern = useMemo(() => listbox(), [])
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
        className={`${styles.timelineItem} flex-row items-start cursor-pointer ${SEVERITY_CLS[ev.severity]} ${isSelected ? styles.timelineItemSelected : ''} ${state.focused ? styles.timelineItemFocused : ''}`}
        onClick={(e) => {
          props.onClick?.(e)
          onSelect(node.id as string)
        }}
      >
        <div className={`${ax({ textStyle: 'code' })} ${styles.timelineTime} shrink-0`}>{ev.time}</div>
        <div className={`${styles.timelineDot} flex-col items-center shrink-0`}>
          <span className={`${styles.dot} shrink-0 ${SEVERITY_CLS[ev.severity]}`} />
          <span className={`${styles.dotLine} flex-1`} />
        </div>
        <div className={`${styles.timelineContent} flex-row flex-1 min-w-0`}>
          <div className={`${styles.timelineIcon} shrink-0`}>{EVENT_ICON[ev.type]}</div>
          <div className="flex-1 min-w-0">
            <div className={`${ax({ textStyle: 'body', weight: 'medium' })} ${styles.timelineTitle}`}>{ev.title}</div>
            <div className={`${ax({ textStyle: 'caption' })} ${styles.timelineDetail}`}>{ev.detail}</div>
          </div>
        </div>
      </div>
    )
  }, [selectedId, onSelect])

  return (
    <div className={`${styles.timelinePanel} flex-col shrink-0`}>
      <div className={`${ax({ textStyle: 'overline' })} ${styles.panelHeader} flex-row items-center shrink-0`}>
        <Clock size={12} />
        <span>Timeline</span>
        <span className={`${ax({ textStyle: 'code' })} ${styles.panelCount}`}>{visibleCount}/{events.length}</span>
      </div>
      {visibleCount > 0 ? (
        <Aria
          pattern={pattern}
          data={data}
          plugins={[]}
          aria-label="Incident timeline"
          onActivate={onSelect}
        >
          <Aria.Item render={renderItem} />
        </Aria>
      ) : (
        <div className={`${ax({ textStyle: 'caption' })} ${styles.panelEmpty} text-center`}>이벤트 수집 중...</div>
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
    <div className={`${styles.capturePanel} flex-1 flex-col min-w-0`}>
      <div className={`${ax({ textStyle: 'overline' })} ${styles.panelHeader} flex-row items-center shrink-0`}>
        <Image size={12} />
        <span>Capture</span>
        {event && <span className={`${ax({ textStyle: 'code' })} ${styles.panelCount}`}>{event.time}</span>}
      </div>
      {capture ? (
        <div className={`${styles.captureBody} flex-1 flex-col min-h-0`}>
          <div className={`${styles.captureComparison} grid flex-1 min-h-0`}>
            <div className={`${styles.captureCard} flex-col min-h-0`}>
              <div className={`${ax({ textStyle: 'overline' })} ${styles.captureLabel} shrink-0`}>Before</div>
              <div className={`${styles.capturePreview} flex-1 flex-col items-center justify-center`}>
                <Eye size={16} />
                <span className={`${ax({ textStyle: 'code', weight: 'semi' })} ${styles.captureText} text-center`}>{capture.before}</span>
              </div>
            </div>
            <div className={`${styles.captureCard} flex-col min-h-0`}>
              <div className={`${ax({ textStyle: 'overline' })} ${styles.captureLabel} shrink-0`}>After</div>
              <div className={`${styles.capturePreview} flex-1 flex-col items-center justify-center ${styles.captureChanged}`}>
                <Eye size={16} />
                <span className={`${ax({ textStyle: 'code', weight: 'semi' })} ${styles.captureText} text-center`}>{capture.after}</span>
              </div>
            </div>
          </div>
          <div className={`${ax({ textStyle: 'caption' })} ${styles.captureAi} flex-row items-start shrink-0`}>
            <Bot size={12} className="shrink-0" />
            <span>{capture.aiNote}</span>
          </div>
        </div>
      ) : (
        <div className={`${ax({ textStyle: 'caption' })} ${styles.captureEmpty} flex-1 flex-col items-center justify-center`}>
          <Eye size={24} />
          <span>타임라인에서 이벤트를 선택하세요</span>
          <kbd>↑↓</kbd>
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
  const [selectedService, setSelectedService] = useState(0)
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

  return (
    <div className={`${styles.page} grid h-full overflow-hidden`}>
      {/* Zone 1: Monitoring Bar */}
      <MonitoringBar
        services={SERVICES}
        selectedIndex={selectedService}
        onSelect={setSelectedService}
      />

      {/* Zone 2: Workspace (Timeline + Capture + Chat) */}
      <div className="flex-row min-h-0">
        <TimelinePanel
          events={TIMELINE_EVENTS}
          visibleCount={timelineVisible}
          selectedId={selectedEvent}
          onSelect={setSelectedEvent}
        />
        <CapturePanel selectedEventId={selectedEvent} />

        <div className={`${styles.chatZone} flex-col shrink-0`}>
          <div className={`${ax({ textStyle: 'overline' })} ${styles.chatHeader} flex-row items-center shrink-0`}>
            <Bot size={12} />
            <span>AI Analysis</span>
            <span className={`${ax({ textStyle: 'code' })} ${styles.chatElapsed} flex-row items-center`}>
              {endTime
                ? <><CheckCircle size={10} /><span>{((endTime - (startTime ?? 0)) / 1000).toFixed(1)}s</span></>
                : startTime
                  ? <><Loader size={10} className={styles.spinner} /><Elapsed startTime={startTime} /></>
                  : null
              }
            </span>
          </div>
          <StreamFeed
            items={items}
            feedRef={feedRef}
            isStreaming={isStreaming}
            className={`${styles.messages} flex-1 flex-col min-h-0 overflow-y-auto`}
            renderItem={(msg) => {
              if (msg.type === 'user') {
                return (
                  <div className={`${styles.userMsg} flex-row items-start justify-end`}>
                    <div className={`${styles.bubble} flex-1 min-w-0`}>
                      <div className={`${ax({ textStyle: 'caption', weight: 'medium' })} ${styles.userLabel}`}>{msg.text}</div>
                    </div>
                    <div className={`${styles.userAvatar} flex-row items-center justify-center shrink-0`}><User size={14} /></div>
                  </div>
                )
              }
              if (msg.type === 'system') {
                return (
                  <div className={styles.systemMsg}>
                    <div className={`${styles.bubble} flex-1 min-w-0`}>
                      <div className={`${ax({ textStyle: 'caption', weight: 'semi' })} ${styles.systemLabel}`}>{msg.text}</div>
                    </div>
                  </div>
                )
              }
              if (msg.type === 'tool') {
                return (
                  <div className={`${ax({ textStyle: 'code' })} ${styles.toolMsg} flex-row items-center`}>
                    <Zap size={10} />
                    <span className={`${ax({ weight: 'semi' })} ${styles.toolName}`}>{msg.toolName}</span>
                    <span className={`${styles.toolArgs} truncate`}>{msg.text}</span>
                  </div>
                )
              }
              return <AgentMessage msg={msg} active={true} />
            }}
          />
          <div className={`${styles.inputBar} flex-row items-center shrink-0`}>
            <input className={`${ax({ surface: 'input', textStyle: 'body' })} ${styles.input} flex-1 outline-none`} placeholder="AI에게 질문하세요..." disabled={isStreaming} />
            <button className={`${styles.sendBtn} flex-row items-center justify-center border-none cursor-pointer`} disabled={isStreaming} onClick={handleReplay}>
              {isStreaming ? <Loader size={14} className={styles.spinner} /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
