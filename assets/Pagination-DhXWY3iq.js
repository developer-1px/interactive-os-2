var e=`/** @catalog 페이지 번호 네비게이션 */
import React from 'react'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { ROOT_ID } from '../store/types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import { PaginationItem } from './items/PaginationItem'

const toolbarPattern = toolbar()

interface PaginationProps {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  siblingCount?: number
  'aria-label'?: string
}

function buildPageRange(totalPages: number, currentPage: number, siblingCount: number): Array<{ id: string; kind: string; page?: number }> {
  const items: Array<{ id: string; kind: string; page?: number }> = []

  items.push({ id: 'prev', kind: 'prev' })

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)

  const lo = Math.max(2, currentPage - siblingCount)
  const hi = Math.min(totalPages - 1, currentPage + siblingCount)
  for (let i = lo; i <= hi; i++) pages.add(i)

  const sorted = Array.from(pages).sort((a, b) => a - b)
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) {
      items.push({ id: \`ellipsis-\${prev}\`, kind: 'ellipsis' })
    }
    items.push({ id: \`page-\${p}\`, kind: 'page', page: p })
    prev = p
  }

  items.push({ id: 'next', kind: 'next' })
  return items
}

function toNormalizedData(items: Array<{ id: string; kind: string; page?: number }>, currentPage: number, totalPages: number): NormalizedData {
  const entities: NormalizedData['entities'] = {
    [ROOT_ID]: { id: ROOT_ID, childIds: [] as string[] },
  }
  const rootChildren: string[] = []

  for (const item of items) {
    rootChildren.push(item.id)
    entities[item.id] = {
      id: item.id,
      data: {
        label: item.kind === 'prev' ? 'Previous' : item.kind === 'next' ? 'Next' : item.kind === 'ellipsis' ? '...' : String(item.page),
        kind: item.kind,
        page: item.page,
        current: item.kind === 'page' && item.page === currentPage,
        disabled: (item.kind === 'prev' && currentPage <= 1) || (item.kind === 'next' && currentPage >= totalPages) || item.kind === 'ellipsis',
      },
    }
  }
  ;(entities[ROOT_ID] as Record<string, unknown>).childIds = rootChildren
  return { entities, relationships: { [ROOT_ID]: rootChildren } }
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement =>
  PaginationItem(props, item, state)

export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  siblingCount = 1,
  'aria-label': ariaLabel = 'Pagination',
}: PaginationProps) {
  const items = React.useMemo(
    () => buildPageRange(totalPages, currentPage, siblingCount),
    [totalPages, currentPage, siblingCount],
  )

  const data = React.useMemo(
    () => toNormalizedData(items, currentPage, totalPages),
    [items, currentPage, totalPages],
  )

  const handleActivate = React.useCallback((nodeId: string) => {
    const entity = data.entities[nodeId]
    if (!entity) return
    const nodeData = entity.data as Record<string, unknown>
    if (nodeData.disabled) return
    if (nodeData.kind === 'prev') {
      onPageChange(currentPage - 1)
    } else if (nodeData.kind === 'next') {
      onPageChange(currentPage + 1)
    } else if (nodeData.kind === 'page' && typeof nodeData.page === 'number') {
      onPageChange(nodeData.page)
    }
  }, [data, currentPage, onPageChange])

  if (totalPages <= 1) return null

  return (
    <nav aria-label={ariaLabel}>
      <Aria
        pattern={toolbarPattern}
        data={data}
        plugins={[]}
        onActivate={handleActivate}
        aria-label={ariaLabel}
      >
        <Aria.Item render={defaultRenderItem} />
      </Aria>
    </nav>
  )
}
`;export{e as default};