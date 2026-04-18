// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * relocate — git mv로 docs/ 파일을 YYYY/YYYY-MM/YYYY-MM-DD/ 경로로 이동.
 *
 * @invariant rename-only — 내용 수정 금지 (git --follow 휴리스틱 보호)
 * @invariant working tree clean 강제 (--dry-run 제외)
 * @invariant memory/ 경로는 isMemoryPath 가드로 스킵
 * @invariant 이미 DATE_FOLDER_RE 매칭이면 skip
 * @invariant 매핑 우선순위: explicit frontmatter.created > git --follow > mtime
 */
import { execSync } from 'node:child_process'
import { resolve, dirname, basename } from 'node:path'
import { mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  walkDocsMd,
  parseDatePath,
  dateToFolder,
  PROJECT_ROOT,
  DOCS_ROOT,
  isMemoryPath,
} from './paths.ts'
import { extractGitDates } from './extractGitDates.ts'
import { extractContent } from './extractContent.ts'
import type { ExtractSource } from './schema.ts'

export type RelocatePlanEntry = {
  from: string
  to: string
  source: ExtractSource
  date: string
  conflictPrefix?: string
}

export type RelocateSkipEntry = {
  path: string
  reason: 'memory' | 'already-dated' | 'noop'
}

export type RelocateConflictEntry = {
  date: string
  base: string
  files: string[]
}

export type RelocatePlan = {
  total: number
  planned: RelocatePlanEntry[]
  skipped: RelocateSkipEntry[]
  unresolvedConflicts: RelocateConflictEntry[]
}

/**
 * Conflict-resolving slug — `a/b/c/foo.md` → depth 0: 'foo.md', 1: 'c-foo.md', 2: 'b-c-foo.md'.
 */
function slugWithParentPrefix(relPath: string, depth: number): string {
  const segs = relPath.split('/')
  const base = segs[segs.length - 1]
  if (depth <= 0) return base
  const start = Math.max(0, segs.length - 1 - depth)
  const parents = segs.slice(start, segs.length - 1)
  return parents.length === 0 ? base : `${parents.join('-')}-${base}`
}

type Candidate = {
  from: string
  date: string
  source: ExtractSource
}

export async function planRelocate(): Promise<RelocatePlan> {
  const files = walkDocsMd(DOCS_ROOT)
  const candidates: Candidate[] = []
  const skipped: RelocateSkipEntry[] = []

  for (const rel of files) {
    const abs = resolve(DOCS_ROOT, rel)
    if (isMemoryPath(abs)) {
      skipped.push({ path: rel, reason: 'memory' })
      continue
    }
    if (parseDatePath(rel)) {
      skipped.push({ path: rel, reason: 'already-dated' })
      continue
    }

    const src = await readFile(abs, 'utf8').catch(() => '')
    const { rawFrontmatter } = extractContent(src)
    const explicitCreated =
      typeof rawFrontmatter?.created === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(rawFrontmatter.created as string)
        ? (rawFrontmatter.created as string)
        : null

    let date: string
    let source: ExtractSource
    if (explicitCreated) {
      date = explicitCreated
      source = 'explicit'
    } else {
      const gd = await extractGitDates(abs, { cwd: PROJECT_ROOT })
      date = gd.created
      source = gd.source
    }
    candidates.push({ from: rel, date, source })
  }

  // 1) noop 분리, 2) 충돌 검출, 3) parent prefix로 충돌 해소 (최대 4단)
  const planned: RelocatePlanEntry[] = []
  const grouped = new Map<string, Candidate[]>() // dayFolder → cands
  for (const c of candidates) {
    const key = dateToFolder(c.date)
    const arr = grouped.get(key) ?? []
    arr.push(c)
    grouped.set(key, arr)
  }

  const unresolvedConflicts: RelocateConflictEntry[] = []

  for (const [dayFolder, cands] of grouped.entries()) {
    // depth 0부터 시작해서 dest unique까지 증가
    const dests = new Map<string, Candidate>() // destBase → cand
    let depth = 0
    let remaining: Candidate[] = cands.slice()
    while (remaining.length > 0 && depth < 5) {
      const collisions = new Map<string, Candidate[]>() // base → cands
      for (const c of remaining) {
        const base = slugWithParentPrefix(c.from, depth)
        const list = collisions.get(base) ?? []
        list.push(c)
        collisions.set(base, list)
      }
      const nextRemaining: Candidate[] = []
      for (const [base, group] of collisions.entries()) {
        if (group.length === 1) {
          if (dests.has(base)) {
            nextRemaining.push(group[0])
          } else {
            dests.set(base, group[0])
          }
        } else {
          for (const c of group) nextRemaining.push(c)
        }
      }
      if (nextRemaining.length === remaining.length) {
        // 진전 없음 — abort
        break
      }
      remaining = nextRemaining
      depth++
    }

    for (const [base, cand] of dests.entries()) {
      const to = `${dayFolder}/${base}`
      if (to === cand.from) {
        skipped.push({ path: cand.from, reason: 'noop' })
        continue
      }
      const conflictPrefix = base !== basename(cand.from) ? base : undefined
      planned.push({ from: cand.from, to, source: cand.source, date: cand.date, conflictPrefix })
    }
    if (remaining.length > 0) {
      // 미해결 충돌 — base별 그룹 출력
      const byBase = new Map<string, string[]>()
      for (const c of remaining) {
        const base = slugWithParentPrefix(c.from, depth)
        const list = byBase.get(base) ?? []
        list.push(c.from)
        byBase.set(base, list)
      }
      for (const [base, files] of byBase.entries()) {
        unresolvedConflicts.push({ date: dayFolder, base, files })
      }
    }
  }

  return { total: files.length, planned, skipped, unresolvedConflicts }
}

function isGitDirty(): boolean {
  try {
    // docs/ scope만 체크 — relocate는 docs/ 내 git mv만 수행하므로
    // 다른 영역의 변경은 무관. untracked 파일도 rename 영향권 밖이라 제외.
    const out = execSync('git status --porcelain --untracked-files=no docs/', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.trim().length > 0
  } catch {
    return false
  }
}

export async function relocate(opts: { dryRun?: boolean } = {}): Promise<RelocatePlan> {
  const dryRun = opts.dryRun ?? false
  if (!dryRun && isGitDirty()) {
    throw new Error('relocate: working tree dirty — commit or stash first, or use --dry-run')
  }
  const plan = await planRelocate()
  if (plan.unresolvedConflicts.length > 0 && !dryRun) {
    throw new Error(
      `relocate: ${plan.unresolvedConflicts.length} unresolved conflict(s). Run with --dry-run --json to inspect.`,
    )
  }
  if (dryRun) return plan

  for (const { from, to } of plan.planned) {
    const toAbs = resolve(DOCS_ROOT, to)
    mkdirSync(dirname(toAbs), { recursive: true })
    const fromArg = `docs/${from}`
    const toArg = `docs/${to}`
    execSync(`git mv ${JSON.stringify(fromArg)} ${JSON.stringify(toArg)}`, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }
  return plan
}
