// ② 2026-03-27-chat-module-prd.md
import type { ChatBlock } from './types'
import styles from './FallbackBlock.module.css'

/** Fallback renderer for unregistered block types. Prevents crash (OCP safety net). */
export function FallbackBlock({ block }: { block: ChatBlock }) {
  return (
    <div className={styles.fallback}>
      <em>Unknown block: {block.type}</em>
    </div>
  )
}
