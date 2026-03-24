import type { Command, NormalizedData, Plugin } from '../core/types'
import type { NodeState, BehaviorContext } from '../behaviors/types'
import { tree } from '../behaviors/tree'
import { useAria } from '../hooks/useAria'
import type { UseAriaReturn } from '../hooks/useAria'
import { core } from '../plugins/core'

export interface UseTreeViewOptions {
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  followFocus?: boolean
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
  const { data, plugins = [core()], keyMap, onChange, onActivate, initialFocus, followFocus, 'aria-label': ariaLabel } = options
  const behavior = followFocus ? { ...tree, followFocus: true } : tree
  const aria = useAria({ behavior, data, plugins, keyMap, onChange, onActivate, initialFocus })
  return toTreeViewReturn(aria, ariaLabel)
}
