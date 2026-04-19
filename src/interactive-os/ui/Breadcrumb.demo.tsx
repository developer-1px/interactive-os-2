/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Breadcrumb } from './Breadcrumb'

export const meta = {
  slug: 'breadcrumb',
  category: 'ui' as const,
  label: 'Breadcrumb',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack' })}>
      <Breadcrumb path="src/interactive-os/ui/Breadcrumb.tsx" root="src" />
      <Breadcrumb path="docs/guides/getting-started.md" root="docs" />
    </div>
  )
}
