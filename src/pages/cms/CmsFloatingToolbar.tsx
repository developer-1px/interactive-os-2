import type { NormalizedData } from '../../interactive-os/core/types'
import { ROOT_ID } from '../../interactive-os/core/types'
import { getChildren, getParent, removeEntity, addEntity } from '../../interactive-os/core/createStore'
import { getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { FOCUS_ID } from '../../interactive-os/plugins/core'
import type { SectionVariant } from './cms-templates'
import { createSection } from './cms-templates'

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

// ── Store manipulation helpers (mirror sidebar logic) ──

function reorderInParent(
  store: NormalizedData,
  parentId: string,
  nodeId: string,
  direction: -1 | 1,
): NormalizedData {
  const children = [...getChildren(store, parentId)]
  const idx = children.indexOf(nodeId)
  if (idx < 0) return store
  const target = idx + direction
  if (target < 0 || target >= children.length) return store
  ;[children[idx], children[target]] = [children[target], children[idx]]
  return {
    ...store,
    relationships: { ...store.relationships, [parentId]: children },
  }
}

function duplicateInParent(
  store: NormalizedData,
  parentId: string,
  nodeId: string,
): NormalizedData {
  if (parentId === ROOT_ID) {
    // Root-level section: use template factory
    const sectionData = store.entities[nodeId]?.data as Record<string, string> | undefined
    const variant = (sectionData?.variant ?? 'hero') as SectionVariant
    const template = createSection(variant)
    const rootChildren = getChildren(store, ROOT_ID)
    const idx = rootChildren.indexOf(nodeId)
    const insertAt = idx + 1
    const entities = { ...store.entities, ...template.entities }
    const relationships = { ...store.relationships, ...template.relationships }
    const newRootChildren = [
      ...rootChildren.slice(0, insertAt),
      template.rootId,
      ...rootChildren.slice(insertAt),
    ]
    relationships[ROOT_ID] = newRootChildren
    return { entities, relationships }
  }
  // Collection-level: clone entity
  const entity = store.entities[nodeId]
  if (!entity) return store
  const cloneId = `${nodeId}-copy-${Date.now()}`
  const cloned = { ...entity, id: cloneId, data: { ...(entity.data as Record<string, unknown>) } }
  const children = getChildren(store, parentId)
  const idx = children.indexOf(nodeId)
  const newChildren = [...children.slice(0, idx + 1), cloneId, ...children.slice(idx + 1)]
  return {
    entities: { ...store.entities, [cloneId]: cloned },
    relationships: { ...store.relationships, [parentId]: newChildren },
  }
}

function addAfterCurrent(
  store: NormalizedData,
  parentId: string,
  nodeId: string,
): NormalizedData {
  const entity = store.entities[nodeId]
  if (!entity) return store
  const newId = `${parentId}-item-${Date.now()}`
  const newEntity = { ...entity, id: newId, data: { ...(entity.data as Record<string, unknown>) } }
  const children = getChildren(store, parentId)
  const idx = children.indexOf(nodeId)
  return addEntity(
    { ...store, entities: { ...store.entities, [newId]: newEntity } },
    newEntity,
    parentId,
    idx + 1,
  )
}

export default function CmsFloatingToolbar({ data, onDataChange, hidden }: CmsFloatingToolbarProps) {
  if (hidden) return null

  const { context, focusedId } = getDepthContext(data)

  const focusCanvas = () => {
    requestAnimationFrame(() => {
      const canvasEl = document.querySelector('[data-cms-root]') as HTMLElement
      canvasEl?.focus()
    })
  }

  const handleAction = (action: string) => {
    if (!focusedId) return
    const parentId = getParent(data, focusedId) ?? ROOT_ID

    switch (action) {
      case 'delete': {
        // Guard: minimum 1 section at root
        if (parentId === ROOT_ID && getChildren(data, ROOT_ID).length <= 1) return
        onDataChange(removeEntity(data, focusedId))
        break
      }
      case 'duplicate': {
        onDataChange(duplicateInParent(data, parentId, focusedId))
        break
      }
      case 'move-up': {
        onDataChange(reorderInParent(data, parentId, focusedId, -1))
        break
      }
      case 'move-down': {
        onDataChange(reorderInParent(data, parentId, focusedId, 1))
        break
      }
      case 'add': {
        onDataChange(addAfterCurrent(data, parentId, focusedId))
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
