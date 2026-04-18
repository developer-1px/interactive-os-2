// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * knowledgeFetch — /mddb-index.json 정적 fetch.
 *
 * @invariant public/ 아래 정적 파일만 소비 — 서버 API 불필요
 * @invariant MddbFrontmatter는 scripts/mddb/schema.ts의 DocFrontmatter와 동일 shape (frontend 소비용 미러)
 */

export type MddbFrontmatter = {
  id: string
  type: string
  slug: string
  title: string
  tags: string[]
  created: string
  updated: string
  summary?: string
  status?: 'open' | 'in_progress' | 'consumed' | 'merged' | 'archived'
  project?: string
  layer?: string
  consumed_by?: string
  legacy?: Record<string, unknown>
}

export type MddbIndexEntry = {
  path: string
  frontmatter: MddbFrontmatter
}

export type MddbIndex = {
  generated_at: string
  total: number
  entries: MddbIndexEntry[]
}

export async function fetchMddbIndex(): Promise<MddbIndex> {
  const res = await fetch('/mddb-index.json')
  if (!res.ok) throw new Error(`mddb-index.json: ${res.status} ${res.statusText}`)
  return res.json()
}
