/** @catalog 칸반 보드 (드래그 앤 드롭 컬럼) */
import React, { useRef, useEffect, useMemo } from 'react'
import { key } from '../axis/types'
import type { CSSProperties } from 'react'
import { ROOT_ID } from '../store/types'
import { useAria } from '../primitives/useAria'
import { AriaInternalContext } from '../primitives/AriaInternalContext'
import { AriaItemContext, Aria } from '../primitives/aria'
import { kanban as kanbanBehavior } from './kanbanPreset'
import { getChildren, getEntity } from '../store/createStore'
import type { AriaComponentProps } from './types'
import { ax } from '@styles/ax'

const extShadow: Record<string, string> = {
  ts: 'inset var(--indicator-width) 0 0 var(--tone-primary-base)',
  tsx: 'inset var(--indicator-width) 0 0 var(--focus)',
  css: 'inset var(--indicator-width) 0 0 var(--tone-destructive-base)',
  md: 'inset var(--indicator-width) 0 0 var(--tone-success-base)',
  mdx: 'inset var(--indicator-width) 0 0 var(--tone-success-base)',
  json: 'inset var(--indicator-width) 0 0 var(--tone-warning-base)',
  yaml: 'inset var(--indicator-width) 0 0 var(--tone-warning-base)',
  yml: 'inset var(--indicator-width) 0 0 var(--tone-warning-base)',
}

const hlShadow: Record<string, string> = {
  up: 'inset var(--indicator-width) 0 0 var(--tone-success-base)',
  down: 'inset var(--indicator-width) 0 0 var(--tone-primary-base)',
}

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

    // Compute card style: box-shadow (ext/highlight), hub, focus/selection, dimming
    const cardStyle: CSSProperties = {}
    if (compact) {
      cardStyle.flexShrink = 0
      const shadow = hlDir ? hlShadow[hlDir] : cardExt ? extShadow[cardExt] : undefined
      if (shadow) cardStyle.boxShadow = shadow
      if (isHub) {
        cardStyle.borderInlineStartWidth = 'var(--space-xs)'
        cardStyle.borderInlineStartColor = 'var(--tone-primary-base)'
        cardStyle.backgroundImage = 'linear-gradient(color-mix(in srgb, var(--tone-primary-base) 6%, var(--surface-default)), color-mix(in srgb, var(--tone-primary-base) 6%, var(--surface-default)))'
      }
      if ((highlightUp?.size || highlightDown?.size) && !hlDir && !cardState.focused) {
        cardStyle.opacity = 0.25
      }
    }
    if (cardState.focused) cardStyle.background = 'var(--selection-cursor)'
    else if (cardState.selected) cardStyle.background = 'var(--selection)'

    return (
      <FocusDiv
        key={cardId}
        focused={cardState.focused}
        className={ax({ surface: 'raised', border: 'ring', textStyle: compact ? 'caption' : undefined, layout: compact ? 'row' : 'stack', padding: compact ? 'md' : 'lg', gap: compact ? 'md' : 'lg', shape: compact ? 'md' : 'lg' })}
        style={cardStyle}
        title={cardTooltip ?? cardTitle}
        data-weight={cardWeight || undefined}
        data-source={(cardData?.sourceId as string) || undefined}
        data-agent-state={(cardData?.agentState as string) || undefined}
        data-stale={(cardData?.isStale as boolean) || undefined}
        data-conflict={(cardData?.conflict as boolean) || undefined}
        {...(cardProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        <AriaItemContext.Provider value={{ nodeId: cardId, focused: cardState.focused, renaming: !!cardState.renaming }}>
          <span className={ax({ clamp: '1' })} style={{ minWidth: 0 }}><Aria.Editable field="title">{cardTitle}</Aria.Editable></span>
          {(cardSubtitle || cardDepUp != null || cardDepDown != null) && (
            <span className={`tabular-nums ${ax({ flex: 'none' })}`} style={{ marginLeft: 'auto' }}>
              {cardSubtitle}
              {cardDepUp != null && cardDepUp > 0 && <span className={ax({  })} style={{ color: 'var(--tone-success-base)' }}> ↑{cardDepUp}</span>}
              {cardDepDown != null && cardDepDown > 0 && <span className={`${ax({  })} ${ax({ tone: 'accent' })}`}> ↓{cardDepDown}</span>}
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
        className={`ax-interactive ${ax({ layout: 'scroll-x', gap: compact ? 'sm' : 'md', padding: compact ? 'sm' : 'xs' })}`}
        style={compact ? { height: '100%', alignItems: 'flex-start', overflow: 'auto hidden' } as CSSProperties : undefined}
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
            <div
              key={colId}
              className={ax({ layout: 'stack', gap: 'xs', flex: compact ? 'none' : '1', surface: 'sunken', shape: compact ? 'sm' : 'xl', padding: compact ? undefined : 'xl' })}
              style={compact ? { minWidth: 'var(--space-3xl)', maxWidth: 'none', width: 'var(--storymap-col-width)', padding: 'var(--space-xs) var(--space-sm)', overflowY: 'auto', maxHeight: '100%' } as CSSProperties : undefined}
            >
              {/* Column header */}
              <FocusDiv
                focused={colState.focused}
                className={ax({ layout: 'bar', gap: 'sm', textStyle: compact ? 'caption' : 'overline', padding: 'xs', shape: 'sm', clamp: compact ? '1' : undefined, placement: 'relative' })}
                title={`${colTitle}\n${cards.length} files${totalLoc ? ` · ${totalLoc} lines` : ''}`}
                style={compact ? { textTransform: 'none', letterSpacing: 0, paddingBlock: 'var(--space-xs)', paddingInline: 0 } as CSSProperties : undefined}
                {...(colProps as React.HTMLAttributes<HTMLDivElement>)}
              >
                <AriaItemContext.Provider value={{ nodeId: colId, focused: colState.focused, renaming: !!colState.renaming }}>
                  <span>{colTitle}</span>
                  <span className={ax({  })} style={{ textTransform: 'none', letterSpacing: 0 }}>{cards.length}{totalLoc != null && totalLoc > 0 ? ` · ${totalLoc}L` : ''}</span>
                </AriaItemContext.Provider>
                {compact && locRatio > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    height: 'var(--indicator-width)',
                    width: `${locRatio * 100}%`,
                    background: 'var(--tone-primary-dim)',
                    borderRadius: 'var(--border-width)',
                    opacity: 0.6,
                  }} />
                )}
              </FocusDiv>

              {cards.map((cardId) => renderCard(cardId))}
            </div>
          )
        })}
      </div>
    </AriaInternalContext.Provider>
  )
}
