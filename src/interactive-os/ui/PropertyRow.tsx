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
    <div className={ax({ role: 'item', content: 'text', layout: 'spread', width: 'full' })}>
      <div className={ax({ layout: 'stack' })}>
        <span className={ax({  })}>{label}</span>
        {description && (
          <span className={ax({  })}>{description}</span>
        )}
      </div>
      {children}
    </div>
  )
}
