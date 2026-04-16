import { BlockLog, BlockMetric, BlockCause, BlockSimilar, BlockBlast, BlockActions } from './incidentBlocks'

// ═══════════════════════════════════════════
// Service monitoring
// ═══════════════════════════════════════════

export interface ServiceInfo {
  name: string
  status: 'critical' | 'warning' | 'healthy'
  latency: string
  errorRate: string
}

export const SERVICES: ServiceInfo[] = [
  { name: 'payment-api', status: 'critical', latency: '2400ms', errorRate: '12%' },
  { name: 'order-service', status: 'warning', latency: '890ms', errorRate: '3.2%' },
  { name: 'checkout-web', status: 'warning', latency: '1100ms', errorRate: '5.1%' },
  { name: 'notification-svc', status: 'healthy', latency: '45ms', errorRate: '0.1%' },
  { name: 'user-service', status: 'healthy', latency: '32ms', errorRate: '0%' },
]

// ═══════════════════════════════════════════
// Timeline events
// ═══════════════════════════════════════════

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
  { id: 'ev-2', time: '14:25', type: 'deploy', title: 'PR #3421 머지', detail: 'config cleanup — pool_size 축소', severity: 'warning' },
  { id: 'ev-3', time: '14:30', type: 'metric', title: 'Connection 포화', detail: 'active: 48/50, pending: 5', severity: 'warning' },
  { id: 'ev-4', time: '14:32', type: 'alert', title: 'P1 Alert 발생', detail: 'payment-api latency > 2000ms', severity: 'critical' },
  { id: 'ev-5', time: '14:33', type: 'metric', title: 'Pool 고갈', detail: 'active: 50/50, pending: 23', severity: 'critical' },
  { id: 'ev-6', time: '14:35', type: 'alert', title: '전파 감지', detail: 'order-service, checkout-web 영향', severity: 'critical' },
  { id: 'ev-7', time: '14:38', type: 'recovery', title: 'Rollback 시작', detail: 'pool_size: 50 → 200', severity: 'info' },
  { id: 'ev-8', time: '14:41', type: 'recovery', title: '정상화 확인', detail: 'latency < 100ms, error 0%', severity: 'info' },
]

// ═══════════════════════════════════════════
// Chat message sequence
// ═══════════════════════════════════════════

export interface Msg {
  id: string
  type: 'user' | 'agent' | 'system' | 'tool'
  text: string
  toolName?: string
  block?: () => React.ReactNode
  delay: number
}

export const MESSAGES: Msg[] = [
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
// Capture comparison data
// ═══════════════════════════════════════════

export const CAPTURE_STATES: Record<string, { before: string; after: string; aiNote: string }> = {
  'ev-1': { before: 'Config: pool_size=100', after: 'Config: pool_size=50', aiNote: 'pool_size 값이 절반으로 줄었습니다.' },
  'ev-2': { before: 'Deployment: v2.14.1', after: 'Deployment: v2.14.2 (PR #3421)', aiNote: 'PR #3421이 pool 설정을 변경했습니다.' },
  'ev-3': { before: 'Connections: 30/100', after: 'Connections: 48/50', aiNote: '연결 수가 새 상한선에 근접했습니다.' },
  'ev-4': { before: 'Latency p99: 120ms', after: 'Latency p99: 2400ms', aiNote: '응답 시간 20배 급증 — pool 고갈 영향.' },
  'ev-5': { before: 'Active: 48/50, Pending: 5', after: 'Active: 50/50, Pending: 23', aiNote: 'Pool 완전 고갈. 대기 큐 급증 중.' },
  'ev-6': { before: 'order-svc: OK, checkout: OK', after: 'order-svc: ERR +12%, checkout: TIMEOUT', aiNote: '장애가 하위 서비스로 전파되었습니다.' },
  'ev-7': { before: 'pool_size=50', after: 'pool_size=200 (rollback)', aiNote: 'Rollback 적용. 복구 진행 중.' },
  'ev-8': { before: 'Latency p99: 2400ms', after: 'Latency p99: 45ms', aiNote: '완전 정상화. 모든 지표 기준선 복귀.' },
}
