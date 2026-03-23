import type { Command, NormalizedData, Plugin } from '../core/types'
import type { NodeState, BehaviorContext } from '../behaviors/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { tree } from '../behaviors/tree'
import { useAria } from '../hooks/useAria'
import type { UseAriaReturn } from '../hooks/useAria'
import { useAriaZone } from '../hooks/useAriaZone'
import { core } from '../plugins/core'

interface UseTreeViewBaseOptions {
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  followFocus?: boolean
  'aria-label'?: string
}

interface UseTreeViewStandaloneOptions extends UseTreeViewBaseOptions {
  data: NormalizedData
  onChange?: (data: NormalizedData) => void
  engine?: undefined
  scope?: undefined
  store?: undefined
}

interface UseTreeViewZoneOptions extends UseTreeViewBaseOptions {
  engine: CommandEngine
  scope: string
  store: NormalizedData
  data?: undefined
  onChange?: undefined
}

export type UseTreeViewOptions = UseTreeViewStandaloneOptions | UseTreeViewZoneOptions

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
  const ariaLabel = options['aria-label']
  const behavior = options.followFocus ? { ...tree, followFocus: true } : tree

  if (options.engine) {
    const { engine, scope, store, plugins, keyMap, onActivate, initialFocus } = options as UseTreeViewZoneOptions
    const aria = useAriaZone({ engine, store, behavior, scope, plugins, keyMap, onActivate, initialFocus })
    return toTreeViewReturn(aria, ariaLabel)
  }

  const { data, plugins = [core()], keyMap, onChange, onActivate, initialFocus } = options as UseTreeViewStandaloneOptions
  const aria = useAria({ behavior, data, plugins, keyMap, onChange, onActivate, initialFocus })
  return toTreeViewReturn(aria, ariaLabel)
}
