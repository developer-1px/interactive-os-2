import { useEffect, useMemo, useRef } from 'react'
import { getChildren } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { Locale } from './cmsTypes'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cmsRenderers'
import { AriaRoute } from '@os/primitives/AriaRoute'

interface CmsPresentModeProps {
  data: NormalizedData
  locale: Locale
  onExit: () => void
}

export default function CmsPresentMode({ data, locale, onExit }: CmsPresentModeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const keyMap = useMemo(() => ({
    Escape: () => { onExit() },
  }), [onExit])

  // Present mode has no focusable content — autoFocus the container so keyMap catches Escape
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  function renderNode(nodeId: string): React.ReactNode {
    const entity = data.entities[nodeId]
    if (!entity) return null
    const d = (entity.data ?? {}) as Record<string, string>
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
        className="cms-present fixed inset-0 overflow-y-auto cursor-pointer"
        ref={containerRef}
        tabIndex={-1}
        onClick={onExit}
      >
        <div className={`cms-landing w-full overflow-x-hidden`}>
          {getChildren(data, ROOT_ID).map(id => renderNode(id))}
        </div>
      </div>
    </AriaRoute>
  )
}
