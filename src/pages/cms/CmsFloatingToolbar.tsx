import type { NormalizedData } from '../../interactive-os/core/types'
import { ROOT_ID } from '../../interactive-os/core/types'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { FOCUS_ID } from '../../interactive-os/plugins/core'

interface CmsFloatingToolbarProps {
  data: NormalizedData
  onDataChange: (data: NormalizedData) => void
  hidden: boolean // true during present mode
}

type DepthContext = 'none' | 'root' | 'collection' | 'fields'

function getDepthContext(data: NormalizedData): { context: DepthContext; focusedId: string | undefined } {
  const focusedId = data.entities[FOCUS_ID]?.focusedId as string | undefined

  if (!focusedId) {
    return { context: 'none', focusedId: undefined }
  }

  const spatialParent = getSpatialParentId(data)

  // spatialParent is ROOT_ID (or undefined maps to ROOT_ID) → section level
  if (spatialParent === ROOT_ID) {
    return { context: 'root', focusedId }
  }

  // spatialParent is a child of ROOT_ID → collection level
  const spatialParentOfSpatialParent = getParent(data, spatialParent)
  if (spatialParentOfSpatialParent === ROOT_ID || spatialParentOfSpatialParent === undefined) {
    return { context: 'collection', focusedId }
  }

  // Deeper → fields
  return { context: 'fields', focusedId }
}

export default function CmsFloatingToolbar({ data, hidden }: CmsFloatingToolbarProps) {
  if (hidden) return null

  const { context, focusedId } = getDepthContext(data)

  const focusCanvas = () => {
    const canvasEl = document.querySelector('[data-cms-root]') as HTMLElement
    canvasEl?.focus()
  }

  const handleAction = (action: string) => {
    // TODO: dispatch command on store (Task 10 integration)
    console.log('toolbar action:', action, 'on', focusedId)
    focusCanvas()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      focusCanvas()
    }
  }

  // Guard: disable delete at root level when only 1 section remains
  const rootChildren = getChildren(data, ROOT_ID)
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
