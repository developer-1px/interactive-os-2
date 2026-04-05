import React, { useEffect } from 'react'

import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import type { IsReachable } from '../plugins/focusRecovery'
import { useAriaZone } from '../primitives/useAriaZone'

export interface AriaZoneContext {
  containerProps: Record<string, unknown>
  getNodeProps: (id: string) => Record<string, unknown>
  getNodeState: (id: string) => NodeState
  dispatch: (command: Command) => void
  focused: string
  selected: string[]
  getStore: () => NormalizedData
}

interface AriaZoneProps {
  engine: CommandEngine
  store: NormalizedData
  pattern: AriaPattern
  scope: string
  plugins?: Plugin[]
  keyMap?: Record<string, import('../axis/types').KeyHandler>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  isReachable?: IsReachable
  disabled?: boolean
  onFocusChange?: (focusedId: string) => void
  children: (ctx: AriaZoneContext) => React.ReactNode
}

/**
 * Declarative wrapper for useAriaZone.
 * Encapsulates zone orchestration (engine + pattern + keyMap) and
 * exposes a render-prop for custom rendering.
 */
export function AriaZone({
  engine,
  store,
  pattern,
  scope,
  plugins,
  keyMap,
  onActivate,
  initialFocus,
  isReachable,
  disabled,
  onFocusChange,
  children,
}: AriaZoneProps) {
  const aria = useAriaZone({
    engine,
    store,
    pattern,
    scope,
    plugins,
    keyMap,
    onActivate,
    initialFocus,
    isReachable,
    disabled,
  })

  useEffect(() => {
    onFocusChange?.(aria.focused)
  }, [aria.focused, onFocusChange])

  return <>{children({
    containerProps: aria.containerProps,
    getNodeProps: aria.getNodeProps,
    getNodeState: aria.getNodeState,
    dispatch: aria.dispatch,
    focused: aria.focused,
    selected: aria.selected,
    getStore: aria.getStore,
  })}</>
}
