import React, { useEffect, useRef, cloneElement } from 'react'
import type { ReactNode, ReactElement } from 'react'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { AriaPattern, NodeState } from '../pattern/types'
import type { KeyHandler } from '../axis/types'
import type { EngineOptions } from '../engine/types'
import { useAria } from './useAria'
import { AriaInternalContext } from './AriaInternalContext'
import { getChildren } from '../store/createStore'
import { GRID_COL_ID } from '../axis/navigate'
import { EXPANDED_ID } from '../axis/expand'
import { POPUP_ID } from '../axis/popup'
import { SEARCH_ID, matchesSearchFilter } from '../plugins/search'
import { AriaItemContext, AriaEditable } from './AriaEditable'
import { AriaSearch, AriaSearchHighlight } from './AriaSearch'

interface AriaProps {
  id?: string
  as?: React.ElementType
  pattern?: AriaPattern
  data: NormalizedData
  plugins: Plugin[]
  keyMap?: Record<string, KeyHandler>
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  onFocusChange?: (nodeId: string | null) => void
  'aria-label'?: string
  'aria-labelledby'?: string
  logger?: EngineOptions['logger']
  autoFocus?: boolean
  disabled?: boolean
  children: ReactNode
}

// ② 2026-03-28-aria-item-children-prd.md
interface AriaItemProps {
  ids?: string[]
  asChild?: boolean
  render: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState, children?: ReactNode) => ReactElement
}

const horizontalStyle = { display: 'flex' } as const

const ROLES_WITH_ORIENTATION = new Set(['listbox', 'menu', 'menubar', 'tablist', 'toolbar', 'treegrid'])

function AriaRoot({ id, as: Component = 'div', pattern, data, plugins, keyMap, onChange, onActivate, onFocusChange, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, logger, autoFocus, disabled, children }: AriaProps) {
  const aria = useAria({ pattern, data, plugins, keyMap, onChange, onActivate, onFocusChange, logger, autoFocus, disabled, 'aria-label': ariaLabel, id })

  const role = pattern?.role || undefined
  const orientation = pattern?.focusStrategy?.orientation
  return (
    <AriaInternalContext.Provider value={{ ...aria, pattern }}>
      <Component
        role={role}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={role && ROLES_WITH_ORIENTATION.has(role) && orientation !== 'both' ? orientation : undefined}
        aria-multiselectable={pattern?.selectionMode === 'multiple' ? 'true' : undefined}
        aria-modal={pattern?.popupModal ? 'true' : undefined}
        style={orientation === 'horizontal' ? horizontalStyle : undefined}
        data-aria-container=""
        {...(aria.containerProps as React.HTMLAttributes<HTMLElement>)}
        className={`ax-interactive${(aria.containerProps as Record<string, string>)?.className ? ` ${(aria.containerProps as Record<string, string>).className}` : ''}`}
      >
        {children}
      </Component>
    </AriaInternalContext.Provider>
  )
}

function useFocusScroll(focused: boolean) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!focused || !ref.current) return
    const container = ref.current.closest('.ax-interactive')
    if (!container || container.scrollHeight <= container.clientHeight) return
    const itemRect = ref.current.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    if (itemRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - itemRect.top
    } else if (itemRect.bottom > containerRect.bottom) {
      container.scrollTop += itemRect.bottom - containerRect.bottom
    }
  }, [focused])
  return ref
}

// ② 2026-03-28-aria-item-children-prd.md
function AriaItemNode({ childId, render, children }: { childId: string; render: AriaItemProps['render']; children?: ReactNode }) {
  const aria = React.useContext(AriaInternalContext)
  if (!aria) throw new Error('<Aria.Item> must be inside <Aria>')
  const store = aria.getStore()
  const entity = store.entities[childId]
  const state = entity ? aria.getNodeState(childId) : { focused: false } as ReturnType<typeof aria.getNodeState>
  const scrollRef = useFocusScroll(entity ? state.focused : false)
  if (!entity) return null
  const props = aria.getNodeProps(childId) as React.HTMLAttributes<HTMLElement>

  // aria-controls → panel slot: when pattern has panelRole, link item to its panel
  if (aria.pattern?.panelRole) {
    (props as Record<string, unknown>)['aria-controls'] = `panel-${childId}`
  }

  return (
    <AriaItemContext.Provider value={{ nodeId: childId, focused: state.focused, renaming: !!state.renaming }}>
      {(() => {
        const rendered = render(props, entity, state, children)
        const injected: Record<string, unknown> = { key: childId }
        if (rendered.type !== React.Fragment) injected.ref = scrollRef
        return cloneElement(rendered as React.ReactElement<Record<string, unknown>>, injected)
      })()}
    </AriaItemContext.Provider>
  )
}

