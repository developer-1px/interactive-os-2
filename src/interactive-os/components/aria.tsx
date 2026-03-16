import React from 'react'
import type { ReactNode } from 'react'
import type { NormalizedData, Plugin, Command } from '../core/types'
import { ROOT_ID } from '../core/types'
import type { AriaBehavior, BehaviorContext, NodeState } from '../behaviors/types'
import { useAria } from '../hooks/use-aria'
import { AriaInternalContext } from './aria-context'
import { getChildren } from '../core/normalized-store'

interface AriaProps {
  behavior: AriaBehavior
  data: NormalizedData
  plugins: Plugin[]
  keyMap?: Record<string, (ctx: BehaviorContext) => Command | void>
  onChange?: (data: NormalizedData) => void
  'aria-label'?: string
  children: ReactNode
}

interface AriaNodeProps {
  render: (node: Record<string, unknown>, state: NodeState) => ReactNode
}

const horizontalStyle = { display: 'flex' } as const

const ROLES_WITH_ORIENTATION = new Set(['listbox', 'menu', 'menubar', 'tablist', 'toolbar', 'treegrid'])

const AriaNodeContext = React.createContext<{ nodeId: string; focused: boolean } | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
function AriaRoot({ behavior, data, plugins, keyMap, onChange, 'aria-label': ariaLabel, children }: AriaProps) {
  const aria = useAria({ behavior, data, plugins, keyMap, onChange })
  const { orientation } = behavior.focusStrategy
  return (
    <AriaInternalContext.Provider value={{ ...aria, behavior }}>
      <div
        role={behavior.role}
        aria-label={ariaLabel}
        aria-orientation={ROLES_WITH_ORIENTATION.has(behavior.role) ? orientation : undefined}
        style={orientation === 'horizontal' ? horizontalStyle : undefined}
        {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    </AriaInternalContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function AriaNode({ render }: AriaNodeProps) {
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria) throw new Error('<Aria.Node> must be inside <Aria>')
        const store = aria.getStore()
        const expandedIds = (store.entities['__expanded__']?.expandedIds as string[]) ?? []
        // If behavior has colCount, consumer uses <Aria.Cell> — skip auto gridcell wrapping
        const hasColCount = !!(aria.behavior.colCount && aria.behavior.colCount > 0)

        const renderNodes = (parentId: string): ReactNode[] => {
          const children = getChildren(store, parentId)
          const nodes: ReactNode[] = []
          for (const childId of children) {
            const entity = store.entities[childId]
            if (!entity) continue
            const state = aria.getNodeState(childId)
            const props = aria.getNodeProps(childId)
            const hasChildren = getChildren(store, childId).length > 0
            const isExpanded = expandedIds.includes(childId)
            // For treegrid rows, content must be wrapped in gridcell (but not for grid with colCount)
            const needsGridcell = !hasColCount && (props as Record<string, unknown>).role === 'row'
            nodes.push(
              <div key={childId} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                <AriaNodeContext.Provider value={{ nodeId: childId, focused: state.focused }}>
                  {needsGridcell
                    ? <div role="gridcell">{render(entity, state)}</div>
                    : render(entity, state)
                  }
                </AriaNodeContext.Provider>
              </div>
            )
            if (hasChildren && isExpanded) {
              nodes.push(...renderNodes(childId))
            }
          }
          return nodes
        }
        return <>{renderNodes(ROOT_ID)}</>
      }}
    </AriaInternalContext.Consumer>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function AriaCell({ index, children }: { index: number; children: React.ReactNode }) {
  const nodeCtx = React.useContext(AriaNodeContext)
  return (
    <AriaInternalContext.Consumer>
      {(aria) => {
        if (!aria || !nodeCtx) throw new Error('<Aria.Cell> must be inside <Aria.Node>')
        const store = aria.getStore()
        const focusedCol = (store.entities['__grid_col__']?.colIndex as number) ?? 0
        const isFocusedCell = nodeCtx.focused && index === focusedCol
        return (
          <div role="gridcell" aria-colindex={index + 1} tabIndex={isFocusedCell ? 0 : -1}>
            {children}
          </div>
        )
      }}
    </AriaInternalContext.Consumer>
  )
}

export const Aria = Object.assign(AriaRoot, { Node: AriaNode, Cell: AriaCell })
