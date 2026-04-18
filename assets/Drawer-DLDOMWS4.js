var e=`/** @catalog 화면 측면 슬라이드 패널 오버레이 */
import { useEffect, useRef, type ReactNode } from 'react'
import { ax } from '@styles/ax'
import './Drawer.css'

type DrawerPlacement = 'left' | 'right' | 'bottom'
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl'

interface DrawerProps {
  open: boolean
  onClose: () => void
  placement?: DrawerPlacement
  size?: DrawerSize
  title?: string
  children: ReactNode
}

export function Drawer({
  open,
  onClose,
  placement = 'right',
  size = 'md',
  title,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement
    panelRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className={ax({ surface: 'overlay', placement: 'viewport' }) + ' drawer-backdrop'}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-placement={placement}
        data-size={size}
        className={ax({ surface: 'raised', placement: 'viewport' }) + ' drawer-panel'}
      >
        {children}
      </div>
    </>
  )
}
`;export{e as default};