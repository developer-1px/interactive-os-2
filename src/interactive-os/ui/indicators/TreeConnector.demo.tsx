/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { TreeConnector } from './TreeConnector'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'tree-connector',
  category: 'indicator' as const,
  label: 'TreeConnector',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'bar' })}>
      <TreeConnector level={1} />
      <TreeConnector level={2} />
      <TreeConnector level={2} isLast />
    </div>
  )
}
