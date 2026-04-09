import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { ax } from '@styles/ax'
import { key } from '@os/axis/types'
import type { KeyHandler } from '@os/axis/types'
import { AriaZone } from '@os/ui/AriaZone'
import type { AriaZoneContext } from '@os/ui/AriaZone'
import { spatial } from '@os/misc/spatial'
import { useSpatialNav } from '@os/plugins/useSpatialNav'
import { focusCommands } from '@os/axis/navigate'
import { crudCommands } from '@os/plugins/crud'
import { dndCommands } from '@os/plugins/dnd'
import { clipboardCommands } from '@os/plugins/clipboard'
import { spatialCommands, SPATIAL_PARENT_ID, spatialClickNavigate } from '@os/plugins/spatial'
import { getChildren, getSlotChildren, getParent } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { createBatchCommand } from '@os/engine/types'
import type { Command } from '@os/engine/types'
import type { Plugin } from '@os/plugins/types'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import type { PatternContext } from '@os/pattern/types'
import { spatialReachable } from '@os/plugins/focusRecovery'
import { renameCommands } from '@os/plugins/rename'
import type { Locale } from './cmsTypes'
import { getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES, getInlineEditableFields } from './cmsRenderers'
import { CmsInlineEditable } from './CmsInlineEditable'
import { cmsCanDelete } from './cmsSchema'
import { SelectionOverlay } from '@os/ui/SelectionOverlay'
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
const cmsKeyMap: Record<string, KeyHandler> = {
  'Mod+ArrowUp': key(['dnd:moveUp'], (ctx) => dndCommands.moveUp(ctx.focused)),
  'Mod+ArrowDown': key(['dnd:moveDown'], (ctx) => dndCommands.moveDown(ctx.focused)),
  'Mod+D': key(['clipboard:copy', 'clipboard:paste'], (ctx) => {
    // Copy then paste = duplicate with new IDs (handles subtrees)
    return createBatchCommand([
      clipboardCommands.copy([ctx.focused]),
      clipboardCommands.paste(ctx.focused),
    ])
  }),
  F2: key(['rename:start'], (ctx) => {
    const entity = ctx.getEntity(ctx.focused)
    const data = (entity?.data ?? {}) as Record<string, unknown>
    const inlineFields = getInlineEditableFields(data)
    if (inlineFields.length === 0) return
    return renameCommands.startRename(ctx.focused)
  }),
  // Mod+C/X/V → clipboard plugin keyMap, Mod+Z → history plugin keyMap
}

export default function CmsCanvas({ engine, store, locale, onFocusChange, plugins, activeTabMap: activeTabMapProp, onActivateTabItem }: CmsCanvasProps) {
  'use no memo' // AriaZone reads internal refs during render (getNodeProps) — incompatible with React Compiler
  const spatialNav = useSpatialNav('[data-cms-root]', store, 'cms')

  // Merge spatial nav + CMS CRUD keyMap (CRUD takes precedence for Mod+ combos)
  // Enter/Escape need closure over spatialNav.clearCursorsAtDepth, so they live here
  const mergedKeyMap = useMemo(
    () => ({
      ...spatialNav.keyMap,
      ...cmsKeyMap,
      Delete: key(['crud:remove'], (ctx) => {
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
      }),
      ArrowRight: key(['navigate:focus'], (ctx) => {
        return navigateTabSibling(ctx, 1) ?? spatialNav.keyMap.ArrowRight(ctx)
      }),
      ArrowLeft: key(['navigate:focus'], (ctx) => {
        return navigateTabSibling(ctx, -1) ?? spatialNav.keyMap.ArrowLeft(ctx)
      }),
      Enter: key(['spatial:enterChild', 'rename:start'], (ctx) => {
        const children = ctx.getChildren(ctx.focused)
        const slotKids = ctx.getSlotChildren(ctx.focused)
        if (children.length === 0 && slotKids.length === 0) {
          // Leaf node: rename only if exactly 1 inline-editable text field
          const entity = ctx.getEntity(ctx.focused)
          const data = (entity?.data ?? {}) as Record<string, unknown>
          const inlineFields = getInlineEditableFields(data)
          if (inlineFields.length !== 1) return
          return renameCommands.startRename(ctx.focused)
        }
        // Prefer slot children for drill down when no array children
        const drillTarget = children.length > 0 ? children : slotKids

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
          focusCommands.setFocus(drillTarget[0]),
        ])
      }),
      Escape: key(['spatial:exitToParent'], (ctx) => {
        // Exit to parent depth (if not at root)
        const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
        const parentId = spatialParent?.parentId as string | undefined
        if (!parentId || parentId === ROOT_ID) return undefined
        spatialNav.clearCursorsAtDepth(parentId)
        return createBatchCommand([
          spatialCommands.exitToParent(),
          focusCommands.setFocus(parentId),
        ])
      }),
    }),
    [spatialNav, engine],
  )

  const cmsBehavior = useMemo(() => ({
    ...spatial,
    focusStrategy: { type: 'natural-tab-order' as const, orientation: 'both' as const },
  }), [])

  return (
    <AriaZone
      engine={engine}
      store={store}
      pattern={cmsBehavior}
      scope="cms"
      plugins={plugins}
      keyMap={mergedKeyMap}
      isReachable={spatialReachable}
      onFocusChange={onFocusChange}
    >
      {(aria) => (
        <CmsCanvasContent
          aria={aria}
          locale={locale}
          spatialNav={spatialNav}
          activeTabMapProp={activeTabMapProp}
          onActivateTabItem={onActivateTabItem}
        />
      )}
    </AriaZone>
  )
}

