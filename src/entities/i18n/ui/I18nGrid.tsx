import React from 'react'
import { Grid } from '@os/ui/Grid'
import type { NormalizedData } from '@os/schema'
import type { Plugin, KeyHandler } from '@os/advanced'
import { EditableCell, SearchableCell } from '@os/ui/cells'

interface I18nGridProps {
  data: NormalizedData
  columns: { key: string; header: string; width?: string }[]
  plugins: Plugin[]
  initialColIndex?: number
  keyMap?: Record<string, KeyHandler>
  onChange: (next: NormalizedData) => void
  searchPortalTarget?: React.RefObject<HTMLElement | null>
  'aria-label'?: string
}

export function I18nGrid({ data, columns, plugins, initialColIndex = 1, keyMap, onChange, searchPortalTarget, 'aria-label': ariaLabel }: I18nGridProps) {
  const dataRef = React.useRef(data)
  React.useEffect(() => { dataRef.current = data })

  const renderCell = (_props: React.HTMLAttributes<HTMLElement>, value: unknown, column: { key: string }) => {
    const text = String(value ?? '')
    const isKey = column.key === 'key'
    const isEmpty = text === '' && !isKey
    const colIdx = columns.findIndex(c => c.key === column.key)
    const focusedCol = (dataRef.current.entities['__grid_col__']?.colIndex as number) ?? initialColIndex
    const isActiveCell = !isKey && colIdx === focusedCol

    if (isActiveCell) {
      return (
        <EditableCell field={`cells.${colIdx}`} allowEmpty enterContinue tabContinue empty={isEmpty}>
          {text}
        </EditableCell>
      )
    }
    return (
      <SearchableCell empty={isEmpty} muted={isKey}>
        {text}
      </SearchableCell>
    )
  }

  return (
    <Grid
      data={data}
      columns={columns}
      plugins={plugins}
      initialColIndex={initialColIndex}
      keyMap={keyMap}
      onChange={onChange}
      enableEditing
      searchable
      searchPortalTarget={searchPortalTarget}
      tabCycle
      renderCell={renderCell}
      aria-label={ariaLabel}
      header
    />
  )
}
