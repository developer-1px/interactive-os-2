import { createContext, useContext } from 'react'
import type { NormalizedData } from '@os/store/types'
import type { StoryEntry } from './storiesStore'

export interface StoriesContextValue {
  entries: StoryEntry[]
  listStore: NormalizedData
  selectedPath: string | null
  onChange: (data: NormalizedData) => void
}

const StoriesContext = createContext<StoriesContextValue | null>(null)

export const StoriesProvider = StoriesContext.Provider

export function useStories(): StoriesContextValue {
  const ctx = useContext(StoriesContext)
  if (!ctx) throw new Error('useStories must be used within StoriesProvider')
  return ctx
}
