/** @catalog 풀스크린 라이트박스 뷰어 */
// ② lightbox-prd.md
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'
import { Camera, type CameraHandle, type CameraRect } from './Camera'
import './Lightbox.css'

// ── Types ──

export interface LightboxContent {
  type: 'image' | 'svg' | 'mermaid'
  src?: string
  html?: string
  alt?: string
  code?: string
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

// ── Mermaid Lightbox Content ──

function MermaidLightboxContent({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<CameraHandle>(null)
  const [svg, setSvg] = useState('')
  const [initialScale, setInitialScale] = useState<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const renderMermaid = async () => {
      const { default: mermaid } = await import('mermaid')
      mermaid.initialize({ startOnLoad: false, theme: 'default' })
      const id = `mermaid-lb-${Date.now()}`
      try {
        const { svg } = await mermaid.render(id, code)
        if (!cancelled) setSvg(svg)
      } catch { /* noop */ }
    }
    renderMermaid()
    return () => { cancelled = true }
  }, [code])

  // Calculate initial scale to fit 80% of viewport after SVG renders
  useEffect(() => {
    if (!svg || !ref.current) return
    const svgEl = ref.current.querySelector('svg')
    if (!svgEl) return
    const rect = svgEl.getBoundingClientRect()
    const vw = window.innerWidth * 0.8
    const vh = window.innerHeight * 0.8
    const fitScale = Math.min(vw / rect.width, vh / rect.height)
    setInitialScale(Math.max(fitScale, 0.1))
  }, [svg])

  const cleanSvg = useMemo(() => svg
    ? svg
      .replace(/max-width:\s*[\d.]+px/g, 'max-width: none')
      .replace(/(<svg[^>]*?)(?:\s+width="[\d.]+(?:px)?")/g, '$1')
      .replace(/(<svg[^>]*?)(?:\s+height="[\d.]+(?:px)?")/g, '$1')
    : '', [svg])

  // Apply initialScale when available via imperative focus.
  useEffect(() => {
    if (initialScale == null || !ref.current) return
    const el = ref.current
    const rect: CameraRect = {
      top: el.offsetTop,
      left: el.offsetLeft,
      width: el.offsetWidth,
      height: el.offsetHeight,
    }
    cameraRef.current?.focus(rect, { scale: initialScale, duration: 0 })
  }, [initialScale])

  if (!cleanSvg) return null

  return (
    <Camera ref={cameraRef} mode="interact" className="lightbox-canvas">
      <div ref={ref} className="lightbox-mermaid" dangerouslySetInnerHTML={{ __html: cleanSvg }} />
    </Camera>
  )
}

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

  const cleanupDialog = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog) {
      dialog.close()
      // Remove inline styles set during open to prevent visual residue
      dialog.style.removeProperty('position')
      dialog.style.removeProperty('inset')
      dialog.style.removeProperty('width')
      dialog.style.removeProperty('height')
      dialog.style.removeProperty('max-width')
      dialog.style.removeProperty('max-height')
    }
    const trigger = triggerRef.current
    setContent(null)
    if (trigger && trigger.isConnected) {
      trigger.focus()
    }
  }, [])

  // Native dialog close event (ESC key handled by browser)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onClose = () => cleanupDialog()
    dialog.addEventListener('close', onClose)
    return () => dialog.removeEventListener('close', onClose)
  }, [cleanupDialog])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) cleanupDialog()
  }, [cleanupDialog])

  const contextValue = useMemo(() => ({ open }), [open])

  return (
    <LightboxContext.Provider value={contextValue}>
      {children}
      <dialog
        ref={dialogRef}
        className={`lightbox-dialog ${ax({ surface: 'trap', layout: 'center', padding: 'none' })}`}
        onClick={handleBackdropClick}
        aria-label="Lightbox"
      >
        {content?.type === 'image' && content.src && (
          <img className="lightbox-content" src={content.src} alt={content.alt ?? ''} />
        )}
        {content?.type === 'svg' && content.html && (
          <div className="lightbox-svg" dangerouslySetInnerHTML={{ __html: content.html }} />
        )}
        {content?.type === 'mermaid' && content.code && (
          <MermaidLightboxContent code={content.code} />
        )}
      </dialog>
    </LightboxContext.Provider>
  )
}
