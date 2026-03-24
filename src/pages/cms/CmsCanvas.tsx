import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { useAriaZone } from '../../interactive-os/primitives/useAriaZone'
import { spatial } from '../../interactive-os/pattern/spatial'
import { useSpatialNav } from '../../interactive-os/plugins/useSpatialNav'
import { focusCommands } from '../../interactive-os/plugins/core'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import { clipboardCommands } from '../../interactive-os/plugins/clipboard'
import { spatialCommands, getSpatialParentId, SPATIAL_PARENT_ID } from '../../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { NormalizedData } from '../../interactive-os/store/types'
import { createBatchCommand } from '../../interactive-os/engine/types'
import type { Command } from '../../interactive-os/engine/types'
import type { Plugin } from '../../interactive-os/plugins/types'
import type { CommandEngine } from '../../interactive-os/engine/createCommandEngine'
import type { PatternContext } from '../../interactive-os/pattern/types'
import { spatialReachable } from '../../interactive-os/plugins/focusRecovery'
import { renameCommands } from '../../interactive-os/plugins/rename'
import type { Locale } from './cms-types'
import { getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES, getEditableFields } from './cms-renderers'
import { CmsInlineEditable } from './CmsInlineEditable'
import { cmsCanDelete } from './cms-schema'
import landingStyles from './CmsLanding.module.css'

interface CmsCanvasProps {
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  onFocusChange?: (focusedId: string) => void
  plugins?: Plugin[]
  activeTabMap?: Map<string, string>
  onActivateTabItem?: (tabItemId: string) => void
}

/** Navigate to adjacent tab sibling (ArrowRight/ArrowLeft in tablist) */
function navigateTabSibling(ctx: PatternContext, dir: 1 | -1): Command | void {
  const entity = ctx.getEntity(ctx.focused)
  const d = (entity?.data ?? {}) as Record<string, unknown>
  if (d.type !== 'tab-item') return undefined
  const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
  const parentId = spatialParent?.parentId as string | undefined
  if (!parentId) return
  const siblings = ctx.getChildren(parentId)
  const idx = siblings.indexOf(ctx.focused)
  const nextIdx = idx + dir
  if (nextIdx >= 0 && nextIdx < siblings.length) {
    return focusCommands.setFocus(siblings[nextIdx])
  }
}

