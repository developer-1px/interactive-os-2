import type { Command, NormalizedData, Plugin } from '../core/types'
import type { NodeState, BehaviorContext } from '../behaviors/types'
import { tabs } from '../behaviors/tabs'
import { useAria } from '../hooks/useAria'
import type { UseAriaReturn } from '../hooks/useAria'
import { core } from '../plugins/core'
import { history } from '../plugins/history'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'F2': (ctx) => renameCommands.startRename(ctx.focused),
  'Alt+ArrowLeft': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowRight': (ctx) => dndCommands.moveDown(ctx.focused),
}

export interface UseTabListOptions {
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  enableEditing?: boolean
  'aria-label'?: string
}

export interface UseTabListReturn {
  rootProps: Record<string, unknown>
  getItemProps: (id: string) => Record<string, unknown>
  getItemState: (id: string) => NodeState
  focused: string
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
}

function toTabListReturn(aria: UseAriaReturn, ariaLabel?: string): UseTabListReturn {
  return {
    rootProps: {
      ...aria.containerProps,
      role: 'tablist',
      'aria-label': ariaLabel,
      'aria-orientation': 'horizontal',
      'data-aria-container': '',
    },
    getItemProps: aria.getNodeProps,
    getItemState: aria.getNodeState,
    focused: aria.focused,
    dispatch: aria.dispatch,
    getStore: aria.getStore,
  }
}

export function useTabList(options: UseTabListOptions): UseTabListReturn {
  const { data, plugins = [core(), ...(options.enableEditing ? [history()] : [])], keyMap, onChange, onActivate, initialFocus, enableEditing = false, 'aria-label': ariaLabel } = options
  const mergedKeyMap = enableEditing ? { ...editingKeyMap, ...keyMap } : keyMap
  const aria = useAria({ behavior: tabs, data, plugins, keyMap: mergedKeyMap, onChange, onActivate, initialFocus })
  return toTabListReturn(aria, ariaLabel)
}
