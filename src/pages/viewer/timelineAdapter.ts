// ② 2026-03-27-chat-module-prd.md
import { groupEvents, type TimelineEvent, type ToolGroup, type DisplayItem } from './groupEvents'
import type { ChatMessage, ChatBlock } from '../../interactive-os/ui/chat/types'

/**
 * Converts raw TimelineEvent[] to ChatMessage[].
 * Uses groupEvents to merge consecutive tool_use into tool_group blocks.
 */
export function timelineToMessages(events: TimelineEvent[]): ChatMessage[] {
  const displayItems = groupEvents(events)
  return displayItems.map(itemToMessage)
}

function itemToMessage(item: DisplayItem): ChatMessage {
  if (item.type === 'tool_group') {
    return toolGroupToMessage(item)
  }

  const evt = item
  return {
    id: `${evt.ts}-${evt.type}`,
    role: evt.type === 'user' ? 'user' : 'assistant',
    ts: new Date(evt.ts).getTime(),
    blocks: eventToBlocks(evt),
  }
}

function eventToBlocks(evt: TimelineEvent): ChatBlock[] {
  if (evt.text) {
    // Edit/Write events with code preview
    if ((evt.tool === 'Edit' || evt.tool === 'Write') && evt.editNew) {
      const blocks: ChatBlock[] = [{ type: 'text', content: evt.text }]
      if (evt.editOld) {
        blocks.push({ type: 'diff', old: evt.editOld, new: evt.editNew, filePath: evt.filePath })
      } else {
        blocks.push({ type: 'code', content: evt.editNew, filename: evt.filePath })
      }
      return blocks
    }
    return [{ type: 'text', content: evt.text }]
  }
  return []
}

function toolGroupToMessage(group: ToolGroup): ChatMessage {
  const firstTs = group.events[0]?.ts ?? ''
  return {
    id: `tg-${firstTs}`,
    role: 'assistant',
    ts: new Date(firstTs).getTime(),
    blocks: [{ type: 'tool_group', data: group } as ChatBlock],
  }
}
