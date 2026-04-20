import React from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { defineLayoutNode } from '../defineLayoutNode'
import { resolveContainerPreset } from '../containerPreset'
import type { GridNode } from '../flatLayout'

defineLayoutNode('grid', {
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<GridNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const layoutValue = `grid-${node.columns}` as 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7'
    const preset = resolveContainerPreset('grid')
    const gap = node.gap ?? preset.gap

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: layoutValue, width: 'full', ...(gap ? { gap } : {}) })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'grid')}</React.Fragment>
        ))}
      </div>
    )
  },
})
