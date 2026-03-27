// ② 2026-03-27-component-creator-prd.md

import React, { useState } from 'react'
import type { RegistryEntry } from './componentRegistry'
import styles from './PageComponentCreator.module.css'

interface ComponentChatProps {
  entry: RegistryEntry | null
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

/**
 * Chat panel for Component Creator.
 * Currently a placeholder UI — dev-channel integration is future work.
 * Shows component context and accepts input.
 */
export function ComponentChat({ entry }: ComponentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), ts: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    // Placeholder: echo back context info until dev-channel is connected
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: `dev-channel 미연결 — 추후 연결 예정.\n\n현재 컨텍스트:\n- Component: ${entry?.name ?? 'none'}\n- Variants: ${entry?.variants.join(', ') || 'none'}\n- Sizes: ${entry?.sizes.join(', ') || 'none'}\n- Surface tokens: shape=${entry?.tokens.shape ?? '?'}, type=${entry?.tokens.type ?? '?'}`,
      ts: Date.now(),
    }
    setMessages((prev) => [...prev, assistantMsg])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex-col ${styles.chat}`}>
      {/* Context bar */}
      {entry && (
        <div className={styles.chatContext}>
          <span className={styles.chatContextLabel}>{entry.name}</span>
          {entry.variants.length > 0 && (
            <span className={styles.chatContextMeta}>
              {entry.variants.length} variants, {entry.sizes.length} sizes
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className={`flex-col gap-sm overflow-y-auto flex-1 ${styles.chatMessages}`}>
        {messages.length === 0 && (
          <div className={styles.chatEmpty}>
            {entry
              ? `"${entry.name}의 tone을 바꿔줘" 같은 요청을 입력하세요`
              : '컴포넌트를 선택하세요'}
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.ts}
            className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant}`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className={styles.chatInputWrap}>
        <textarea
          className={styles.chatInput}
          data-surface="input"
          placeholder={entry ? `${entry.name} 수정 요청...` : 'dev-channel 미연결'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
      </div>
    </div>
  )
}
