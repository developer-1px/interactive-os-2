/** @catalog 라우트 연동 모달 오버레이 */
// ② 2026-04-07-route-modal-prd.md
import { useEffect, useRef, type ReactNode } from 'react'

interface RouteModalProps {
  active: boolean
  children: ReactNode
  restoreFocus?: boolean
  label?: string
}

/**
 * Route-level modal: 활성 시 siblings에 inert를 전파하고 컨테이너에 focus를 잡는다.
 * popup 축(인스턴스 내 modal)과 별개로, 인스턴스 간 포커스 격리를 담당.
 */
export function RouteModal({ active, children, restoreFocus = true, label }: RouteModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<Element | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (active) {
      // 포커스 복구용으로 현재 포커스 저장
      previousFocusRef.current = document.activeElement

      // siblings에 inert 적용
      const parent = container.parentElement
      if (parent) {
        for (const sibling of Array.from(parent.children)) {
          if (sibling !== container && !sibling.hasAttribute('inert')) {
            sibling.setAttribute('inert', '')
            sibling.setAttribute('data-route-modal-inert', '')
          }
        }
      }

      // 컨테이너에 focus
      container.focus()
    }

    return () => {
      // cleanup: inert 제거
      const parent = container.parentElement
      if (parent) {
        for (const sibling of Array.from(parent.children)) {
          if (sibling.getAttribute('data-route-modal-inert') != null) {
            sibling.removeAttribute('inert')
            sibling.removeAttribute('data-route-modal-inert')
          }
        }
      }

      // 포커스 복구
      if (restoreFocus && previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [active, restoreFocus])

  if (!active) return null

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="outline-none"
    >
      {children}
    </div>
  )
}
