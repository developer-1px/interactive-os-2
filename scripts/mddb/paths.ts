// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * Path filter SSOT + date layout helper.
 *
 * @invariant isMemoryPath가 true인 경로는 mddb 파이프라인이 절대 읽지 않는다
 * @invariant 모든 함수는 pure — 파일시스템 IO 없음 (walkDocsMd 제외)
 * @invariant isDocsMd ∩ isMemoryPath === ∅ (상호 배타)
 * @invariant parseDatePath ∘ dateToFolder == identity (year/month/day 일관성)
 */
import { resolve, sep, isAbsolute, relative, extname } from 'node:path'
import { readdirSync, statSync } from 'node:fs'
import { DATE_FOLDER_RE } from './schema.ts'

// DOCS_ROOT 계산: scripts/mddb/paths.ts → project root → docs/
export const PROJECT_ROOT = resolve(import.meta.dirname, '../..')
export const DOCS_ROOT = resolve(PROJECT_ROOT, 'docs')
const MEMORY_ROOT = resolve(PROJECT_ROOT, 'memory')

/** absolute-or-relative path가 docs/ 하위의 .md 파일인가? */
export function isDocsMd(path: string): boolean {
  if (!path) return false
  if (!isAbsolute(path)) {
    const p = path.replace(/^\.\//, '')
    // 'docs/...' 상대 경로 또는 DOCS_ROOT 기준 상대 경로 모두 허용
    const abs = p.startsWith('docs/') || p.startsWith('docs' + sep)
      ? resolve(PROJECT_ROOT, p)
      : resolve(DOCS_ROOT, p)
    const normalized = abs.endsWith(sep) ? abs.slice(0, -1) : abs
    if (!normalized.startsWith(DOCS_ROOT + sep) && normalized !== DOCS_ROOT) return false
    return extname(normalized).toLowerCase() === '.md'
  }
  const abs = path
  const normalized = abs.endsWith(sep) ? abs.slice(0, -1) : abs
  if (!normalized.startsWith(DOCS_ROOT + sep) && normalized !== DOCS_ROOT) return false
  return extname(normalized).toLowerCase() === '.md'
}

/** memory/ 경로인가? (defense in depth 가드) */
export function isMemoryPath(path: string): boolean {
  if (!path) return false
  const abs = isAbsolute(path) ? path : resolve(PROJECT_ROOT, path)
  if (abs === MEMORY_ROOT) return true
  if (abs.startsWith(MEMORY_ROOT + sep)) return true
  // 상대 경로가 'memory/...' 형태인 경우도 방어
  if (path.startsWith('memory' + sep) || path === 'memory') return true
  return false
}

/**
 * docs/ 기준 상대 경로에서 첫 segment 반환.
 * @invariant 'docs/0-inbox/foo.md' → '0-inbox', 'docs/foo.md' → ''
 * @invariant FOLDER_STATUS_MAP의 key와 정확히 대응
 */
export function folder0(relOrAbsPath: string): string {
  const rel = toRelDocsPath(relOrAbsPath)
  const segs = rel.split('/').filter(Boolean)
  if (segs.length <= 1) return '' // docs/ 루트 파일
  return segs[0]
}

/**
 * 절대 경로 → DOCS_ROOT 기준 상대 경로 (posix style).
 * @invariant DOCS_ROOT 바깥 경로는 throw
 */
export function toRelDocsPath(absOrRelPath: string): string {
  if (!absOrRelPath) throw new Error('toRelDocsPath: empty path')
  let abs: string
  if (isAbsolute(absOrRelPath)) {
    abs = absOrRelPath
  } else {
    const maybeRel = absOrRelPath.replace(/^\.\//, '')
    if (maybeRel.startsWith('docs' + sep) || maybeRel.startsWith('docs/')) {
      abs = resolve(PROJECT_ROOT, maybeRel)
    } else {
      // docs/ 접두어 없는 상대 경로는 DOCS_ROOT 기준으로 해석 (이미 docs-relative)
      abs = resolve(DOCS_ROOT, maybeRel)
    }
  }
  const rel = relative(DOCS_ROOT, abs)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`toRelDocsPath: path not under DOCS_ROOT: ${absOrRelPath}`)
  }
  return rel.split(sep).join('/')
}

/**
 * DOCS_ROOT 하위 재귀 스캔 → .md 파일 상대 경로 리스트 (memory/ 제외 — 이미 바깥).
 * 동기 IO. audit/extractAll에서 사용.
 */
export function walkDocsMd(root: string = DOCS_ROOT): string[] {
  const out: string[] = []
  function walk(dir: string) {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const ent of entries) {
      // hidden (dot-prefix) 디렉토리는 건너뜀 (.git, .DS_Store 등). 숨김 .md는 포함.
      if (ent.isDirectory()) {
        if (ent.name.startsWith('.')) continue
        walk(resolve(dir, ent.name))
        continue
      }
      if (!ent.isFile() && !ent.isSymbolicLink()) continue
      const full = resolve(dir, ent.name)
      if (extname(ent.name).toLowerCase() !== '.md') continue
      // symbolic link는 realpath 후 DOCS_ROOT 하위인지 재확인
      if (ent.isSymbolicLink()) {
        try {
          const st = statSync(full)
          if (!st.isFile()) continue
        } catch {
          continue
        }
      }
      out.push(toRelDocsPath(full))
    }
  }
  walk(root)
  return out.sort()
}

// ── Date layout helpers (mddb-lite) ────────────────────────────

/**
 * docs-relative path → { year, month, day } if matches DATE_FOLDER_RE.
 * @invariant return null if not under YYYY/YYYY-MM/YYYY-MM-DD/
 */
export function parseDatePath(relPath: string): { year: string; month: string; day: string } | null {
  const m = DATE_FOLDER_RE.exec(relPath)
  if (!m) return null
  const [, year, mm, dd] = m
  return { year, month: `${year}-${mm}`, day: `${year}-${mm}-${dd}` }
}

/**
 * ISO date (YYYY-MM-DD) → 'YYYY/YYYY-MM/YYYY-MM-DD' folder segment.
 * @invariant input must match /^\d{4}-\d{2}-\d{2}$/ — throws otherwise
 */
export function dateToFolder(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!m) throw new Error(`dateToFolder: invalid date ${isoDate}`)
  const [, y, mm, dd] = m
  return `${y}/${y}-${mm}/${y}-${mm}-${dd}`
}
