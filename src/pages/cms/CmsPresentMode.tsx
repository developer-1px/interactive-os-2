import { useEffect, useMemo, useRef } from 'react'
import cmsStyles from './CmsLanding.module.css'
import { getChildren } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { Command } from '../../interactive-os/engine/types'
import type { PatternContext } from '../../interactive-os/pattern/types'
import type { Locale } from './cms-types'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'
import { useAria } from '../../interactive-os/primitives/useAria'

const EMPTY_DATA: NormalizedData = { entities: {}, relationships: {} }

interface CmsPresentModeProps {
  data: NormalizedData
  locale: Locale
  onExit: () => void
}

export default function CmsPresentMode({ data, locale, onExit }: CmsPresentModeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const keyMap = useMemo((): Record<string, (ctx: PatternContext) => Command | void> => ({
    Escape: () => { onExit() },
    'Mod+\\': () => { onExit() },
  }), [onExit])

  const { containerProps } = useAria({
    data: EMPTY_DATA,
    keyMap,
  })

  // Present mode has no focusable content — autoFocus the container so keyMap catches Escape
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  function renderNode(nodeId: string): React.ReactNode {
    const entity = data.entities[nodeId]
    if (!entity) return null
    const d = (entity.data ?? {}) as Record<string, string>
    const children = getChildren(data, nodeId)
    const className = getNodeClassName(d, { focused: false, selected: false, expanded: false, level: 0, disabled: false, index: 0, siblingCount: 0 })
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
    <div
      className="cms-present"
      ref={containerRef}
      tabIndex={-1}
      onClick={onExit}
      {...(containerProps as React.HTMLAttributes<HTMLDivElement>)}
    >
      <div className={`cms-landing ${cmsStyles.cmsLanding}`}>
        {getChildren(data, ROOT_ID).map(id => renderNode(id))}
      </div>
    </div>
  )
}
