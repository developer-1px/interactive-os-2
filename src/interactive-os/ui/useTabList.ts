import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { Command } from '../engine/types'
import type { NodeState } from '../pattern/types'
import { tabs } from '../pattern/roles/tabs'
import { tabsManual } from '../pattern/roles/tabsManual'
import { useAria } from '../primitives/useAria'
import type { UseAriaReturn } from '../primitives/useAria'
import { history } from '../plugins/history'
import { crudCommands } from '../plugins/crud'
import { renameCommands } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'
import { key } from '../axis/types'
import type { KeyHandler } from '../axis/types'

const editingKeyMap: Record<string, KeyHandler> = {
  'Delete': key(['crud:remove'], (ctx) => crudCommands.remove(ctx.focused)),
  'F2': key(['rename:start'], (ctx) => renameCommands.startRename(ctx.focused)),
  'Alt+ArrowLeft': key(['dnd:moveUp'], (ctx) => dndCommands.moveUp(ctx.focused)),
  'Alt+ArrowRight': key(['dnd:moveDown'], (ctx) => dndCommands.moveDown(ctx.focused)),
}

export interface UseTabListOptions {
  data: NormalizedData
  plugins?: Plugin[]
  keyMap?: Record<string, KeyHandler>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  initialFocus?: string
  enableEditing?: boolean
  /** When true, uses tabsManual pattern (selection does NOT follow focus). Default: false (automatic). */
  manual?: boolean
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
  const { data, plugins = [...(options.enableEditing ? [history()] : [])], keyMap, onChange, onActivate, initialFocus, enableEditing = false, manual = false, 'aria-label': ariaLabel } = options
  const mergedKeyMap = enableEditing ? { ...editingKeyMap, ...keyMap } : keyMap
  const pattern = manual ? tabsManual : tabs
  const aria = useAria({ pattern, data, plugins, keyMap: mergedKeyMap, onChange, onActivate, initialFocus, 'aria-label': ariaLabel })
  return toTabListReturn(aria, ariaLabel)
}
