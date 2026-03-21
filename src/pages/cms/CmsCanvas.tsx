import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAriaZone } from '../../interactive-os/hooks/useAriaZone'
import { spatial } from '../../interactive-os/behaviors/spatial'
import { useSpatialNav } from '../../interactive-os/hooks/useSpatialNav'
import { focusCommands } from '../../interactive-os/plugins/core'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import { clipboardCommands } from '../../interactive-os/plugins/clipboard'
import { spatialCommands, getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { ROOT_ID, createBatchCommand } from '../../interactive-os/core/types'
import type { NormalizedData, Command, Plugin } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import { spatialReachable } from '../../interactive-os/plugins/focusRecovery'
import { renameCommands } from '../../interactive-os/plugins/rename'
import type { Locale } from './cms-types'
import { getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES, getEditableFields } from './cms-renderers'
import { CmsInlineEditable } from './CmsInlineEditable'

interface CmsCanvasProps {
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  onFocusChange?: (focusedId: string) => void
  plugins?: Plugin[]
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
  F2: (ctx) => {
    const entity = ctx.getEntity(ctx.focused)
    const data = (entity?.data ?? {}) as Record<string, unknown>
    const fields = getEditableFields(data)
    if (fields.length === 0) return
    return renameCommands.startRename(ctx.focused)
  },
  // Mod+C/X/V → clipboard plugin keyMap, Mod+Z → history plugin keyMap
}

export default function CmsCanvas({ engine, store, locale, onFocusChange, plugins }: CmsCanvasProps) {
  const spatialNav = useSpatialNav('[data-cms-root]', store, 'cms')

  // Merge spatial nav + CMS CRUD keyMap (CRUD takes precedence for Mod+ combos)
  // Enter/Escape need closure over spatialNav.clearCursorsAtDepth, so they live here
  const mergedKeyMap = useMemo(
    () => ({
      ...spatialNav.keyMap,
      ...cmsKeyMap,
      Delete: (ctx: BehaviorContext) => {
        // Minimum-1-section guard
        const rootChildren = ctx.getChildren(ROOT_ID)
        if (rootChildren.includes(ctx.focused) && rootChildren.length <= 1) return

        // Minimum-1-tab guard: if focused is a tab-item, check sibling count
        const entity = ctx.getEntity(ctx.focused)
        const data = (entity?.data ?? {}) as Record<string, unknown>
        if (data.type === 'tab-item') {
          const spatialParent = ctx.getEntity('__spatial_parent__')
          const parentId = spatialParent?.parentId as string | undefined
          if (parentId) {
            const siblings = ctx.getChildren(parentId)
            if (siblings.length <= 1) return
          }
        }

        return crudCommands.remove(ctx.focused)
      },
      ArrowRight: (ctx: BehaviorContext) => {
        // Tab-item: navigate to next tab within tab-group
        const entity = ctx.getEntity(ctx.focused)
        const d = (entity?.data ?? {}) as Record<string, unknown>
        if (d.type === 'tab-item') {
          const spatialParent = ctx.getEntity('__spatial_parent__')
          const parentId = spatialParent?.parentId as string | undefined
          if (parentId) {
            const siblings = ctx.getChildren(parentId)
            const idx = siblings.indexOf(ctx.focused)
            if (idx >= 0 && idx < siblings.length - 1) {
              return focusCommands.setFocus(siblings[idx + 1])
            }
          }
          return
        }
        // Fall through to spatial nav
        return spatialNav.keyMap.ArrowRight(ctx)
      },
      ArrowLeft: (ctx: BehaviorContext) => {
        // Tab-item: navigate to previous tab within tab-group
        const entity = ctx.getEntity(ctx.focused)
        const d = (entity?.data ?? {}) as Record<string, unknown>
        if (d.type === 'tab-item') {
          const spatialParent = ctx.getEntity('__spatial_parent__')
          const parentId = spatialParent?.parentId as string | undefined
          if (parentId) {
            const siblings = ctx.getChildren(parentId)
            const idx = siblings.indexOf(ctx.focused)
            if (idx > 0) {
              return focusCommands.setFocus(siblings[idx - 1])
            }
          }
          return
        }
        // Fall through to spatial nav
        return spatialNav.keyMap.ArrowLeft(ctx)
      },
      Enter: (ctx: BehaviorContext) => {
        const children = ctx.getChildren(ctx.focused)
        if (children.length === 0) {
          // Guard: only start rename if node has editable text fields
          const entity = ctx.getEntity(ctx.focused)
          const data = (entity?.data ?? {}) as Record<string, unknown>
          const fields = getEditableFields(data)
          if (fields.length === 0) return
          return renameCommands.startRename(ctx.focused)
        }

        // Tab-item: Enter goes through panel to its first section
        const entity = ctx.getEntity(ctx.focused)
        const d = (entity?.data ?? {}) as Record<string, unknown>
        if (d.type === 'tab-item') {
          const panelId = children[0]
          const panelChildren = ctx.getChildren(panelId)
          if (panelChildren.length > 0) {
            spatialNav.clearCursorsAtDepth(ctx.focused)
            return createBatchCommand([
              spatialCommands.enterChild(ctx.focused),
              focusCommands.setFocus(panelChildren[0]),
            ])
          }
        }

        spatialNav.clearCursorsAtDepth(ctx.focused)
        // Container node → enterChild (spatial depth navigation)
        return createBatchCommand([
          spatialCommands.enterChild(ctx.focused),
          focusCommands.setFocus(children[0]),
        ])
      },
      Escape: (ctx: BehaviorContext) => {
        // Exit to parent depth (if not at root)
        const spatialParent = ctx.getEntity('__spatial_parent__')
        const parentId = spatialParent?.parentId as string | undefined
        if (!parentId || parentId === ROOT_ID) return undefined
        spatialNav.clearCursorsAtDepth(parentId)
        return createBatchCommand([
          spatialCommands.exitToParent(),
          focusCommands.setFocus(parentId),
        ])
      },
    }),
    [spatialNav],
  )

  // Spatial model: all nodes always rendered — reachable = exists in store
  const aria = useAriaZone({
    engine,
    store,
    behavior: spatial,
    scope: 'cms',
    plugins,
    keyMap: mergedKeyMap,
    isReachable: spatialReachable,
  })

  // Recursive renderer — ALL nodes always rendered
  const currentStore = aria.getStore()

  const [activeTabMap, setActiveTabMap] = useState<Map<string, string>>(new Map())

  function getActiveTabId(tabGroupId: string): string | undefined {
    const active = activeTabMap.get(tabGroupId)
    if (active && currentStore.entities[active]) return active
    const children = getChildren(currentStore, tabGroupId)
    return children[0]
  }

  // Report focus changes to parent (for activeSectionId computation)
  useEffect(() => {
    onFocusChange?.(aria.focused)
    // Track active tab: if focused node is a tab-item, update its parent tab-group
    const s = aria.getStore()
    const entity = s.entities[aria.focused]
    const data = (entity?.data ?? {}) as Record<string, unknown>
    if (data.type === 'tab-item') {
      const parentId = getParent(s, aria.focused)
      if (parentId) {
        setActiveTabMap(prev => {
          if (prev.get(parentId) === aria.focused) return prev
          const next = new Map(prev)
          next.set(parentId, aria.focused)
          return next
        })
      }
    }
  }, [aria.focused, onFocusChange])

  // Click handler: jump to node's depth + focus
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const s = aria.getStore()
    const parentId = getParent(s, nodeId) ?? ROOT_ID
    const currentSpatialParent = getSpatialParentId(s)

    spatialNav.clearCursorsAtDepth(parentId)

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
  }, [aria, spatialNav])

  function renderNode(nodeId: string): React.ReactNode {
    const entity = currentStore.entities[nodeId]
    if (!entity) return null

    const state = aria.getNodeState(nodeId)
    const props = aria.getNodeProps(nodeId)
    const children = getChildren(currentStore, nodeId)
    const d = (entity.data ?? {}) as Record<string, unknown>

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

    // For tab-group nodes, render tablist + active panel
    if (d.type === 'tab-group') {
      const tabItems = children
      const activeTabId = getActiveTabId(nodeId)

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
          <div className="cms-tablist" role="tablist">
            {tabItems.map(tabId => {
              const tabEntity = currentStore.entities[tabId]
              if (!tabEntity) return null
              const tabState = aria.getNodeState(tabId)
              const tabProps = aria.getNodeProps(tabId)
              const tabData = (tabEntity.data ?? {}) as Record<string, unknown>
              const isActive = tabId === activeTabId
              const { onClick: _tabClick, onKeyDown: tkd, onFocus: tf, tabIndex: ti, role: _tr, ...tabRest } = tabProps as Record<string, unknown>
              void _tabClick

              return (
                <button
                  key={tabId}
                  {...(tabRest as React.HTMLAttributes<HTMLButtonElement>)}
                  role="tab"
                  tabIndex={ti as number}
                  aria-selected={isActive}
                  onKeyDown={tkd as React.KeyboardEventHandler}
                  onFocus={tf as React.FocusEventHandler}
                  onClick={(e) => handleNodeClick(tabId, e)}
                  className={getNodeClassName(tabData, tabState)}
                >
                  <CmsInlineEditable
                    nodeId={tabId}
                    data={tabData}
                    locale={locale}
                    dispatch={aria.dispatch}
                    store={currentStore}
                  />
                </button>
              )
            })}
          </div>
          {activeTabId && (() => {
            const panelChildren = getChildren(currentStore, activeTabId)
            const panelId = panelChildren[0]
            if (!panelId) return null
            const panelEntity = currentStore.entities[panelId]
            if (!panelEntity) return null
            const panelProps = aria.getNodeProps(panelId)
            const panelState = aria.getNodeState(panelId)
            const panelData = (panelEntity.data ?? {}) as Record<string, unknown>
            const { onClick: _panelClick, onKeyDown: pkd, onFocus: pf, tabIndex: pti, role: _pr, ...panelRest } = panelProps as Record<string, unknown>
            void _panelClick
            const panelSections = getChildren(currentStore, panelId)

            return (
              <div
                key={panelId}
                {...(panelRest as React.HTMLAttributes<HTMLDivElement>)}
                role="tabpanel"
                tabIndex={pti as number}
                onKeyDown={pkd as React.KeyboardEventHandler}
                onFocus={pf as React.FocusEventHandler}
                onClick={(e) => handleNodeClick(panelId, e)}
                className={getNodeClassName(panelData, panelState)}
              >
                {panelSections.map(sectionId => renderNode(sectionId))}
              </div>
            )
          })()}
        </div>
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
        <CmsInlineEditable
          nodeId={nodeId}
          data={d}
          locale={locale}
          dispatch={aria.dispatch}
          store={currentStore}
        />
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
