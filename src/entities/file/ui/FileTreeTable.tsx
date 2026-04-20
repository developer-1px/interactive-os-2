/** @catalog 파일 트리 테이블 — Finder 리스트 뷰 (row-focus, 다컬럼) */
import React from 'react'
import type { NormalizedData } from '@os/store/types'
import { TreeTable } from '@os/ui/TreeTable'
import { FileIcon } from '@os/ui/FileIcon'
import { SymlinkIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'

export type FileTableSortKey = 'name' | 'kind' | 'date' | 'loc'
export type FileTableSortDir = 'asc' | 'desc'

interface FileTreeTableProps {
  data: NormalizedData
  onChange?: (data: NormalizedData) => void
  sortKey?: FileTableSortKey
  sortDir?: FileTableSortDir
  onSort?: (key: FileTableSortKey) => void
}

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'kind', header: 'Kind', width: '120px' },
  { key: 'date', header: 'Date Modified', width: '170px' },
  { key: 'loc', header: 'LOC', width: '80px' },
]

const dimCell = ax({ role: 'badge', surface: 'ghost', textStyle: 'caption', tone: 'neutral-dim' })

function formatDate(mtime: number | undefined): string {
  if (mtime == null) return ''
  const d = new Date(mtime)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

function getExt(name: string): string {
  if (!name.includes('.')) return ''
  return (name.split('.').pop() ?? '').toUpperCase()
}

const renderCell = (
  value: unknown,
  col: { key: string },
  state: { expanded?: boolean },
  data?: Record<string, unknown>,
): React.ReactNode => {
  const name = (data?.name as string) ?? ''
  const type = (data?.type as string) ?? 'file'
  const symlink = Boolean(data?.symlink)
  const target = data?.target as string | undefined
  switch (col.key) {
    case 'name':
      return (
        <>
          <FileIcon name={name} type={type} expanded={state.expanded} />
          <span className={ax({ clamp: '1' })}>{name}</span>
          {symlink && <SymlinkIndicator target={target} className={dimCell} />}
        </>
      )
    case 'kind':
      return <span className={dimCell}>{type === 'directory' ? 'Folder' : getExt(name)}</span>
    case 'date':
      return <span className={dimCell}>{formatDate(data?.mtime as number | undefined)}</span>
    case 'loc':
      return <span className={dimCell}>{value != null && value !== '' ? String(value) : ''}</span>
    default:
      return <span className={dimCell}>{String(value ?? '')}</span>
  }
}

export function FileTreeTable({ data, onChange, sortKey, sortDir, onSort }: FileTreeTableProps) {
  return (
    <TreeTable
      data={data}
      onChange={onChange}
      columns={COLUMNS}
      header
      sortKey={sortKey}
      sortDir={sortDir}
      onSortColumn={onSort ? (k) => onSort(k as FileTableSortKey) : undefined}
      renderCell={renderCell}
      aria-label="File browser"
    />
  )
}
