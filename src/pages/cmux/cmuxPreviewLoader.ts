// ② cmuxPrd.md §W2 — URL ?preview= 쿼리 → scenario loader
import { SCENARIOS, type CmuxScenario } from './cmuxPreviewScenarios'

/** URL search string → preview scenario id. 없으면 null. */
export function parsePreviewQuery(search: string): string | null {
  return new URLSearchParams(search).get('preview')
}

/** id → scenario. 잘못된 id면 null. */
export function getScenario(id: string | null): CmuxScenario | null {
  if (!id) return null
  return SCENARIOS.find((s) => s.id === id) ?? null
}
