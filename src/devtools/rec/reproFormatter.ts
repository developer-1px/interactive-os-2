/**
 * Text formatter for reproduction recordings.
 * Produces LLM-readable output from a timeline of events.
 */

interface ReproMeta {
  url: string
  startedAt: string
  duration: number
  eventCount: number
}

interface InputEntry {
  seq: number
  time: string
  ch: 'input'
  type: 'keydown' | 'click' | 'focus'
  key?: string
  target: string
  source: string | null
  focus: string
  prevented: boolean
  ariaTree: string
}

interface StateEntry {
  seq: number
  time: string
  ch: 'state'
  command: string
  diff: string[]
  error?: string
}

interface ConsoleEntry {
  seq: number
  time: string
  ch: 'console'
  level: 'error' | 'warn'
  message: string
}

type ReproEvent = InputEntry | StateEntry | ConsoleEntry

const INPUT_ICONS: Record<string, string> = {
  keydown: '\u2328', click: '\uD83D\uDDB1', focus: '\u23CE',
}

export function formatTimelineAsText(meta: ReproMeta, timeline: ReproEvent[]): string {
  const lines: string[] = []
  lines.push(`# Reproduction — ${meta.url}`)
  lines.push(`# ${meta.startedAt} · ${(meta.duration / 1000).toFixed(1)}s · ${meta.eventCount} events`)
  lines.push('')

  let lastSource = ''

  let i = 0
  while (i < timeline.length) {
    const ev = timeline[i]

    if (ev.ch === 'input') {
      const icon = INPUT_ICONS[ev.type] ?? '?'
      const keyStr = ev.key ? ` ${ev.key}` : ''
      const srcChanged = ev.source !== null && ev.source !== lastSource
      const srcStr = srcChanged ? `  \u2190 ${ev.source}` : ''
      if (ev.source) lastSource = ev.source

      let j = i + 1
      const trailingLines: string[] = []
      while (j < timeline.length && timeline[j].ch !== 'input') {
        const trailing = timeline[j]
        if (trailing.ch === 'state') {
          const diffStr = trailing.diff.length > 0 ? trailing.diff.join(', ') : 'no diff'
          trailingLines.push(`  \u2192 ${trailing.command}: ${diffStr}`)
          if (trailing.error) trailingLines.push(`  \u26A0 ${trailing.error}`)
        } else if (trailing.ch === 'console') {
          const prefix = trailing.level === 'error' ? '\u2717' : '\u26A0'
          trailingLines.push(`  ${prefix} ${trailing.message}`)
        }
        j++
      }

      const noChanges = ev.ariaTree === '(no changes)' && trailingLines.length === 0
      if (noChanges) {
        lines.push(`[${ev.seq}] ${ev.time} ${icon}${keyStr} \u2192 ${ev.target} (no changes)`)
      } else {
        lines.push(`[${ev.seq}] ${ev.time} ${icon}${keyStr} \u2192 ${ev.target}${srcStr}`)
        const focusDiffers = ev.focus !== ev.target
        const focusStr = focusDiffers ? `focus: ${ev.focus}` : ''
        const preventedStr = ev.prevented ? 'prevented' : ''
        const metaLine = [focusStr, preventedStr].filter(Boolean).join(' | ')
        if (metaLine) lines.push(metaLine)
        for (const treeLine of ev.ariaTree.split('\n')) {
          lines.push(`  ${treeLine}`)
        }
        for (const tl of trailingLines) lines.push(tl)
      }

      lines.push('')
      i = j
    } else {
      if (ev.ch === 'state') {
        lines.push(`[${ev.seq}] ${ev.time} \u2192 ${ev.command}: ${ev.diff.join(', ')}`)
      } else if (ev.ch === 'console') {
        const prefix = ev.level === 'error' ? '\u2717' : '\u26A0'
        lines.push(`[${ev.seq}] ${ev.time} ${prefix} ${ev.message}`)
      }
      lines.push('')
      i++
    }
  }

  return lines.join('\n')
}
