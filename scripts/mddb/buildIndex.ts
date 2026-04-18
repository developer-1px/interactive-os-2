// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * buildIndex — extractAll → MddbIndex (frontmatter only).
 *
 * @invariant 출력은 public/mddb-index.json (브라우저 정적 서빙)
 * @invariant entries는 path 오름차순 정렬 (재현 가능)
 * @invariant warnings/provenance는 index에 포함 안 함 (frontend는 frontmatter만 소비)
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { extractAll } from './extract.ts'
import { PROJECT_ROOT } from './paths.ts'
import type { DocFrontmatter } from './schema.ts'

export type MddbIndexEntry = {
  path: string
  frontmatter: DocFrontmatter
}

export type MddbIndex = {
  generated_at: string
  total: number
  entries: MddbIndexEntry[]
}

export async function buildIndex(): Promise<MddbIndex> {
  const all = await extractAll()
  const entries: MddbIndexEntry[] = all
    .map((r) => ({ path: `docs/${r.path}`, frontmatter: r.frontmatter }))
    .sort((a, b) => a.path.localeCompare(b.path))
  return {
    generated_at: new Date().toISOString(),
    total: entries.length,
    entries,
  }
}

export async function writeIndexFile(outPath: string): Promise<MddbIndex> {
  const index = await buildIndex()
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(index, null, 2) + '\n', 'utf8')
  return index
}

export const DEFAULT_INDEX_PATH = resolve(PROJECT_ROOT, 'public/mddb-index.json')
