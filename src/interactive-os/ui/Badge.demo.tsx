/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Badge } from './Badge'

export const meta = {
  slug: 'badge',
  category: 'ui' as const,
  label: 'Badge',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row' })}>
      <Badge>Default</Badge>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="danger">Danger</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="outline" tone="accent">Outline Accent</Badge>
    </div>
  )
}
