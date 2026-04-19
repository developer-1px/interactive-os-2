/** @catalog 선택/포커스 시각 오버레이 */
// ② 2026-03-31-selection-overlay-prd.md
import type { RefObject } from 'react'
import { ax } from '@styles/ax'
import { useRectTracker } from './useRectTracker'
import type { TrackedRect } from './useRectTracker'
import './SelectionOverlay.css'

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
  focus: 'sel-overlay-focus',
  selection: '',
  hover: 'sel-overlay-hover',
}

export function SelectionOverlay({ containerRef, focusedId, selectedIds, nodeIdAttr, hover, labelFn }: SelectionOverlayProps) {
  const rects = useRectTracker({ containerRef, focusedId, selectedIds, nodeIdAttr, hover })

  if (rects.length === 0) return null

  return (
    <div className={`sel-overlay-container absolute inset-0 ${ax({ })}`}>
      {rects.map((tr) => {
        const label = labelFn?.(tr.id, tr)
        return (
          <div
            key={`${tr.kind}-${tr.id}`}
            className={`absolute sel-overlay-rect ${ax({ })} ${kindClass[tr.kind]}`}
            style={{
              left: tr.x,
              top: tr.y,
              width: tr.width,
              height: tr.height,
            }}
          >
            {label && (
              <div
                className={`sel-overlay-label ${ax({ textStyle: 'caption', placement: 'above' })}`}
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
