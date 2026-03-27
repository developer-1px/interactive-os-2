// ② 2026-03-27-chat-module-prd.md
import { useState, useRef, useCallback } from 'react'
import styles from './ChatInput.module.css'

export interface ChatInputProps {
  onSubmit?: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSubmit, disabled, placeholder = 'Send a message...' }: ChatInputProps) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = text.trim()
      if (trimmed && onSubmit) {
        onSubmit(trimmed)
        setText('')
      }
    }
  }, [text, onSubmit])

  return (
    <div className={styles.chatInput}>
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
      />
    </div>
  )
}
