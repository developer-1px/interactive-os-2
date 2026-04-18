/** @catalog 파일 트리 그리드 — Name/Kind/LOC 3 column. FileIcon + sort 헤더 */
import React from 'react'
import type { NormalizedData } from '@os/store/types'
import { TreeGrid } from '@os/ui/TreeGrid'
import { FileIcon } from '@os/ui/FileIcon'
import { ax } from '@styles/ax'

export type FileSortKey = 'name' | 'type' | 'loc'
export type FileSortDir = 'asc' | 'desc'

interface FileTreeGridProps {
  data: NormalizedData
  onChange?: (data: NormalizedData) => void
  sortKey?: FileSortKey
  sortDir?: FileSortDir
  onSort?: (key: FileSortKey) => void
}

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'type', header: 'Kind', width: '120px' },
  { key: 'loc', header: 'LOC', width: '80px' },
]

const dimCell = ax({ role: 'badge', surface: 'ghost', textStyle: 'caption', tone: 'neutral-dim' })

const renderCell = (
  props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
  col: { key: string },
  state: { expanded?: boolean },
) => {
  if (col.key === 'name') {
    const v = value as { name: string; type: string }
    return (
      <>
        <FileIcon name={v.name} type={v.type} expanded={state.expanded} />
        <span {...props}>{v.name}</span>
      </>
    )
  }
  return <span className={dimCell} {...props}>{String(value ?? '')}</span>
}

export function FileTreeGrid({ data, onChange, sortKey, sortDir, onSort }: FileTreeGridProps) {
  return (
    <TreeGrid
      data={data}
      onChange={onChange}
      columns={COLUMNS}
      header
      sortKey={sortKey ?? undefined}
      sortDir={sortDir}
      onSortColumn={onSort ? (k) => onSort(k as FileSortKey) : undefined}
      renderCell={renderCell}
      aria-label="File browser"
    />
  )
}
