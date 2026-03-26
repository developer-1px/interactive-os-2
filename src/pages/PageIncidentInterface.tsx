import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import styles from './PageIncidentInterface.module.css'
import {
  AlertTriangle, GitCommit, Server, Database,
  RotateCcw, Zap, Activity, ChevronDown, Play, Terminal,
  ArrowRight, CheckCircle, Loader, Bot, Send,
  User, Clock, Eye, Image,
} from 'lucide-react'
import { useStreamFeed, type SequenceItem } from '../interactive-os/ui/useStreamFeed'
import { useTypewriter } from '../interactive-os/ui/useTypewriter'
import { StreamFeed, StreamCursor } from '../interactive-os/ui/StreamFeed'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { Aria } from '../interactive-os/primitives/aria'
import { listbox } from '../interactive-os/pattern/examples/listbox'

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
      <div className={styles.logLines}>
        <div className={styles.logLine}><span className={styles.logTime}>14:35:12</span><span className={styles.logError}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5002ms)</span></div>
        <div className={styles.logLine}><span className={styles.logTime}>14:35:13</span><span className={styles.logError}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5001ms)</span></div>
        <div className={styles.logLine}><span className={styles.logTime}>14:35:14</span><span className={styles.logWarn}>WARN</span><span>active_connections: 50/50, pending: 23</span></div>
      </div>
    </div>
  )
}

function BlockMetric() {
  return (
    <div className={styles.block}>
      <div className={styles.metricGrid}>
        <div className={styles.stat}><div className={styles.statValue}>50/50</div><div className={styles.statLabel}>connections</div><div className={styles.barTrack}><div className={styles.barFillBad} style={{ width: '100%' }} /></div></div>
        <div className={styles.stat}><div className={styles.statValue}>23</div><div className={styles.statLabel}>pending</div><div className={styles.barTrack}><div className={styles.barFillWarn} style={{ width: '46%' }} /></div></div>
        <div className={styles.stat}><div className={styles.statValue}>2.4s</div><div className={styles.statLabel}>p99 latency</div><div className={styles.barTrack}><div className={styles.barFillBad} style={{ width: '80%' }} /></div></div>
      </div>
    </div>
  )
}

function BlockCause() {
  return (
    <div className={styles.block}>
      <div className={styles.causeChain}>
        <div className={styles.causeNode}>
          <div className={`${styles.causeIcon} ${styles.causeIconBad}`}><GitCommit size={12} /></div>
          <div className={styles.causeBody}><div className={styles.causeTitle}>PR #3421 — config cleanup</div><div className={styles.causeDesc}>pool_size: 100 → 50</div></div>
          <div className={styles.causeBadge}>87%</div>
        </div>
        <div className={styles.causeArrow}><ChevronDown size={12} /></div>
        <div className={styles.causeNode}>
          <div className={`${styles.causeIcon} ${styles.causeIconWarn}`}><Database size={12} /></div>
          <div className={styles.causeBody}><div className={styles.causeTitle}>DB pool 고갈</div><div className={styles.causeDesc}>max=50, 동시 요청 처리 불가</div></div>
        </div>
        <div className={styles.causeArrow}><ChevronDown size={12} /></div>
        <div className={styles.causeNode}>
          <div className={`${styles.causeIcon} ${styles.causeIconBad}`}><AlertTriangle size={12} /></div>
          <div className={styles.causeBody}><div className={styles.causeTitle}>p99 2.4s → 3개 서비스 전파</div></div>
        </div>
      </div>
    </div>
  )
}

