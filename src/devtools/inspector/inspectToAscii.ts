// ② 2026-04-04-inspector-redesign-prd.md
import type { InspectResult } from '@os/engine/types'
import { ROOT_ID } from '@os/store/types'

/**
 * Render a single InspectResult as an ASCII ARIA tree — LLM-readable format.
 */
export function inspectToAscii(result: InspectResult): string {
  const { state, role, childRole } = result
  const { entities, relationships } = state

  const rootIds = relationships[ROOT_ID] ?? []
  if (rootIds.length === 0) return '(empty)'

  const lines: string[] = []
  const containerRole = role || 'group'
  lines.push(`[role=${containerRole}] container`)

  function walk(ids: string[], prefix: string) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!
      if (id.startsWith('__')) continue

      const isLast = i === ids.length - 1
      const connector = isLast ? '└─' : '├─'
      const childPrefix = isLast ? '   ' : '│  '

      const entity = entities[id]
      const label = (entity?.data as Record<string, unknown>)?.label as string | undefined
        ?? (entity?.data as Record<string, unknown>)?.title as string | undefined
        ?? (entity?.data as Record<string, unknown>)?.name as string | undefined

      const itemRole = childRole || 'item'
      const labelStr = label ? ` "${label}"` : ''

      lines.push(`${prefix}${connector} [role=${itemRole}]${labelStr}`)

      const children = (relationships[id] ?? []).filter(c => !c.startsWith('__'))
      if (children.length > 0) {
        walk(children, prefix + childPrefix)
      }
    }
  }

  walk(rootIds, '  ')
  return lines.join('\n')
}

/**
 * Copy ASCII tree to clipboard.
 */
export async function copyAriaTree(result: InspectResult): Promise<void> {
  const ascii = inspectToAscii(result)
  await navigator.clipboard.writeText(ascii)
}
