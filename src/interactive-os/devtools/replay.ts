/**
 * Replay helper for vitest — feeds a Recording into a rendered component.
 *
 * Usage:
 *   const recording = { events: [...], ... }
 *   const { container } = render(<MyComponent />)
 *   const snapshots = await replay(container, recording)
 */
import userEvent from '@testing-library/user-event'
import type { Recording, RawEvent } from './recorder'

export interface ReplaySnapshot {
  afterEvent: RawEvent
  focusedNodeId: string | null
  activeElement: string
}

export async function replay(
  container: HTMLElement,
  recording: Recording,
): Promise<ReplaySnapshot[]> {
  const user = userEvent.setup()
  const snapshots: ReplaySnapshot[] = []

  for (const event of recording.events) {
    if (event.type === 'focus' && event.targetNodeId) {
      const el = container.querySelector(`[data-node-id="${event.targetNodeId}"]`) as HTMLElement
      el?.focus()
    } else if (event.type === 'keydown' && event.key) {
      const parts = event.key.split('+')
      const baseKey = parts.pop()!
      if (parts.length > 0) {
        const modOpen = parts.map(m => `{${m}>}`).join('')
        const modClose = parts.reverse().map(m => `{/${m}}`).join('')
        await user.keyboard(`${modOpen}{${baseKey}}${modClose}`)
      } else {
        await user.keyboard(`{${baseKey}}`)
      }
    } else if (event.type === 'click' && event.targetNodeId) {
      const el = container.querySelector(`[data-node-id="${event.targetNodeId}"]`) as HTMLElement
      if (el) await user.click(el)
    }

    const focusedEl = container.querySelector('[tabindex="0"][data-node-id]')
    snapshots.push({
      afterEvent: event,
      focusedNodeId: focusedEl?.getAttribute('data-node-id') ?? null,
      activeElement: document.activeElement?.tagName.toLowerCase() ?? 'null',
    })
  }

  return snapshots
}

export function formatSnapshots(snapshots: ReplaySnapshot[]): string {
  return snapshots.map((s, i) => {
    const e = s.afterEvent
    const action = e.type === 'keydown' ? `keydown(${e.key})` : e.type
    const target = e.targetNodeId ?? e.target
    return `${i + 1}. ${action} target=${target} → focused: ${s.focusedNodeId ?? 'none'} active: ${s.activeElement}`
  }).join('\n')
}
