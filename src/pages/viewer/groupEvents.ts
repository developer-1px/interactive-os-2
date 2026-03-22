export interface TimelineEvent {
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result'
  ts: string
  tool?: string
  filePath?: string
  text?: string
  editOld?: string
  editNew?: string
}

export interface ToolGroup {
  type: 'tool_group'
  events: TimelineEvent[]
}

export type DisplayItem = TimelineEvent | ToolGroup

/**
 * Groups consecutive tool_use events into ToolGroup cards.
 * tool_result events are skipped but don't break continuity.
 */
export function groupEvents(events: TimelineEvent[]): DisplayItem[] {
  const result: DisplayItem[] = []
  let currentGroup: TimelineEvent[] | null = null

  function flushGroup() {
    if (currentGroup && currentGroup.length > 0) {
      result.push({ type: 'tool_group', events: currentGroup })
      currentGroup = null
    }
  }

  for (const evt of events) {
    if (evt.type === 'tool_result') continue

    if (evt.type === 'tool_use') {
      if (!currentGroup) currentGroup = []
      currentGroup.push(evt)
    } else {
      flushGroup()
      result.push(evt)
    }
  }

  flushGroup()
  return result
}