function BlockSimilar() {
  return (
    <div className={styles.block}>
      <div className={styles.similarCard}>
        <div className={styles.similarHeader}><span className={styles.similarId}>INC-847</span><span className={styles.matchBadge}>92%</span><span className={styles.similarTime}>2주 전</span></div>
        <div className={styles.similarBody}>동일: DB pool exhaustion after config change</div>
        <div className={styles.similarResolution}><CheckCircle size={12} /><span>해결: pool_size 50→200 (PR #2891) — 3분 정상화</span></div>
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
      <div className={styles.svcList}>
        {BLAST_SERVICES.map((s, i) => (
          <div key={i} className={`${styles.svcItem} ${BLAST_CLS[s.state]}`}><Server size={12} /><span className={styles.svcName}>{s.name}</span><span className={styles.svcStatus}>{s.status}</span></div>
        ))}
      </div>
    </div>
  )
}

function BlockActions() {
  return (
    <div className={styles.actionList}>
      <button className={`${styles.action} ${styles.actionPrimary}`}><RotateCcw size={14} />Revert PR #3421<kbd>1</kbd></button>
      <button className={styles.action}><Play size={14} />Rollback v2.14.2<kbd>2</kbd></button>
      <button className={styles.action}><Terminal size={14} />Scale pool → 200<kbd>3</kbd></button>
      <button className={styles.action}><ArrowRight size={14} />Runbook<kbd>4</kbd></button>
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

const SEQUENCE: SequenceItem<Msg>[] = MESSAGES.map(msg => ({ data: msg, delay: msg.delay }))

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function AgentMessage({ msg, active }: { msg: Msg; active: boolean }) {
  const { displayed, done } = useTypewriter(msg.text, active)
  return (
    <div className={styles.agentMsg}>
      <div className={styles.avatar}><Bot size={14} /></div>
      <div className={styles.bubble}>
        <div className={styles.agentLabel}>
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
    <div className={styles.monitorBar} role="toolbar" aria-label="Service monitoring">
      <div className={styles.monitorLabel}><Activity size={12} /><span>Monitor</span></div>
      <div className={styles.monitorServices}>
        {services.map((svc, i) => (
          <button
            key={svc.name}
            className={`${styles.monitorItem} ${i === selectedIndex ? styles.monitorItemActive : ''}`}
            onClick={() => onSelect(i)}
            aria-pressed={i === selectedIndex}
          >
            <span className={`${styles.indicator} ${STATUS_CLS[svc.status]}`} />
            <span className={styles.monitorName}>{svc.name}</span>
            <span className={styles.monitorLatency}>{svc.latency}</span>
          </button>
        ))}
      </div>
      <div className={styles.monitorMeta}>
        <span className={styles.monitorMetaItem}>INC-1284</span>
        <span className={`${styles.monitorMetaItem} ${styles.monitorMetaLive}`}>REC</span>
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
  const behavior = useMemo(() => listbox(), [])
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
        className={`${styles.timelineItem} ${SEVERITY_CLS[ev.severity]} ${isSelected ? styles.timelineItemSelected : ''} ${state.focused ? styles.timelineItemFocused : ''}`}
        onClick={(e) => {
          props.onClick?.(e)
          onSelect(node.id as string)
        }}
      >
        <div className={styles.timelineTime}>{ev.time}</div>
        <div className={styles.timelineDot}>
          <span className={`${styles.dot} ${SEVERITY_CLS[ev.severity]}`} />
          <span className={styles.dotLine} />
        </div>
        <div className={styles.timelineContent}>
          <div className={styles.timelineIcon}>{EVENT_ICON[ev.type]}</div>
          <div className={styles.timelineBody}>
            <div className={styles.timelineTitle}>{ev.title}</div>
            <div className={styles.timelineDetail}>{ev.detail}</div>
          </div>
        </div>
      </div>
    )
  }, [selectedId, onSelect])

  return (
    <div className={styles.timelinePanel}>
      <div className={styles.panelHeader}>
        <Clock size={12} />
        <span>Timeline</span>
        <span className={styles.panelCount}>{visibleCount}/{events.length}</span>
      </div>
      {visibleCount > 0 ? (
        <Aria
          behavior={behavior}
          data={data}
          plugins={[]}
          aria-label="Incident timeline"
          onActivate={onSelect}
        >
          <Aria.Item render={renderItem} />
        </Aria>
      ) : (
        <div className={styles.panelEmpty}>이벤트 수집 중...</div>
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
    <div className={styles.capturePanel}>
      <div className={styles.panelHeader}>
        <Image size={12} />
        <span>Capture</span>
        {event && <span className={styles.panelCount}>{event.time}</span>}
      </div>
      {capture ? (
        <div className={styles.captureBody}>
          <div className={styles.captureComparison}>
            <div className={styles.captureCard}>
              <div className={styles.captureLabel}>Before</div>
              <div className={styles.capturePreview}>
                <Eye size={16} />
                <span className={styles.captureText}>{capture.before}</span>
              </div>
            </div>
            <div className={styles.captureCard}>
              <div className={styles.captureLabel}>After</div>
              <div className={`${styles.capturePreview} ${styles.captureChanged}`}>
                <Eye size={16} />
                <span className={styles.captureText}>{capture.after}</span>
              </div>
            </div>
          </div>
          <div className={styles.captureAi}>
            <Bot size={12} />
            <span>{capture.aiNote}</span>
          </div>
        </div>
      ) : (
        <div className={styles.captureEmpty}>
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

  const { items, isStreaming, feedRef, replay } = useStreamFeed<Msg>({
    mode: 'sequence',
    sequence: SEQUENCE,
    autoPlay: true,
  })

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
    <div className={styles.page}>
      {/* Zone 1: Monitoring Bar */}
      <MonitoringBar
        services={SERVICES}
        selectedIndex={selectedService}
        onSelect={setSelectedService}
      />

      {/* Zone 2: Workspace (Timeline + Capture + Chat) */}
      <div className={styles.workspace}>
        <TimelinePanel
          events={TIMELINE_EVENTS}
          visibleCount={timelineVisible}
          selectedId={selectedEvent}
          onSelect={setSelectedEvent}
        />
        <CapturePanel selectedEventId={selectedEvent} />

        <div className={styles.chatZone}>
          <div className={styles.chatHeader}>
            <Bot size={12} />
            <span>AI Analysis</span>
            <span className={styles.chatElapsed}>
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
            className={styles.messages}
            renderItem={(msg) => {
              if (msg.type === 'user') {
                return (
                  <div className={styles.userMsg}>
                    <div className={styles.bubble}>
                      <div className={styles.userLabel}>{msg.text}</div>
                    </div>
                    <div className={styles.userAvatar}><User size={14} /></div>
                  </div>
                )
              }
              if (msg.type === 'system') {
                return (
                  <div className={styles.systemMsg}>
                    <div className={styles.bubble}>
                      <div className={styles.systemLabel}>{msg.text}</div>
                    </div>
                  </div>
                )
              }
              if (msg.type === 'tool') {
                return (
                  <div className={styles.toolMsg}>
                    <Zap size={10} />
                    <span className={styles.toolName}>{msg.toolName}</span>
                    <span className={`${styles.toolArgs} truncate`}>{msg.text}</span>
                  </div>
                )
              }
              return <AgentMessage msg={msg} active={true} />
            }}
          />
          <div className={styles.inputBar}>
            <input className={styles.input} placeholder="AI에게 질문하세요..." disabled={isStreaming} />
            <button className={styles.sendBtn} disabled={isStreaming} onClick={handleReplay}>
              {isStreaming ? <Loader size={14} className={styles.spinner} /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
