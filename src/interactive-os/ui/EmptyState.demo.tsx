/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { EmptyState } from './EmptyState'

export const meta = {
  slug: 'empty-state',
  category: 'ui' as const,
  label: 'EmptyState',
}

export function Demo() {
  return (
    <EmptyState
      title="No items yet"
      description="Create your first item to get started."
      action={{ label: 'Create Item', onClick: () => {} }}
    />
  )
}
