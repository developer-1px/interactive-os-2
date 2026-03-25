import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './PageIncidentInterface.module.css'
import {
  AlertTriangle, GitCommit, Server, Database,
  RotateCcw, Zap, Activity, ChevronDown, Play, Terminal,
  ArrowRight, CheckCircle, Loader, History, Bot, Send,
  User, Clock,
} from 'lucide-react'
import { useStreamFeed, type SequenceItem } from '../interactive-os/ui/useStreamFeed'
import { useTypewriter } from '../interactive-os/ui/useTypewriter'
import { StreamFeed, StreamCursor } from '../interactive-os/ui/StreamFeed'

// --- Rich block components ---

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

function BlockBlast() {
  const services = [
    { name: 'payment-api', status: 'p99: 2.4s', state: 'bad' as const },
    { name: 'order-service', status: 'error +12%', state: 'warn' as const },
    { name: 'checkout-web', status: 'timeout', state: 'warn' as const },
    { name: 'notification-svc', status: 'healthy', state: 'ok' as const },
    { name: 'user-service', status: 'healthy', state: 'ok' as const },
  ]
  const cls = { bad: styles.svcBad, warn: styles.svcWarn, ok: styles.svcOk }
  return (
    <div className={styles.block}>
      <div className={styles.svcList}>
        {services.map((s, i) => (
          <div key={i} className={`${styles.svcItem} ${cls[s.state]}`}><Server size={12} /><span className={styles.svcName}>{s.name}</span><span className={styles.svcStatus}>{s.status}</span></div>
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

// --- Message types ---

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
  { id: 'metric', type: 'agent', text: 'Connection pool 고갈 패턴입니다. active connections이 max에 도달했고, pending 큐가 쌓이면서 latency가 치솟고 있습니다.', block: BlockMetric, delay: 1400 },
  { id: 'tool-git', type: 'tool', text: 'getRecentChanges("payment-api", hours=2)', toolName: 'getRecentChanges', delay: 600 },
  { id: 'cause', type: 'agent', text: '원인을 추적했습니다. 14:32에 머지된 PR #3421이 pool_size를 100에서 50으로 줄였습니다.', block: BlockCause, delay: 1500 },
  { id: 'tool-similar', type: 'tool', text: 'searchIncidents("pool exhaustion", similarity=0.7)', toolName: 'searchIncidents', delay: 600 },
  { id: 'similar', type: 'agent', text: '유사한 과거 인시던트를 찾았습니다. 2주 전 INC-847과 92% 일치합니다.', block: BlockSimilar, delay: 1200 },
  { id: 'tool-blast', type: 'tool', text: 'getServiceDependencies("payment-api")', toolName: 'getServiceDependencies', delay: 600 },
  { id: 'blast', type: 'agent', text: '영향 범위: payment-api 포함 3개 서비스가 영향받고 있습니다. 나머지 2개는 정상입니다.', block: BlockBlast, delay: 1000 },
  { id: 'decide', type: 'agent', text: '분석 완료. INC-847과 동일 패턴이며, pool_size 복원으로 3분 내 정상화가 예상됩니다. 행동을 선택하세요.', block: BlockActions, delay: 800 },
]

const SEQUENCE: SequenceItem<Msg>[] = MESSAGES.map(msg => ({ data: msg, delay: msg.delay }))

// --- Agent message with typewriter ---

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

// --- Elapsed timer ---

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

// --- Main ---

export default function PageIncidentInterface() {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)

  const { items, isStreaming, feedRef, replay } = useStreamFeed<Msg>({
    mode: 'sequence',
    sequence: SEQUENCE,
    autoPlay: true,
  })

  // Track timing — items.length drives timing via a prev-length ref
  const prevItemsLenRef = useRef(0)
  const len = items.length

  useEffect(() => {
    if (len >= 1 && prevItemsLenRef.current === 0) {
      queueMicrotask(() => {
        setStartTime(Date.now())
        setEndTime(null)
      })
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
    replay()
  }, [replay])

  const visibleCount = items.length

  // Context panel state
  const showMetric = visibleCount >= 6
  const showCause = visibleCount >= 8
  const showBlast = visibleCount >= 12
  const showSimilar = visibleCount >= 10

  return (
    <div className={styles.chat}>
      <div className={styles.chatBody}>
        <div className={styles.messagesCol}>
          <StreamFeed
            items={items}
            feedRef={feedRef}
            isStreaming={isStreaming}
            className={styles.messages}
            renderItem={(msg, _i, { isLatest: _ }) => {
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
                    <span className={styles.toolArgs}>{msg.text}</span>
                  </div>
                )
              }
              // agent
              return <AgentMessage msg={msg} active={true} />
            }}
          />

          <div className={styles.inputBar}>
            <input className={styles.input} placeholder="메시지를 입력하세요..." disabled={isStreaming} />
            <button className={styles.sendBtn} disabled={isStreaming} onClick={handleReplay}>
              {isStreaming ? <Loader size={14} className={styles.spinner} /> : <Send size={14} />}
            </button>
          </div>
        </div>

        {/* Context panel */}
        <div className={styles.contextPanel}>
          <div className={styles.panelSection}>
            <div className={styles.panelTitle}><Clock size={12} /><span>Elapsed</span></div>
            <div className={styles.elapsed}>
              {endTime
                ? <><CheckCircle size={12} /><span>{((endTime - (startTime ?? 0)) / 1000).toFixed(1)}s</span></>
                : <><Loader size={12} className={styles.spinner} /><Elapsed startTime={startTime} /></>
              }
            </div>
          </div>

          <div className={styles.panelSection}>
            <div className={styles.panelTitle}><Activity size={12} /><span>Live Metrics</span></div>
            {showMetric ? (
              <div className={styles.liveMetrics}>
                <div className={styles.liveStat}><span className={styles.liveValue}>50/50</span><span className={styles.liveLabel}>connections</span><div className={styles.barTrack}><div className={styles.barFillBad} style={{ width: '100%' }} /></div></div>
                <div className={styles.liveStat}><span className={styles.liveValue}>2.4s</span><span className={styles.liveLabel}>p99 latency</span><div className={styles.barTrack}><div className={styles.barFillBad} style={{ width: '80%' }} /></div></div>
                <div className={styles.liveStat}><span className={styles.liveValue}>12%</span><span className={styles.liveLabel}>error rate</span><div className={styles.barTrack}><div className={styles.barFillWarn} style={{ width: '24%' }} /></div></div>
              </div>
            ) : <div className={styles.panelEmpty}>수집 중...</div>}
          </div>

          <div className={styles.panelSection}>
            <div className={styles.panelTitle}><Server size={12} /><span>Services</span></div>
            {showBlast ? (
              <div className={styles.svcList}>
                {[
                  { name: 'payment-api', state: 'bad' as const },
                  { name: 'order-service', state: 'warn' as const },
                  { name: 'checkout-web', state: 'warn' as const },
                  { name: 'notification-svc', state: 'ok' as const },
                  { name: 'user-service', state: 'ok' as const },
                ].map((s, i) => (
                  <div key={i} className={`${styles.svcItem} ${{ bad: styles.svcBad, warn: styles.svcWarn, ok: styles.svcOk }[s.state]}`}><Server size={10} /><span className={styles.svcName}>{s.name}</span></div>
                ))}
              </div>
            ) : <div className={styles.panelEmpty}>확인 중...</div>}
          </div>

          <div className={styles.panelSection}>
            <div className={styles.panelTitle}><GitCommit size={12} /><span>Root Cause</span></div>
            {showCause ? (
              <div className={styles.panelCause}>
                <div className={styles.panelCauseTitle}>PR #3421</div>
                <div className={styles.panelCauseDesc}>pool_size: 100 → 50</div>
                <div className={styles.causeBadge}>87%</div>
              </div>
            ) : <div className={styles.panelEmpty}>분석 중...</div>}
          </div>

          <div className={styles.panelSection}>
            <div className={styles.panelTitle}><History size={12} /><span>Similar</span></div>
            {showSimilar ? (
              <div className={styles.panelSimilar}><span className={styles.similarId}>INC-847</span><span className={styles.matchBadge}>92%</span></div>
            ) : <div className={styles.panelEmpty}>검색 중...</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
