/** @catalog 상태·카운트 라벨 뱃지 */
import { ax } from '@styles/ax'
import type { Axes } from '@styles/ax'

interface BadgeProps {
  tone?: Axes['tone']
  variant?: 'solid' | 'outline'
  children: React.ReactNode
}

export function Badge({ tone = 'neutral', variant = 'solid', children }: BadgeProps) {
  return (
    <span
      className={ax({
        recipe: 'badge',
        surface: variant === 'solid' ? 'action' : 'ghost',
        tone,
        text: variant === 'solid' ? 'bright' : 'primary',
        border: variant === 'outline' ? 'default' : undefined,
        padding: 'xs',
        gap: 'xs',
        shape: 'pill',
        layout: 'row',
        content: 'text',
        clamp: '1',
      })}
    >
      {children}
    </span>
  )
}
