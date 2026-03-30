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
  onGhostAccept?: () => void
  onGhostDismiss?: () => void
  onTextChange?: (text: string) => void
}

export interface ComposerHandle {
  setText: (text: string) => void
  getText: () => string
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { onSubmit, disabled, placeholder = 'Send a message...', ghostText, commandHighlight = 0, overlayText = '', onGhostAccept, onGhostDismiss, onTextChange },
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
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
  }, [getText, clear, onSubmit, disabled, ghostText, onGhostAccept, onGhostDismiss, onTextChange])

  const handleCompositionStart = useCallback(() => { isComposingRef.current = true }, [])
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    fireTextChange()
  }, [fireTextChange])

  const hasOverlay = commandHighlight > 0 || !!ghostText

  return (
    <div className={styles.composer}>
      <div className={styles.inputWrap} data-disabled={disabled || undefined}>
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
