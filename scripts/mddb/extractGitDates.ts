// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * Git log → created/updated date extraction.
 *
 * @invariant child_process.execSync는 이 파일에서만 사용 (SRP)
 * @invariant untracked 파일도 반드시 created/updated 둘 다 반환
 * @invariant source 체인: git → filename → mtime
 * @invariant 반환 date는 ISO YYYY-MM-DD (로컬 타임존 아닌 UTC)
 * @invariant timeout 2000ms 초과 시 mtime fallback
 */
import { execSync } from 'node:child_process'
import { statSync } from 'node:fs'

export type GitDates = {
  created: string
  updated: string
  source: 'git' | 'mtime' | 'filename'
  confidence: 'high' | 'low'
}

function toIsoDate(d: Date): string {
  // UTC 기준 YYYY-MM-DD
  return d.toISOString().slice(0, 10)
}

function isoFromCommit(raw: string): string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  // git --format=%aI → e.g. '2026-04-17T12:34:56+09:00'
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return undefined
  return toIsoDate(d)
}

function runGit(args: string[], cwd: string, timeoutMs = 2000): string {
  try {
    return execSync(`git ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: timeoutMs,
    })
  } catch {
    return ''
  }
}

export async function extractGitDates(
  absPath: string,
  opts?: { fallbackFromFilename?: string; cwd?: string; timeoutMs?: number },
): Promise<GitDates> {
  const cwd = opts?.cwd ?? process.cwd()
  const timeoutMs = opts?.timeoutMs ?? 2000

  // 1. git log --follow --diff-filter=A --format=%aI → first commit date (creation)
  const firstRaw = runGit(
    ['log', '--follow', '--diff-filter=A', '--format=%aI', '--', absPath],
    cwd,
    timeoutMs,
  )
  // 여러 creation entry 중 가장 오래된 것(마지막 줄)
  const firstLines = firstRaw.split('\n').filter(Boolean)
  const firstIso = firstLines.length > 0 ? isoFromCommit(firstLines[firstLines.length - 1]) : undefined

  // 2. git log -1 --format=%aI → last commit date (latest)
  const lastRaw = runGit(['log', '-1', '--format=%aI', '--', absPath], cwd, timeoutMs)
  const lastIso = isoFromCommit(lastRaw)

  if (firstIso && lastIso) {
    // 불변식 #4: created ≤ updated
    const created = firstIso <= lastIso ? firstIso : lastIso
    const updated = firstIso <= lastIso ? lastIso : firstIso
    return { created, updated, source: 'git', confidence: 'high' }
  }

  if (lastIso && !firstIso) {
    // 단일 커밋 (first==last)
    return { created: lastIso, updated: lastIso, source: 'git', confidence: 'high' }
  }

  // 3. untracked 파일 — fallback 체인
  if (opts?.fallbackFromFilename) {
    const iso = opts.fallbackFromFilename
    return { created: iso, updated: iso, source: 'filename', confidence: 'high' }
  }

  // 4. 최종 fallback — fs.stat mtime
  try {
    const st = statSync(absPath)
    const created = toIsoDate(st.birthtime && !Number.isNaN(st.birthtime.getTime()) ? st.birthtime : st.mtime)
    const updated = toIsoDate(st.mtime)
    // 불변식 #4 방어
    const c = created <= updated ? created : updated
    const u = created <= updated ? updated : created
    return { created: c, updated: u, source: 'mtime', confidence: 'low' }
  } catch {
    // 파일이 없는 경우(신규 content만) — 오늘 날짜
    const today = toIsoDate(new Date())
    return { created: today, updated: today, source: 'mtime', confidence: 'low' }
  }
}
