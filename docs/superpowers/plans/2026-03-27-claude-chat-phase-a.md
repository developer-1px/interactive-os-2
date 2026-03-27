# Claude Code Web Chat (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 브라우저에서 Claude Code 세션을 시작/종료하고 채팅(텍스트 송수신 + 스트리밍)할 수 있는 웹 클라이언트를 만든다.

**Architecture:** Vite dev server plugin이 WebSocket 엔드포인트를 제공하고, `@anthropic-ai/claude-agent-sdk` V2 API로 Claude CLI subprocess를 관리한다. 브라우저는 WebSocket으로 세션 생성/메시지 전송/종료를 요청하고, SDK 스트리밍 응답을 실시간 수신한다. Monitor(PageAgentViewer)와 완전히 분리된 `/chat` 라우트.

**Tech Stack:** React, @anthropic-ai/claude-agent-sdk (V2 unstable API), WebSocket (Vite server.ws), useSyncExternalStore

**PRD:** `docs/superpowers/specs/2026-03-27-claude-chat-phase-a-prd.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/pages/chat/chatStore.ts` | Chat 모드 상태 관리 — WS 연결, 세션 목록, 메시지, 연결 상태. useSyncExternalStore 기반 |
| Create | `src/pages/chat/chatWsProtocol.ts` | WS 메시지 프로토콜 타입 정의 (client↔server 공유) |
| Create | `src/pages/chat/PageAgentChat.tsx` | Chat 모드 페이지 — 세션 목록 사이드바 + 채팅 영역 |
| Create | `src/pages/chat/PageAgentChat.module.css` | Chat 페이지 스타일 |
| Modify | `vite-plugin-agent-ops.ts` | WebSocket 핸들러 추가 — SDK session spawn/send/close + 스트리밍 relay |
| Modify | `src/router.tsx` | `/chat` 라우트 등록 |

---

### Task 1: WS 프로토콜 타입 정의

**Files:**
- Create: `src/pages/chat/chatWsProtocol.ts`

- [ ] **Step 1: 프로토콜 타입 파일 작성**

```typescript
// ② 2026-03-27-claude-chat-phase-a-prd.md

// --- Client → Server ---

export type ChatWsClientMessage =
  | { type: 'create-session' }
  | { type: 'send-message'; sessionId: string; text: string }
  | { type: 'close-session'; sessionId: string }

// --- Server → Client ---

export type ChatWsServerMessage =
  | { type: 'session-created'; sessionId: string }
  | { type: 'session-closed'; sessionId: string }
  | { type: 'session-error'; sessionId: string; error: string }
  | { type: 'assistant-text'; sessionId: string; text: string }
  | { type: 'assistant-done'; sessionId: string }
  | { type: 'state-changed'; sessionId: string; state: 'idle' | 'running' | 'requires_action' }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/chat/chatWsProtocol.ts
git commit -m "feat: chat WS protocol types"
```

---

### Task 2: Vite plugin — WebSocket + Agent SDK 세션 관리

**Files:**
- Modify: `vite-plugin-agent-ops.ts`

**Context:**
- Agent SDK V2 API: `unstable_v2_createSession(options)` → `SDKSession { send(), stream(), close(), sessionId }`
- `SDKSessionOptions`: `{ model: string, permissionMode?: 'default' | 'acceptEdits' | 'plan' | 'dontAsk', includePartialMessages?: boolean }`
- `SDKMessage` 중 Phase A에서 처리할 타입: `assistant` (완료된 메시지), `stream_event` (토큰 스트리밍), `system.session_state_changed`
- `stream_event.event`는 `BetaRawMessageStreamEvent` — `content_block_delta` 이벤트의 `delta.text`가 토큰 텍스트
- Vite의 `server.ws`를 통해 커스텀 WebSocket 이벤트 송수신 가능: `server.ws.on('chat:client', handler)`, `server.ws.send('chat:server', payload)`

- [ ] **Step 1: import 추가 + 세션 관리 Map 선언**

`vite-plugin-agent-ops.ts`의 `configureServer(server)` 내부, 기존 코드 하단에 추가:

```typescript
// --- Chat mode: Agent SDK session management ---
import type { SDKSession, SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { ChatWsClientMessage, ChatWsServerMessage } from './src/pages/chat/chatWsProtocol'

const chatSessions = new Map<string, SDKSession>()
```

참고: `unstable_v2_createSession`은 ESM-only export이므로 dynamic import 사용 필요: `const { unstable_v2_createSession } = await import('@anthropic-ai/claude-agent-sdk')`

- [ ] **Step 2: WebSocket 핸들러 — create-session**

`configureServer` 내부에 WS 핸들러 등록:

