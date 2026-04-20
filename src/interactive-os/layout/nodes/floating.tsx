import React from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { defineLayoutNode } from '../defineLayoutNode'
import type { FloatingNode } from '../flatLayout'

defineLayoutNode('floating', {
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<FloatingNode>(store, nodeId)
    if (!node || node.hidden) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div ref={refCallback(nodeId)} className={ax({ placement: node.anchor })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'floating')}</React.Fragment>
        ))}
      </div>
    )
  },
})
