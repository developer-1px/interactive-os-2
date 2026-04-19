import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import './PageIncidentInterface.css'
import {
  GitCommit, Server, Database,
  RotateCcw, Play, Terminal,
  ArrowRight, CheckCircle, AlertTriangle, ChevronDown,
} from 'lucide-react'

export function BlockLog() {
  return (
    <div className={ax({ surface: 'display' })}>
      <div className={ax({ layout: 'stack', textStyle: 'code' })}>
        <div className={ax({ layout: 'bar' })}><span className={ax({ })}>14:35:12</span><span className={`${ax({ tone: 'danger' })}`}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5002ms)</span></div>
        <div className={ax({ layout: 'bar' })}><span className={ax({ })}>14:35:13</span><span className={ax({ tone: 'danger' })}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5001ms)</span></div>
        <div className={ax({ layout: 'bar' })}><span className={ax({ })}>14:35:14</span><span className={ax({ tone: 'warning' })}>WARN</span><span>active_connections: 50/50, pending: 23</span></div>
      </div>
    </div>
  )
}

export function BlockMetric() {
  return (
    <div className={ax({ surface: 'display' })}>
      <div className={`incident-metric-grid grid`}>
        <div className={ax({ layout: 'stack' })}><div className={ax({ textStyle: 'body' })}>50/50</div><div className={ax({ textStyle: 'caption' })}>connections</div><div className={`incident-bar-track ${ax({ })}`}><div className={`incident-bar-fill-bad incident-bar-w100 h-full`} /></div></div>
        <div className={ax({ layout: 'stack' })}><div className={ax({ textStyle: 'body' })}>23</div><div className={ax({ textStyle: 'caption' })}>pending</div><div className={`incident-bar-track ${ax({ })}`}><div className={`incident-bar-fill-warn incident-bar-w46 h-full`} /></div></div>
        <div className={ax({ layout: 'stack' })}><div className={ax({ textStyle: 'body' })}>2.4s</div><div className={ax({ textStyle: 'caption' })}>p99 latency</div><div className={`incident-bar-track ${ax({ })}`}><div className={`incident-bar-fill-bad incident-bar-w80 h-full`} /></div></div>
      </div>
    </div>
  )
}

export function BlockCause() {
  return (
    <div className={ax({ surface: 'display' })}>
      <div className={ax({ layout: 'stack' })}>
        <div className={ax({ layout: 'bar' })}>
          <div className={`${ax({ layout: 'center', tone: 'danger' })} incident-cause-icon`}><GitCommit size={12} /></div>
          <div className={ax({ flex: '1' })}><div className={ax({ textStyle: 'caption' })}>PR #3421 — config cleanup</div><div className={ax({ textStyle: 'caption' })}>pool_size: 100 → 50</div></div>
          <span className={ax({ textStyle: 'caption', tone: 'danger' })}>연관 87%</span>
        </div>
        <div className={`${ax({ })} incident-cause-arrow`}><ChevronDown size={12} /></div>
        <div className={ax({ layout: 'bar' })}>
          <div className={`${ax({ layout: 'center', tone: 'warning' })} incident-cause-icon`}><Database size={12} /></div>
          <div className={ax({ flex: '1' })}><div className={ax({ textStyle: 'caption' })}>DB pool 고갈</div><div className={ax({ textStyle: 'caption' })}>max=50, 동시 요청 처리 불가</div></div>
        </div>
        <div className={`${ax({ })} incident-cause-arrow`}><ChevronDown size={12} /></div>
        <div className={ax({ layout: 'bar' })}>
          <div className={`${ax({ layout: 'center', tone: 'danger' })} incident-cause-icon`}><AlertTriangle size={12} /></div>
          <div className={ax({ flex: '1' })}><div className={ax({ textStyle: 'caption' })}>p99 2.4s → 3개 서비스 전파</div></div>
        </div>
      </div>
    </div>
  )
}

export function BlockSimilar() {
  return (
    <div className={ax({ surface: 'display', layout: 'stack' })}>
      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ textStyle: 'caption', tone: 'accent' })}>INC-847</span>
        <span className={ax({ role: 'badge', tone: 'success', surface: 'ghost', content: 'text' })}>92%</span>
        <span className={ax({ textStyle: 'caption' })}>2주 전</span>
      </div>
      <div className={ax({ textStyle: 'caption' })}>동일: DB pool exhaustion after config change</div>
      <div className={ax({ layout: 'bar', textStyle: 'caption', tone: 'success' })}>
        <CheckCircle size={12} />
        <span>해결: pool_size 50→200 (PR #2891) — 3분 정상화</span>
      </div>
    </div>
  )
}

const BLAST_SERVICES = [
  { name: 'payment-api', status: 'p99: 2.4s', tone: 'danger' as const },
  { name: 'order-service', status: 'error +12%', tone: 'warning' as const },
  { name: 'checkout-web', status: 'timeout', tone: 'warning' as const },
  { name: 'notification-svc', status: 'healthy', tone: 'success' as const },
  { name: 'user-service', status: 'healthy', tone: 'success' as const },
]

export function BlockBlast() {
  return (
    <div className={ax({ surface: 'display', layout: 'stack' })}>
      {BLAST_SERVICES.map((s, i) => (
        <div key={i} className={ax({ layout: 'bar', textStyle: 'caption' })}>
          <Server size={12} />
          <span className={ax({ flex: '1' })}>{s.name}</span>
          <span className={ax({ tone: s.tone })}>{s.status}</span>
        </div>
      ))}
    </div>
  )
}

export function BlockActions() {
  return (
    <div className={ax({ layout: 'row' })}>
      <Button variant="accent"><RotateCcw size={14} />Revert PR #3421<kbd className={ax({ textStyle: 'code' })}>1</kbd></Button>
      <Button variant="accent" tone="neutral"><Play size={14} />Rollback v2.14.2<kbd className={ax({ textStyle: 'code' })}>2</kbd></Button>
      <Button variant="accent" tone="neutral"><Terminal size={14} />Scale pool → 200<kbd className={ax({ textStyle: 'code' })}>3</kbd></Button>
      <Button variant="accent" tone="neutral"><ArrowRight size={14} />Runbook<kbd className={ax({ textStyle: 'code' })}>4</kbd></Button>
    </div>
  )
}