function AriaItem({ ids, render }: AriaItemProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Item> must be inside <Aria>')
        const store = aria.getStore()
        const expandEntity = store.entities[EXPANDED_ID]
        // No expand entity → all containers open (matches expand axis shouldDescend)
        const expandedIds = expandEntity ? ((expandEntity.expandedIds as string[]) ?? []) : null

        // Popup visibility: when popup axis is present, only descend into trigger's children when open
        const popupEntity = store.entities[POPUP_ID]
        const popupTriggerId = (popupEntity?.triggerId as string) ?? ''
        const popupIsOpen = (popupEntity?.isOpen as boolean) ?? false

        const searchEntity = store.entities[SEARCH_ID] as Record<string, unknown> | undefined
        const filterText = (searchEntity?.filterText as string) ?? ''

        // ② 2026-03-28-aria-item-children-prd.md
        const renderNodes = (parentId: string): ReactNode[] => {
          const childIds = getChildren(store, parentId)
          const nodes: ReactNode[] = []
          for (const childId of childIds) {
            if (filterText && !matchesSearchFilter(store.entities[childId], filterText)) continue
            if (!store.entities[childId]) continue
            const hasChildren = getChildren(store, childId).length > 0
            // Popup gating: if popup entity exists, only show children of the open trigger
            const isPopupVisible = !popupEntity || (popupTriggerId === childId && popupIsOpen)
            const isExpanded = (expandedIds === null || expandedIds.includes(childId)) && isPopupVisible

            // Container node with 4-arg render: wrap children inside container node
            // render.length >= 4: opt-in — only when render callback declares children param
            // Children always rendered in DOM (APG pattern: display:none/block toggle)
            // so focus targets exist before expand animation completes
            if (hasChildren && render.length >= 4) {
              const childNodes = renderNodes(childId)
              nodes.push(
                <AriaItemNode key={childId} childId={childId} render={render}>
                  {childNodes}
                </AriaItemNode>,
              )
            } else {
              // Leaf, or 3-arg render: flat rendering (existing behavior)
              nodes.push(
                <AriaItemNode key={childId} childId={childId} render={render} />,
              )
              if (hasChildren && isExpanded) {
                nodes.push(...renderNodes(childId))
              }
            }
          }
          return nodes
        }
        // ids mode: flat rendering only (no recursion into children). See PRD F4.
        if (ids) {
          return <>{ids.filter(id => !filterText || matchesSearchFilter(store.entities[id], filterText)).map(id =>
            store.entities[id] ? <AriaItemNode key={id} childId={id} render={render} /> : null,
          ).filter(Boolean)}</>
        }
        return <>{renderNodes(ROOT_ID)}</>
      }}
    </AriaInternalContext.Consumer>
  )
}

function AriaCell({ index, children }: { index: number; children: React.ReactNode }) {
  const nodeCtx = React.useContext(AriaItemContext)
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria || !nodeCtx) throw new Error('<Aria.Cell> must be inside <Aria.Item>')
        const store = aria.getStore()
        const focusedCol = (store.entities[GRID_COL_ID]?.colIndex as number) ?? 0
        const isFocusedCell = nodeCtx.focused && index === focusedCol
        return (
          <div role="gridcell" className="ia-cell" aria-colindex={index + 1} tabIndex={isFocusedCell ? 0 : -1} data-cell-focused={isFocusedCell || undefined}>
            {children}
          </div>
        )
      }}
    </AriaInternalContext.Consumer>
  )
}

// ② 2026-03-28-aria-panel-trigger-prd.md
interface AriaPanelProps {
  render: (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) => ReactElement
}

function AriaPanel({ render }: AriaPanelProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Panel> must be inside <Aria>')
        if (!aria.pattern?.panelRole) return null
        const store = aria.getStore()
        const childIds = getChildren(store, ROOT_ID)
        return <>{childIds.map(childId => {
          const entity = store.entities[childId]
          if (!entity) return null
          const state = aria.getNodeState(childId)
          if (!state.slotProps) return null
          return cloneElement(
            render(state.slotProps as React.HTMLAttributes<HTMLElement>, entity, state),
            { key: `panel-${childId}` },
          )
        })}</>
      }}
    </AriaInternalContext.Consumer>
  )
}

// ② 2026-03-28-aria-panel-trigger-prd.md
interface AriaTriggerProps {
  render: (props: React.HTMLAttributes<HTMLElement>, state: { open: boolean }) => ReactElement
}

function AriaTrigger({ render }: AriaTriggerProps) {
  const aria = React.useContext(AriaInternalContext)
  if (!aria) throw new Error('<Aria.Trigger> must be inside <Aria>')
  const store = aria.getStore()
  const popupEntity = store.entities[POPUP_ID] as Record<string, unknown> | undefined
  const isOpen = (popupEntity?.isOpen as boolean) ?? false
  const { dispatch, getPatternContext, pattern } = aria

  const triggerKeyMap = pattern?.triggerKeyMap
  const triggerClickMap = pattern?.triggerClickMap

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.defaultPrevented) return
    if (!triggerKeyMap) return
    const handler = triggerKeyMap[e.key]
    if (!handler) return
    e.preventDefault()
    e.stopPropagation()
    const ctx = getPatternContext?.()
    if (!ctx) return
    const cmd = handler(ctx)
    if (cmd) dispatch(cmd)
  }, [dispatch, getPatternContext, triggerKeyMap])

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (e.defaultPrevented) return
    if (!triggerClickMap) return
    const modifier = e.shiftKey ? 'Shift+Click' : e.metaKey || e.ctrlKey ? 'Mod+Click' : 'Click'
    const handler = triggerClickMap[modifier]
    if (!handler) return
    e.preventDefault()
    e.stopPropagation()
    const ctx = getPatternContext?.()
    if (!ctx) return
    const cmd = handler(ctx)
    if (cmd) dispatch(cmd)
  }, [dispatch, getPatternContext, triggerClickMap])

  const props: React.HTMLAttributes<HTMLElement> = {
    ...(pattern?.popupType && { 'aria-haspopup': pattern.popupType }),
    'aria-expanded': isOpen,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
  }

  return render(props, { open: isOpen })
}

export { AriaItemContext }
export type { EditKeyContext } from './AriaEditable'
// eslint-disable-next-line react-refresh/only-export-components
export const Aria = Object.assign(AriaRoot, { Item: AriaItem, Cell: AriaCell, Editable: AriaEditable, Search: AriaSearch, SearchHighlight: AriaSearchHighlight, Panel: AriaPanel, Trigger: AriaTrigger })
