/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TextCell } from './TextCell'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'text-cell',
  category: 'cell' as const,
  label: 'TextCell',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <TextCell>Default aligned</TextCell>
      <TextCell align="center">Center aligned</TextCell>
      <TextCell align="end">End aligned</TextCell>
    </div>
  )
}
