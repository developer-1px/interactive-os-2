/**
 * Chat TypeScript types — inferred from Zod schemas in chatSchema.ts.
 * Use these for typed entity data; never duplicate shape manually.
 */
import type { z } from 'zod'
import type {
  chatSessionSchema,
  chatUiStateSchema,
  sessionCardModelSchema,
  sessionStateSchema,
  sessionActivitySchema,
  sessionUiStateSchema,
  sidebarModeSchema,
  turnUsageSchema,
} from './chatSchema'

export type ChatSessionData    = z.infer<typeof chatSessionSchema>
export type ChatUiStateData    = z.infer<typeof chatUiStateSchema>
export type SessionCardModel   = z.infer<typeof sessionCardModelSchema>
export type TurnUsage          = z.infer<typeof turnUsageSchema>

/** 'idle' | 'running' | 'requires_action' | 'error' */
export type SessionState       = z.infer<typeof sessionStateSchema>
/** 'idle' | 'thinking' | 'executing' | 'streaming' */
export type SessionActivity    = z.infer<typeof sessionActivitySchema>
/** 'active' | 'running' | 'waiting' | 'idle' | 'error' (derived) */
export type SessionUiState     = z.infer<typeof sessionUiStateSchema>
/** 'sessions' | 'files' */
export type SidebarMode        = z.infer<typeof sidebarModeSchema>

/** 잘 알려진 UI singleton entity ID */
export const CHAT_UI_STATE_ID = '__chat-ui-state__' as const
