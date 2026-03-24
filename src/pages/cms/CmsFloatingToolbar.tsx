import React, { useMemo } from 'react'
import type { NormalizedData, Command } from '../../interactive-os/core/types'
import { ROOT_ID, createBatchCommand } from '../../interactive-os/core/types'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import { clipboardCommands } from '../../interactive-os/plugins/clipboard'
import { cmsCanDelete } from './cms-schema'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import { toolbar } from '../../interactive-os/behaviors/toolbar'
import { useAria } from '../../interactive-os/hooks/useAria'
import { core } from '../../interactive-os/plugins/core'

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

  const { visibleActions, toolbarData } = useMemo(() => {
    const visible = toolbarActions.filter(a => !a.condition || a.condition(context))
    return {
      visibleActions: visible,
      toolbarData: {
        entities: Object.fromEntries(
          visible.map(a => [a.id, { id: a.id, data: { label: a.label } }])
        ),
        relationships: { __root__: visible.map(a => a.id) },
      } as NormalizedData,
    }
  }, [context])

  const focusCanvas = () => {
    const canvasEl = document.querySelector('[data-cms-root]') as HTMLElement
    canvasEl?.focus()
  }

  const keyMap = useMemo((): Record<string, (ctx: BehaviorContext) => Command | void> => ({
    Escape: () => { focusCanvas() },
  }), [])

  const aria = useAria({
    behavior: toolbar,
    data: toolbarData,
    plugins: [core()],
    keyMap,
    onActivate: (actionId) => {
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
    },
  })

  if (hidden) return null

  return (
    <div className="cms-floating-toolbar" role="toolbar" aria-label="Section actions" {...aria.containerProps}>
      {visibleActions.map((action) => {
        const props = aria.getNodeProps(action.id)
        const isDisabled = disabled || (action.id === 'delete' && isOnlySection)

        return (
          <React.Fragment key={action.id}>
            <button
              {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
              className="cms-floating-toolbar__btn"
              disabled={isDisabled}
            >
              {action.label}
            </button>
            {(action.id === 'add' || action.id === 'delete') && (
              <div className="cms-floating-toolbar__sep" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
