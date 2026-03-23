import { useCallback } from 'react'
import cmsStyles from '../PageVisualCms.module.css'
import { getChildren } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { Locale } from './cms-types'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'

interface CmsPresentModeProps {
  data: NormalizedData
  locale: Locale
  onExit: () => void
}

export default function CmsPresentMode({ data, locale, onExit }: CmsPresentModeProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onExit() }
  }, [onExit])

  function renderNode(nodeId: string): React.ReactNode {
    const entity = data.entities[nodeId]
    if (!entity) return null
    const d = (entity.data ?? {}) as Record<string, string>
    const children = getChildren(data, nodeId)
    const className = getNodeClassName(d, { focused: false, selected: false, expanded: false, level: 0, disabled: false })
    const Tag = getNodeTag(d)

    if (d.type === 'section') {
      const containerClass = getChildrenContainerClassName(d)
      const headerIds: string[] = []
      const contentIds: string[] = []
      for (const childId of children) {
        const childData = (data.entities[childId]?.data ?? {}) as Record<string, string>
        if (HEADER_TYPES.has(childData.type)) headerIds.push(childId)
        else contentIds.push(childId)
      }
      return (
        <Tag key={nodeId} className={className}>
          {headerIds.map(id => renderNode(id))}
          {containerClass && contentIds.length > 0 ? (
            <div className={containerClass}>{contentIds.map(id => renderNode(id))}</div>
          ) : contentIds.map(id => renderNode(id))}
        </Tag>
      )
    }

    if (d.type === 'card') {
      return (
        <div key={nodeId} className={className}>
          {children.map(id => renderNode(id))}
        </div>
      )
    }

    return (
      <Tag key={nodeId} className={className || undefined}>
        <NodeContent data={d} locale={locale} />
        {children.length > 0 && children.map(id => renderNode(id))}
      </Tag>
    )
  }

  return (
    <div className="cms-present" onClick={onExit} onKeyDown={handleKeyDown}>
      <div className={cmsStyles.cmsLanding}>
        {getChildren(data, ROOT_ID).map(id => renderNode(id))}
      </div>
    </div>
  )
}
