import { useSyncExternalStore } from 'react'

// --- Chat feature flags ---

export interface ChatFeatures {
  /** Collapsible blocks (thinking, tool result) default to open */
  expandByDefault: boolean
}

const defaults: ChatFeatures = {
  expandByDefault: true,
}

let state: ChatFeatures = { ...defaults }
const listeners = new Set<() => void>()

function notify() { listeners.forEach(fn => fn()) }

export function setChatFeature<K extends keyof ChatFeatures>(key: K, value: ChatFeatures[K]) {
  state = { ...state, [key]: value }
  notify()
}

export function getChatFeatures(): ChatFeatures {
  return state
}

export function useChatFeatures(): ChatFeatures {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => state,
  )
}
