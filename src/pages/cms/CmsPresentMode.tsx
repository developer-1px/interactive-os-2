import { useMemo } from 'react'
import { ImageOff } from 'lucide-react'
import cmsStyles from './CmsLanding.module.css'
import { getChildren } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { Locale } from './cmsTypes'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cmsRenderers'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { ax } from '@styles/ax'

interface CmsPresentModeProps {
  data: NormalizedData
  locale: Locale
  onExit: () => void
}

export default function CmsPresentMode({ data, locale, onExit }: CmsPresentModeProps) {
  const keyMap = useMemo(() => ({
    Escape: defineRouteKey('present:exit', () => onExit(), 'PresentMode'),
  }), [onExit])

  function renderNode(nodeId: string): React.ReactNode {
    const entity = data.entities[nodeId]
    if (!entity) return null
    const d = (entity.data ?? {}) as Record<string, string>

    // Present mode: shy placeholder for empty image nodes
    if (d.type === 'hero-image' && !d.src) {
      return <div key={nodeId} className={`${cmsStyles.cmsPresentShyPlaceholder} ${ax({ layout: 'center' })} opacity-dim`}><ImageOff size={16} /></div>
    }
    if (d.type === 'gallery-item' && !d.image) {
      const galleryChildren = getChildren(data, nodeId)
      return (
        <div key={nodeId} className={getNodeClassName(d)}>
          <div className={ax({ layout: 'stack' })}>
            <div className={`${cmsStyles.cmsPresentShyPlaceholderSmall} ${ax({ layout: 'center' })} opacity-faint`}><ImageOff size={14} /></div>
            {galleryChildren.map(id => renderNode(id))}
          </div>
        </div>
      )
    }
    const children = getChildren(data, nodeId)
    const className = getNodeClassName(d)
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
    <AriaRoute keyMap={keyMap} label="Present Mode">
      <div
        className={`cms-present fixed inset-0 ${ax({ scroll: 'y', surface: 'base' })} cursor-pointer`}
        onClick={onExit}
      >
        <div className={`cms-landing ${cmsStyles.cmsLanding} w-full overflow-x-hidden`}>
          {getChildren(data, ROOT_ID).map(id => renderNode(id))}
        </div>
      </div>
    </AriaRoute>
  )
}
