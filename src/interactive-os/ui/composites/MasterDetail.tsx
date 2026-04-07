// ② 2026-04-08-a2ui-composites-prd.md
import type { A2UIRenderContext } from '../a2uiComponentMap'
import { ax } from '@styles/ax'

export function masterDetailRenderer({ entity, renderNode, depth }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const masterId = d.master as string | undefined
  const detailId = d.detail as string | undefined

  if (!masterId && !detailId) return null

  if (!detailId) {
    return (
      <div className={ax({ layout: 'stack', gap: 'md' })}>
        {masterId && renderNode(masterId, depth + 1)}
      </div>
    )
  }

  return (
    <div className={ax({ layout: 'row', gap: 'lg' })}>
      <div className={ax({ flex: '1' })}>
        {masterId && renderNode(masterId, depth + 1)}
      </div>
      <div className={ax({ surface: 'display', padding: 'md', shape: 'md', flex: '1' })}>
        {renderNode(detailId, depth + 1)}
      </div>
    </div>
  )
}
