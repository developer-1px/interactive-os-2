/**
 * Chat fixtures — 3 sample sessions for SessionCard / SessionList demo + tests.
 *
 * 시나리오 커버리지:
 *   1. running     — 응답 생성 중 (thinking)
 *   2. requires_action — 사용자 입력 대기 (waiting → glow + unread badge)
 *   3. idle        — 완료된 과거 세션
 */
import type { ChatSessionData } from './chatTypes'

const NOW = 1745000000000 // 2026-04-18T17:13:20Z 기준 (테스트 결정성)

export const chatSessionFixtures: Record<string, ChatSessionData> = {
  'session-1-l8m9k': {
    id: 'session-1-l8m9k',
    sdkSessionId: 'sk-7c3a',
    state: 'running',
    activity: 'thinking',
    messageCount: 47,
    streamingText: 'Reading src/pages/todo/...',
    thinkingText: '',
    usage: { input: 8240, output: 1024, costUsd: 0.045, durationMs: 5200 },
    cwd: '/Users/user/Desktop/aria',
    branch: 'main',
    title: null,
    createdAt: NOW - 600_000,
    lastUpdatedAt: NOW - 120_000,
    unreadCount: 0,
    lastReadAt: NOW - 120_000,
    model: 'claude-opus-4-7',
    commands: [],
  },
  'session-2-q2vt8': {
    id: 'session-2-q2vt8',
    sdkSessionId: 'sk-9f1b',
    state: 'requires_action',
    activity: 'idle',
    messageCount: 12,
    streamingText: '',
    thinkingText: '',
    usage: null,
    cwd: '/Users/user/Desktop/aria',
    branch: 'feat/cms-flat',
    title: 'CMS flat refactor',
    createdAt: NOW - 4_200_000,
    lastUpdatedAt: NOW - 300_000,
    unreadCount: 3,
    lastReadAt: NOW - 4_200_000,
    model: 'claude-sonnet-4-6',
    commands: ['bash:pnpm test'],
  },
  'session-3-tg5wn': {
    id: 'session-3-tg5wn',
    sdkSessionId: 'sk-3d8e',
    state: 'idle',
    activity: 'idle',
    messageCount: 23,
    streamingText: '',
    thinkingText: '',
    usage: { input: 1200, output: 580, costUsd: 0.012, durationMs: 2800 },
    cwd: '/Users/user/playground',
    branch: 'experiment',
    title: null,
    createdAt: NOW - 11_400_000,
    lastUpdatedAt: NOW - 10_500_000,
    unreadCount: 0,
    lastReadAt: NOW - 10_500_000,
    model: 'claude-haiku-4-5-20251001',
    commands: [],
  },
}

/** Last-read message preview (real chat 에서는 message 본문에서 derive) */
export const previewTextFixtures: Record<string, string> = {
  'session-1-l8m9k': 'refactoring todoStore to use defineCommands...',
  'session-2-q2vt8': 'what should the panel look like for empty state?',
  'session-3-tg5wn': 'commit pushed to experiment branch',
}

/** Default UI singleton (active = first running session) */
export const chatUiStateFixture = {
  type: 'ui' as const,
  activeSessionId: 'session-1-l8m9k',
  sidebarMode: 'sessions' as const,
  bottomVisible: false,
  composerDraft: '',
}
