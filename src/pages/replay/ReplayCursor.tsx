// ② 2026-04-03-replay-edit-animation-prd.md
import { memo } from 'react'
import styles from './ReplayCursor.module.css'

/**
 * Blinking cursor overlay positioned at a specific line in CodeBlock.
 * Positioned absolute over the code container.
 */
export const ReplayCursor = memo(function ReplayCursor({ line }: { line: number }) {
  // line is 1-indexed; CodeBlock uses CSS counter starting at 1
  // Each line height ≈ var(--leading-code) * var(--type-code-size)
  // We use em units relative to the code font size
  const top = `calc(var(--space-lg) + ${(line - 1)} * var(--leading-code) * 1em)`

  return (
    <div
      className={styles.cursor}
      style={{ top, left: 'calc(3.5em + 1em + 2px)' }}
    />
  )
})
