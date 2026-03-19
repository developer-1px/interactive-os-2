import { useCallback } from 'react'
import { useAria } from '../../interactive-os/hooks/useAria'
import { spatial } from '../../interactive-os/behaviors/spatial'
import { useSpatialNav } from '../../interactive-os/hooks/use-spatial-nav'
import { core } from '../../interactive-os/plugins/core'
import { focusCommands } from '../../interactive-os/plugins/core'
import { spatialCommands, getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import { createBatchCommand } from '../../interactive-os/core/types'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { Locale } from './cms-types'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'

interface CmsCanvasProps {
  data: NormalizedData
  onDataChange: (data: NormalizedData) => void
  locale: Locale
}

const plugins = [core()]

export default function CmsCanvas({ data, onDataChange, locale }: CmsCanvasProps) {
  const spatialKeyMap = useSpatialNav('[data-cms-root]', data)
  const aria = useAria({
    behavior: spatial,
    data,
    plugins,
    keyMap: spatialKeyMap,
    onChange: onDataChange,
  })

  // Click handler: jump to node's depth + focus
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const store = aria.getStore()
    const parentId = getParent(store, nodeId) ?? ROOT_ID
    const currentSpatialParent = getSpatialParentId(store)

    if (parentId !== currentSpatialParent) {
      // Switch depth to the clicked node's parent
      if (parentId === ROOT_ID) {
        // Go to root — exit until at root
        const exitCmd = spatialCommands.exitToParent()
        // Keep exiting (simple: just set spatial parent to nothing for root)
        aria.dispatch(createBatchCommand([
          exitCmd,
          focusCommands.setFocus(nodeId),
        ]))
        return
      }
      aria.dispatch(createBatchCommand([
        spatialCommands.enterChild(parentId),
        focusCommands.setFocus(nodeId),
      ]))
      return
    }
    aria.dispatch(focusCommands.setFocus(nodeId))
  }, [aria])

  // Recursive renderer — ALL nodes always rendered
  function renderNode(nodeId: string): React.ReactNode {
    const store = aria.getStore()
    const entity = store.entities[nodeId]
    if (!entity) return null

    const state = aria.getNodeState(nodeId)
    const props = aria.getNodeProps(nodeId)
    const children = getChildren(store, nodeId)
    const d = (entity.data ?? {}) as Record<string, string>

    // Destructure props from aria to override onClick
    const {
      onClick: _,
      onKeyDown,
      onFocus,
      tabIndex,
      role: ariaRole,
      ...restProps
    } = props as Record<string, unknown>
    void _

    const className = getNodeClassName(d, state)
    const Tag = getNodeTag(d)

    // For section nodes, render section header + children container
    if (d.type === 'section') {
      const childrenContainerClass = getChildrenContainerClassName(d)

      return (
        <Tag
          key={nodeId}
          {...(restProps as React.HTMLAttributes<HTMLElement>)}
          role={ariaRole as string}
          tabIndex={tabIndex as number}
          onKeyDown={onKeyDown as React.KeyboardEventHandler}
          onFocus={onFocus as React.FocusEventHandler}
          onClick={(e: React.MouseEvent) => handleNodeClick(nodeId, e)}
          className={className}
        >
          {(() => {
            const headerIds: string[] = []
            const contentIds: string[] = []
            for (const childId of children) {
              const childData = (store.entities[childId]?.data ?? {}) as Record<string, string>
              if (HEADER_TYPES.has(childData.type)) {
                headerIds.push(childId)
              } else {
                contentIds.push(childId)
              }
            }
            return (
              <>
                {headerIds.map(childId => renderNode(childId))}
                {childrenContainerClass && contentIds.length > 0 ? (
                  <div className={childrenContainerClass}>
                    {contentIds.map(childId => renderNode(childId))}
                  </div>
                ) : (
                  contentIds.map(childId => renderNode(childId))
                )}
              </>
            )
          })()}
        </Tag>
      )
    }

    // For card nodes, render all children via renderNode
    if (d.type === 'card') {
      return (
        <div
          key={nodeId}
          {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
          role={ariaRole as string}
          tabIndex={tabIndex as number}
          onKeyDown={onKeyDown as React.KeyboardEventHandler}
          onFocus={onFocus as React.FocusEventHandler}
          onClick={(e) => handleNodeClick(nodeId, e)}
          className={className}
        >
          {children.map(childId => renderNode(childId))}
        </div>
      )
    }

    // Leaf / generic nodes
    return (
      <Tag
        key={nodeId}
        {...(restProps as React.HTMLAttributes<HTMLElement>)}
        role={ariaRole as string}
        tabIndex={tabIndex as number}
        onKeyDown={onKeyDown as React.KeyboardEventHandler}
        onFocus={onFocus as React.FocusEventHandler}
        onClick={(e: React.MouseEvent) => handleNodeClick(nodeId, e)}
        className={className || undefined}
      >
        <NodeContent data={d} locale={locale} />
        {children.length > 0 && children.map(childId => renderNode(childId))}
      </Tag>
    )
  }

  return (
    <div className="cms-landing" data-cms-root data-aria-container="">
      {getChildren(aria.getStore(), ROOT_ID).map(id => renderNode(id))}
    </div>
  )
}
