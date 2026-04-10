// ② 2026-03-28-overlay-core-layer-prd.md
import type { RefObject } from 'react'

export type OverlayType = 'modal' | 'popup' | 'hint'

export interface OverlayOptions {
  type: OverlayType
  /** Allow backdrop click to dismiss modal. Default: true for modal, N/A for popup/hint */
  dismissOnBackdrop?: boolean
}

export interface OverlayHandle {
  isOpen: boolean
  open(): void
  close(): void
  toggle(): void
  contentRef: RefObject<HTMLElement | null>
  triggerRef: RefObject<HTMLElement | null>
}
