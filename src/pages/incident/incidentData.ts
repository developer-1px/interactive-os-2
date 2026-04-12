export interface ServiceInfo {
  name: string
  status: 'critical' | 'warning' | 'healthy'
  latency: string
}

export const SERVICES: ServiceInfo[] = [
  { name: 'payment-api', status: 'critical', latency: '2400ms' },
  { name: 'order-service', status: 'warning', latency: '890ms' },
  { name: 'checkout-web', status: 'warning', latency: '1100ms' },
  { name: 'notification-svc', status: 'healthy', latency: '45ms' },
  { name: 'user-service', status: 'healthy', latency: '32ms' },
]

export interface TimelineEvent {
  id: string
  time: string
  type: 'deploy' | 'alert' | 'config' | 'metric' | 'recovery'
  title: string
  detail: string
  severity: 'critical' | 'warning' | 'info'
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 'ev-1', time: '14:20', type: 'config', title: 'Config 변경', detail: 'pool_size: 100 → 50', severity: 'info' },
  { id: 'ev-2', time: '14:25', type: 'deploy', title: 'PR #3421 머지', detail: 'config cleanup', severity: 'warning' },
  { id: 'ev-3', time: '14:30', type: 'metric', title: 'Connection 포화', detail: 'active: 48/50', severity: 'warning' },
  { id: 'ev-4', time: '14:32', type: 'alert', title: 'P1 Alert 발생', detail: 'latency > 2000ms', severity: 'critical' },
  { id: 'ev-5', time: '14:33', type: 'metric', title: 'Pool 고갈', detail: 'active: 50/50, pending: 23', severity: 'critical' },
  { id: 'ev-6', time: '14:35', type: 'alert', title: '전파 감지', detail: 'order-service 영향', severity: 'critical' },
  { id: 'ev-7', time: '14:38', type: 'recovery', title: 'Rollback 시작', detail: 'pool_size: 50 → 200', severity: 'info' },
  { id: 'ev-8', time: '14:41', type: 'recovery', title: '정상화 확인', detail: 'latency < 100ms', severity: 'info' },
]

export interface Msg {
  id: string
  type: 'user' | 'agent' | 'system' | 'tool'
  text: string
  toolName?: string
  block?: () => React.ReactNode
  delay: number
}

export const CAPTURE_STATES: Record<string, { before: string; after: string; aiNote: string }> = {
  'ev-1': { before: 'pool_size=100', after: 'pool_size=50', aiNote: 'pool_size 절반으로.' },
  'ev-2': { before: 'v2.14.1', after: 'v2.14.2 (PR #3421)', aiNote: 'PR #3421이 pool 변경.' },
  'ev-3': { before: 'Conn: 30/100', after: 'Conn: 48/50', aiNote: '새 상한선에 근접.' },
  'ev-4': { before: 'p99: 120ms', after: 'p99: 2400ms', aiNote: '응답 시간 20배 급증.' },
  'ev-5': { before: 'Active: 48/50', after: '50/50, Pending: 23', aiNote: 'Pool 완전 고갈.' },
  'ev-6': { before: 'order-svc: OK', after: 'ERR +12%', aiNote: '하위 서비스 전파.' },
  'ev-7': { before: 'pool_size=50', after: 'pool_size=200', aiNote: 'Rollback 적용.' },
  'ev-8': { before: 'p99: 2400ms', after: 'p99: 45ms', aiNote: '완전 정상화.' },
}
