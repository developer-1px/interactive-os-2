var e=`import { useState, useEffect } from 'react'
import type { SubAgentFile } from './subAgentTypes'

/** 기존 타입 — 불변(하위호환). */
export interface ActiveSession {
  id: string
  label: string
  mtime: number
  active: boolean
}

/**
 * 서버 응답 슈퍼셋. subagentFiles 포함.
 * @invariant ActiveSession의 모든 필드를 그대로 포함(슈퍼셋 관계)
 * @invariant subagentFiles 길이 0 = Agent tool 미사용 또는 meta 미도착 (둘은 hook이 구분)
 */
export interface ActiveSessionWithSubs extends ActiveSession {
  subagentFiles: SubAgentFile[]
}

const POLL_INTERVAL = 10_000

/**
 * 10s 폴링으로 /api/agent-ops/sessions 구독. subagentFiles까지 노출.
 * @invariant 기존 호출부 호환 — 반환 원소가 ActiveSession을 구조적으로 포함
 * @invariant fetch·parse는 subAgent jsonl/meta에 접근하지 않는다 (B2) — 경로만 전달
 */
export function useActiveSessions(options?: { activeOnly?: boolean }): ActiveSessionWithSubs[] {
  const activeOnly = options?.activeOnly ?? true
  const [sessions, setSessions] = useState<ActiveSessionWithSubs[]>([])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/agent-ops/sessions')
        if (!res.ok) return
        const data: Array<ActiveSession & { subagentFiles?: SubAgentFile[] }> = await res.json()
        if (!cancelled) {
          const normalized: ActiveSessionWithSubs[] = data.map(s => ({
            id: s.id,
            label: s.label,
            mtime: s.mtime,
            active: s.active,
            subagentFiles: s.subagentFiles ?? [],
          }))
          const filtered = activeOnly ? normalized.filter(s => s.active) : normalized
          setSessions(prev => {
            if (
              prev.length === filtered.length
              && prev.every((s, i) =>
                s.id === filtered[i].id
                && s.mtime === filtered[i].mtime
                && s.subagentFiles.length === filtered[i].subagentFiles.length
                && s.subagentFiles.every((f, j) => f.agentHash === filtered[i].subagentFiles[j].agentHash && f.mtime === filtered[i].subagentFiles[j].mtime),
              )
            ) return prev
            return filtered
          })
        }
      } catch { /* server unavailable */ }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [activeOnly])

  return sessions
}
`;export{e as default};