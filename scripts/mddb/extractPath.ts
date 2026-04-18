// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * Path-based extraction (lite) — only handoff filename → createdFromFilename hint.
 *
 * @invariant pure synchronous (FS IO 없음)
 * @invariant kind/topics/status 파생 책임은 viewer/runtime이 tags 에서 계산
 */
import { basename } from 'node:path'

export type PathExtract = {
  createdFromFilename?: string
}

const HANDOFF_DATE_RE = /^handoff-(\d{4}-\d{2}-\d{2})/

export function extractPath(relPath: string): PathExtract {
  const filename = basename(relPath)
  const m = HANDOFF_DATE_RE.exec(filename)
  return m ? { createdFromFilename: m[1] } : {}
}
