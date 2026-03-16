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

// eslint-disable-next-line react-refresh/only-export-components
function AriaRoot({ behavior, data, plugins, keyMap, onChange, 'aria-label': ariaLabel, children }: AriaProps) {
  const aria = useAria({ behavior, data, plugins, keyMap, onChange })
  return (
    <AriaInternalContext.Provider value={aria}>
      <div role={behavior.role} aria-label={ariaLabel}>
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
            // For treegrid rows, content must be wrapped in gridcell
            const needsGridcell = (props as Record<string, unknown>).role === 'row'
            nodes.push(
              <div key={childId} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
                {needsGridcell
                  ? <div role="gridcell">{render(entity, state)}</div>
                  : render(entity, state)
                }
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

export const Aria = Object.assign(AriaRoot, { Node: AriaNode })
