// ② cmux-layout-prd — external focus sync.
import { ax } from '@styles/ax'
import type { NormalizedData } from '../../store/types'
import { ROOT_ID } from '../../store/types'
import { getChildren, getEntityData } from '../../store/createStore'
import { workspaceCommands } from '../../plugins/workspaceStore'
import { Button } from '../../ui/Button'
import { WorkspaceTabList } from '../../ui/WorkspaceTabList'
import { defineLayoutNode } from '../defineLayoutNode'
import { layoutCommands, FOCUS_STATE_ID, type FocusStateData } from '../layoutCommands'
import type { TabgroupNode, TabNode } from '../flatLayout'
import styles from '../../ui/FlatLayout.module.css'

defineLayoutNode('tabgroup', {
  isAppRoot: true,
  render: ({ nodeId, store, renderNode, refCallback, dispatch }) => {
    const node = getEntityData<TabgroupNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    if (childIds.length === 0) return null
    const activeTabId = node.activeTabId && childIds.includes(node.activeTabId)
      ? node.activeTabId
      : childIds[0]!

    const focusState = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
    const isFocused = focusState?.focusedTabgroupId === nodeId

    // useAria는 data.entities[FOCUS_ID]가 있을 때만 external focus 변경을 전파한다.
    // activeTabId가 런타임에 바뀌면 내부 WorkspaceTabList의 focus/selection이 따라가야
    // aria-selected가 재그려진다 (⌘T, ⌘⇧] 등).
    const tabBarStore: NormalizedData = {
      entities: {
        ...Object.fromEntries(
          childIds.map(id => [id, { id, data: getEntityData(store, id) }])
        ),
        __focus__: { id: '__focus__', focusedId: activeTabId } as unknown as NormalizedData['entities'][string],
      },
      relationships: { [ROOT_ID]: childIds },
    }

    return (
      <div
        ref={refCallback(nodeId)}
        className={`${ax({ layout: 'stack', width: 'full', flex: '1' })} ${styles.tabgroupRoot}`}
        data-tabgroup-focused={isFocused || undefined}
        onPointerDownCapture={() => dispatch(layoutCommands.setFocus(nodeId, activeTabId))}
      >
        <div className={ax({ layout: 'bar', width: 'full' })}>
          <div className={ax({ flex: '1' })}>
            <WorkspaceTabList
              data={tabBarStore}
              initialFocus={activeTabId}
              onActivate={(tabId) => {
                dispatch(workspaceCommands.setActiveTab(nodeId, tabId))
                dispatch(layoutCommands.setFocus(nodeId, tabId))
              }}
              aria-label={`Tabgroup ${nodeId}`}
            />
          </div>
          <Button
            icon
            aria-label="New tab"
            onClick={() => {
              // active tab을 복제 — splitHere와 동일 규약.
              const src = getEntityData<TabNode>(store, activeTabId)
              if (!src) return
              const newId = `t-${Date.now().toString(36)}`
              dispatch(workspaceCommands.addTab(nodeId, {
                id: newId,
                data: {
                  type: 'tab',
                  label: src.label,
                  contentType: src.contentType,
                  contentRef: src.contentRef,
                },
              }))
              dispatch(workspaceCommands.setActiveTab(nodeId, newId))
            }}
          >+</Button>
        </div>
        {renderNode(activeTabId, 'tabgroup')}
      </div>
    )
  },
})
