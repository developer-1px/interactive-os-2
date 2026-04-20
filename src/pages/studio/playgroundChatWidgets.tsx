// Playground의 floating 대화 UI.
// - PlaygroundComposerWidget: 하단 floating (사용자 입력)
// - PlaygroundSubtitleWidget: 상단 floating 자막 (LLM thinking/streaming overlay)
// - PlaygroundChatLogWidget: ChatFeed 전체 로그 (Mod+L로 탭 생성)
// 세션은 kind='playground' 싱글톤 — /chat과 격리. SDK는 tools:[]+settingSources:[]로 구조적 잠금.
import { useEffect, useRef } from 'react'
import { ax } from '@styles/ax'
import { Composer } from '@os/ui/Composer'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { ensureSession, sendMessage, useChatSession, type ChatSession } from '../chat/chatStore'
import { getFlatLayoutActions } from '@os/primitives/flatLayoutRegistry'
import { parseFlatLayoutBlocks } from './parseFlatLayoutBlocks'
import { dispatchToolCall } from './layoutTools'
import { STUDIO_CANVAS_ID as PLAYGROUND_CANVAS_ID } from './studioLayout'
import styles from './playgroundChatWidgets.module.css'

function usePlaygroundSession(): ChatSession | null {
  // lazy ref init은 렌더 사이드이펙트 아님 — 첫 렌더에서 id 고정.
  const idRef = useRef<string | null>(null)
  if (idRef.current === null) {
    idRef.current = ensureSession('playground')
  }
  // eslint-disable-next-line react-hooks/refs -- lazy-init ref: stable after first render
  return useChatSession(idRef.current)
}

/** assistant 메시지의 flatlayout 블록을 dispatch. 중복 방지 위해 메시지 id 기반 caching. */
function useLlmToolDispatch(session: ChatSession | null) {
  const dispatchedRef = useRef(new Set<string>())
  useEffect(() => {
    if (!session) return
    const actions = getFlatLayoutActions(PLAYGROUND_CANVAS_ID)
    if (!actions) return
    for (const msg of session.messages) {
      if (msg.role !== 'assistant') continue
      if (dispatchedRef.current.has(msg.id)) continue
      dispatchedRef.current.add(msg.id)
      for (const block of msg.blocks) {
        if (block.type !== 'text') continue
        const content = (block as { content?: string }).content ?? ''
        const calls = parseFlatLayoutBlocks(content)
        for (const call of calls) {
          const result = dispatchToolCall(actions, call)
          if (!result.ok) {
            console.warn('[playground tool]', call.tool, result.error)
          }
        }
      }
    }
  }, [session])
}

// ── Composer (하단 floating) ──────────────────────────

export function PlaygroundComposerWidget() {
  const session = usePlaygroundSession()
  useLlmToolDispatch(session)

  return (
    <div className={ax({ role: 'control-group', surface: 'overlay', width: 'lg' })}>
      <Composer
        placeholder={session ? '화면을 설명하세요 — 예: "Gmail 같은 3단 레이아웃 만들어줘"' : '세션 준비 중...'}
        disabled={!session || session.state === 'running'}
        onSubmit={(text) => {
          if (!session || !text.trim()) return
          sendMessage(session.id, text)
        }}
      />
    </div>
  )
}

// ── Subtitle (상단 floating) ──────────────────────────

export function PlaygroundSubtitleWidget() {
  const session = usePlaygroundSession()
  if (!session) return null

  // 우선순위: streamingText > thinkingText > 마지막 assistant text
  const streaming = session.streamingText
  const thinking = session.thinkingText
  let fallback = ''
  if (!streaming && !thinking) {
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const msg = session.messages[i]
      if (msg.role === 'assistant') {
        const textBlock = msg.blocks.find(b => b.type === 'text') as { type: 'text'; content?: string } | undefined
        if (textBlock) {
          fallback = lastLine(textBlock.content ?? '')
          break
        }
      }
    }
  }
  const text = streaming || thinking || fallback
  if (!text) return null
  const dimmed = !streaming && !!thinking

  return (
    <div
      className={ax({ role: 'control-group', surface: 'overlay', width: 'prose' })}
      data-dimmed={dimmed || undefined}
    >
      {lastLine(text)}
    </div>
  )
}

/** 자막용 — 긴 텍스트에서 가장 최근 문장만 노출. */
function lastLine(text: string): string {
  const lines = text.trim().split(/\n+/)
  return lines[lines.length - 1] ?? ''
}

// ── ChatLog (탭 콘텐츠) — 전체 대화 이력 ─────────────

export function PlaygroundChatLogWidget() {
  const session = usePlaygroundSession()
  if (!session) {
    return (
      <div className={ax({ role: 'control-group', surface: 'overlay', layout: 'center', width: 'lg' })}>
        <span className={ax({ textStyle: 'caption' })}>세션 준비 중...</span>
      </div>
    )
  }
  return (
    <div className={`${ax({ role: 'control-group', surface: 'overlay', layout: 'stack', width: 'lg' })} ${styles.chatlogContainer}`}>
      <ChatFeed
        messages={session.messages}
        isStreaming={session.state === 'running'}
        streamingLabel={session.activity === 'thinking' ? 'Thinking…' : session.activity === 'streaming' ? 'Responding…' : ''}
      />
    </div>
  )
}
