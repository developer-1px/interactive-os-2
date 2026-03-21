import type { NormalizedData, Command } from '../../interactive-os/core/types'
import { ROOT_ID, createBatchCommand } from '../../interactive-os/core/types'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import { clipboardCommands } from '../../interactive-os/plugins/clipboard'

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

export default function CmsFloatingToolbar({ store, focusedId, dispatch, hidden }: CmsFloatingToolbarProps) {
  if (hidden) return null

  const context = getDepthContext(store, focusedId)

  const focusCanvas = () => {
    const canvasEl = document.querySelector('[data-cms-root]') as HTMLElement
    canvasEl?.focus()
  }

  const handleAction = (action: string) => {
    if (!focusedId) return

    switch (action) {
      case 'delete': {
        if (context === 'root' && getChildren(store, ROOT_ID).length <= 1) return
        dispatch(crudCommands.remove(focusedId))
        break
      }
      case 'duplicate': {
        dispatch(createBatchCommand([
          clipboardCommands.copy([focusedId]),
          clipboardCommands.paste(focusedId),
        ]))
        break
      }
      case 'move-up': {
        dispatch(dndCommands.moveUp(focusedId))
        break
      }
      case 'move-down': {
        dispatch(dndCommands.moveDown(focusedId))
        break
      }
      case 'add': {
        dispatch(createBatchCommand([
          clipboardCommands.copy([focusedId]),
          clipboardCommands.paste(focusedId),
        ]))
        break
      }
    }
    focusCanvas()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      focusCanvas()
    }
  }

  const rootChildren = getChildren(store, ROOT_ID)
  const isOnlySection = context === 'root' && rootChildren.length <= 1
  const disabled = context === 'none' || context === 'fields'

  return (
    <div className="cms-floating-toolbar" onKeyDown={handleKeyDown}>
      {context === 'collection' && (
        <>
          <button
            className="cms-floating-toolbar__btn"
            disabled={disabled}
            onClick={() => handleAction('add')}
          >
            + 추가
          </button>
          <div className="cms-floating-toolbar__sep" />
        </>
      )}

      <button
        className="cms-floating-toolbar__btn"
        disabled={disabled}
        onClick={() => handleAction('duplicate')}
      >
        복제
      </button>

      <button
        className="cms-floating-toolbar__btn"
        disabled={disabled || isOnlySection}
        onClick={() => handleAction('delete')}
      >
        삭제
      </button>

      <div className="cms-floating-toolbar__sep" />

      <button
        className="cms-floating-toolbar__btn"
        disabled={disabled}
        onClick={() => handleAction('move-up')}
      >
        ↑ 위로
      </button>

      <button
        className="cms-floating-toolbar__btn"
        disabled={disabled}
        onClick={() => handleAction('move-down')}
      >
        ↓ 아래로
      </button>
    </div>
  )
}
