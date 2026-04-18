// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * backfill — 기존 frontmatter + git rename history → 본문 끝 hashtag 라인 1회 주입.
 *
 * @invariant 본문 끝 hashtag 라인이 SSOT, frontmatter의 kind/topics/status는 legacy.*로 이동
 * @invariant 기존 hashtag 라인이 있으면 set union (정보 손실 0)
 * @invariant memory/ 절대 건드리지 않음
 * @invariant rename commit (HEAD의 마지막 R commit)에서 PARA 도메인 흡수
 */
import { execSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { walkDocsMd, DOCS_ROOT, PROJECT_ROOT, isMemoryPath } from './paths.ts'
import { extractContent } from './extractContent.ts'
import {
  HASHTAG_LINE_RE,
  HASHTAG_TOKEN_RE,
  NUMERIC_ONLY_HASHTAG_RE,
} from './schema.ts'

const KIND_ENUM = new Set([
  'prd', 'plan', 'handoff', 'audit', 'decision', 'retro',
  'explain', 'pyramid', 'research', 'note',
])

const PARA_FOLDER_TOPICS = new Set([
  '0-inbox', '1-projects', '2-areas', '3-resources', '4-archive', '5-backlogs',
])

function kindFromFilename(filename: string): string {
  if (/^handoff-\d{4}-\d{2}-\d{2}/.test(filename)) return 'handoff'
  if (/-prd\.md$/i.test(filename)) return 'prd'
  if (/-plan\.md$/i.test(filename)) return 'plan'
  if (/-task\.md$/i.test(filename)) return 'plan'
  if (/^pyramid-/i.test(filename)) return 'pyramid'
  if (/^explain-/i.test(filename)) return 'explain'
  return 'note'
}

/** Extract `[tag]` from filename like `61-[decision]serviceUserStory.md`. */
function bracketTag(filename: string): string | null {
  const m = /\[([a-z][a-z0-9_-]*)\]/i.exec(filename)
  return m ? m[1].toLowerCase() : null
}

/** Build map<newRelPath, oldRelPath> from last R commit on HEAD. */
export function buildRenameMap(): Map<string, string> {
  const out = execSync(
    `git log --diff-filter=R --format='' --name-status -1`,
    { cwd: PROJECT_ROOT, encoding: 'utf8' },
  )
  const map = new Map<string, string>()
  for (const line of out.split('\n')) {
    const m = /^R\d+\t(.+?)\t(.+)$/.exec(line)
    if (!m) continue
    const oldPath = m[1].replace(/^docs\//, '')
    const newPath = m[2].replace(/^docs\//, '')
    map.set(newPath, oldPath)
  }
  return map
}

function topicsFromOldPath(oldPath: string): string[] {
  const segs = oldPath.split('/')
  const out: string[] = []
  if (segs[0] === '1-projects' || segs[0] === '2-areas') {
    // segs[1]이 파일명이면(.md) 도메인 정보 없음 — root 파일 동급
    if (segs[1] && !segs[1].endsWith('.md') && !PARA_FOLDER_TOPICS.has(segs[1])) {
      out.push(segs[1])
    }
  } else if (segs[0] === 'research') {
    out.push('research')
  }
  return out
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

/** Existing hashtag-line tokens (with `#` prefix). Empty array if no valid line. */
function extractExistingTagTokens(body: string): string[] {
  const lines = body.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    if (!HASHTAG_LINE_RE.test(trimmed)) return []
    const tokens = trimmed.split(/\s+/)
    if (tokens.some((t) => NUMERIC_ONLY_HASHTAG_RE.test(t))) return []
    const out: string[] = []
    for (const t of tokens) {
      const mm = HASHTAG_TOKEN_RE.exec(t)
      if (mm) out.push(t)
    }
    return out
  }
  return []
}

function bodyWithoutTrailingTagLine(body: string): string {
  const lines = body.split('\n')
  let lastNonBlank = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim()) { lastNonBlank = i; break }
  }
  if (lastNonBlank < 0) return body
  const trimmed = lines[lastNonBlank].trim()
  if (!HASHTAG_LINE_RE.test(trimmed)) return body
  const tokens = trimmed.split(/\s+/)
  if (tokens.some((t) => NUMERIC_ONLY_HASHTAG_RE.test(t))) return body
  return lines.slice(0, lastNonBlank).join('\n').replace(/\n+$/, '')
}

const LEGACY_KEYS = ['kind', 'topics', 'status', 'parent', 'relates', 'supersedes', 'superseded_by'] as const

export type BackfillEntry = {
  path: string
  finalLine: string
  added: string[]
  existing: string[]
  fmRemoved: string[]
}

export type BackfillSkipped = { path: string; reason: 'memory' | 'unreadable' | 'noop' }

export type BackfillResult = {
  total: number
  changed: BackfillEntry[]
  skipped: BackfillSkipped[]
}

export async function planBackfill(): Promise<BackfillResult> {
  const renameMap = buildRenameMap()
  const files = walkDocsMd(DOCS_ROOT)
  const changed: BackfillEntry[] = []
  const skipped: BackfillSkipped[] = []

  for (const rel of files) {
    const abs = resolve(DOCS_ROOT, rel)
    if (isMemoryPath(abs)) { skipped.push({ path: rel, reason: 'memory' }); continue }
    const source = await readFile(abs, 'utf8').catch(() => null)
    if (source === null) { skipped.push({ path: rel, reason: 'unreadable' }); continue }

    const c = extractContent(source)
    const fm = c.rawFrontmatter ?? {}
    const filename = basename(rel)
    const oldPath = renameMap.get(rel) ?? null

    const tagSet = new Set<string>()

    // kind (1) — filename pattern 우선, [tag]가 KIND_ENUM이면 그 값, 아니면 'note'
    const bracket = bracketTag(filename)
    const filenameKind = kindFromFilename(filename)
    const kind =
      filenameKind !== 'note'
        ? filenameKind
        : (bracket && KIND_ENUM.has(bracket))
          ? bracket
          : 'note'
    tagSet.add(`#kind/${kind}`)

    // topic from filename [tag] (KIND_ENUM이 아니면 topic으로)
    if (bracket && !KIND_ENUM.has(bracket) && !PARA_FOLDER_TOPICS.has(bracket)) {
      tagSet.add(`#topic/${bracket}`)
    }

    // topic from old PARA path (domain segment only)
    if (oldPath) {
      for (const t of topicsFromOldPath(oldPath)) tagSet.add(`#topic/${t.toLowerCase()}`)
      if (oldPath.startsWith('4-archive/')) tagSet.add('#archived')
    }

    // existing tag line — set union
    const existing = extractExistingTagTokens(c.body)
    for (const e of existing) tagSet.add(e)

    // sort: #kind 먼저, #topic 다음, #archived 마지막
    const finalTags = Array.from(tagSet).sort((a, b) => {
      const order = (s: string) =>
        s.startsWith('#kind/') ? 0 : s.startsWith('#topic/') ? 1 : 2
      const ao = order(a), bo = order(b)
      return ao !== bo ? ao - bo : a.localeCompare(b)
    })
    const finalLine = finalTags.join(' ')

    // frontmatter modification: kind/topics/status/etc → legacy.*
    const fmRemoved: string[] = []
    const newFmCore: Record<string, unknown> = {}
    const legacyExtra: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fm)) {
      if (k === 'legacy') continue
      if ((LEGACY_KEYS as readonly string[]).includes(k)) {
        legacyExtra[k] = v
        fmRemoved.push(k)
      } else {
        newFmCore[k] = v
      }
    }
    const existingLegacy =
      (typeof fm.legacy === 'object' && fm.legacy !== null && !Array.isArray(fm.legacy))
        ? (fm.legacy as Record<string, unknown>)
        : {}
    const mergedLegacy = { ...existingLegacy, ...legacyExtra }

    // body 재구성
    const cleanBody = bodyWithoutTrailingTagLine(c.body).replace(/\n+$/, '')

    // noop 검출: 추가될 tag 0 + frontmatter 제거 0 + 기존 라인 동일
    const added = finalTags.filter((t) => !existing.includes(t))
    const existingLineEq =
      existing.length === finalTags.length &&
      existing.every((t, i) => t === finalTags[i])
    if (added.length === 0 && fmRemoved.length === 0 && existingLineEq) {
      skipped.push({ path: rel, reason: 'noop' })
      continue
    }

    changed.push({ path: rel, finalLine, added, existing, fmRemoved })

    // store the prepared file content for write phase
    PREPARED_CONTENT.set(rel, buildOutput(c.hasFrontmatterBlock, newFmCore, mergedLegacy, cleanBody, finalLine, source))
  }

  return { total: files.length, changed, skipped }
}

