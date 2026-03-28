import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { Command } from '../engine/types'
import type { NodeState, PatternContext } from '../pattern/types'
import { navlist } from '../misc/navlist'
import { useAria } from '../primitives/useAria'
import type { UseAriaReturn } from '../primitives/useAria'

export interface UseNavListOptions {
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: PatternContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  'aria-label'?: string
}

export interface UseNavListReturn {
  rootProps: Record<string, unknown>
  getItemProps: (id: string) => Record<string, unknown>
  getItemState: (id: string) => NodeState
  focused: string
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
}

function toNavListReturn(aria: UseAriaReturn, ariaLabel?: string): UseNavListReturn {
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

export function useNavList(options: UseNavListOptions): UseNavListReturn {
  const { data, plugins = [], keyMap, onChange, onActivate, initialFocus, 'aria-label': ariaLabel } = options
  const aria = useAria({ pattern: navlist, data, plugins, keyMap, onChange, onActivate, initialFocus })
  return toNavListReturn(aria, ariaLabel)
}
