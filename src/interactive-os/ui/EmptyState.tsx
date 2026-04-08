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
    <div className={`${ax({ layout: 'stack', gap: 'md', padding: 'xl' })} text-center`}>
      {icon && <div className={ax({ text: 'muted', icon: 'lg', layout: 'center', flex: 'none' })}>{icon}</div>}
      <div className={ax({ textStyle: 'section', text: 'primary', layout: 'self-center' })}>{title}</div>
      {description && <div className={ax({ textStyle: 'body', text: 'muted', layout: 'self-center' })}>{description}</div>}
      {action && (
        <Button variant="accent" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
