import React, { useRef, useEffect } from 'react'
import styles from './Kanban.module.css'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import { ROOT_ID } from '../store/types'
import { useAria } from '../primitives/useAria'
import { AriaInternalContext } from '../primitives/AriaInternalContext'
import { AriaItemContext, Aria } from '../primitives/aria'
import { kanban as kanbanBehavior } from '../pattern/kanban'
import { core } from '../plugins/core'
import { getChildren, getEntity } from '../store/createStore'

interface KanbanProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  'aria-label'?: string
}

function FocusDiv({ focused, children, ...props }: { focused: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  }, [focused])
  return <div ref={ref} {...props}>{children}</div>
}

export function Kanban({
  data,
  plugins = [core()],
  onChange,
  'aria-label': ariaLabel,
}: KanbanProps) {
  const aria = useAria({ behavior: kanbanBehavior, data, plugins, onChange })
  const store = aria.getStore()
  const columns = getChildren(store, ROOT_ID)

  return (
    <AriaInternalContext.Provider value={{ ...aria, behavior: kanbanBehavior }}>
      <div
        role={kanbanBehavior.role}
        aria-label={ariaLabel}
        data-aria-container=""
        className={styles.board}
        {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {columns.map((colId) => {
          const colEntity = getEntity(store, colId)
          if (!colEntity) return null
          const colState = aria.getNodeState(colId)
          const colProps = aria.getNodeProps(colId)
          const cards = getChildren(store, colId)
          const colTitle = (colEntity.data as Record<string, unknown>)?.title as string ?? ''

          return (
            <div key={colId} className={styles.column}>
              {/* Column header */}
              <FocusDiv
                focused={colState.focused}
                className={styles.columnHeader}
                {...(colProps as React.HTMLAttributes<HTMLDivElement>)}
              >
                <AriaItemContext.Provider value={{ nodeId: colId, focused: colState.focused, renaming: !!colState.renaming }}>
                  <span>{colTitle}</span>
                  <span className={styles.columnCount}>{cards.length}</span>
                </AriaItemContext.Provider>
              </FocusDiv>

              {/* Cards */}
              {cards.map((cardId) => {
                const cardEntity = getEntity(store, cardId)
                if (!cardEntity) return null
                const cardState = aria.getNodeState(cardId)
                const cardProps = aria.getNodeProps(cardId)
                const cardTitle = (cardEntity.data as Record<string, unknown>)?.title as string ?? ''

                return (
                  <FocusDiv
                    key={cardId}
                    focused={cardState.focused}
                    className={styles.card}
                    {...(cardProps as React.HTMLAttributes<HTMLDivElement>)}
                  >
                    <AriaItemContext.Provider value={{ nodeId: cardId, focused: cardState.focused, renaming: !!cardState.renaming }}>
                      <Aria.Editable field="title">{cardTitle}</Aria.Editable>
                    </AriaItemContext.Provider>
                  </FocusDiv>
                )
              })}
            </div>
          )
        })}
      </div>
    </AriaInternalContext.Provider>
  )
}
