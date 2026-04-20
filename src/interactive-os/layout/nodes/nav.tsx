/* eslint-disable react-refresh/only-export-components */
import React, { useMemo } from 'react'
import { ax } from '@styles/ax'
import { getChildren, getEntityData } from '../../store/createStore'
import { NavLayoutContext } from '../../ui/NavLayoutContext'
import { defineLayoutNode } from '../defineLayoutNode'
import type { NavNode } from '../flatLayout'
import styles from '../../ui/FlatLayout.module.css'

function NavLayoutWrapper({ nodeId, navId, contentIds, sidebarWidth, renderNode, refCallback }: {
  nodeId: string
  navId: string
  contentIds: string[]
  sidebarWidth: number
  renderNode: (id: string, parentType?: string) => React.ReactNode
  refCallback: (id: string) => (el: HTMLElement | null) => void
}) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const ctx = useMemo(() => ({ activeIndex, setActiveIndex }), [activeIndex])

  return (
    <NavLayoutContext.Provider value={ctx}>
      <div ref={refCallback(nodeId)} className={`${ax({ layout: 'row', width: 'full' })} ${styles.navRoot}`}>
        <div
          className={`${styles.splitPane} ${styles.navSidebar}`}
          style={{ '--split-flex': '0 0 auto', '--split-basis': `${sidebarWidth * 100}%` } as React.CSSProperties}
        >
          {renderNode(navId, 'nav')}
        </div>
        <div
          className={`${styles.splitPane} ${styles.navContent} ${ax({ })}`}
          style={{ '--split-flex': '1', '--split-basis': 'auto' } as React.CSSProperties}
        >
          {contentIds[activeIndex] ? renderNode(contentIds[activeIndex], 'nav') : null}
        </div>
      </div>
    </NavLayoutContext.Provider>
  )
}

defineLayoutNode('nav', {
  isAppRoot: true,
  fillsChildren: true,
  render: ({ nodeId, store, renderNode, refCallback }) => {
    const node = getEntityData<NavNode>(store, nodeId)
    if (!node) return null
    const childIds = getChildren(store, nodeId)
    if (childIds.length === 0) return null

    const navId = childIds[0]
    const contentIds = childIds.slice(1)
    const sidebarWidth = node.sidebarWidth ?? 0.2

    return (
      <NavLayoutWrapper
        nodeId={nodeId}
        navId={navId}
        contentIds={contentIds}
        sidebarWidth={sidebarWidth}
        renderNode={renderNode}
        refCallback={refCallback}
      />
    )
  },
})
