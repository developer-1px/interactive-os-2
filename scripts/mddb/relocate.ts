// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
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
}

export type RelocateSkipEntry = {
  path: string
  reason: 'memory' | 'already-dated' | 'noop'
}

export type RelocatePlan = {
  total: number
  planned: RelocatePlanEntry[]
  skipped: RelocateSkipEntry[]
}

export async function planRelocate(): Promise<RelocatePlan> {
  const files = walkDocsMd(DOCS_ROOT)
  const planned: RelocatePlanEntry[] = []
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

    const base = basename(rel)
    const to = `${dateToFolder(date)}/${base}`
    if (to === rel) {
      skipped.push({ path: rel, reason: 'noop' })
      continue
    }
    planned.push({ from: rel, to, source, date })
  }

  return { total: files.length, planned, skipped }
}

function isGitDirty(): boolean {
  try {
    const out = execSync('git status --porcelain', {
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
