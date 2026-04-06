// @useState-hatch — scopePath is view-only navigation state, not OS data
import { useState, useMemo } from 'react'
import { ax } from '@styles/ax'
import { type NormalizedData, ROOT_ID } from '@os/store/types'
import { getChildren, getEntity } from '@os/store/createStore'
import { MermaidBlock } from '../../pages/showcase/MermaidBlock'
import type { HeadingData, SentenceData } from './writerSchema'

// ── helpers ──

function isHeading(data: NormalizedData, id: string): boolean {
  return getEntity(data, id)?.data?.type === 'heading'
}

function isSentenceOrListItem(data: NormalizedData, id: string): boolean {
  const type = getEntity(data, id)?.data?.type
  return type === 'sentence' || type === 'listItem'
}

/** Count all sentence/listItem descendants recursively */
function countLeaves(data: NormalizedData, id: string): number {
  let count = 0
  for (const childId of getChildren(data, id)) {
    if (isSentenceOrListItem(data, childId)) count++
    count += countLeaves(data, childId)
  }
  return count
}

/** Get direct heading children of a node */
function getHeadingChildren(data: NormalizedData, parentId: string): string[] {
  const result: string[] = []
  for (const childId of getChildren(data, parentId)) {
    if (isHeading(data, childId)) {
      result.push(childId)
    }
  }
  return result
}

/** Get all non-heading leaf content under a node */
function getLeafContent(data: NormalizedData, parentId: string): string[] {
  const result: string[] = []
  for (const childId of getChildren(data, parentId)) {
    const entity = getEntity(data, childId)
    const type = entity?.data?.type
    if (type === 'sentence' || type === 'listItem') {
      result.push(childId)
    } else if (type !== 'heading') {
      result.push(...getLeafContent(data, childId))
    }
  }
  return result
}

/** Count sentences by role under a subtree */
function countByRole(data: NormalizedData, id: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const walk = (nodeId: string) => {
    const entity = getEntity(data, nodeId)
    if (entity?.data?.type === 'sentence') {
      const role = (entity.data as SentenceData).role ?? 'none'
      counts[role] = (counts[role] ?? 0) + 1
    }
    for (const childId of getChildren(data, nodeId)) {
      walk(childId)
    }
  }
  walk(id)
  return counts
}

// ── storeToMermaid ──

export function storeToMermaid(data: NormalizedData): string {
  const lines: string[] = ['graph TD']
  const edges: string[] = []

  const walk = (parentId: string) => {
    for (const childId of getChildren(data, parentId)) {
      const entity = getEntity(data, childId)
      if (entity?.data?.type === 'heading') {
        const hd = entity.data as HeadingData
        const leafCount = countLeaves(data, childId)
        const safe = hd.content.replace(/"/g, '#quot;')
        lines.push(`  ${childId}["${safe} (${leafCount})"]`)
        if (isHeading(data, parentId)) {
          edges.push(`  ${parentId} --> ${childId}`)
        }
        walk(childId)
      } else {
        walk(childId)
      }
    }
  }

  const rootChildren = getChildren(data, ROOT_ID)
  for (const docId of rootChildren) {
    walk(docId)
  }

  return [...lines, ...edges].join('\n')
}

// ── PyramidView ──

export function PyramidView({ data }: { data: NormalizedData }) {
  const [scopePath, setScopePath] = useState<string[]>([])

  const mermaidCode = useMemo(() => storeToMermaid(data), [data])

  const docId = useMemo(() => {
    const rootChildren = getChildren(data, ROOT_ID)
    return rootChildren.find((id) => getEntity(data, id)?.data?.type === 'document') ?? rootChildren[0] ?? ROOT_ID
  }, [data])

  const currentParentId = scopePath.length > 0 ? scopePath[scopePath.length - 1] : docId

  const headingChildren = useMemo(
    () => getHeadingChildren(data, currentParentId),
    [data, currentParentId],
  )

  const isLeaf = headingChildren.length === 0
  const leafContentIds = useMemo(
    () => isLeaf ? getLeafContent(data, currentParentId) : [],
    [data, currentParentId, isLeaf],
  )

  const breadcrumbs = useMemo(() => {
    const items: { id: string; label: string }[] = [{ id: '', label: 'Document' }]
    for (const id of scopePath) {
      const entity = getEntity(data, id)
      const hd = entity?.data as HeadingData | undefined
      items.push({ id, label: hd?.content ?? id })
    }
    return items
  }, [data, scopePath])

  return (
    <div className={ax({ layout: 'stack', gap: 'md', padding: 'md' })}>
      {/* Mermaid overview */}
      <div className={ax({ surface: 'display', padding: 'md', shape: 'md' })}>
        <MermaidBlock code={mermaidCode} />
      </div>

      {/* Breadcrumb — click any segment to navigate back */}
      <nav className={ax({ layout: 'row', gap: 'xs', padding: 'sm' })}>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.id + i}>
            {i > 0 && <span className={ax({ text: 'muted' })}> {'>'} </span>}
            <button
              type="button"
              className={ax({ surface: 'ghost', textStyle: 'caption', text: i === breadcrumbs.length - 1 ? 'primary' : 'secondary' })}
              onClick={() => {
                if (i === 0) setScopePath([])
                else setScopePath(scopePath.slice(0, i))
              }}
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </nav>

      {/* Cards or leaf content */}
      {isLeaf ? (
        <div className={ax({ layout: 'stack', gap: 'sm', padding: 'md' })}>
          {leafContentIds.map((id) => {
            const entity = getEntity(data, id)
            const content = (entity?.data as { content?: string })?.content ?? ''
            return (
              <div key={id} className={ax({ surface: 'display', padding: 'sm', shape: 'sm' })}>
                <p className={ax({ textStyle: 'body', text: 'primary' })}>{content}</p>
              </div>
            )
          })}
          {leafContentIds.length === 0 && (
            <p className={ax({ tone: 'danger', textStyle: 'caption' })}>No content under this heading</p>
          )}
        </div>
      ) : (
        <div className={ax({ layout: 'row', gap: 'md', padding: 'md' })}>
          {headingChildren.map((id) => {
            const entity = getEntity(data, id)
            const hd = entity?.data as HeadingData
            const leafCount = countLeaves(data, id)
            const roles = countByRole(data, id)
            const hasContent = leafCount > 0

            return (
              <button
                key={id}
                type="button"
                className={ax({ surface: 'overlay', padding: 'md', gap: 'sm', layout: 'stack', shape: 'md', interactive: 'item' })}
                onClick={() => setScopePath([...scopePath, id])}
              >
                <span className={ax({ textStyle: hd.level <= 2 ? 'section' : 'label', text: 'primary' })}>
                  {hd.content}
                </span>
                <span className={ax({ textStyle: 'caption', tone: hasContent ? 'success' : 'danger' })}>
                  {leafCount} sentence{leafCount !== 1 ? 's' : ''}
                </span>
                {Object.keys(roles).length > 0 && (
                  <span className={ax({ textStyle: 'caption', text: 'muted' })}>
                    {Object.entries(roles).map(([role, count]) => `${role}: ${count}`).join(', ')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
