// ② 2026-03-30-composer-ghost-text-prd.md
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react'
import './Composer.css'
import { useAria } from '../primitives/useAria'
import { combobox as comboboxPattern } from '../pattern/roles/combobox'
import { focusCommands } from '../axis/navigate'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'

export interface ComposerProps {
  onSubmit?: (text: string) => void
  disabled?: boolean
  placeholder?: string
  commandHighlight?: number
  overlayText?: string
  suggestions?: string[]
  onCommandSelect?: (cmd: string) => void
  onDismiss?: () => void
  onTextChange?: (text: string) => void
}

export interface ComposerHandle {
  setText: (text: string) => void
  getText: () => string
}

function suggestionsToData(items: string[]): NormalizedData {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  for (const cmd of items) {
    entities[cmd] = { id: cmd, data: { label: cmd } }
  }
  return { entities, relationships: { [ROOT_ID]: items } }
}

const EMPTY_DATA: NormalizedData = { entities: {}, relationships: { [ROOT_ID]: [] } }

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  {
    onSubmit, disabled, placeholder = 'Send a message...',
    commandHighlight = 0, overlayText = '',
    suggestions, onCommandSelect, onDismiss, onTextChange,
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

  // --- os combobox for suggestion popup ---

  const hasSuggestions = !!suggestions && suggestions.length > 0
  const data = useMemo(() => hasSuggestions ? suggestionsToData(suggestions!) : EMPTY_DATA, [suggestions, hasSuggestions])

  const aria = useAria({
    pattern: comboboxPattern({ selectionMode: 'single' }),
    data,
    autoFocus: false,
  })

  // Focus first suggestion when list appears or changes
  const prevSuggestionsRef = useRef<string[] | undefined>(undefined)
  useEffect(() => {
    if (hasSuggestions && suggestions !== prevSuggestionsRef.current) {
      aria.dispatch(focusCommands.setFocus(suggestions![0]))
    }
    prevSuggestionsRef.current = suggestions
  }, [suggestions, hasSuggestions, aria])

  const focusedCmd = aria.focused
  const typedCmd = overlayText.startsWith('/') ? overlayText.slice(1) : ''
  const ghostText = (hasSuggestions && focusedCmd && focusedCmd.startsWith(typedCmd))
    ? focusedCmd.slice(typedCmd.length)
    : ''

  // Merge pattern keydown with our handlers
  const patternKeyDown = (aria.containerProps as Record<string, unknown>).onKeyDown as ((e: React.KeyboardEvent) => void) | undefined

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (hasSuggestions) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
        // Let pattern handle navigation
        patternKeyDown?.(e)
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current)) {
        e.preventDefault()
        if (focusedCmd) onCommandSelect?.(focusedCmd)
        return
      }
      if (e.key === 'Escape') {
        onDismiss?.()
        return
      }
    }

    // Normal Composer handlers (no popup)
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault()
      const trimmed = getText().trim()
      if (trimmed && onSubmit && !disabled) {
        onSubmit(trimmed)
        clear()
        onTextChange?.('')
      }
    }
    if (e.key === 'Tab' && ghostText && onCommandSelect && focusedCmd) {
      e.preventDefault()
      onCommandSelect(focusedCmd)
    }
    if (e.key === 'Escape' && ghostText && onDismiss) {
      onDismiss()
    }
  }, [getText, clear, onSubmit, disabled, hasSuggestions, ghostText, focusedCmd, patternKeyDown, onCommandSelect, onDismiss, onTextChange])

  const handleCompositionStart = useCallback(() => { isComposingRef.current = true }, [])
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false
    fireTextChange()
  }, [fireTextChange])

  const hasOverlay = !disabled && (commandHighlight > 0 || !!ghostText)

  return (
    <div className={ax({ layout: 'row', flex: 'none' })}>
      <div className={`relative composer-input-wrap ${disabled ? 'pointer-none' : ''} ${ax({ surface: 'input', flex: '1', shape: 'md' })}`} data-disabled={disabled || undefined}>
        {hasSuggestions && (
          <ul className={`composer-suggestion-list ${ax({ surface: 'overlay', padding: 'xs', shape: 'md', placement: 'above' })}`} role="listbox" aria-label="Command suggestions">
            {suggestions!.map(cmd => {
              const nodeProps = aria.getNodeProps(cmd) as Record<string, unknown>
              const state = aria.getNodeState(cmd)
              return (
                <li
                  key={cmd}
                  ref={state.focused ? el => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                  role="option"
                  aria-selected={state.focused}
                  className={`composer-suggestion-item ${ax({ interactive: 'item', textStyle: 'body', text: 'secondary' })}`}
                  data-selected={state.focused || undefined}
                  data-node-id={nodeProps['data-node-id'] as string}
                >
                  /{cmd}
                </li>
              )
            })}
          </ul>
        )}
        <div className="relative">
          <div
            ref={ref}
            className={`composer-editor pre-wrap overflow-y-auto outline-none ${ax({ textStyle: 'body', text: 'primary' })}`}
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
            <div className={`composer-overlay absolute inset-0 pointer-none font-inherit pre-wrap ${ax({ textStyle: 'body' })}`} aria-hidden="true">
              {commandHighlight > 0 && (
                <span className={ax({ tone: 'accent' })}>{overlayText.slice(0, commandHighlight)}</span>
              )}
              {commandHighlight > 0 && overlayText.length > commandHighlight && (
                <span className={ax({ text: 'primary' })}>{overlayText.slice(commandHighlight)}</span>
              )}
              {ghostText && <span className={ax({ text: 'muted' })}>{ghostText}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
