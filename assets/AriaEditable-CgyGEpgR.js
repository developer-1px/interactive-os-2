var e=`import React, { useEffect, useRef } from 'react'
import type { Command } from '../engine/types'
import { AriaInternalContext } from './AriaInternalContext'
import { FOCUS_ID } from '../axis/navigate'
import { renameCommands, RENAME_ID } from '../plugins/rename'

const AriaItemContext = React.createContext<{ nodeId: string; focused: boolean; renaming: boolean } | null>(null)

function placeCaret(el: HTMLElement, atEnd: boolean) {
  const range = document.createRange()
  range.selectNodeContents(el)
  if (atEnd) range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

// ② 2026-04-05-writer-tree-crud-prd.md
export interface EditKeyContext {
  nodeId: string
  field: string
  content: string
  cursorOffset: number
}

function AriaEditable({ field, placeholder, selection = 'all', allowEmpty = false, tabContinue = false, enterContinue = false, editKeyDown, children, ...restProps }: { field: string; placeholder?: string; selection?: 'all' | 'end'; allowEmpty?: boolean; tabContinue?: boolean; enterContinue?: boolean; editKeyDown?: (e: React.KeyboardEvent, ctx: EditKeyContext) => Command | void; children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  const nodeCtx = React.useContext(AriaItemContext)
  const ariaCtx = React.useContext(AriaInternalContext)
  const editRef = useRef<HTMLSpanElement>(null)
  const originalValueRef = useRef<string>('')
  const composingRef = useRef(false)
  const committedRef = useRef(false)
  const wasRenamingRef = useRef(false)

  const renaming = nodeCtx?.renaming ?? false

  useEffect(() => {
    if (renaming) {
      // Entering rename mode
      wasRenamingRef.current = true
      committedRef.current = false
      composingRef.current = false
      if (!editRef.current) return
      const el = editRef.current
      originalValueRef.current = el.textContent ?? ''

      const store = ariaCtx?.getStore()
      const renameEntity = store?.entities[RENAME_ID] as Record<string, unknown> | undefined
      const isReplace = renameEntity?.replace === true
      const initialChar = renameEntity?.initialChar as string | undefined

      if (isReplace) {
        el.textContent = initialChar ?? ''
      }
      placeCaret(el, isReplace || selection === 'end')
      el.focus()
    } else if (wasRenamingRef.current) {
      // Exiting rename mode — restore focus to node
      wasRenamingRef.current = false
      if (nodeCtx) {
        const nodeEl = document.querySelector<HTMLElement>(\`[data-node-id="\${nodeCtx.nodeId}"]\`)
        nodeEl?.focus()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- selection prop is stable, only needed on rename entry
  }, [renaming, nodeCtx])

  if (!renaming) {
    return (
      <span {...restProps} data-placeholder={placeholder} onDoubleClick={(e) => {
        if (!nodeCtx || !ariaCtx) return
        e.stopPropagation()
        ariaCtx.dispatch(renameCommands.startRename(nodeCtx.nodeId))
      }}>
        {children}
      </span>
    )
  }

  const confirm = () => {
    if (committedRef.current || !nodeCtx || !ariaCtx) return
    committedRef.current = true
    const el = editRef.current
    const newValue = el?.textContent?.trim() ?? ''
    if ((!allowEmpty && newValue === '') || newValue === originalValueRef.current) {
      // Restore DOM before React reconciles — prevents stale DOM from external mutation
      if (el) el.textContent = originalValueRef.current
      ariaCtx.dispatch(renameCommands.cancelRename())
    } else {
      ariaCtx.dispatch(renameCommands.confirmRename(nodeCtx.nodeId, field, newValue))
    }
  }

  const cancel = () => {
    if (committedRef.current || !ariaCtx || !editRef.current) return
    committedRef.current = true
    editRef.current.textContent = originalValueRef.current
    ariaCtx.dispatch(renameCommands.cancelRename())
  }

  return (
    <span
      {...restProps}
      ref={editRef}
      contentEditable
      suppressContentEditableWarning
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={(e) => {
        if (editKeyDown && !composingRef.current && nodeCtx && ariaCtx) {
          const sel = window.getSelection()
          const ctx: EditKeyContext = {
            nodeId: nodeCtx.nodeId,
            field,
            content: editRef.current?.textContent ?? '',
            cursorOffset: sel?.focusOffset ?? 0,
          }
          const cmd = editKeyDown(e, ctx)
          if (cmd) {
            e.preventDefault()
            e.stopPropagation()
            committedRef.current = true
            ariaCtx.dispatch(cmd)
            return
          }
        }
        if (e.key === 'Enter' && !composingRef.current) {
          e.preventDefault()
          const shiftKey = e.shiftKey
          confirm()
          if (enterContinue && nodeCtx && ariaCtx) {
            setTimeout(() => {
              const nodeEl = document.querySelector<HTMLElement>(\`[data-node-id="\${nodeCtx.nodeId}"]\`)
              if (nodeEl) {
                nodeEl.dispatchEvent(new KeyboardEvent('keydown', {
                  key: shiftKey ? 'ArrowUp' : 'ArrowDown',
                  code: shiftKey ? 'ArrowUp' : 'ArrowDown',
                  bubbles: true, cancelable: true,
                }))
              }
              // No auto-rename — Google Sheets standard: return to cell mode
            }, 0)
          }
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancel()
        } else if (e.key === 'Tab') {
          e.preventDefault()
          e.stopPropagation()
          const shiftKey = e.shiftKey
          confirm()
          if (tabContinue && nodeCtx && ariaCtx) {
            // After confirm, dispatch synthetic Tab on the row node
            // to trigger grid navigation, then auto-start rename on new cell.
            // Use setTimeout(0) — synchronous dispatch won't work because
            // the DOM hasn't re-rendered yet after confirm().
            setTimeout(() => {
              const nodeEl = document.querySelector<HTMLElement>(\`[data-node-id="\${nodeCtx.nodeId}"]\`)
              if (nodeEl) {
                nodeEl.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Tab', code: 'Tab', bubbles: true, cancelable: true, shiftKey,
                }))
              }
              // After navigation, start rename on new focused node
              setTimeout(() => {
                const store = ariaCtx.getStore()
                const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
                if (focusedId) {
                  ariaCtx.dispatch(renameCommands.startRename(focusedId))
                }
              }, 0)
            }, 0)
          }
        }
      }}
      onBlur={confirm}
      data-renaming=""
      data-placeholder={placeholder}
      style={{
        outline: 'var(--border-width) solid var(--focus)',
        outlineOffset: 'calc(var(--space-xs) / 2)',
        borderRadius: 'var(--shape-xs-radius)',
        paddingBlock: 0,
        paddingInline: 'calc(var(--space-xs) / 2)',
        minWidth: 'var(--space-3xl)',
      }}
    >
      {children}
    </span>
  )
}

export { AriaItemContext, AriaEditable }
`;export{e as default};