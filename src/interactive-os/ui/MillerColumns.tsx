/** @catalog Miller Columns (Finder 스타일 컬럼 탐색기) */
import React, { useRef, useEffect, useMemo } from 'react'
import { ROOT_ID } from '../store/types'
import { FOCUS_ID } from '../core'
import { useAria } from '../primitives/useAria'
import { AriaInternalContext } from '../primitives/AriaInternalContext'
import { miller as millerBehavior } from './millerPreset'
import { getChildren, getEntity } from '../store/createStore'
import type { AriaComponentProps } from './types'
import { DirectionIndicator } from './indicators'
import { FileIcon } from './FileIcon'
import { EmptyState } from './EmptyState'
import { ax } from '@styles/ax'
import { resolveContainerPreset } from '../layout/containerPreset'
import './MillerColumns.css'

const millerRootPreset = resolveContainerPreset('miller.root')
const millerColumnPreset = resolveContainerPreset('miller.column')

interface MillerColumnsProps extends AriaComponentProps {
  renderPreview?: (nodeId: string) => React.ReactNode
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

/** focused 노드에서 ROOT까지 ancestor path를 구한다 */
function getAncestorPath(store: ReturnType<ReturnType<typeof useAria>['getStore']>, focusedId: string): string[] {
  const path: string[] = []
  let current = focusedId
  while (current && current !== ROOT_ID) {
    path.unshift(current)
    let parentId: string | undefined
    for (const [pid, children] of Object.entries(store.relationships)) {
      if (children.includes(current)) { parentId = pid; break }
    }
    if (!parentId) break
    current = parentId
  }
  return path
}


export function MillerColumns({
  data,
  plugins = [],
  onChange,
  onActivate,
  onFocusChange,
  renderPreview,
  'aria-label': ariaLabel,
}: MillerColumnsProps) {
  const aria = useAria({ pattern: millerBehavior, data, plugins, onChange, onActivate, onFocusChange })
  const store = aria.getStore()

  const focusedId = (store.entities[FOCUS_ID] as { focusedId?: string } | undefined)?.focusedId ?? ''

  // Build columns: ancestor path determines which columns to show
  const columns = useMemo(() => {
    const path = getAncestorPath(store, focusedId)
    const cols: Array<{ parentId: string; items: string[]; selectedId?: string }> = []

    const rootChildren = getChildren(store, ROOT_ID)
    if (rootChildren.length === 0) return cols
    cols.push({ parentId: ROOT_ID, items: rootChildren, selectedId: path[0] })

    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i]!
      const children = getChildren(store, nodeId)
      if (children.length > 0) {
        cols.push({ parentId: nodeId, items: children, selectedId: path[i + 1] })
      }
    }

    return cols
  }, [store, focusedId])

  const focusedEntity = focusedId ? getEntity(store, focusedId) : undefined
  const focusedData = focusedEntity?.data as Record<string, unknown> | undefined
  const focusedIsFile = focusedData?.type === 'file'

  const hasPreview = focusedIsFile && !!renderPreview

  const COLUMN_MIN_WIDTH = 200

  function renderColumn(col: typeof columns[number]) {
    return (
      <div
        className={`${ax({ layout: 'scroll', flex: 'none', ...(millerColumnPreset.padding ? { padding: millerColumnPreset.padding } : {}), ...(millerColumnPreset.gap ? { gap: millerColumnPreset.gap } : {}) })} miller-column`}
        style={{ minWidth: COLUMN_MIN_WIDTH }}
      >
        {col.items.map((itemId) => {
          const entity = getEntity(store, itemId)
          if (!entity) return null
          const state = aria.getNodeState(itemId)
          const props = aria.getNodeProps(itemId)
          const itemData = entity.data as Record<string, unknown> | undefined
          const label = itemData?.title as string ?? itemData?.name as string ?? itemData?.label as string ?? itemId
          const hasChildren = getChildren(store, itemId).length > 0
          const isAncestor = col.selectedId === itemId && !state.focused
          const propsObj = props as React.HTMLAttributes<HTMLDivElement> & { 'aria-selected'?: string }
          if (isAncestor && propsObj['aria-selected'] !== 'true') {
            propsObj['aria-selected'] = 'true'
          }
          return (
            <FocusDiv
              key={itemId}
              focused={state.focused}
              {...propsObj}
              className={`${(props as Record<string, string>).className ?? ''} ${ax({ role: 'item', layout: 'bar', interactive: 'item', width: 'full' })}`}
            >
              <FileIcon name={label} type={hasChildren ? 'directory' : 'file'} />
              <span className={ax({ clamp: '1', flex: '1' })}>{label}</span>
              {hasChildren && <DirectionIndicator direction="next" className={ax({ flex: 'none' })} />}
            </FocusDiv>
          )
        })}
      </div>
    )
  }

  if (columns.length <= 0) return null

  return (
    <AriaInternalContext.Provider value={{ ...aria, pattern: millerBehavior }}>
      <div
        role={millerBehavior.role}
        aria-label={ariaLabel}
        data-aria-container=""
        className={`ax-interactive ${ax({ layout: 'row-fill' })}`}
        {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)}
      >
        <div className={ax({ layout: 'scroll-x', flex: hasPreview ? 'none' : '1', ...(millerRootPreset.gap ? { gap: millerRootPreset.gap } : {}) })}>
          {columns.map((col) => (
            <React.Fragment key={col.parentId}>
              {renderColumn(col)}
            </React.Fragment>
          ))}
          {!hasPreview && focusedId && !focusedIsFile && getChildren(store, focusedId).length === 0 && (
            <div className={`${ax({
                role: 'control-group',
                layout: 'center', surface: 'sunken', flex: 'none' })} miller-column`} style={{ minWidth: COLUMN_MIN_WIDTH }}>
              <EmptyState title="Empty" />
            </div>
          )}
        </div>

        {focusedIsFile && renderPreview && (
          <div className={ax({ layout: 'scroll', flex: '1' })} data-scroll-target>
            {renderPreview(focusedId)}
          </div>
        )}
      </div>
    </AriaInternalContext.Provider>
  )
}
