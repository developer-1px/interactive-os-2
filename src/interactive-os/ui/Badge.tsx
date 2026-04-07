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
        surface: variant === 'solid' ? 'action' : 'ghost',
        tone,
        shape: 'pill',
        textStyle: 'caption',
        text: variant === 'solid' ? 'bright' : 'primary',
        padding: 'xs',
        content: 'text',
        border: variant === 'outline' ? 'default' : undefined,
        weight: 'medium',
      })}
    >
      {children}
    </span>
  )
}
