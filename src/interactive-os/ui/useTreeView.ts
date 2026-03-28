import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { Command } from '../engine/types'
import type { NodeState, PatternContext } from '../pattern/types'
import { tree } from '../pattern/roles/tree'
import { selectionFollowsFocusMiddleware } from '../axis/select'
import { useAria } from '../primitives/useAria'
import type { UseAriaReturn } from '../primitives/useAria'

export interface UseTreeViewOptions {
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: PatternContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  selectionFollowsFocus?: boolean
  selectable?: boolean
  'aria-label'?: string
}

export interface UseTreeViewReturn {
  rootProps: Record<string, unknown>
  getItemProps: (id: string) => Record<string, unknown>
  getItemState: (id: string) => NodeState
  focused: string
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
}

function toTreeViewReturn(aria: UseAriaReturn, ariaLabel?: string): UseTreeViewReturn {
  return {
    rootProps: {
      ...aria.containerProps,
      role: 'tree',
      'aria-label': ariaLabel,
      'data-aria-container': '',
    },
    getItemProps: aria.getNodeProps,
    getItemState: aria.getNodeState,
    focused: aria.focused,
    dispatch: aria.dispatch,
    getStore: aria.getStore,
  }
}

export function useTreeView(options: UseTreeViewOptions): UseTreeViewReturn {
  const { data, plugins = [], keyMap, onChange, onActivate, initialFocus, selectionFollowsFocus, selectable = false, 'aria-label': ariaLabel } = options
  let pattern = selectionFollowsFocus
    ? { ...tree, selectionFollowsFocus: true, activationFollowsSelection: true, middleware: selectionFollowsFocusMiddleware() }
    : tree
  if (!selectable) {
    const { Space: _space, ...rest } = pattern.keyMap
    pattern = { ...pattern, keyMap: rest, selectionMode: undefined, selectOnClick: false }
  }
  const aria = useAria({ pattern, data, plugins, keyMap, onChange, onActivate, initialFocus })
  return toTreeViewReturn(aria, ariaLabel)
}
