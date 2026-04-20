import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { FlatLayoutSurfaceContext } from '../../ui/useFlatLayoutSurface'
import { defineLayoutNode } from '../defineLayoutNode'
import type { TabNode } from '../flatLayout'

defineLayoutNode('tab', {
  isAppRoot: true,
  fillsChildren: true,
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const tabData = getEntityData<TabNode>(store, nodeId)
    const childIds = getChildren(store, nodeId)
    if (!tabData || childIds.length === 0) return null
    return (
      <FlatLayoutSurfaceContext.Provider value={{ tabNodeId: nodeId, tabData }}>
        <div ref={refCallback(nodeId)} className={ax({ layout: 'fill', flex: '1' })}>
          {renderNode(childIds[0]!, 'tab')}
        </div>
      </FlatLayoutSurfaceContext.Provider>
    )
  },
})
