// @see docs/0-inbox/handoff-2026-04-18-mddb-phase1.md
/**
 * knowledgeFetch — /mddb-index.json 정적 fetch.
 *
 * @invariant public/ 아래 정적 파일만 소비 — 서버 API 불필요
 * @invariant MddbFrontmatter는 scripts/mddb/schema.ts의 DocFrontmatter와 동일 shape (frontend 소비용 미러)
 */

export type MddbFrontmatter = {
  id: string
  title: string
  status: 'inbox' | 'active' | 'reference' | 'archived' | 'backlog' | 'research' | 'sample' | 'meta'
  kind: string
  created: string
  updated: string
  summary?: string
  topics: string[]
  parent?: string
  relates: string[]
  supersedes: string[]
  superseded_by?: string
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
