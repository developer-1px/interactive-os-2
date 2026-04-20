import React from 'react'
import { ax, type AxPlacement } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { defineLayoutNode } from '../defineLayoutNode'
import type { OverlayNode } from '../flatLayout'

const defaultPlacement: Record<string, string> = {
  modal: 'center',
  popup: 'anchor-below',
  hint: 'anchor-below',
}

defineLayoutNode('overlay', {
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<OverlayNode>(store, nodeId)
    if (!node || !node.visible) return null
    const childIds = getChildren(store, nodeId)
    const pl = (node.placement ?? defaultPlacement[node.overlayType] ?? 'center') as AxPlacement

    return (
      <div ref={refCallback(nodeId)} className={ax({ placement: pl })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'overlay')}</React.Fragment>
        ))}
      </div>
    )
  },
})
