import React from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { defineLayoutNode } from '../defineLayoutNode'
import { resolveContainerPreset } from '../containerPreset'
import type { StackNode } from '../flatLayout'
import { ContainerIntentContext } from './_shared/containerIntent'
import { resolveScrollLayout } from './_shared/resolveScrollLayout'

defineLayoutNode('stack', {
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<StackNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const preset = resolveContainerPreset('stack', undefined, node.holds)
    const gap = node.gap ?? preset.gap
    const padding = node.padding ?? preset.padding
    const layout = resolveScrollLayout(node.scroll, 'stack')
    const holdsAttr = node.holds ? { 'data-holds': node.holds } : {}

    return (
      <ContainerIntentContext.Provider value={{ holds: node.holds }}>
        <div ref={refCallback(nodeId)} {...holdsAttr} className={ax({ layout, width: 'full', flex: '1', ...(gap ? { gap } : {}), ...(padding ? { padding } : {}) })}>
          {childIds.map((childId) => (
            <React.Fragment key={childId}>{renderNode(childId, 'stack')}</React.Fragment>
          ))}
        </div>
      </ContainerIntentContext.Provider>
    )
  },
})
