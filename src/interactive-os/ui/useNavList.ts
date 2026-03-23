import type { Command, NormalizedData, Plugin } from '../core/types'
import type { NodeState, BehaviorContext } from '../behaviors/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { navlist } from '../behaviors/navlist'
import { useAria } from '../hooks/useAria'
import { useAriaZone } from '../hooks/useAriaZone'
import { core } from '../plugins/core'

interface UseNavListBaseOptions {
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  'aria-label'?: string
}

interface UseNavListStandaloneOptions extends UseNavListBaseOptions {
  data: NormalizedData
  onChange?: (data: NormalizedData) => void
  engine?: undefined
  scope?: undefined
  store?: undefined
}

interface UseNavListZoneOptions extends UseNavListBaseOptions {
  engine: CommandEngine
  scope: string
  store: NormalizedData
  data?: undefined
  onChange?: undefined
}

export type UseNavListOptions = UseNavListStandaloneOptions | UseNavListZoneOptions

export interface UseNavListReturn {
  rootProps: Record<string, unknown>
  getItemProps: (id: string) => Record<string, unknown>
  getItemState: (id: string) => NodeState
  focused: string
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
}

export function useNavList(options: UseNavListOptions): UseNavListReturn {
  if (options.engine) {
    return useNavListZone(options as UseNavListZoneOptions)
  }
  return useNavListStandalone(options as UseNavListStandaloneOptions)
}

function useNavListStandalone(options: UseNavListStandaloneOptions): UseNavListReturn {
  const {
    data,
    plugins = [core()],
    keyMap,
    onChange,
    onActivate,
    initialFocus,
    'aria-label': ariaLabel,
  } = options

  const aria = useAria({
    behavior: navlist,
    data,
    plugins,
    keyMap,
    onChange,
    onActivate,
    initialFocus,
  })

  return {
    rootProps: {
      ...aria.containerProps,
      role: 'listbox',
      'aria-label': ariaLabel,
      'aria-orientation': 'vertical',
      'data-aria-container': '',
    },
    getItemProps: aria.getNodeProps,
    getItemState: aria.getNodeState,
    focused: aria.focused,
    dispatch: aria.dispatch,
    getStore: aria.getStore,
  }
}

function useNavListZone(options: UseNavListZoneOptions): UseNavListReturn {
  const {
    engine,
    scope,
    store,
    plugins,
    keyMap,
    onActivate,
    initialFocus,
    'aria-label': ariaLabel,
  } = options

  const aria = useAriaZone({
    engine,
    store,
    behavior: navlist,
    scope,
    plugins,
    keyMap,
    onActivate,
    initialFocus,
  })

  return {
    rootProps: {
      ...aria.containerProps,
      role: 'listbox',
      'aria-label': ariaLabel,
      'aria-orientation': 'vertical',
      'data-aria-container': '',
    },
    getItemProps: aria.getNodeProps,
    getItemState: aria.getNodeState,
    focused: aria.focused,
    dispatch: aria.dispatch,
    getStore: aria.getStore,
  }
}
