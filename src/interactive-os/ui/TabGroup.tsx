// ② 2026-03-26-workspace-containers-prd.md
import React, { useCallback, useMemo } from 'react'
import type { NormalizedData, Entity } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { PatternContext } from '../pattern/types'
import type { Command } from '../engine/types'
import { ROOT_ID } from '../store/types'
import { createStore, getChildren, getEntityData } from '../store/createStore'
import { useTabList } from './useTabList'
import { workspaceCommands } from '../plugins/workspaceStore'
import type { TabGroupData } from '../plugins/workspaceStore'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { CloseIndicator, AddIndicator } from './indicators'
import styles from './TabGroup.module.css'

interface TabGroupProps {
  data: NormalizedData
  tabgroupId: string
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onAddTab?: (tabgroupId: string) => void
  renderPanel: (tab: Entity) => React.ReactNode
  keyMap?: Record<string, (ctx: PatternContext) => Command | void>
  'aria-label'?: string
}

export function TabGroup({
  data,
  tabgroupId,
  plugins,
  onChange,
  onAddTab,
  renderPanel,
  keyMap,
  'aria-label': ariaLabel,
}: TabGroupProps) {
  const tabgroupData = getEntityData<TabGroupData>(data, tabgroupId)
  const tabIds = getChildren(data, tabgroupId)
  const activeTabId = tabgroupData?.activeTabId ?? tabIds[0] ?? ''

  const tabStore = useMemo(() => {
    const entities: Record<string, Entity> = {}
    for (const id of tabIds) {
      const entity = data.entities[id]
      if (entity) entities[id] = entity
    }
    return createStore({ entities, relationships: { [ROOT_ID]: tabIds } })
  }, [data, tabIds])

  const handleActivate = useCallback((nodeId: string) => {
    if (!onChange) return
    onChange(workspaceCommands.setActiveTab.reduce(data, tabgroupId, nodeId))
  }, [onChange, tabgroupId, data])

  const handleClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onChange) return
    onChange(workspaceCommands.removeTab.reduce(data, tabId))
  }, [onChange, data])

  const closeKeyMap = useMemo((): Record<string, (ctx: PatternContext) => Command | void> => ({
    'Delete': (ctx) => {
      onChange?.(workspaceCommands.removeTab.reduce(data, ctx.focused))
    },
    'Meta+w': (ctx) => {
      onChange?.(workspaceCommands.removeTab.reduce(data, ctx.focused))
    },
    ...keyMap,
  }), [keyMap, onChange, data])

  const tl = useTabList({
    data: tabStore,
    plugins,
    keyMap: closeKeyMap,
    onActivate: handleActivate,
    initialFocus: activeTabId,
    'aria-label': ariaLabel,
  })

  const store = tl.getStore()
  const childIds = getChildren(store, ROOT_ID)

  const activeEntity = data.entities[activeTabId]

  const handleAdd = useCallback(() => {
    onAddTab?.(tabgroupId)
  }, [onAddTab, tabgroupId])

  return (
    <div className={ax({ layout: 'fill' })} data-full-height>
      <div {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)} className={`${ax({ layout: 'bar', gap: 'xs', padding: 'xs' })} ${styles.tabBar}`}>
        {childIds.map((id) => {
          const entity = store.entities[id]
          if (!entity) return null
          const itemProps = tl.getItemProps(id)
          const entityData = entity.data as Record<string, unknown>
          const label = entityData?.label as string ?? id
          const isPreview = entityData?.preview === true
          const tabClass = isPreview
            ? `${ax({ surface: 'ghost', controlSize: 'sm' })} ${styles.tab} ${styles.tabPreview}`
            : `${ax({ surface: 'ghost', controlSize: 'sm' })} ${styles.tab}`
          return (
            <div key={id} {...(itemProps as React.HTMLAttributes<HTMLDivElement>)} className={tabClass}>
              <span>{label}</span>
              <button
                className={`${ax({ surface: 'ghost', layout: 'center', text: 'muted' })} ${styles.tabClose}`}
                aria-label={`Close ${label}`}
                tabIndex={-1}
                onClick={(e) => handleClose(e, id)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <CloseIndicator />
              </button>
            </div>
          )
        })}
        {onAddTab && (
          <button
            className={`${ax({ surface: 'ghost', layout: 'center', controlSize: 'sm', text: 'muted' })} ${styles.tabAdd}`}
            aria-label="Add tab"
            tabIndex={-1}
            onClick={handleAdd}
          >
            <AddIndicator />
          </button>
        )}
      </div>
      <div role="tabpanel" className={ax({ layout: 'fill' })}>
        {activeEntity ? renderPanel(activeEntity) : null}
      </div>
    </div>
  )
}
