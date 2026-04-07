/** @catalog 진행률 표시 바 */
import { ax } from '@styles/ax'
import type { Axes } from '@styles/ax'
import styles from './Progress.module.css'

interface ProgressProps {
  value: number
  tone?: Axes['tone']
  'aria-label'?: string
}

export function Progress({ value, tone = 'accent', 'aria-label': ariaLabel }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={ax({ surface: 'sunken', shape: 'pill', width: 'full', size: 'xs', scroll: 'hidden' })}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={`${ax({ surface: 'action', tone, shape: 'pill', size: 'xs' })} ${styles.fill}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