// ── Inner content — receives AriaZone context ──

interface CmsCanvasContentProps {
  aria: AriaZoneContext
  locale: Locale
  spatialNav: ReturnType<typeof useSpatialNav>
  activeTabMapProp?: Map<string, string>
  onActivateTabItem?: (tabItemId: string) => void
}

function CmsCanvasContent({ aria, locale, spatialNav, activeTabMapProp, onActivateTabItem }: CmsCanvasContentProps) {
  const currentStore = aria.getStore()

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

  // ② 2026-04-06-spatial-click-handler-prd.md — delegates to OS spatial plugin
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const s = aria.getStore()
    const parentId = getParent(s, nodeId) ?? ROOT_ID
    spatialNav.clearCursorsAtDepth(parentId)
    const cmd = spatialClickNavigate(s, nodeId)
    if (cmd) aria.dispatch(cmd)
  }, [aria, spatialNav])

  function renderNode(nodeId: string): React.ReactNode {
    const entity = currentStore.entities[nodeId]
    if (!entity) return null

    const props = aria.getNodeProps(nodeId)
    const children = getChildren(currentStore, nodeId)
    const d = (entity.data ?? {}) as Record<string, unknown>

    const {
      onClick: _,
      onKeyDown,
      onFocus,
      tabIndex,
      role: ariaRole,
      ...restProps
    } = props as Record<string, unknown>
    void _

    const ds = d as Record<string, string>
    const className = getNodeClassName(ds)
    const Tag = getNodeTag(ds) as React.ElementType

    if (d.type === 'section') {
      const childrenContainerClass = getChildrenContainerClassName(ds)

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
          {/* eslint-disable-next-line local/no-raw-aria-role -- CMS renderer: AriaZone이 role 미포함, pattern이 tablist 관리 */}
          <div className={`${landingStyles.cmsTablist} ${ax({ layout: 'row' })}`} role="tablist">
            {tabItems.map(tabId => {
              const tabEntity = currentStore.entities[tabId]
              if (!tabEntity) return null
              const tabProps = aria.getNodeProps(tabId)
              const tabData = (tabEntity.data ?? {}) as Record<string, unknown>
              const isActive = tabId === activeTabId
              const { onClick: _tabClick, onKeyDown: tkd, onFocus: tf, tabIndex: ti, role: _tr, ...tabRest } = tabProps as Record<string, unknown>
              void _tabClick; void _tr

              return (
                <button
                  key={tabId}
                  {...(tabRest as React.HTMLAttributes<HTMLButtonElement>)}
                  role="tab" // eslint-disable-line local/no-raw-aria-role -- CMS renderer
                  tabIndex={ti as number}
                  aria-selected={isActive}
                  onKeyDown={tkd as React.KeyboardEventHandler}
                  onFocus={tf as React.FocusEventHandler}
                  onClick={(e) => handleNodeClick(tabId, e)}
                  className={`${getNodeClassName(tabData as Record<string, string>)}${isActive ? ` ${landingStyles.cmsTabItemActive}` : ''}`}
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
            const panelData = (panelEntity.data ?? {}) as Record<string, unknown>
            const { onClick: _panelClick, onKeyDown: pkd, onFocus: pf, tabIndex: pti, role: _pr, ...panelRest } = panelProps as Record<string, unknown>
            void _panelClick; void _pr
            const panelSections = getChildren(currentStore, panelId)

            return (
              <div
                key={panelId}
                {...(panelRest as React.HTMLAttributes<HTMLDivElement>)}
                role="tabpanel" // eslint-disable-line local/no-raw-aria-role -- CMS renderer
                tabIndex={pti as number}
                onKeyDown={pkd as React.KeyboardEventHandler}
                onFocus={pf as React.FocusEventHandler}
                onClick={(e) => handleNodeClick(panelId, e)}
                className={getNodeClassName(panelData as Record<string, string>)}
              >
                {panelSections.map(sectionId => renderNode(sectionId))}
              </div>
            )
          })()}
        </div>
      )
    }

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

    const slotKids = getSlotChildren(currentStore, nodeId)
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
        {slotKids.length > 0 && slotKids.map(childId => {
          const slotProps = aria.getNodeProps(childId)
          const { onClick: _sc, onKeyDown: skd, onFocus: sf, tabIndex: sti, role: _sr, ...slotRest } = slotProps as Record<string, unknown>
          void _sc; void _sr
          return (
            <div
              key={childId}
              {...(slotRest as React.HTMLAttributes<HTMLDivElement>)}
              tabIndex={sti as number}
              onKeyDown={skd as React.KeyboardEventHandler}
              onFocus={sf as React.FocusEventHandler}
              onClick={(e: React.MouseEvent) => handleNodeClick(childId, e)}
              className="sr-only"
            />
          )
        })}
      </Tag>
    )
  }

  const containerRef = useRef<HTMLDivElement>(null)

  const labelFn = useCallback((id: string) => {
    const s = aria.getStore()
    const entity = s.entities[id]
    if (!entity) return ''
    const d = (entity.data ?? {}) as Record<string, string>
    return d.type ?? ''
  }, [aria])

  return (
    <div ref={containerRef} {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)} className={`ax-interactive cms-landing ${landingStyles.cmsLanding} w-full overflow-x-hidden relative`} data-cms-root data-aria-container="">
      {getChildren(currentStore, ROOT_ID).map(id => renderNode(id))}
      <SelectionOverlay
        containerRef={containerRef}
        focusedId={aria.focused}
        selectedIds={aria.selected}
        nodeIdAttr="data-cms-id"
        labelFn={labelFn}
      />
    </div>
  )
}