```typescript
server.ws.on('chat:client', async (rawData: string) => {
  let msg: ChatWsClientMessage
  try { msg = JSON.parse(rawData) } catch { return }

  if (msg.type === 'create-session') {
    try {
      const { unstable_v2_createSession } = await import('@anthropic-ai/claude-agent-sdk')
      const session = unstable_v2_createSession({
        model: 'claude-sonnet-4-6',
        permissionMode: 'acceptEdits',
      })

      // Stream in background
      ;(async () => {
        let currentText = ''
        for await (const sdkMsg of session.stream()) {
          const sessionId = session.sessionId
          handleSdkMessage(sessionId, sdkMsg, server, () => currentText, (t) => { currentText = t })
        }
      })()

      // Wait for session to be ready (first message gives sessionId)
      // Small delay to let the stream start and sessionId to be assigned
      await new Promise(r => setTimeout(r, 500))
      const sessionId = session.sessionId
      chatSessions.set(sessionId, session)

      const reply: ChatWsServerMessage = { type: 'session-created', sessionId }
      server.ws.send('chat:server', JSON.stringify(reply))
    } catch (e) {
      const reply: ChatWsServerMessage = { type: 'session-error', sessionId: '', error: String(e) }
      server.ws.send('chat:server', JSON.stringify(reply))
    }
  }
})
```

- [ ] **Step 3: send-message + close-session 핸들러**

같은 `server.ws.on('chat:client', ...)` 내부에 분기 추가:

```typescript
  if (msg.type === 'send-message') {
    const session = chatSessions.get(msg.sessionId)
    if (!session) {
      const reply: ChatWsServerMessage = { type: 'session-error', sessionId: msg.sessionId, error: 'Session not found' }
      server.ws.send('chat:server', JSON.stringify(reply))
      return
    }
    await session.send(msg.text)
  }

  if (msg.type === 'close-session') {
    const session = chatSessions.get(msg.sessionId)
    if (session) {
      session.close()
      chatSessions.delete(msg.sessionId)
      const reply: ChatWsServerMessage = { type: 'session-closed', sessionId: msg.sessionId }
      server.ws.send('chat:server', JSON.stringify(reply))
    }
  }
```

- [ ] **Step 4: SDK 메시지 핸들러 함수**

`configureServer` 바깥(플러그인 파일 스코프)에 헬퍼 추가:

```typescript
function handleSdkMessage(
  sessionId: string,
  sdkMsg: SDKMessage,
  server: { ws: { send: (event: string, data: string) => void } },
  getText: () => string,
  setText: (t: string) => void,
) {
  // Streaming token
  if (sdkMsg.type === 'stream_event') {
    const evt = sdkMsg.event
    if (evt.type === 'content_block_delta' && 'delta' in evt && 'text' in (evt.delta as Record<string, unknown>)) {
      const text = (evt.delta as { text: string }).text
      setText(getText() + text)
      const reply: ChatWsServerMessage = { type: 'assistant-text', sessionId, text }
      server.ws.send('chat:server', JSON.stringify(reply))
    }
    return
  }

  // Complete assistant message — flush accumulated text
  if (sdkMsg.type === 'assistant') {
    setText('')
    const reply: ChatWsServerMessage = { type: 'assistant-done', sessionId }
    server.ws.send('chat:server', JSON.stringify(reply))
    return
  }

  // Session state change
  if (sdkMsg.type === 'system' && 'subtype' in sdkMsg && sdkMsg.subtype === 'session_state_changed') {
    const state = (sdkMsg as { state: 'idle' | 'running' | 'requires_action' }).state
    const reply: ChatWsServerMessage = { type: 'state-changed', sessionId, state }
    server.ws.send('chat:server', JSON.stringify(reply))
  }
}
```

- [ ] **Step 5: Cleanup on server close**

기존 `server.close` 래핑 부분에 chatSessions 정리 추가:

```typescript
// 기존 origClose 코드 근처에:
for (const [id, session] of chatSessions) {
  session.close()
  chatSessions.delete(id)
}
```

- [ ] **Step 6: typecheck**

Run: `pnpm typecheck`
Expected: PASS (0 errors)

- [ ] **Step 7: Commit**

```bash
git add vite-plugin-agent-ops.ts
git commit -m "feat: chat WS handler with Agent SDK session management"
```

---

### Task 3: chatStore — 클라이언트 상태 관리

**Files:**
- Create: `src/pages/chat/chatStore.ts`

**Context:**
- viewerStore.ts 패턴을 참고하되, 데이터 소스가 SSE → WebSocket으로 다름
- HMR-safe: `import.meta.hot.data`에 상태 보존
- useSyncExternalStore 기반 React 바인딩
- Vite 클라이언트 WS API: `import.meta.hot.send(event, data)`, `import.meta.hot.on(event, cb)`

- [ ] **Step 1: chatStore.ts 작성**

