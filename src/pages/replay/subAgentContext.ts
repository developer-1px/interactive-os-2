import type { FC, ReactNode } from 'react'
import { createContext, createElement, useContext } from 'react'
import type { SubAgentMatchKey, SubAgentSession } from './subAgentTypes'

export interface SubAgentContextValue {
  session: SubAgentSession
  matchKey: SubAgentMatchKey | null
  parentSessionId: string
}

const SubAgentCtx = createContext<SubAgentContextValue | null>(null)

/**
 * 단일 SubAgent 상태 공급. ReplayContext와 병렬.
 * @invariant 자손은 이 컨텍스트로만 session/matchKey 접근 (prop drilling 금지)
 * @invariant Provider는 SubAgentStageWidget 루트에서만 mount
 */
export const SubAgentProvider: FC<{
  value: SubAgentContextValue
  children: ReactNode
}> = ({ value, children }) =>
  createElement(SubAgentCtx.Provider, { value }, children)

export function useSubAgent(): SubAgentContextValue {
  const ctx = useContext(SubAgentCtx)
  if (!ctx) throw new Error('useSubAgent must be used inside SubAgentProvider')
  return ctx
}
