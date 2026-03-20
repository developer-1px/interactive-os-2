import { useCallback, useEffect, useMemo } from 'react'
import { useAriaZone } from '../../interactive-os/hooks/useAriaZone'
import { spatial } from '../../interactive-os/behaviors/spatial'
import { useSpatialNav } from '../../interactive-os/hooks/useSpatialNav'
import { focusCommands } from '../../interactive-os/plugins/core'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import { clipboardCommands } from '../../interactive-os/plugins/clipboard'
import { historyCommands } from '../../interactive-os/plugins/history'
import { spatialCommands, getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { ROOT_ID, createBatchCommand } from '../../interactive-os/core/types'
import type { NormalizedData, Command } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import type { Locale } from './cms-types'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'

interface CmsCanvasProps {
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  onFocusChange?: (focusedId: string) => void
}

/** CRUD keyMap for CMS Canvas — os commands with undo/redo */
const cmsKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  Delete: (ctx) => {
    // Minimum-1-section guard: if focused is a root child and it's the only one, skip
    const rootChildren = ctx.getChildren(ROOT_ID)
    if (rootChildren.includes(ctx.focused) && rootChildren.length <= 1) return
    return crudCommands.remove(ctx.focused)
  },
  'Mod+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Mod+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
  'Mod+D': (ctx) => {
    // Copy then paste = duplicate with new IDs (handles subtrees)
    return createBatchCommand([
      clipboardCommands.copy([ctx.focused]),
      clipboardCommands.paste(ctx.focused),
    ])
  },
  'Mod+C': (ctx) => clipboardCommands.copy([ctx.focused]),
  'Mod+X': (ctx) => clipboardCommands.cut([ctx.focused]),
  'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
  'Mod+Z': () => historyCommands.undo(),
  'Mod+Shift+Z': () => historyCommands.redo(),
}

export default function CmsCanvas({ engine, store, locale, onFocusChange }: CmsCanvasProps) {
  const spatialKeyMap = useSpatialNav('[data-cms-root]', store, 'cms')

  // Merge spatial nav + CMS CRUD keyMap (CRUD takes precedence for Mod+ combos)
  const mergedKeyMap = useMemo(
    () => ({ ...spatialKeyMap, ...cmsKeyMap }),
    [spatialKeyMap],
  )

  // focusRecovery disabled: spatial depth navigation conflicts with isVisible() expand/collapse model
  const aria = useAriaZone({
    engine,
    store,
    behavior: spatial,
    scope: 'cms',
    keyMap: mergedKeyMap,
    focusRecovery: false,
  })

  // Report focus changes to parent (for activeSectionId computation)
  useEffect(() => {
    onFocusChange?.(aria.focused)
  }, [aria.focused, onFocusChange])

  // Click handler: jump to node's depth + focus
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const s = aria.getStore()
    const parentId = getParent(s, nodeId) ?? ROOT_ID
    const currentSpatialParent = getSpatialParentId(s)

    if (parentId !== currentSpatialParent) {
      if (parentId === ROOT_ID) {
        const exitCmd = spatialCommands.exitToParent()
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
  const currentStore = aria.getStore()
  function renderNode(nodeId: string): React.ReactNode {
    const entity = currentStore.entities[nodeId]
    if (!entity) return null

    const state = aria.getNodeState(nodeId)
    const props = aria.getNodeProps(nodeId)
    const children = getChildren(currentStore, nodeId)
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
              const childData = (currentStore.entities[childId]?.data ?? {}) as Record<string, string>
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
      {getChildren(currentStore, ROOT_ID).map(id => renderNode(id))}
    </div>
  )
}