/** CRUD keyMap for CMS Canvas — os commands with undo/redo */
const cmsKeyMap: Record<string, (ctx: PatternContext) => Command | void> = {
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

export default function CmsCanvas({ engine, store, locale, onFocusChange, plugins, activeTabMap: activeTabMapProp, onActivateTabItem }: CmsCanvasProps) {
  'use no memo' // useAriaZone reads internal refs during render (getNodeProps/getNodeState), which is intentional but incompatible with React Compiler
  const spatialNav = useSpatialNav('[data-cms-root]', store, 'cms')

  // Merge spatial nav + CMS CRUD keyMap (CRUD takes precedence for Mod+ combos)
  // Enter/Escape need closure over spatialNav.clearCursorsAtDepth, so they live here
  const mergedKeyMap = useMemo(
    () => ({
      ...spatialNav.keyMap,
      ...cmsKeyMap,
      Delete: (ctx: PatternContext) => {
        // Slot guard: non-array parent → structural child → cannot delete
        const parentId = getParent(engine.getStore(), ctx.focused)
        if (parentId) {
          const parentData = ctx.getEntity(parentId)?.data as Record<string, unknown> | undefined
          if (!cmsCanDelete(parentData)) return
        }

        // Minimum-1-section guard
        const rootChildren = ctx.getChildren(ROOT_ID)
        if (rootChildren.includes(ctx.focused) && rootChildren.length <= 1) return

        // Minimum-1-tab guard: if focused is a tab-item, check sibling count
        const entity = ctx.getEntity(ctx.focused)
        const data = (entity?.data ?? {}) as Record<string, unknown>
        if (data.type === 'tab-item') {
          const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
          const parentId2 = spatialParent?.parentId as string | undefined
          if (parentId2) {
            const siblings = ctx.getChildren(parentId2)
            if (siblings.length <= 1) return
          }
        }

        return crudCommands.remove(ctx.focused)
      },
      ArrowRight: (ctx: PatternContext) => {
        return navigateTabSibling(ctx, 1) ?? spatialNav.keyMap.ArrowRight(ctx)
      },
      ArrowLeft: (ctx: PatternContext) => {
        return navigateTabSibling(ctx, -1) ?? spatialNav.keyMap.ArrowLeft(ctx)
      },
      Enter: (ctx: PatternContext) => {
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
      Escape: (ctx: PatternContext) => {
        // Exit to parent depth (if not at root)
        const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
        const parentId = spatialParent?.parentId as string | undefined
        if (!parentId || parentId === ROOT_ID) return undefined
        spatialNav.clearCursorsAtDepth(parentId)
        return createBatchCommand([
          spatialCommands.exitToParent(),
          focusCommands.setFocus(parentId),
        ])
      },
    }),
    [spatialNav, engine],
  )

  const cmsBehavior = useMemo(() => ({
    ...spatial,
    focusStrategy: { type: 'natural-tab-order' as const, orientation: 'both' as const },
  }), [])

  // Spatial model: all nodes always rendered — reachable = exists in store
  const aria = useAriaZone({
    engine,
    store,
    behavior: cmsBehavior,
    scope: 'cms',
    plugins,
    keyMap: mergedKeyMap,
    isReachable: spatialReachable,
  })

  // Recursive renderer — ALL nodes always rendered
  const currentStore = aria.getStore()

  // Track active tab: if focused node is a tab-item, update its parent tab-group
  const focusedEntity = currentStore.entities[aria.focused]
  const focusedData = (focusedEntity?.data ?? {}) as Record<string, unknown>
  const focusedIsTabItem = focusedData.type === 'tab-item'
  const focusedTabParent = focusedIsTabItem ? getParent(currentStore, aria.focused) : null

  const [localActiveTabMap, dispatchTabMap] = useReducer(
    (prev: Map<string, string>, action: { parentId: string; tabId: string }) => {
      if (prev.get(action.parentId) === action.tabId) return prev
      const next = new Map(prev)
      next.set(action.parentId, action.tabId)
      return next
    },
    new Map<string, string>(),
  )

  const activeTabMap = activeTabMapProp ?? localActiveTabMap

  // Notify parent about tab-item activation, or update local map
  useEffect(() => {
    if (!focusedTabParent) return
    if (onActivateTabItem) {
      onActivateTabItem(aria.focused)
    } else {
      const action = { parentId: focusedTabParent, tabId: aria.focused }
      queueMicrotask(() => dispatchTabMap(action))
    }
  }, [aria.focused, focusedTabParent, onActivateTabItem])

  function getActiveTabId(tabGroupId: string): string | undefined {
    const active = activeTabMap.get(tabGroupId)
    if (active && currentStore.entities[active]) return active
    const children = getChildren(currentStore, tabGroupId)
    return children[0]
  }

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
          <div className={landingStyles.cmsTablist} role="tablist">
            {tabItems.map(tabId => {
              const tabEntity = currentStore.entities[tabId]
              if (!tabEntity) return null
              const tabState = aria.getNodeState(tabId)
              const tabProps = aria.getNodeProps(tabId)
              const tabData = (tabEntity.data ?? {}) as Record<string, unknown>
              const isActive = tabId === activeTabId
              const { onClick: _tabClick, onKeyDown: tkd, onFocus: tf, tabIndex: ti, role: _tr, ...tabRest } = tabProps as Record<string, unknown>
              void _tabClick; void _tr

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
                  className={`${getNodeClassName(tabData, tabState)}${isActive ? ` ${landingStyles.cmsTabItemActive}` : ''}`}
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
            void _panelClick; void _pr
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
    <div className={`cms-landing ${landingStyles.cmsLanding}`} data-cms-root data-aria-container="">
      {getChildren(currentStore, ROOT_ID).map(id => renderNode(id))}
    </div>
  )
}
