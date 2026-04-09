import { parse } from 'yaml'
import type { StoryDoc } from './storyTypes'

// POC: vite glob import as raw text, then parse yaml
const storyRaw = import.meta.glob('/docs/**/*.story.yaml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

export interface StoryEntry {
  path: string
  doc: StoryDoc
}

export function loadStories(): StoryEntry[] {
  return Object.entries(storyRaw).map(([path, raw]) => ({
    path,
    doc: parse(raw) as StoryDoc,
  }))
}

export function getStoryStats(doc: StoryDoc) {
  const total = doc.behaviors.length
  const done = doc.behaviors.filter(b => b.status === 'done').length
  const wip = doc.behaviors.filter(b => b.status === 'wip').length
  const todo = doc.behaviors.filter(b => b.status === 'todo').length
  return { total, done, wip, todo }
}
