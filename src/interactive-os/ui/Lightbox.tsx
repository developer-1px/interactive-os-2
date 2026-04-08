/** @catalog 풀스크린 라이트박스 뷰어 */
// ② lightbox-prd.md
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import './Lightbox.css'

// ── Types ──

export interface LightboxContent {
  type: 'image' | 'svg'
  src?: string
  html?: string
  alt?: string
}

// ── Context ──

interface LightboxContextValue {
  open: (content: LightboxContent) => void
}

const LightboxContext = createContext<LightboxContextValue | null>(null)

/** @see LightboxProvider */
// eslint-disable-next-line react-refresh/only-export-components
export function useLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext)
  if (!ctx) throw new Error('useLightbox must be inside <LightboxProvider>')
  return ctx
}

// ── Provider ──

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<LightboxContent | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const open = useCallback((c: LightboxContent) => {
    triggerRef.current = document.activeElement as HTMLElement
    setContent(c)
  }, [])

  // Open dialog when content is set
  // dialog UA stylesheet override: @layer CSS cannot override browser defaults for <dialog>
  useEffect(() => {
    const dialog = dialogRef.current
    if (content && dialog && !dialog.open) {
      dialog.showModal()
      dialog.style.position = 'fixed'
      dialog.style.inset = '0'
      dialog.style.width = '100vw'
      dialog.style.height = '100vh'
      dialog.style.maxWidth = 'none'
      dialog.style.maxHeight = 'none'
    }
  }, [content])

  const handleClose = useCallback(() => {
    // V3/V4: lightbox-prd.md — ESC/backdrop closes, focus recovery
    dialogRef.current?.close()
    const trigger = triggerRef.current
    setContent(null)
    // Focus recovery
    if (trigger && trigger.isConnected) {
      trigger.focus()
    }
  }, [])

  // Native dialog close event (ESC key handled by browser)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onClose = () => {
      const trigger = triggerRef.current
      setContent(null)
      if (trigger && trigger.isConnected) {
        trigger.focus()
      }
    }
    dialog.addEventListener('close', onClose)
    return () => dialog.removeEventListener('close', onClose)
  }, [])

  // V4: lightbox-prd.md — backdrop click closes
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }, [handleClose])

  const contextValue = useMemo(() => ({ open }), [open])

  return (
    <LightboxContext.Provider value={contextValue}>
      {children}
      <dialog
        ref={dialogRef}
        className={`lightbox-dialog ${ax({ surface: 'overlay', layout: 'center', padding: 'none' })}`}
        onClick={handleBackdropClick}
        aria-label="Lightbox"
      >
        {content?.type === 'image' && content.src && (
          <img className="lightbox-content" src={content.src} alt={content.alt ?? ''} />
        )}
        {content?.type === 'svg' && content.html && (
          <div className="lightbox-svg" dangerouslySetInnerHTML={{ __html: content.html }} />
        )}
      </dialog>
    </LightboxContext.Provider>
  )
}
