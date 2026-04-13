import { createContext, useContext } from 'react'
import type { Msg } from './incidentData'

export interface IncidentContextValue {
  items: Msg[]
  isStreaming: boolean
  feedRef: React.RefObject<HTMLDivElement | null>
  onReplay: () => void
}

const IncidentContext = createContext<IncidentContextValue | null>(null)

export const IncidentProvider = IncidentContext.Provider

export function useIncident(): IncidentContextValue {
  const ctx = useContext(IncidentContext)
  if (!ctx) throw new Error('useIncident must be used inside IncidentProvider')
  return ctx
}