```typescript
// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useSyncExternalStore, useCallback } from 'react'
import type { ChatWsClientMessage, ChatWsServerMessage } from './chatWsProtocol'
import type { ChatMessage } from '../../interactive-os/ui/chat/types'

// --- State ---

interface ChatSession {
  id: string
  messages: ChatMessage[]
  state: 'idle' | 'running' | 'requires_action'
  streamingText: string
}

interface ChatStoreState {
  sessions: Map<string, ChatSession>
  activeSessionId: string | null
  connected: boolean
  subs: Set<() => void>
}

// --- HMR-safe init ---

function getStore(): ChatStoreState {
  if (import.meta.hot?.data?.chatStore) {
    return import.meta.hot.data.chatStore as ChatStoreState
  }
  const state: ChatStoreState = {
    sessions: new Map(),
    activeSessionId: null,
    connected: false,
    subs: new Set(),
  }
  if (import.meta.hot) {
    import.meta.hot.data.chatStore = state
  }
  return state
}

const S = getStore()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    S.subs.clear()
  })
}

function notify() {
  for (const cb of S.subs) cb()
}

// --- WS connection ---

function setupWs() {
  if (!import.meta.hot) return
  S.connected = true

  import.meta.hot.on('chat:server', (rawData: string) => {
    let msg: ChatWsServerMessage
    try { msg = JSON.parse(rawData) } catch { return }

    if (msg.type === 'session-created') {
      const session: ChatSession = {
        id: msg.sessionId,
        messages: [],
        state: 'idle',
        streamingText: '',
      }
      S.sessions.set(msg.sessionId, session)
      S.activeSessionId = msg.sessionId
      notify()
      return
    }

    if (msg.type === 'assistant-text') {
      const session = S.sessions.get(msg.sessionId)
      if (!session) return
      session.streamingText += msg.text
      notify()
      return
    }

    if (msg.type === 'assistant-done') {
      const session = S.sessions.get(msg.sessionId)
      if (!session) return
      if (session.streamingText) {
        session.messages = [...session.messages, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          ts: Date.now(),
          blocks: [{ type: 'text', content: session.streamingText }],
        }]
        session.streamingText = ''
      }
      notify()
      return
    }

    if (msg.type === 'state-changed') {
      const session = S.sessions.get(msg.sessionId)
      if (session) {
        session.state = msg.state
        notify()
      }
      return
    }

    if (msg.type === 'session-closed') {
      S.sessions.delete(msg.sessionId)
      if (S.activeSessionId === msg.sessionId) {
        S.activeSessionId = S.sessions.size > 0 ? S.sessions.keys().next().value ?? null : null
      }
      notify()
      return
    }

    if (msg.type === 'session-error') {
      console.error('[chat]', msg.error)
      return
    }
  })
}

setupWs()

// --- Actions ---

function wsSend(msg: ChatWsClientMessage) {
  if (!import.meta.hot) return
  import.meta.hot.send('chat:client', JSON.stringify(msg))
}

export function createSession() {
  wsSend({ type: 'create-session' })
}

export function sendMessage(sessionId: string, text: string) {
  const session = S.sessions.get(sessionId)
  if (!session) return

  // Add user message immediately
  session.messages = [...session.messages, {
    id: `user-${Date.now()}`,
    role: 'user',
    ts: Date.now(),
    blocks: [{ type: 'text', content: text }],
  }]
  notify()

  wsSend({ type: 'send-message', sessionId, text })
}

export function closeSession(sessionId: string) {
  wsSend({ type: 'close-session', sessionId })
}

export function setActiveSession(sessionId: string) {
  S.activeSessionId = sessionId
  notify()
}

// --- React hooks ---

export function useActiveSession(): ChatSession | null {
  const subscribe = useCallback((cb: () => void) => {
    S.subs.add(cb)
    return () => { S.subs.delete(cb) }
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => S.activeSessionId ? S.sessions.get(S.activeSessionId) ?? null : null,
  )
}

export function useChatSessions(): ChatSession[] {
  const subscribe = useCallback((cb: () => void) => {
    S.subs.add(cb)
    return () => { S.subs.delete(cb) }
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => [...S.sessions.values()],
  )
}

export function useActiveSessionId(): string | null {
  const subscribe = useCallback((cb: () => void) => {
    S.subs.add(cb)
    return () => { S.subs.delete(cb) }
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => S.activeSessionId,
  )
}

export type { ChatSession }
```

