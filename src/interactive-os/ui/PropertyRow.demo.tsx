/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { PropertyRow } from './PropertyRow'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'property-row',
  category: 'ui',
  label: 'PropertyRow',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'stack', gap: 'sm' })}>
      <PropertyRow label="Name" description="Display name">
        <span className={ax({ text: 'secondary' })}>Aria OS</span>
      </PropertyRow>
      <PropertyRow label="Version">
        <span className={ax({ text: 'secondary' })}>2.4.1</span>
      </PropertyRow>
      <PropertyRow label="Status" description="Current deploy status">
        <span className={ax({ text: 'secondary' })}>Active</span>
      </PropertyRow>
    </div>
  )
}
