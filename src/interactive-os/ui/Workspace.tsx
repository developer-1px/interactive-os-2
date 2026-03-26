// ② 2026-03-26-workspace-containers-prd.md
import React, { useCallback } from 'react'

import type { NormalizedData, Entity } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getEntityData } from '../store/createStore'
import type { SplitData } from '../plugins/workspaceStore'
import { workspaceCommands, findTabgroup } from '../plugins/workspaceStore'
import { SplitPane } from './SplitPane'
import { TabGroup } from './TabGroup'
import styles from './Workspace.module.css'

interface WorkspaceProps {
  data: NormalizedData
  onChange: (data: NormalizedData) => void
  renderPanel: (tab: Entity) => React.ReactNode
  'aria-label'?: string
}

interface WorkspaceNodeProps {
  nodeId: string
  data: NormalizedData
  onChange: (data: NormalizedData) => void
  renderPanel: (tab: Entity) => React.ReactNode
}

function WorkspaceNode({ nodeId, data, onChange, renderPanel }: WorkspaceNodeProps) {
  const entityData = getEntityData<{ type: string }>(data, nodeId)
  if (!entityData) return null

  if (entityData.type === 'split') {
    const splitData = entityData as unknown as SplitData
    const childIds = getChildren(data, nodeId)

    const handleResize = (sizes: number[]) => {
      onChange(workspaceCommands.resize(nodeId, sizes).execute(data))
    }

    return (
      <SplitPane direction={splitData.direction} sizes={splitData.sizes} onResize={handleResize}>
        {childIds.map((id) => (
          <WorkspaceNode key={id} nodeId={id} data={data} onChange={onChange} renderPanel={renderPanel} />
        ))}
      </SplitPane>
    )
  }

  if (entityData.type === 'tabgroup') {
    const tabIds = getChildren(data, nodeId)
    if (tabIds.length === 0) {
      return <div className={styles.empty}>No open tabs</div>
    }

    return (
      <TabGroup
        data={data}
        tabgroupId={nodeId}
        onChange={onChange}
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
  renderPanel,
  'aria-label': ariaLabel,
}: WorkspaceProps) {
  const rootChildren = getChildren(data, ROOT_ID)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === '\\' && e.metaKey) {
        e.preventDefault()
        const activePaneId = findTabgroup(data)
        if (!activePaneId) return

        const direction = e.shiftKey ? 'vertical' : 'horizontal'
        onChange(workspaceCommands.splitPane(activePaneId, direction).execute(data))
      }
    },
    [data, onChange],
  )

  if (rootChildren.length === 0) {
    return (
      <div className={styles.workspace} aria-label={ariaLabel}>
        <div className={styles.empty}>No open tabs</div>
      </div>
    )
  }

  return (
    <div className={styles.workspace} aria-label={ariaLabel} onKeyDown={handleKeyDown}>
      <div className={styles.workspaceContent}>
        {rootChildren.map((id) => (
          <WorkspaceNode key={id} nodeId={id} data={data} onChange={onChange} renderPanel={renderPanel} />
        ))}
      </div>
    </div>
  )
}
