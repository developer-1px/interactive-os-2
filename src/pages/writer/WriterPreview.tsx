// ② 2026-04-04-md-writer-prd.md
import React from 'react'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { ax } from '@styles/ax'

interface WriterPreviewProps {
  data: NormalizedData
}

export default function WriterPreview({ data }: WriterPreviewProps) {
  const docIds = data.relationships[ROOT_ID] ?? []
  if (docIds.length === 0) return <div className={ax({ padding: 'lg', text: 'secondary' })}>Empty document</div>

  const docId = docIds[0]

  function renderNode(nodeId: string): React.ReactNode {
    const entity = data.entities[nodeId]
    if (!entity?.data) return null
    const d = entity.data as Record<string, unknown>

    const children = data.relationships[nodeId] ?? []

    if (d.type === 'heading') {
      const Tag = `h${d.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <React.Fragment key={nodeId}>
          <Tag>{d.content as string}</Tag>
          {children.map(childId => renderNode(childId))}
        </React.Fragment>
      )
    }

    if (d.type === 'paragraph') {
      return <p key={nodeId}>{d.content as string}</p>
    }

    return children.map(childId => renderNode(childId))
  }

  const docChildren = data.relationships[docId] ?? []

  return (
    <article className={ax({ padding: 'lg' })}>
      {docChildren.map(childId => renderNode(childId))}
    </article>
  )
}
