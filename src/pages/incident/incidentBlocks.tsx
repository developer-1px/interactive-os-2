import { ax } from '@styles/ax'
import './PageIncidentInterface.css'
import {
  GitCommit, Server, Database,
  RotateCcw, Play, Terminal,
  ArrowRight, CheckCircle, AlertTriangle, ChevronDown,
} from 'lucide-react'

export function BlockLog() {
  return (
    <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}>
      <div className={ax({ layout: 'column', textStyle: 'code', gap: 'xs' })}>
        <div className={ax({ layout: 'bar', gap: 'sm' })}><span className={ax({ text: 'muted' })}>14:35:12</span><span className={`${ax({ weight: 'semi', text: 'danger' })}`}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5002ms)</span></div>
        <div className={ax({ layout: 'bar', gap: 'sm' })}><span className={ax({ text: 'muted' })}>14:35:13</span><span className={ax({ weight: 'semi', text: 'danger' })}>ERROR</span><span>pool exhausted — cannot acquire connection (waited 5001ms)</span></div>
        <div className={ax({ layout: 'bar', gap: 'sm' })}><span className={ax({ text: 'muted' })}>14:35:14</span><span className={ax({ weight: 'semi', text: 'warning' })}>WARN</span><span>active_connections: 50/50, pending: 23</span></div>
      </div>
    </div>
  )
}

export function BlockMetric() {
  return (
    <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}>
      <div className={`incident-metric-grid grid`}>
        <div className={ax({ layout: 'column', gap: 'xs' })}><div className={ax({ textStyle: 'body', weight: 'semi' })}>50/50</div><div className={ax({ textStyle: 'caption', text: 'muted' })}>connections</div><div className={`incident-bar-track overflow-hidden`}><div className={`incident-bar-fill-bad incident-bar-w100 h-full`} /></div></div>
        <div className={ax({ layout: 'column', gap: 'xs' })}><div className={ax({ textStyle: 'body', weight: 'semi' })}>23</div><div className={ax({ textStyle: 'caption', text: 'muted' })}>pending</div><div className={`incident-bar-track overflow-hidden`}><div className={`incident-bar-fill-warn incident-bar-w46 h-full`} /></div></div>
        <div className={ax({ layout: 'column', gap: 'xs' })}><div className={ax({ textStyle: 'body', weight: 'semi' })}>2.4s</div><div className={ax({ textStyle: 'caption', text: 'muted' })}>p99 latency</div><div className={`incident-bar-track overflow-hidden`}><div className={`incident-bar-fill-bad incident-bar-w80 h-full`} /></div></div>
      </div>
    </div>
  )
}

export function BlockCause() {
  return (
    <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <div className={`${ax({ layout: 'center', text: 'danger' })} incident-cause-icon`}><GitCommit size={12} /></div>
          <div className={ax({ flex: '1' })}><div className={ax({ textStyle: 'caption', weight: 'medium' })}>PR #3421 — config cleanup</div><div className={ax({ textStyle: 'caption', text: 'muted' })}>pool_size: 100 → 50</div></div>
          <span className={ax({ textStyle: 'caption', weight: 'semi', text: 'danger' })}>87%</span>
        </div>
        <div className={`${ax({ text: 'muted' })} incident-cause-arrow`}><ChevronDown size={12} /></div>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <div className={`${ax({ layout: 'center', text: 'warning' })} incident-cause-icon`}><Database size={12} /></div>
          <div className={ax({ flex: '1' })}><div className={ax({ textStyle: 'caption', weight: 'medium' })}>DB pool 고갈</div><div className={ax({ textStyle: 'caption', text: 'muted' })}>max=50, 동시 요청 처리 불가</div></div>
        </div>
        <div className={`${ax({ text: 'muted' })} incident-cause-arrow`}><ChevronDown size={12} /></div>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          <div className={`${ax({ layout: 'center', text: 'danger' })} incident-cause-icon`}><AlertTriangle size={12} /></div>
          <div className={ax({ flex: '1' })}><div className={ax({ textStyle: 'caption', weight: 'medium' })}>p99 2.4s → 3개 서비스 전파</div></div>
        </div>
      </div>
    </div>
  )
}

export function BlockSimilar() {
  return (
    <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm', layout: 'column', gap: 'sm' })}>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <span className={ax({ textStyle: 'caption', weight: 'semi', text: 'accent' })}>INC-847</span>
        <span className={ax({ textStyle: 'caption', weight: 'semi', tone: 'success', surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text' })}>92%</span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>2주 전</span>
      </div>
      <div className={ax({ textStyle: 'caption', text: 'secondary' })}>동일: DB pool exhaustion after config change</div>
      <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', text: 'success' })}>
        <CheckCircle size={12} />
        <span>해결: pool_size 50→200 (PR #2891) — 3분 정상화</span>
      </div>
    </div>
  )
}

const BLAST_SERVICES = [
  { name: 'payment-api', status: 'p99: 2.4s', text: 'danger' as const },
  { name: 'order-service', status: 'error +12%', text: 'warning' as const },
  { name: 'checkout-web', status: 'timeout', text: 'warning' as const },
  { name: 'notification-svc', status: 'healthy', text: 'success' as const },
  { name: 'user-service', status: 'healthy', text: 'success' as const },
]

export function BlockBlast() {
  return (
    <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm', layout: 'column', gap: 'xs' })}>
      {BLAST_SERVICES.map((s, i) => (
        <div key={i} className={ax({ layout: 'bar', gap: 'sm', textStyle: 'caption' })}>
          <Server size={12} />
          <span className={ax({ weight: 'medium', flex: '1' })}>{s.name}</span>
          <span className={ax({ text: s.text })}>{s.status}</span>
        </div>
      ))}
    </div>
  )
}

export function BlockActions() {
  return (
    <div className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
      <button className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', tone: 'accent', layout: 'bar', gap: 'xs', textStyle: 'caption', weight: 'medium' })}><RotateCcw size={14} />Revert PR #3421<kbd className={ax({ textStyle: 'code' })}>1</kbd></button>
      <button className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs', textStyle: 'caption', weight: 'medium' })}><Play size={14} />Rollback v2.14.2<kbd className={ax({ textStyle: 'code' })}>2</kbd></button>
      <button className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs', textStyle: 'caption', weight: 'medium' })}><Terminal size={14} />Scale pool → 200<kbd className={ax({ textStyle: 'code' })}>3</kbd></button>
      <button className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs', textStyle: 'caption', weight: 'medium' })}><ArrowRight size={14} />Runbook<kbd className={ax({ textStyle: 'code' })}>4</kbd></button>
    </div>
  )
}
