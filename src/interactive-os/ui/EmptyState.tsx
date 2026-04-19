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
  // ② ax-p0-roles-prd (W9): role:'signal', surface:'ghost' 승격 판정 (a)
  //   — "데이터 없음"은 시스템→사용자 알림. signal role 공유, ghost variant로 평평한 표현.
  //   layout:'stack'은 .ly-stack이 .rl-signal의 row flex를 override (late-declared in same @layer).
  return (
    <div className={`${ax({ role: 'signal', surface: 'ghost', layout: 'stack' })} text-center`}>
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
