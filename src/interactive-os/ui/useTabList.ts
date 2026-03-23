import type { Command, NormalizedData, Plugin } from '../core/types'
import type { NodeState, BehaviorContext } from '../behaviors/types'
import type { CommandEngine } from '../core/createCommandEngine'
import { tabs } from '../behaviors/tabs'
import { useAria } from '../hooks/useAria'
import type { UseAriaReturn } from '../hooks/useAria'
import { useAriaZone } from '../hooks/useAriaZone'
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

interface UseTabListBaseOptions {
  plugins?: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  enableEditing?: boolean
  'aria-label'?: string
}

interface UseTabListStandaloneOptions extends UseTabListBaseOptions {
  data: NormalizedData
  onChange?: (data: NormalizedData) => void
  engine?: undefined
  scope?: undefined
  store?: undefined
}

interface UseTabListZoneOptions extends UseTabListBaseOptions {
  engine: CommandEngine
  scope: string
  store: NormalizedData
  data?: undefined
  onChange?: undefined
}

export type UseTabListOptions = UseTabListStandaloneOptions | UseTabListZoneOptions

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
  const ariaLabel = options['aria-label']
  const enableEditing = options.enableEditing ?? false

  const mergedKeyMap = enableEditing
    ? { ...editingKeyMap, ...options.keyMap }
    : options.keyMap

  if (options.engine) {
    const { engine, scope, store, plugins, onActivate, initialFocus } = options as UseTabListZoneOptions
    const aria = useAriaZone({ engine, store, behavior: tabs, scope, plugins, keyMap: mergedKeyMap, onActivate, initialFocus })
    return toTabListReturn(aria, ariaLabel)
  }

  const { data, plugins = [core(), ...(enableEditing ? [history()] : [])], keyMap: _keyMap, onChange, onActivate, initialFocus } = options as UseTabListStandaloneOptions
  const aria = useAria({ behavior: tabs, data, plugins, keyMap: mergedKeyMap, onChange, onActivate, initialFocus })
  return toTabListReturn(aria, ariaLabel)
}
