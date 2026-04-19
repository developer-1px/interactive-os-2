/** @catalog 진행률 표시 바 */
import { ax } from '@styles/ax'
import type { AxTone } from '@styles/ax'
import styles from './Progress.module.css'

interface ProgressProps {
  value: number
  tone?: AxTone
  'aria-label'?: string
}

export function Progress({ value, tone = 'accent', 'aria-label': ariaLabel }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={ax({
          role: 'control-group',
        surface: 'sunken', width: 'full' })}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={`${ax({
            role: 'control',
            surface: 'action', tone })} ${styles.fill}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