- [ ] **Step 2: typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/chat/chatStore.ts
git commit -m "feat: chat store with WS connection and React hooks"
```

---

### Task 4: PageAgentChat — 채팅 페이지 UI

**Files:**
- Create: `src/pages/chat/PageAgentChat.tsx`
- Create: `src/pages/chat/PageAgentChat.module.css`
- Modify: `src/router.tsx`

**Context:**
- 기존 ChatFeed, ChatInput 컴포넌트 재사용
- 세션 목록 사이드바 + 채팅 영역 레이아웃
- `/design-implement` 필수 (CLAUDE.md)이지만 Phase A 최소 스타일로 시작

- [ ] **Step 1: PageAgentChat.module.css 작성**

CSS는 `/design-implement` 스킬을 호출하여 작성. 기본 레이아웃:
- 좌측 세션 목록 사이드바 (200px)
- 우측 채팅 영역 (flex: 1)
- 전체 높이 100%

- [ ] **Step 2: PageAgentChat.tsx 작성**

```tsx
// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useCallback, useMemo } from 'react'
import { Plus, X, Circle } from 'lucide-react'
import { ChatFeed } from '../../interactive-os/ui/chat/ChatFeed'
import { ChatInput } from '../../interactive-os/ui/chat/ChatInput'
import {
  createSession,
  sendMessage,
  closeSession,
  setActiveSession,
  useActiveSession,
  useChatSessions,
  useActiveSessionId,
} from './chatStore'
import type { ChatMessage } from '../../interactive-os/ui/chat/types'
import styles from './PageAgentChat.module.css'

export default function PageAgentChat() {
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const activeSessionId = useActiveSessionId()

  const handleSubmit = useCallback((text: string) => {
    if (!activeSessionId) return
    sendMessage(activeSessionId, text)
  }, [activeSessionId])

  // Build messages including streaming partial
  const messages: ChatMessage[] = useMemo(() => {
    if (!activeSession) return []
    if (!activeSession.streamingText) return activeSession.messages
    return [
      ...activeSession.messages,
      {
        id: 'streaming',
        role: 'assistant' as const,
        ts: Date.now(),
        blocks: [{ type: 'text' as const, content: activeSession.streamingText }],
      },
    ]
  }, [activeSession])

  const isStreaming = activeSession?.state === 'running'

  return (
    <div className={styles.chat}>
      {/* Sidebar: session list */}
      <div className={styles.chatSidebar}>
        <div className={styles.chatSidebarHeader}>
          <span>Sessions</span>
          <button className={styles.chatNewBtn} onClick={createSession} aria-label="New session">
            <Plus size={14} />
          </button>
        </div>
        <div className={styles.chatSessionList}>
          {sessions.map(s => (
            <div
              key={s.id}
              className={`${styles.chatSessionItem} ${s.id === activeSessionId ? styles.chatSessionActive : ''}`}
              onClick={() => setActiveSession(s.id)}
            >
              <Circle size={8} fill="currentColor" className={s.state === 'running' ? styles.chatRunning : styles.chatIdle} />
              <span className="truncate">{s.id.slice(0, 8)}</span>
              <button
                className={styles.chatCloseBtn}
                onClick={(e) => { e.stopPropagation(); closeSession(s.id) }}
                aria-label={`Close session ${s.id.slice(0, 8)}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className={styles.chatEmpty}>No sessions</div>
          )}
        </div>
      </div>

      {/* Main: chat area */}
      <div className={styles.chatMain}>
        {activeSession ? (
          <>
            <ChatFeed
              messages={messages}
              isStreaming={isStreaming}
              streamingLabel="Thinking"
              className={styles.chatFeed}
            />
            <ChatInput
              onSubmit={handleSubmit}
              disabled={!activeSession || activeSession.state === 'running'}
              placeholder={activeSession.state === 'running' ? 'Claude is responding...' : 'Send a message...'}
            />
          </>
        ) : (
          <div className={styles.chatWelcome}>
            <p>Start a new Claude Code session</p>
            <button className={styles.chatStartBtn} onClick={createSession}>
              <Plus size={16} /> New Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 라우트 등록**

`src/router.tsx`에 추가:

```typescript
{ path: '/chat', lazy: () => import('./pages/chat/PageAgentChat').then(m => ({ Component: m.default })) },
```

- [ ] **Step 4: typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/chat/ src/router.tsx
git commit -m "feat: PageAgentChat — Claude Code web chat client"
```

---

### Task 5: 통합 검증 + CSS

**Files:**
- Modify: `src/pages/chat/PageAgentChat.module.css` (if not done in Task 4)

- [ ] **Step 1: dev server 실행 + 브라우저 검증**

Run: `pnpm dev`
- `/chat` 접속 → 페이지 렌더링 확인
- "New Session" 클릭 → 세션 생성 (SDK spawn)
- 메시지 입력 → 스트리밍 응답 표시
- "세션 종료" → 세션 제거

- [ ] **Step 2: 에러 핸들링 확인**

- SDK 없이 (패키지 미설치) 세션 생성 시도 → 에러 메시지
- 빈 메시지 전송 → 무시됨 (ChatInput이 처리)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Claude Code web chat Phase A complete"
```
