var e=`// ② 2026-04-14
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
      className={\`\${ax({
        role: 'item',
        interactive: 'item',
        layout: isVertical ? 'stack' : 'bar',
      })} \${ax.raw({ gap: 'xs', text: isActive ? 'primary' : completed ? 'secondary' : 'muted' })}\`}
    >
      <span className={\`\${ax({ layout: isVertical ? 'bar' : 'stack', content: 'text' })} \${ax.raw({ gap: 'xs' })}\`}>
        <span className={\`\${ax({ layout: 'bar' })} \${ax.raw({ gap: 'xs' })}\`}>
          <StepIndicator step={step} completed={completed} />
          <span className={ax({ clamp: '1' })}>{label}</span>
        </span>
        {description && (
          <span className={\`\${ax({ textStyle: 'caption', clamp: '1' })} \${ax.raw({ text: 'muted' })}\`}>{description}</span>
        )}
      </span>
    </div>
  )
}
`;export{e as default};