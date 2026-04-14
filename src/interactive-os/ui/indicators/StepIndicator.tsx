// ② 2026-03-28-ui-indicators-prd.md
import { ax } from '@styles/ax'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  step: number
  completed?: boolean
  className?: string
}

export function StepIndicator({ step, completed, className }: StepIndicatorProps) {
  const classes = [
    `inline-flex ${ax({ layout: 'center', flex: 'none', border: 'subtle', shape: 'pill' })}`,
    'item-indicator--step',
    completed ? 'item-indicator--step-completed' : '',
    className,
  ].filter(Boolean).join(' ')
  const display = Math.max(1, step)
  return (
    <span className={classes}>
      {completed ? <Check size="1em" /> : display}
    </span>
  )
}
