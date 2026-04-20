import React from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { resolveWidget } from '../widgetRegistry'
import { defineLayoutNode, getLayoutNode } from '../defineLayoutNode'
import type { WidgetNode } from '../flatLayout'
import { WidgetSlot } from './_shared/WidgetSlot'

defineLayoutNode('widget', {
  labelFrom: (n) => (n as unknown as WidgetNode).widget,
  render: ({ nodeId, store, parentType, registry, refCallback, renderNode }) => {
    const node = getEntityData<WidgetNode>(store, nodeId)
    if (!node) return null
    const Component = resolveWidget(registry, node.widget)

    if (!Component) {
      return (
        <div className={ax({ role: 'control-group', surface: 'sunken' })}>
          Unknown widget: {node.widget}
        </div>
      )
    }

    const childIds = getChildren(store, nodeId)
    const children = childIds.length > 0
      ? childIds.map((childId) => <React.Fragment key={childId}>{renderNode(childId, 'widget')}</React.Fragment>)
      : undefined

    const parentDesc = getLayoutNode(parentType)
    const isSplitChild = parentType === 'split' || parentType === 'nav'
    const fillSlot = parentDesc?.fillsChildren || (node as Record<string, unknown>).fill

    // scroll 필드 1순위, fillSlot 2순위, 그 외는 clip (사일런트 overflow 차단).
    const layout = node.scroll === 'y' ? 'scroll' as const
                 : node.scroll === 'x' ? 'scroll-x' as const
                 : fillSlot ? 'fill' as const
                 : 'clip' as const

    return <WidgetSlot
      nodeId={nodeId}
      refCallback={refCallback}
      layout={layout}
      nodePadding={node.padding}
      isSplitChild={isSplitChild}
      Component={Component}
      componentProps={node.props ?? {}}
      source={node.source}
    >{children}</WidgetSlot>
  },
})
