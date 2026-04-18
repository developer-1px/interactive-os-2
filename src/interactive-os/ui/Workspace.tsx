/** @catalog 탭+패널 워크스페이스 레이아웃 */
// ② 2026-03-26-workspace-containers-prd.md
import React, { useCallback, useMemo } from 'react'

import type { NormalizedData, Entity } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getEntityData } from '../store/createStore'
import type { SplitData, TabGroupData } from '../plugins/workspaceStore'
import { workspaceCommands, findTabgroup } from '../plugins/workspaceStore'
import { SplitPane } from './SplitPane'
import type { PaneSize } from './SplitPane'
import { TabGroup } from './TabGroup'
import { useKeyMap } from '../primitives/useKeyMap'
import { ax } from '@styles/ax'

interface WorkspaceProps {
  data: NormalizedData
  onChange: (data: NormalizedData) => void
  onAddTab?: (tabgroupId: string) => void
  renderPanel: (tab: Entity) => React.ReactNode
  'aria-label'?: string
}

interface WorkspaceNodeProps {
  nodeId: string
  data: NormalizedData
  onChange: (data: NormalizedData) => void
  onAddTab?: (tabgroupId: string) => void
  renderPanel: (tab: Entity) => React.ReactNode
}

function WorkspaceNode({ nodeId, data, onChange, onAddTab, renderPanel }: WorkspaceNodeProps) {
  const entityData = getEntityData<{ type: string }>(data, nodeId)
  if (!entityData) return null

  if (entityData.type === 'split') {
    const splitData = entityData as unknown as SplitData
    const childIds = getChildren(data, nodeId)

    const handleResize = (sizes: PaneSize[]) => {
      onChange(workspaceCommands.resize.reduce(data, nodeId, sizes))
    }

    return (
      <SplitPane direction={splitData.direction} sizes={splitData.sizes} onResize={handleResize}>
        {childIds.map((id) => (
          <WorkspaceNode key={id} nodeId={id} data={data} onChange={onChange} onAddTab={onAddTab} renderPanel={renderPanel} />
        ))}
      </SplitPane>
    )
  }

  if (entityData.type === 'tabgroup') {
    const tabIds = getChildren(data, nodeId)
    if (tabIds.length === 0) {
      return null
    }

    return (
      <TabGroup
        data={data}
        tabgroupId={nodeId}
        onChange={onChange}
        onAddTab={onAddTab}
        renderPanel={renderPanel}
        aria-label="Tab group"
      />
    )
  }

  return null
}

export function Workspace({
  data,
  onChange,
  onAddTab,
  renderPanel,
  'aria-label': ariaLabel,
}: WorkspaceProps) {
  const rootChildren = getChildren(data, ROOT_ID)

  const switchTab = useCallback((offset: 1 | -1) => {
    const tgId = findTabgroup(data)
    if (!tgId) return
    const tabIds = getChildren(data, tgId)
    const tgData = getEntityData<TabGroupData>(data, tgId)
    const activeId = tgData?.activeTabId ?? ''
    const idx = tabIds.indexOf(activeId)
    const nextIdx = (idx + offset + tabIds.length) % tabIds.length
    if (tabIds[nextIdx]) onChange(workspaceCommands.setActiveTab.reduce(data, tgId, tabIds[nextIdx]))
  }, [data, onChange])

  const layoutHandlers = useMemo(() => ({
    close: () => {
      const tgId = findTabgroup(data)
      if (!tgId) return
      const tgData = getEntityData<TabGroupData>(data, tgId)
      const activeId = tgData?.activeTabId
      if (activeId) onChange(workspaceCommands.removeTab.reduce(data, activeId))
    },
    prevTab: () => switchTab(-1),
    nextTab: () => switchTab(1),
  }), [data, onChange, switchTab])

  const { onKeyDown: handleKeyDown } = useKeyMap(layoutHandlers)

  if (rootChildren.length === 0) {
    return (
      <div className={ax({ layout: 'fill' })} aria-label={ariaLabel}>
        <div className={ax({ layout: 'center', flex: '1' })}>No open tabs</div>
      </div>
    )
  }

  return (
    <div className={ax({ layout: 'fill' })} aria-label={ariaLabel} onKeyDown={handleKeyDown}>
      <div className={ax({ layout: 'fill' })}>
        {rootChildren.map((id) => (
          <WorkspaceNode key={id} nodeId={id} data={data} onChange={onChange} onAddTab={onAddTab} renderPanel={renderPanel} />
        ))}
      </div>
    </div>
  )
}
