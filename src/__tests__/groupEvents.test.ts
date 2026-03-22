import { describe, it, expect } from 'vitest'
import { groupEvents, type TimelineEvent, type ToolGroup } from '../pages/viewer/groupEvents'

function evt(type: TimelineEvent['type'], tool?: string): TimelineEvent {
  return { type, ts: Date.now().toString(), tool }
}

function asGroup(item: unknown): ToolGroup {
  return item as ToolGroup
}

describe('groupEvents', () => {
  it('passes through non-tool events as-is', () => {
    const events = [evt('user'), evt('assistant')]
    const result = groupEvents(events)
    expect(result).toEqual([events[0], events[1]])
  })

  it('groups consecutive tool_use events into a ToolGroup', () => {
    const events = [evt('tool_use', 'Read'), evt('tool_use', 'Edit')]
    const result = groupEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('tool_group')
    const group = asGroup(result[0])
    expect(group.events).toHaveLength(2)
    expect(group.events[0].tool).toBe('Read')
    expect(group.events[1].tool).toBe('Edit')
  })

  it('breaks group when assistant event arrives', () => {
    const events = [
      evt('tool_use', 'Read'),
      evt('tool_use', 'Edit'),
      evt('assistant'),
      evt('tool_use', 'Bash'),
    ]
    const result = groupEvents(events)
    expect(result).toHaveLength(3)
    expect(result[0].type).toBe('tool_group')
    expect(asGroup(result[0]).events).toHaveLength(2)
    expect(result[1].type).toBe('assistant')
    expect(result[2].type).toBe('tool_group')
    expect(asGroup(result[2]).events).toHaveLength(1)
  })

  it('skips tool_result but preserves tool_use continuity', () => {
    const events = [
      evt('tool_use', 'Read'),
      evt('tool_result'),
      evt('tool_use', 'Edit'),
    ]
    const result = groupEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('tool_group')
    expect(asGroup(result[0]).events).toHaveLength(2)
  })

  it('handles single tool_use as a group of 1', () => {
    const events = [evt('assistant'), evt('tool_use', 'Bash'), evt('assistant')]
    const result = groupEvents(events)
    expect(result).toHaveLength(3)
    expect(result[1].type).toBe('tool_group')
    expect(asGroup(result[1]).events).toHaveLength(1)
  })

  it('handles empty array', () => {
    expect(groupEvents([])).toEqual([])
  })

  it('handles tool_use at start without preceding assistant', () => {
    const events = [evt('tool_use', 'Read'), evt('tool_use', 'Grep'), evt('assistant')]
    const result = groupEvents(events)
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('tool_group')
    expect(asGroup(result[0]).events).toHaveLength(2)
    expect(result[1].type).toBe('assistant')
  })
})
