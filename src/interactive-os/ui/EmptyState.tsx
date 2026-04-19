/** @catalog 빈 상태 표시 */
import type React from 'react'
import { ax } from '@styles/ax'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={`${ax({ layout: 'stack' })} text-center`}>
      {icon && <div className={ax({ layout: 'center', flex: 'none' })}>{icon}</div>}
      <div className={ax({ textStyle: 'section', layout: 'self-center' })}>{title}</div>
      {description && <div className={ax({ textStyle: 'body', layout: 'self-center' })}>{description}</div>}
      {action && (
        <Button variant="accent" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
