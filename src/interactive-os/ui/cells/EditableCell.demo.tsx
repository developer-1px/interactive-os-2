/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { EditableCell } from './EditableCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'editable-cell',
  category: 'cell' as const,
  label: 'EditableCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <EditableCell field="title">Sample text</EditableCell>
      <EditableCell field="title" empty>empty</EditableCell>
    </div>
  )
}
