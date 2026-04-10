/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { RouteModal } from './RouteModal'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'route-modal',
  category: 'ui',
  label: 'RouteModal',
}

export function Demo() {
  return (
    <RouteModal active label="Demo Modal">
      <div className={ax({ layout: 'center', padding: 'lg', text: 'primary', textStyle: 'body' })}>
        Modal content area
      </div>
    </RouteModal>
  )
}
