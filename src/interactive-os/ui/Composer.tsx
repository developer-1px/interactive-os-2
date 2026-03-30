// ② 2026-03-30-composer-ghost-text-prd.md
import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import styles from './Composer.module.css'

export interface ComposerProps {
  onSubmit?: (text: string) => void
  disabled?: boolean
  placeholder?: string
  ghostText?: string
  commandHighlight?: number
  overlayText?: string
  suggestions?: string[]
  selectedSuggestion?: number
  onGhostAccept?: () => void
  onGhostDismiss?: () => void
  onTextChange?: (text: string) => void
  onSuggestionNav?: (direction: 'up' | 'down') => void
  onSuggestionSelect?: () => void
}

export interface ComposerHandle {
  setText: (text: string) => void
  getText: () => string
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  {
    onSubmit, disabled, placeholder = 'Send a message...',
    ghostText, commandHighlight = 0, overlayText = '',
    suggestions, selectedSuggestion = -1,
    onGhostAccept, onGhostDismiss, onTextChange,
    onSuggestionNav, onSuggestionSelect,
  },
  fwdRef,
) {
  const ref = useRef<HTMLDivElement>(null)
  const isComposingRef = useRef(false)

  useEffect(() => { ref.current?.focus() }, [])

  const getText = useCallback(() => ref.current?.textContent ?? '', [])

  const clear = useCallback(() => {
    if (ref.current) {
      ref.current.textContent = ''
      ref.current.focus()
    }
  }, [])

  const setText = useCallback((text: string) => {
    if (!ref.current) return
    ref.current.textContent = text
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(ref.current)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [])

  useImperativeHandle(fwdRef, () => ({ setText, getText }), [setText, getText])

  const fireTextChange = useCallback(() => {
    if (!isComposingRef.current) onTextChange?.(getText())
  }, [getText, onTextChange])

  const hasSuggestions = suggestions && suggestions.length > 0

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Suggestion navigation takes priority when popup is open
    if (hasSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        onSuggestionNav?.('down')
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        onSuggestionNav?.('up')
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current)) {
        e.preventDefault()
        onSuggestionSelect?.()
        return
      }
      if (e.key === 'Escape') {
        onGhostDismiss?.()
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault()
      const trimmed = getText().trim()
      if (trimmed && onSubmit && !disabled) {
        onSubmit(trimmed)
        clear()
        onTextChange?.('')
      }
    }
    if (e.key === 'Tab' && ghostText && onGhostAccept) {
      e.preventDefault()
      onGhostAccept()
    }
    if (e.key === 'Escape' && ghostText && onGhostDismiss) {
      onGhostDismiss()
    }
  }, [getText, clear, onSubmit, disabled, ghostText, hasSuggestions, onGhostAccept, onGhostDismiss, onTextChange, onSuggestionNav, onSuggestionSelect])

  const handleCompositionStart = useCallback(() => { isComposingRef.current = true }, [])
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    fireTextChange()
  }, [fireTextChange])

  const hasOverlay = !disabled && (commandHighlight > 0 || !!ghostText)

  return (
    <div className={styles.composer}>
      <div className={styles.inputWrap} data-disabled={disabled || undefined}>
        {hasSuggestions && (
          <ul className={styles.suggestionList} role="listbox" aria-label="Command suggestions">
            {suggestions.map((cmd, i) => (
              <li
                key={cmd}
                role="option"
                aria-selected={i === selectedSuggestion}
                className={styles.suggestionItem}
                data-selected={i === selectedSuggestion || undefined}
              >
                /{cmd}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.editorArea}>
          <div
            ref={ref}
            className={styles.editor}
            contentEditable={!disabled}
            role="textbox"
            aria-multiline="true"
            aria-label={placeholder}
            data-placeholder={placeholder}
            data-overlay={hasOverlay || undefined}
            aria-activedescendant={hasSuggestions && selectedSuggestion >= 0 ? `suggestion-${selectedSuggestion}` : undefined}
            onKeyDown={handleKeyDown}
            onInput={fireTextChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            suppressContentEditableWarning
          />
          {hasOverlay && (
            <div className={styles.overlay} aria-hidden="true">
              {commandHighlight > 0 && (
                <span className={styles.commandMatch}>{overlayText.slice(0, commandHighlight)}</span>
              )}
              {commandHighlight > 0 && overlayText.length > commandHighlight && (
                <span className={styles.overlayNormal}>{overlayText.slice(commandHighlight)}</span>
              )}
              {ghostText && <span className={styles.ghost}>{ghostText}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
