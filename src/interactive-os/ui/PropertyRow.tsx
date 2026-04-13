/** @catalog 키-값 속성 행 */
import type { ReactNode } from 'react'

import { ax } from '@styles/ax'

interface PropertyRowProps {
  label: string
  description?: string
  children: ReactNode
}

export function PropertyRow({ label, description, children }: PropertyRowProps) {
  return (
    <div className={ax({ recipe: 'item', layout: 'spread', padding: 'sm', gap: 'sm', shape: '2xs', width: 'full' })}>
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'body', text: 'primary', weight: 'medium' })}>{label}</span>
        {description && (
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>{description}</span>
        )}
      </div>
      {children}
    </div>
  )
}
