/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SpreadReader } from './SpreadReader'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'spread-reader',
  category: 'ui',
  label: 'SpreadReader',
}

export function Demo() {
  return (
    <div className={ax({ layout: 'column', gap: 'md' })}>
      <SpreadReader>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.</p>
      </SpreadReader>
    </div>
  )
}
