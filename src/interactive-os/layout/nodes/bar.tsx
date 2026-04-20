import React from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { defineLayoutNode } from '../defineLayoutNode'
import { resolveContainerPreset } from '../containerPreset'
import type { BarNode } from '../flatLayout'
import { resolveScrollLayout } from './_shared/resolveScrollLayout'

defineLayoutNode('bar', {
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<BarNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const base = node.justify === 'between' ? 'spread' as const : 'bar' as const
    const preset = resolveContainerPreset('bar')
    const gap = node.gap ?? preset.gap
    const padding = node.padding ?? preset.padding
    const layout = resolveScrollLayout(node.scroll, base)

    return (
      <div ref={refCallback(nodeId)} className={ax({ layout, width: 'full', ...(gap ? { gap } : {}), ...(padding ? { padding } : {}) })}>
        {childIds.map((childId) => (
          <React.Fragment key={childId}>{renderNode(childId, 'bar')}</React.Fragment>
        ))}
      </div>
    )
  },
})
