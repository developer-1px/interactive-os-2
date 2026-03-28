import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import styles from './Kanban.module.css'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import { ROOT_ID } from '../store/types'
import { useAria } from '../primitives/useAria'
import { FOCUS_ID } from '../axis/navigate'
import { AriaInternalContext } from '../primitives/AriaInternalContext'
import { AriaItemContext, Aria } from '../primitives/aria'
import { kanban as kanbanBehavior } from './kanbanPreset'
import { getChildren, getEntity } from '../store/createStore'

interface KanbanProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onActivate?: (nodeId: string) => void
  onFocusChange?: (nodeId: string | null) => void
  compact?: boolean
  'aria-label'?: string
}

function FocusDiv({ focused, children, ...props }: { focused: boolean; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  }, [focused])
  return <div ref={ref} data-focused={focused || undefined} {...props}>{children}</div>
}

export function Kanban({
  data,
  plugins = [],
  onChange,
  onActivate,
  onFocusChange,
  compact = false,
  'aria-label': ariaLabel,
}: KanbanProps) {
  // onActivate가 있으면 Enter를 activate로 override (기본은 rename)
  const keyMap = useMemo(() => onActivate ? { Enter: (ctx: { activate: () => void }) => ctx.activate() } : undefined, [onActivate])
  const aria = useAria({ pattern: kanbanBehavior, data, plugins, keyMap, onChange, onActivate })
  const store = aria.getStore()
  const columns = getChildren(store, ROOT_ID)

  const focusedId = (store.entities[FOCUS_ID] as Record<string, unknown>)?.focusedId as string | undefined ?? null
  const stableFocusChange = useCallback((id: string | null) => { onFocusChange?.(id) }, [onFocusChange])
  useEffect(() => { stableFocusChange(focusedId) }, [focusedId, stableFocusChange])

  return (
    <AriaInternalContext.Provider value={{ ...aria, pattern: kanbanBehavior }}>
      <div
        role={kanbanBehavior.role}
        aria-label={ariaLabel}
        data-aria-container=""
        className={`flex-row gap-md overflow-x-auto ${styles.board}`}
        data-compact={compact || undefined}
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
            <div key={colId} className={`flex-col gap-xs ${styles.column}`}>
              {/* Column header */}
              <FocusDiv
                focused={colState.focused}
                className={`flex-row items-center gap-sm ${styles.columnHeader}`}
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
