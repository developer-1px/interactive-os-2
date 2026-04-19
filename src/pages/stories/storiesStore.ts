import { parse } from 'yaml'
import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/store/types'
import type { StoryDoc } from './storyTypes'

// POC: vite glob import as raw text, then parse yaml
const storyRaw = import.meta.glob('/docs/**/*.story.yaml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

export interface StoryEntry {
  path: string
  doc: StoryDoc
}

export function loadStories(): StoryEntry[] {
  return Object.entries(storyRaw)
    .map(([path, raw]) => ({ path, doc: parse(raw) as StoryDoc }))
    .sort((a, b) => (a.doc.number ?? 9999) - (b.doc.number ?? 9999))
}

const UNGROUPED = 'Other'

export function storiesToNavStore(entries: StoryEntry[]): NormalizedData {
  // group 첫 등장 순서대로 보존 (entries는 number 정렬된 상태로 들어온다고 가정)
  const groupOrder: string[] = []
  const byGroup = new Map<string, StoryEntry[]>()
  for (const e of entries) {
    const g = e.doc.group ?? UNGROUPED
    if (!byGroup.has(g)) {
      byGroup.set(g, [])
      groupOrder.push(g)
    }
    byGroup.get(g)!.push(e)
  }

  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const g of groupOrder) {
    const groupId = `group:${g}`
    entities[groupId] = { id: groupId, data: { type: 'group', label: g } }
    relationships[ROOT_ID].push(groupId)

    const children = byGroup.get(g)!
    relationships[groupId] = children.map((e) => e.path)
    for (const e of children) {
      const label = e.doc.number != null ? `#${e.doc.number} · ${e.doc.title}` : e.doc.title
      entities[e.path] = { id: e.path, data: { label } }
    }
  }

  return createStore({ entities, relationships })
}

export function getStoryStats(doc: StoryDoc) {
  const total = doc.behaviors.length
  const done = doc.behaviors.filter(b => b.status === 'done').length
  const wip = doc.behaviors.filter(b => b.status === 'wip').length
  const todo = doc.behaviors.filter(b => b.status === 'todo').length
  return { total, done, wip, todo }
}
