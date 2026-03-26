// ② 2026-03-26-workspace-containers-prd.md
import React, { useMemo } from 'react'
import { X } from 'lucide-react'

import type { NormalizedData, Entity } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { PatternContext } from '../pattern/types'
import type { Command } from '../engine/types'
import { ROOT_ID } from '../store/types'
import { createStore, getChildren, getEntityData } from '../store/createStore'
import { useTabList } from './useTabList'
import { workspaceCommands } from '../plugins/workspaceStore'
import type { TabGroupData } from '../plugins/workspaceStore'
import styles from './TabGroup.module.css'

interface TabGroupProps {
  data: NormalizedData
  tabgroupId: string
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderPanel: (tab: Entity) => React.ReactNode
  keyMap?: Record<string, (ctx: PatternContext) => Command | void>
  'aria-label'?: string
}

export function TabGroup({
  data,
  tabgroupId,
  plugins,
  onChange,
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

  const handleActivate = (nodeId: string) => {
    if (!onChange) return
    const cmd = workspaceCommands.setActiveTab(tabgroupId, nodeId)
    onChange(cmd.execute(data))
  }

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onChange) return
    const cmd = workspaceCommands.removeTab(tabId)
    onChange(cmd.execute(data))
  }

  const closeKeyMap: Record<string, (ctx: PatternContext) => Command | void> = {
    'Delete': (ctx) => {
      if (!onChange) return
      onChange(workspaceCommands.removeTab(ctx.focused).execute(data))
    },
    'Meta+w': (ctx) => {
      if (!onChange) return
      onChange(workspaceCommands.removeTab(ctx.focused).execute(data))
    },
    ...keyMap,
  }

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

  return (
    <div className={styles.tabGroup}>
      <div {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)} className={styles.tabBar}>
        {childIds.map((id) => {
          const entity = store.entities[id]
          if (!entity) return null
          const itemProps = tl.getItemProps(id)
          const label = (entity.data as Record<string, unknown>)?.label as string ?? id
          return (
            <div key={id} {...(itemProps as React.HTMLAttributes<HTMLDivElement>)} className={styles.tab}>
              <span>{label}</span>
              <button
                className={styles.tabClose}
                aria-label={`Close ${label}`}
                tabIndex={-1}
                onClick={(e) => handleClose(e, id)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>
      <div role="tabpanel" className={styles.tabPanel}>
        {activeEntity ? renderPanel(activeEntity) : null}
      </div>
    </div>
  )
}
