/** @catalog 칸반 보드 (드래그 앤 드롭 컬럼) */
import React, { useRef, useEffect, useMemo } from 'react'
import { key } from '../axis/types'
import './Kanban.css'
import { ROOT_ID } from '../store/types'
import { useAria } from '../primitives/useAria'
import { AriaInternalContext } from '../primitives/AriaInternalContext'
import { AriaItemContext, Aria } from '../primitives/aria'
import { kanban as kanbanBehavior } from './kanbanPreset'
import { getChildren, getEntity } from '../store/createStore'
import type { AriaComponentProps } from './types'
import { ax } from '@styles/ax'

interface KanbanProps extends AriaComponentProps {
  highlightUp?: Set<string>
  highlightDown?: Set<string>
  compact?: boolean
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
  highlightUp,
  highlightDown,
  compact = false,
  'aria-label': ariaLabel,
}: KanbanProps) {
  // onActivate가 있으면 Enter를 activate로 override (기본은 rename)
  const keyMap = useMemo(() => onActivate ? { Enter: key(['activate'], (ctx) => ctx.activate()) } : undefined, [onActivate])
  const aria = useAria({ pattern: kanbanBehavior, data, plugins, keyMap, onChange, onActivate, onFocusChange })
  const store = aria.getStore()
  const columns = getChildren(store, ROOT_ID)

  // Column LOC ratios for visual bar
  const maxColLoc = useMemo(() => {
    let max = 0
    for (const colId of columns) {
      const loc = (getEntity(store, colId)?.data as Record<string, unknown> | undefined)?.totalLoc as number | undefined
      if (loc && loc > max) max = loc
    }
    return max
  }, [store, columns])

  function renderCard(cardId: string) {
    const cardEntity = getEntity(store, cardId)
    if (!cardEntity) return null
    const cardState = aria.getNodeState(cardId)
    const cardProps = aria.getNodeProps(cardId)
    const cardData = cardEntity.data as Record<string, unknown> | undefined
    const cardTitle = cardData?.title as string ?? ''
    const cardSubtitle = cardData?.subtitle as string | undefined
    const cardTooltip = cardData?.tooltip as string | undefined
    const cardWeight = cardData?.weight as string | undefined
    const cardExt = cardData?.ext as string | undefined
    const cardDepUp = cardData?.depUp as number | undefined
    const cardDepDown = cardData?.depDown as number | undefined
    const hlDir = highlightUp?.has(cardId) ? 'up' : highlightDown?.has(cardId) ? 'down' : undefined
    const isHub = cardDepUp != null && cardDepUp >= 20

    return (
      <FocusDiv
        key={cardId}
        focused={cardState.focused}
        className={`${compact ? 'border-none' : ''} ${ax({ recipe: compact ? 'container-sm' : 'container', surface: 'display', textStyle: compact ? 'caption' : undefined, layout: compact ? 'row' : undefined })} kanban-card`}
        data-hub={isHub || undefined}
        title={cardTooltip ?? cardTitle}
        data-weight={cardWeight || undefined}
        data-ext={cardExt || undefined}
        data-highlight={hlDir}
        data-source={(cardData?.sourceId as string) || undefined}
        {...(cardProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        <AriaItemContext.Provider value={{ nodeId: cardId, focused: cardState.focused, renaming: !!cardState.renaming }}>
          <span className={`${ax({ clamp: '1' })} kanban-card-title`}><Aria.Editable field="title">{cardTitle}</Aria.Editable></span>
          {(cardSubtitle || cardDepUp != null || cardDepDown != null) && (
            <span className={`tabular-nums ${ax({ text: 'muted', flex: 'none' })} kanban-card-subtitle`}>
              {cardSubtitle}
              {cardDepUp != null && cardDepUp > 0 && <span className={`${ax({ weight: 'medium' })} kanban-dep-up`}> ↑{cardDepUp}</span>}
              {cardDepDown != null && cardDepDown > 0 && <span className={`${ax({ weight: 'medium' })} ${ax({ tone: 'accent' })}`}> ↓{cardDepDown}</span>}
            </span>
          )}
        </AriaItemContext.Provider>
      </FocusDiv>
    )
  }

  return (
    <AriaInternalContext.Provider value={{ ...aria, pattern: kanbanBehavior }}>
      <div
        role={kanbanBehavior.role}
        aria-label={ariaLabel}
        data-aria-container=""
        className={`ax-interactive ${ax({ layout: 'scroll-x', gap: compact ? 'sm' : 'md', padding: compact ? 'sm' : 'xs' })} kanban-board`}
        data-compact={compact || undefined}
        data-has-highlight={(highlightUp?.size || highlightDown?.size) ? '' : undefined}
        {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        {columns.map((colId) => {
          const colEntity = getEntity(store, colId)
          if (!colEntity) return null
          const colState = aria.getNodeState(colId)
          const colProps = aria.getNodeProps(colId)
          const cards = getChildren(store, colId)
          const colData = colEntity.data as Record<string, unknown> | undefined
          const colTitle = colData?.title as string ?? ''
          const totalLoc = colData?.totalLoc as number | undefined

          const locRatio = totalLoc && maxColLoc ? totalLoc / maxColLoc : 0

          return (
            <div key={colId} className={`${ax({ layout: 'column', gap: 'xs', flex: compact ? 'none' : '1', surface: 'sunken', shape: compact ? 'sm' : 'xl', padding: compact ? undefined : 'xl' })} kanban-column`}>
              {/* Column header */}
              <FocusDiv
                focused={colState.focused}
                className={`relative ${ax({ layout: 'bar', gap: 'sm', textStyle: compact ? 'caption' : 'overline', text: 'secondary', padding: 'xs', shape: 'sm', clamp: compact ? '1' : undefined })} kanban-column-header`}
                title={`${colTitle}\n${cards.length} files${totalLoc ? ` · ${totalLoc} lines` : ''}`}
                style={locRatio > 0 ? { '--_loc-ratio': locRatio } as React.CSSProperties : undefined}
                {...(colProps as React.HTMLAttributes<HTMLDivElement>)}
              >
                <AriaItemContext.Provider value={{ nodeId: colId, focused: colState.focused, renaming: !!colState.renaming }}>
                  <span>{colTitle}</span>
                  <span className={`${ax({ text: 'muted' })} kanban-column-count`}>{cards.length}{totalLoc != null && totalLoc > 0 ? ` · ${totalLoc}L` : ''}</span>
                </AriaItemContext.Provider>
              </FocusDiv>

              {cards.map((cardId) => renderCard(cardId))}
            </div>
          )
        })}
      </div>
    </AriaInternalContext.Provider>
  )
}
