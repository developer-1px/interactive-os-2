/**
 * Chat (Claude Code session multiplexer) Zod schema — SSOT for the chat entity.
 *
 * Hierarchy: ROOT → chatSession[] → message[] (referenced by id, see ChatMessage in @os/ui/chat/types)
 *
 * 역할:
 *   - SessionList/SessionCard 가 직접 읽는 SessionCardModel 의 정의처
 *   - chatSelectors.ts 가 ChatSession → SessionCardModel 변환
 *   - chatCommands.ts 가 entity field 를 mutate
 */
import { z } from 'zod'

// ── enums ──────────────────────────────────────────────────────

export const sessionStateSchema = z.enum(['idle', 'running', 'requires_action', 'error'])
export const sessionActivitySchema = z.enum(['idle', 'thinking', 'executing', 'streaming'])

/** UI 카드가 표시하는 상태 — state + activity + isActive 의 derive 결과 */
export const sessionUiStateSchema = z.enum(['active', 'running', 'waiting', 'idle', 'error'])

export const sidebarModeSchema = z.enum(['sessions', 'files'])

// ── ChatSession entity ─────────────────────────────────────────

export const turnUsageSchema = z.object({
  input: z.number().int().nonnegative(),
  output: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  durationMs: z.number().int().nonnegative(),
})

export const chatSessionSchema = z.object({
  // ── identity ──
  id: z.string().describe('local session id'),
  sdkSessionId: z.string().describe('server-side SDK session id (for resume)'),

  // ── execution state ──
  state: sessionStateSchema,
  activity: sessionActivitySchema,

  // ── content ──
  // messages 는 사이즈가 커서 외부 ChatMessage 타입 (@os/ui/chat/types) 으로 보관.
  // Zod 스펙에는 길이만 카운트로 노출 (full validation 은 chat ui 레이어 책임).
  messageCount: z.number().int().nonnegative().default(0),
  streamingText: z.string().default(''),
  thinkingText: z.string().default(''),
  usage: turnUsageSchema.nullable().default(null),

  // ── meta (cmux 카드용) ──
  cwd: z.string().nullable().default(null).describe('working directory'),
  branch: z.string().nullable().default(null).describe('git branch at session start'),
  title: z.string().nullable().default(null).describe('user-set label'),

  // ── stats (cmux 카드용) ──
  createdAt: z.number().int(),
  lastUpdatedAt: z.number().int(),
  unreadCount: z.number().int().nonnegative().default(0),
  lastReadAt: z.number().int(),

  // ── runtime config ──
  model: z.string().default(''),
  commands: z.array(z.string()).default([]),
})

// ── UI state singleton entity ──────────────────────────────────

export const chatUiStateSchema = z.object({
  type: z.literal('ui'),
  activeSessionId: z.string().nullable().default(null),
  sidebarMode: sidebarModeSchema.default('sessions'),
  bottomVisible: z.boolean().default(false),
  composerDraft: z.string().default(''),
})

// ── derive: SessionCardModel ───────────────────────────────────

/** SessionCard 가 직접 읽는 미니 모델 — selector 가 ChatSession 에서 도출 */
export const sessionCardModelSchema = z.object({
  id: z.string(),
  uiState: sessionUiStateSchema,
  title: z.string(),
  cwd: z.string(),
  branch: z.string().nullable(),
  previewText: z.string(),
  msgCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
  lastUpdatedAgo: z.string(),
  hasGlow: z.boolean(),
})
