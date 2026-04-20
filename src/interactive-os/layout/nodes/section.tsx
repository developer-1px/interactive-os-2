import React from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { defineLayoutNode } from '../defineLayoutNode'
import type { SectionNode } from '../flatLayout'

defineLayoutNode('section', {
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<SectionNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout: 'stack', width: 'full' })}>
        <div className={ax({ layout: 'spread', width: 'full' })}>
          <span className={ax({ textStyle: 'section' })}>{node.title}</span>
          {node.count != null && (
            <span className={ax({ textStyle: 'caption' })}>{node.count}</span>
          )}
        </div>
        {childIds.map(childId => (
          <React.Fragment key={childId}>{renderNode(childId, 'section')}</React.Fragment>
        ))}
      </div>
    )
  },
})
