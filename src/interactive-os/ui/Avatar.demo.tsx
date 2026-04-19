/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { ax } from '@styles/ax'
import { Avatar } from './Avatar'

export const meta = {
  slug: 'avatar',
  category: 'ui' as const,
  label: 'Avatar',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'row' })}>
      <Avatar name="Alice Kim" size="sm" />
      <Avatar name="Bob Park" size="md" />
      <Avatar name="Charlie Lee" size="lg" />
    </div>
  )
}
