import { useCallback, useEffect, useMemo, useRef } from 'react'
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
import { RENAME_ID, renameCommands } from '../../interactive-os/plugins/rename'
import type { Locale } from './cms-types'
import { localized } from './cms-types'
import type { LocaleMap } from './cms-types'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES, getEditableFields } from './cms-renderers'

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

  // Recursive renderer — ALL nodes always rendered
  const currentStore = aria.getStore()

  function CmsInlineEditable({ nodeId, data, loc, disp, s }: {
    nodeId: string
    data: Record<string, unknown>
    loc: Locale
    disp: (cmd: Command) => void
    s: NormalizedData
  }) {
    const editRef = useRef<HTMLSpanElement>(null)
    const originalValueRef = useRef('')
    const composingRef = useRef(false)
    const committedRef = useRef(false)

    const renameEntity = s.entities[RENAME_ID]
    const isRenaming = renameEntity?.active === true && (renameEntity as Record<string, unknown>).nodeId === nodeId

    const fields = getEditableFields(data)
    const primaryField = fields[0]

    useEffect(() => {
      if (isRenaming && editRef.current) {
        committedRef.current = false
        composingRef.current = false
        const el = editRef.current
        originalValueRef.current = el.textContent ?? ''
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
        el.focus()
      }
    }, [isRenaming])

    // Focus recovery: schedule after React re-render (component remounts on store change)
    const restoreFocus = useCallback(() => {
      requestAnimationFrame(() => {
        const nodeEl = document.querySelector<HTMLElement>(`[data-cms-id="${nodeId}"]`)
        nodeEl?.focus()
      })
    }, [nodeId])

    if (!isRenaming || !primaryField) {
      return <NodeContent data={data} locale={loc} />
    }

    const rawValue = data[primaryField.field]
    const { text } = localized(rawValue as string | LocaleMap, loc)

    const confirm = (shouldRestoreFocus: boolean) => {
      if (committedRef.current) return
      committedRef.current = true
      const newText = editRef.current?.textContent?.trim() ?? ''
      if (newText === '' || newText === originalValueRef.current) {
        if (editRef.current) editRef.current.textContent = originalValueRef.current
        disp(renameCommands.cancelRename())
      } else {
        const newValue = primaryField.isLocaleMap
          ? { ...(rawValue as Record<string, string>), [loc]: newText }
          : newText
        disp(renameCommands.confirmRename(nodeId, primaryField.field, newValue))
      }
      if (shouldRestoreFocus) restoreFocus()
    }

    const cancel = () => {
      if (committedRef.current) return
      committedRef.current = true
      if (editRef.current) editRef.current.textContent = originalValueRef.current
      disp(renameCommands.cancelRename())
      restoreFocus()
    }

    return (
      <span
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        data-renaming=""
        onCompositionStart={() => { composingRef.current = true }}
        onCompositionEnd={() => { composingRef.current = false }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !composingRef.current) { e.preventDefault(); confirm(true) }
          else if (e.key === 'Escape') { e.preventDefault(); cancel() }
          else if (e.key === 'Tab') { e.preventDefault(); confirm(true) }
        }}
        onBlur={() => confirm(false)}
      >
        {text}
      </span>
    )
  }

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
        <CmsInlineEditable
          nodeId={nodeId}
          data={d}
          loc={locale}
          disp={aria.dispatch}
          s={currentStore}
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