const PREPARED_CONTENT = new Map<string, string>()

function buildOutput(
  hasFm: boolean,
  fmCore: Record<string, unknown>,
  legacy: Record<string, unknown>,
  body: string,
  finalLine: string,
  origSource: string,
): string {
  // 본문 정리 + tag line 추가
  const newBody = body + (body.length > 0 ? '\n\n' : '') + finalLine + '\n'
  if (!hasFm && Object.keys(legacy).length === 0) {
    // frontmatter 없고 legacy도 없음 → 본문 + tag line만
    return newBody
  }
  // frontmatter 직렬화 (간단 YAML)
  const finalFm: Record<string, unknown> = { ...fmCore }
  if (Object.keys(legacy).length > 0) finalFm.legacy = legacy
  const lines: string[] = ['---']
  for (const [k, v] of Object.entries(finalFm)) {
    if (v === undefined) continue
    lines.push(formatYaml(k, v, 0))
  }
  lines.push('---')
  return lines.join('\n') + '\n' + newBody
}

function formatYaml(key: string, value: unknown, indent: number): string {
  const pad = '  '.repeat(indent)
  if (value === null) return `${pad}${key}: null`
  if (typeof value === 'string') return `${pad}${key}: ${yamlScalar(value)}`
  if (typeof value === 'number' || typeof value === 'boolean') return `${pad}${key}: ${value}`
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}${key}: []`
    if (value.every((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      const items = value.map((v) => (typeof v === 'string' ? yamlScalar(v) : String(v)))
      return `${pad}${key}: [${items.join(', ')}]`
    }
    return `${pad}${key}: ${JSON.stringify(value)}`
  }
  if (typeof value === 'object') {
    const flat = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined)
    if (flat.length === 0) return `${pad}${key}: {}`
    return `${pad}${key}:\n` + flat.map(([k, v]) => formatYaml(k, v, indent + 1)).join('\n')
  }
  return `${pad}${key}: ${String(value)}`
}

function yamlScalar(s: string): string {
  if (/^[A-Za-z0-9][A-Za-z0-9 _./@+=-]*$/.test(s) && !/^(true|false|null|yes|no|~)$/i.test(s)) {
    return s
  }
  return `'${s.replace(/'/g, "''")}'`
}

export async function backfill(opts: { dryRun?: boolean } = {}): Promise<BackfillResult> {
  const dryRun = opts.dryRun ?? false
  if (!dryRun) {
    const dirty = execSync('git status --porcelain', { cwd: PROJECT_ROOT, encoding: 'utf8' })
    if (dirty.trim()) throw new Error('backfill: working tree dirty — commit or stash first, or use --dry-run')
  }
  const plan = await planBackfill()
  if (dryRun) return plan
  for (const entry of plan.changed) {
    const content = PREPARED_CONTENT.get(entry.path)
    if (!content) continue
    const abs = resolve(DOCS_ROOT, entry.path)
    await writeFile(abs, content, 'utf8')
  }
  return plan
}
