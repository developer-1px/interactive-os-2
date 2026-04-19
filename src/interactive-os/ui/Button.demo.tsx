/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Button } from './Button'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'button',
  category: 'ui',
  label: 'Button',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row' })}>
      <Button variant="accent">Accent</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="dialog">Dialog</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  )
}
