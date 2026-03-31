// ② 2026-03-31-selection-overlay-prd.md
import type { RefObject } from 'react'
import { useRectTracker } from './useRectTracker'
import type { TrackedRect } from './useRectTracker'
import s from './SelectionOverlay.module.css'

export interface SelectionOverlayProps {
  /** Container element to track nodes within */
  containerRef: RefObject<HTMLElement | null>
  /** Currently focused node ID */
  focusedId: string
  /** Currently selected node IDs */
  selectedIds: string[]
  /** DOM attribute for node identification (default: 'data-node-id') */
  nodeIdAttr?: string
  /** Enable hover preview (default: true) */
  hover?: boolean
  /** Custom label for each tracked rect */
  labelFn?: (id: string, rect: TrackedRect) => string
}

const kindClass: Record<TrackedRect['kind'], string> = {
  focus: s.focus,
  selection: s.selection,
  hover: s.hover,
}

export function SelectionOverlay({ containerRef, focusedId, selectedIds, nodeIdAttr, hover, labelFn }: SelectionOverlayProps) {
  const rects = useRectTracker({ containerRef, focusedId, selectedIds, nodeIdAttr, hover })

  if (rects.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {rects.map((tr) => {
        const label = labelFn?.(tr.id, tr)
        return (
          <div
            key={`${tr.kind}-${tr.id}`}
            className={`absolute ${s.rect} ${kindClass[tr.kind]}`}
            style={{
              left: tr.x,
              top: tr.y,
              width: tr.width,
              height: tr.height,
            }}
          >
            {label && (
              <div
                className={`absolute whitespace-nowrap pointer-events-none ${s.label}`}
                style={{ bottom: '100%', left: 0 }}
              >
                {label}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
