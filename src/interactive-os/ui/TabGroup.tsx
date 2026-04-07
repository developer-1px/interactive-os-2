/** @catalog 탭+패널 그룹 컨테이너 */
// ② 2026-03-26-workspace-containers-prd.md
import React, { useCallback, useMemo } from 'react'
import type { NormalizedData, Entity } from '../store/types'
import type { Plugin } from '../plugins/types'
import { key } from '../axis/types'
import { ROOT_ID } from '../store/types'
import { createStore, getChildren, getEntityData } from '../store/createStore'
import { useTabList } from './useTabList'
import { workspaceCommands } from '../plugins/workspaceStore'
import type { TabGroupData } from '../plugins/workspaceStore'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { CloseIndicator, AddIndicator } from './indicators'
import './TabGroup.css'

interface TabGroupProps {
  data: NormalizedData
  tabgroupId: string
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  onAddTab?: (tabgroupId: string) => void
  renderPanel: (tab: Entity) => React.ReactNode
  keyMap?: Record<string, import('../axis/types').KeyHandler>
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

  const closeKeyMap = useMemo(() => ({
    'Delete': key(['workspace:removeTab'], (ctx) => {
      onChange?.(workspaceCommands.removeTab.reduce(data, ctx.focused))
    }),
    'Meta+w': key(['workspace:removeTab'], (ctx) => {
      onChange?.(workspaceCommands.removeTab.reduce(data, ctx.focused))
    }),
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
      <div {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)} className={`overflow-x-auto ${ax({ layout: 'bar', gap: 'xs', padding: 'xs', border: 'bottom' })}`}>
        {childIds.map((id) => {
          const entity = store.entities[id]
          if (!entity) return null
          const itemProps = tl.getItemProps(id)
          const entityData = entity.data as Record<string, unknown>
          const label = entityData?.label as string ?? id
          const isPreview = entityData?.preview === true
          const tabClass = `tab-item ${ax({ surface: 'ghost', recipe: 'control-sm', layout: 'bar', text: 'muted', interactive: 'tab' })}${isPreview ? ' tab-item-preview' : ''}`
          return (
            <div key={id} {...(itemProps as React.HTMLAttributes<HTMLDivElement>)} className={tabClass}>
              <span>{label}</span>
              <button
                className={`tab-close ${ax({ surface: 'ghost', layout: 'center', text: 'muted', shape: 'sm' })}`}
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
            className={`tab-add ${ax({ surface: 'ghost', layout: 'center', recipe: 'control-sm', text: 'muted' })}`}
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
