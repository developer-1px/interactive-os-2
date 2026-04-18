var e=`import { createContext, useContext, useSyncExternalStore } from 'react'

// --- Chat feature flags ---

export interface ChatFeatures {
  /** Collapsible blocks (thinking, tool result) default to open */
  expandByDefault: boolean
  /** Whether this message is the latest in the feed (live streaming context) */
  isLatest: boolean
}

const defaults: ChatFeatures = {
  expandByDefault: true,
  isLatest: false,
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

function useGlobalChatFeatures(): ChatFeatures {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => state,
  )
}

// --- Per-message override via context ---

export const ChatFeaturesOverride = createContext<Partial<ChatFeatures> | null>(null)

export function useChatFeatures(): ChatFeatures {
  const global = useGlobalChatFeatures()
  const override = useContext(ChatFeaturesOverride)
  if (!override) return global
  return { ...global, ...override }
}
`;export{e as default};