import React from 'react'

import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { useAria } from '../primitives/useAria'
import { useSpatialNav } from '../plugins/useSpatialNav'
import { spatialView } from './spatialViewPreset'

const CONTAINER_SELECTOR = '[data-spatial-view]'

export interface SpatialViewContext {
  getNodeProps: (id: string) => Record<string, unknown>
  getNodeState: (id: string) => NodeState
  focused: string
}

interface SpatialViewProps {
  data: NormalizedData
  children: (ctx: SpatialViewContext) => React.ReactNode
  'aria-label'?: string
}

/**
 * Read-only spatial navigation container.
 * Arrow keys move focus based on DOM position (useSpatialNav).
 * Layout is entirely controlled by the consumer via children render-prop.
 */
export function SpatialView({
  data,
  children,
  'aria-label': ariaLabel,
}: SpatialViewProps) {
  const spatialNav = useSpatialNav(CONTAINER_SELECTOR, data)

  const aria = useAria({
    pattern: spatialView,
    data,
    keyMap: spatialNav.keyMap,
  })

  return (
    <div
      data-spatial-view=""
      data-aria-container=""
      {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      aria-label={ariaLabel}
    >
      {children({
        getNodeProps: aria.getNodeProps,
        getNodeState: aria.getNodeState,
        focused: aria.focused,
      })}
    </div>
  )
}
