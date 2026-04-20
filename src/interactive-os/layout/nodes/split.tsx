// ② flatlayout-resizable-split-prd.md
import React from 'react'
import { ax } from '@styles/ax'
import type { PaneSize } from '../../store/types'
import { getChildren, getEntityData } from '../../store/createStore'
import { workspaceCommands } from '../../plugins/workspaceStore'
import { SplitPane } from '../../ui/SplitPane'
import { defineLayoutNode } from '../defineLayoutNode'
import { resolveContainerPreset } from '../containerPreset'
import type { SplitNode } from '../flatLayout'
import { ContainerIntentContext } from './_shared/containerIntent'

defineLayoutNode('split', {
  isAppRoot: true,
  fillsChildren: true,
  render: ({ nodeId, store, parentType, renderNode, refCallback, dispatch }) => {
    const node = getEntityData<SplitNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    const isHorizontal = node.direction === 'horizontal'

    const preset = resolveContainerPreset('split', parentType ? 'nested' : 'root', node.holds)
    const padding = node.padding ?? preset.padding
    const holdsAttr = node.holds ? { 'data-holds': node.holds } : {}

    // resizable: false → 고정 비율. 'fill'/'row-fill'로 overflow:hidden + flex:1 + min-0.
    if (node.resizable === false) {
      return (
        <ContainerIntentContext.Provider value={{ holds: node.holds }}>
          <div ref={refCallback(nodeId)} {...holdsAttr} className={ax({ layout: isHorizontal ? 'row-fill' : 'fill', width: 'full', ...(padding ? { padding } : {}) })}>
            {childIds.map((childId, i) => {
              const size = node.sizes[i]
              const isFlex = size === 'flex' || size === undefined
              const isAuto = size === 'auto'
              const style: React.CSSProperties = isFlex
                ? { flex: 1, flexBasis: 'auto', minWidth: 0, minHeight: 0 }
                : isAuto
                  ? { flex: '0 0 auto', flexBasis: 'auto', minWidth: 0, minHeight: 0 }
                  : { flex: '0 0 auto', flexBasis: `${size * 100}%`, minWidth: 0, minHeight: 0 }
              return (
                <div key={childId} className={ax({ layout: 'stack' })} style={style}>
                  {renderNode(childId, 'split')}
                </div>
              )
            })}
          </div>
        </ContainerIntentContext.Provider>
      )
    }

    const handleResize = (newSizes: PaneSize[]) => {
      dispatch(workspaceCommands.resize(nodeId, newSizes))
    }

    return (
      <ContainerIntentContext.Provider value={{ holds: node.holds }}>
        <div ref={refCallback(nodeId)} {...holdsAttr} className={ax({ flex: '1', layout: 'fill' })}>
          <SplitPane direction={node.direction} sizes={node.sizes} onResize={handleResize}>
            {childIds.map((childId) => renderNode(childId, 'split'))}
          </SplitPane>
        </div>
      </ContainerIntentContext.Provider>
    )
  },
})
