import { useCallback, useMemo } from 'react'
import { useAria } from '../../interactive-os/hooks/useAria'
import { spatial } from '../../interactive-os/behaviors/spatial'
import { useSpatialNav } from '../../interactive-os/hooks/use-spatial-nav'
import { core, focusCommands } from '../../interactive-os/plugins/core'
import { crud, crudCommands } from '../../interactive-os/plugins/crud'
import { dnd, dndCommands } from '../../interactive-os/plugins/dnd'
import { clipboard, clipboardCommands } from '../../interactive-os/plugins/clipboard'
import { history, historyCommands } from '../../interactive-os/plugins/history'
import { spatialCommands, getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { ROOT_ID, createBatchCommand } from '../../interactive-os/core/types'
import type { NormalizedData, Command } from '../../interactive-os/core/types'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import type { Locale } from './cms-types'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'

interface CmsCanvasProps {
  data: NormalizedData
  onDataChange: (data: NormalizedData) => void
  locale: Locale
}

// focusRecovery() intentionally omitted: its isVisible() uses expand/collapse model,
// which conflicts with spatial depth navigation (all CMS nodes are always rendered).
// This is an os gap — focusRecovery needs spatial-awareness.
const plugins = [core(), crud(), dnd(), clipboard(), history()]

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

export default function CmsCanvas({ data, onDataChange, locale }: CmsCanvasProps) {
  const spatialKeyMap = useSpatialNav('[data-cms-root]', data)

  // Merge spatial nav + CMS CRUD keyMap (CRUD takes precedence for Mod+ combos)
  const mergedKeyMap = useMemo(
    () => ({ ...spatialKeyMap, ...cmsKeyMap }),
    [spatialKeyMap],
  )

  const aria = useAria({
    behavior: spatial,
    data,
    plugins,
    keyMap: mergedKeyMap,
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
