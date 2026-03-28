// ② 2026-03-27-claude-chat-phase-a-prd.md

// --- Client → Server ---

export type ChatWsClientMessage =
  | { type: 'create-session'; localId: string }
  | { type: 'send-message'; sessionId: string; text: string }
  | { type: 'close-session'; sessionId: string }

// --- Server → Client ---

export type ChatWsServerMessage =
  | { type: 'session-created'; sessionId: string; localId: string }
  | { type: 'session-closed'; sessionId: string }
  | { type: 'session-error'; sessionId: string; error: string }
  | { type: 'create-failed'; error: string }
  | { type: 'assistant-text'; sessionId: string; text: string }
  | { type: 'assistant-done'; sessionId: string }
  | { type: 'state-changed'; sessionId: string; state: 'idle' | 'running' | 'requires_action' }
