import { useCallback, useEffect, useRef } from 'react'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { Command } from '../../interactive-os/engine/types'
import { RENAME_ID, renameCommands } from '../../interactive-os/plugins/rename'
import type { Locale } from './cms-types'
import { localized } from './cms-types'
import type { LocaleMap } from './cms-types'
import { NodeContent, getEditableFields } from './cms-renderers'

interface CmsInlineEditableProps {
  nodeId: string
  data: Record<string, unknown>
  locale: Locale
  dispatch: (cmd: Command) => void
  store: NormalizedData
}

export function CmsInlineEditable({ nodeId, data, locale, dispatch, store }: CmsInlineEditableProps) {
  const editRef = useRef<HTMLSpanElement>(null)
  const originalValueRef = useRef('')
  const composingRef = useRef(false)
  const committedRef = useRef(false)

  const renameEntity = store.entities[RENAME_ID]
  const isRenaming = renameEntity?.active === true && (renameEntity as Record<string, unknown>).nodeId === nodeId

  const fields = getEditableFields(data)
  const primaryField = fields.find(f => f.fieldType !== 'icon')

  useEffect(() => {
    if (isRenaming && editRef.current) {
      committedRef.current = false
      composingRef.current = false
      const el = editRef.current
      originalValueRef.current = el.textContent ?? ''
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      el.focus()
    }
  }, [isRenaming])

  // Focus recovery: schedule after React re-render
  const restoreFocus = useCallback(() => {
    requestAnimationFrame(() => {
      const nodeEl = document.querySelector<HTMLElement>(`[data-cms-id="${nodeId}"]`)
      nodeEl?.focus()
    })
  }, [nodeId])

  if (!isRenaming || !primaryField) {
    return <NodeContent data={data} locale={locale} />
  }

  const rawValue = data[primaryField.field]
  const { text } = localized(rawValue as string | LocaleMap, locale)

  const confirm = (shouldRestoreFocus: boolean) => {
    if (committedRef.current) return
    committedRef.current = true
    const newText = editRef.current?.textContent?.trim() ?? ''
    if (newText === '' || newText === originalValueRef.current) {
      if (editRef.current) editRef.current.textContent = originalValueRef.current
      dispatch(renameCommands.cancelRename())
    } else {
      const newValue = primaryField.isLocaleMap
        ? { ...(rawValue as Record<string, string>), [locale]: newText }
        : newText
      dispatch(renameCommands.confirmRename(nodeId, primaryField.field, newValue))
    }
    if (shouldRestoreFocus) restoreFocus()
  }

  const cancel = () => {
    if (committedRef.current) return
    committedRef.current = true
    if (editRef.current) editRef.current.textContent = originalValueRef.current
    dispatch(renameCommands.cancelRename())
    restoreFocus()
  }

  return (
    <span
      ref={editRef}
      contentEditable
      suppressContentEditableWarning
      data-renaming=""
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); confirm(true) }
        else if (e.key === 'Escape') { e.preventDefault(); cancel() }
        else if (e.key === 'Tab') { e.preventDefault(); confirm(true) }
      }}
      onBlur={() => confirm(false)}
    >
      {text}
    </span>
  )
}
