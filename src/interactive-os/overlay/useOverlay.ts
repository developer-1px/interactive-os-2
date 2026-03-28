// ② 2026-03-28-overlay-core-layer-prd.md
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { OverlayOptions, OverlayHandle } from './types'
import { layerStack } from './layerStack'

export function useOverlay(options: OverlayOptions): OverlayHandle {
  const { type, dismissOnBackdrop } = options
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const prevOpenRef = useRef(false)

  const open = useCallback(() => { setIsOpen(true) }, [])
  const close = useCallback(() => { setIsOpen(false) }, [])
  const toggle = useCallback(() => { setIsOpen((prev) => !prev) }, [])

  // Sync with browser APIs when isOpen changes
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    if (type === 'modal') {
      const dialog = el as HTMLDialogElement
      if (isOpen) {
        if (!dialog.open) dialog.showModal()
      } else {
        if (dialog.open) dialog.close()
      }
    } else if (type === 'popup') {
      if (isOpen) {
        try { el.showPopover() } catch { /* Popover API throws if already in target state */ }
      } else {
        try { el.hidePopover() } catch { /* Popover API throws if already in target state */ }
      }
    }
  }, [isOpen, type])

  // Layer stack registration
  useEffect(() => {
    if (!isOpen) return
    layerStack.push({ id, close })
    return () => { layerStack.remove(id) }
  }, [isOpen, id, close])

  // Focus restoration on close (only on true→false transition, not initial mount)
  useEffect(() => {
    if (prevOpenRef.current && !isOpen) {
      const trigger = triggerRef.current
      if (trigger && document.activeElement !== trigger && trigger.isConnected) {
        trigger.focus()
      }
    }
    prevOpenRef.current = isOpen
  }, [isOpen])

  // Modal: backdrop click + native close event (merged — same guard and target)
  useEffect(() => {
    if (type !== 'modal' || !isOpen) return
    const dialog = contentRef.current as HTMLDialogElement | null
    if (!dialog) return

    const shouldDismissOnBackdrop = dismissOnBackdrop ?? true

    function handleClick(e: MouseEvent) {
      if (shouldDismissOnBackdrop && e.target === dialog) {
        close()
      }
    }

    function handleClose() {
      setIsOpen(false)
    }

    dialog.addEventListener('click', handleClick)
    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('click', handleClick)
      dialog.removeEventListener('close', handleClose)
    }
  }, [type, isOpen, dismissOnBackdrop, close])

  // Popup: handle popover toggle event (light dismiss by browser)
  useEffect(() => {
    if (type !== 'popup' || !isOpen) return
    const el = contentRef.current
    if (!el) return

    function handleToggle(e: Event) {
      if ((e as ToggleEvent).newState === 'closed') {
        setIsOpen(false)
      }
    }

    el.addEventListener('toggle', handleToggle)
    return () => el.removeEventListener('toggle', handleToggle)
  }, [type, isOpen])

  return { isOpen, open, close, toggle, contentRef, triggerRef }
}
