// ② 2026-04-14
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { StepIndicator } from '../indicators'

export interface StepperItemOptions {
  orientation?: 'horizontal' | 'vertical'
}

export function StepperItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: StepperItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  const data = node.data as Record<string, unknown> | undefined
  const step = (data?.step as number) ?? 1
  const completed = (data?.completed as boolean) ?? false
  const description = data?.description as string | undefined
  const { orientation = 'horizontal' } = options ?? {}

  const isActive = state.selected
  const isVertical = orientation === 'vertical'

  return (
    <div
      {...props}
      className={ax({
        role: 'item',
        interactive: 'item',
        layout: isVertical ? 'stack' : 'bar',
        gap: 'xs',
        text: isActive ? 'primary' : completed ? 'secondary' : 'muted',
      })}
    >
      <span className={ax({ layout: isVertical ? 'bar' : 'stack', gap: 'xs', content: 'text' })}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}>
          <StepIndicator step={step} completed={completed} />
          <span className={ax({ clamp: '1' })}>{label}</span>
        </span>
        {description && (
          <span className={ax({ textStyle: 'caption', text: 'muted', clamp: '1' })}>{description}</span>
        )}
      </span>
    </div>
  )
}
