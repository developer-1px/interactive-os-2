import { useEffect, useRef, useState } from 'react'
import type { TimelineEvent } from '../viewer/groupEvents'
import type { SubAgentFile, SubAgentSession } from './subAgentTypes'
import { buildSubAgentSession } from './buildSubAgentSession'

interface SubAgentFetchResponse {
  jsonl: string
  meta: string
  mtime: number
}

/**
 * 단일 부모 세션의 SubAgent 집합을 구독한다.
 * subagentFiles 변화를 감지 → 각 파일의 jsonl+meta fetch → buildSubAgentSession 머지.
 * @invariant I1 — 반환 sessions 모두 sessionId === parentSessionId
 * @invariant I5 — isActive = (parentActive && endedAt === null). parentActive가 true→false로
 *   전환될 때 이 hook 내부에서 각 sub.endedAt = lastTs 세팅(강제 종료 반영)
 * @invariant fetch·parse·merge 책임은 이 hook에만. useActiveSessions에서는 금지 (B2)
 * @invariant 동일 agentHash 재폴링 시 mtime 변화 없으면 skip (dedupe)
 */
export function useSubAgentSessions(args: {
  parentSessionId: string
  parentActive: boolean
  parentEvents: TimelineEvent[]
  subagentFiles: SubAgentFile[]
}): SubAgentSession[] {
  const { parentSessionId, parentActive, parentEvents, subagentFiles } = args
  const [sessions, setSessions] = useState<SubAgentSession[]>([])

  // mtime dedupe cache: agentHash -> last fetched mtime
  const mtimeCacheRef = useRef<Map<string, number>>(new Map())
  // keep latest parentEvents for async fetches without re-triggering on every event change
  const parentEventsRef = useRef(parentEvents)
  // eslint-disable-next-line react-hooks/refs -- idempotent write tracking latest prop for async fetch closure
  parentEventsRef.current = parentEvents

  // fetch/merge effect driven by subagentFiles identity (agentHash+mtime signature)
  const signature = subagentFiles.map(f => `${f.agentHash}@${f.mtime}`).join('|')

  useEffect(() => {
    if (!parentSessionId) return
    let cancelled = false

    async function sync() {
      const cache = mtimeCacheRef.current
      const stale = subagentFiles.filter(f => cache.get(f.agentHash) !== f.mtime)
      if (stale.length === 0) return

      const results = await Promise.all(
        stale.map(async (file): Promise<SubAgentSession | null> => {
          try {
            const res = await fetch(
              `/api/agent-ops/subagent?parent=${encodeURIComponent(file.parentSessionId)}&hash=${encodeURIComponent(file.agentHash)}`,
            )
            if (!res.ok) return null
            const body: SubAgentFetchResponse = await res.json()
            const session = buildSubAgentSession({
              file,
              jsonlText: body.jsonl,
              metaText: body.meta,
              parentEvents: parentEventsRef.current,
              parentActive,
            })
            return session
          } catch {
            return null
          }
        }),
      )

      if (cancelled) return

      // commit mtime cache (only for successful builds)
      for (let i = 0; i < stale.length; i += 1) {
        if (results[i]) cache.set(stale[i].agentHash, stale[i].mtime)
      }

      setSessions(prev => {
        const byHash = new Map(prev.map(s => [s.agentHash, s]))
        for (const r of results) {
          if (r) byHash.set(r.agentHash, r)
        }
        // drop sessions whose files disappeared
        const liveHashes = new Set(subagentFiles.map(f => f.agentHash))
        const merged: SubAgentSession[] = []
        for (const [hash, s] of byHash) {
          if (liveHashes.has(hash)) merged.push(s)
        }
        merged.sort((a, b) => a.startedAt - b.startedAt)
        return merged
      })
    }

    sync()
    return () => { cancelled = true }
  }, [signature, parentSessionId, parentActive, subagentFiles])

  // I5: parentActive true→false 전환 감지 시 모든 sub 강제 종료
  const prevActiveRef = useRef(parentActive)
  useEffect(() => {
    if (prevActiveRef.current && !parentActive) {
      setSessions(prev => prev.map(s => (
        s.isActive || s.endedAt === null
          ? { ...s, endedAt: s.lastTs, isActive: false }
          : s
      )))
    }
    prevActiveRef.current = parentActive
  }, [parentActive])

  return sessions
}
