import { useMemo } from 'react'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import type { Command } from '@os/engine/types'
import { createBatchCommand } from '@os/engine/types'
import { getChildren, getParent } from '@os/store/createStore'
import { getSpatialParentId } from '@os/plugins/spatial'
import { crudCommands } from '@os/plugins/crud'
import { dndCommands } from '@os/plugins/dnd'
import { clipboardCommands } from '@os/plugins/clipboard'
import { cmsCanDelete } from './cmsSchema'
import { key } from '@os/axis/types'
import { ButtonToolbar } from '@os/ui/ButtonToolbar'
import { ax } from '@styles/ax'

interface CmsFloatingToolbarProps {
  store: NormalizedData
  focusedId: string
  dispatch: (cmd: Command) => void
  hidden: boolean
}

type DepthContext = 'none' | 'root' | 'collection' | 'fields'

function getDepthContext(store: NormalizedData, focusedId: string): DepthContext {
  if (!focusedId) return 'none'

  const spatialParent = getSpatialParentId(store)

  if (spatialParent === ROOT_ID) return 'root'

  const spatialGrandparent = getParent(store, spatialParent)
  if (spatialGrandparent === ROOT_ID || spatialGrandparent === undefined) {
    return 'collection'
  }

  return 'fields'
}

interface ToolbarAction {
  id: string
  label: string
  condition?: (ctx: DepthContext) => boolean
  disabledWhen?: (ctx: DepthContext, isOnly: boolean) => boolean
}

const toolbarActions: ToolbarAction[] = [
  { id: 'add', label: '+ 추가', condition: (ctx) => ctx === 'collection' },
  { id: 'duplicate', label: '복제' },
  { id: 'delete', label: '삭제' },
  { id: 'move-up', label: '↑ 위로' },
  { id: 'move-down', label: '↓ 아래로' },
]

export default function CmsFloatingToolbar({ store, focusedId, dispatch, hidden }: CmsFloatingToolbarProps) {
  const context = getDepthContext(store, focusedId)
  const rootChildren = getChildren(store, ROOT_ID)
  const isOnlySection = context === 'root' && rootChildren.length <= 1
  const disabled = context === 'none' || context === 'fields'

  const separatorAfter = useMemo(() => new Set(['add', 'delete']), [])

  const toolbarData = useMemo(() => {
    const visible = toolbarActions.filter(a => !a.condition || a.condition(context))
    return {
        entities: Object.fromEntries(
          visible.map(a => [a.id, {
            id: a.id,
            data: {
              label: a.label,
              disabled: disabled || (a.id === 'delete' && isOnlySection),
              separator: separatorAfter.has(a.id),
            },
          }])
        ),
        relationships: { __root__: visible.map(a => a.id) },
      } as NormalizedData
  }, [context, disabled, isOnlySection, separatorAfter])

  const focusCanvas = () => {
    const canvasEl = document.querySelector('[data-cms-root]') as HTMLElement
    canvasEl?.focus()
  }

  const keyMap = useMemo(() => ({
    Escape: key(['dismiss'], () => { focusCanvas() }),
  }), [])

  const handleActivate = useMemo(() => (actionId: string) => {
    if (!focusedId || disabled) return

    switch (actionId) {
      case 'delete': {
        const parentId = getParent(store, focusedId)
        if (parentId) {
          const parentData = store.entities[parentId]?.data as Record<string, unknown> | undefined
          if (!cmsCanDelete(parentData)) return
        }
        if (isOnlySection) return
        dispatch(crudCommands.remove(focusedId))
        break
      }
      case 'duplicate':
      case 'add':
        dispatch(createBatchCommand([
          clipboardCommands.copy([focusedId]),
          clipboardCommands.paste(focusedId),
        ]))
        break
      case 'move-up':
        dispatch(dndCommands.moveUp(focusedId))
        break
      case 'move-down':
        dispatch(dndCommands.moveDown(focusedId))
        break
    }
    focusCanvas()
  }, [focusedId, disabled, store, isOnlySection, dispatch])

  if (hidden) return null

  return (
    <div className={`cms-floating-toolbar ${ax({ surface: 'overlay' })} fixed flex-row items-center`}>
      <ButtonToolbar
        data={toolbarData}
        plugins={[]}
        keyMap={keyMap}
        onActivate={handleActivate}
        aria-label="Section actions"
      />
    </div>
  )
}
