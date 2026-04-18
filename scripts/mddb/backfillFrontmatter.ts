// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * backfill — 기존 md에 frontmatter SSOT 필드를 주입.
 *
 * 2026-04-19 신설: 구 backfillTags.ts(하단 hashtag SSOT) 폐기 대체.
 *
 * @invariant 기존 frontmatter 필드는 보존 (explicit 우선)
 * @invariant type/slug/tags 3필드는 추론 후 반드시 주입
 * @invariant 구 PARA 폴더 위치·filename 패턴·legacy.kind 에서 type 추론
 * @invariant 구 legacy.topics·filename [tag]·PARA 폴더에서 tags 파생
 * @invariant memory/ 절대 건드리지 않음
 */
import { execSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { walkDocsMd, DOCS_ROOT, PROJECT_ROOT, isMemoryPath } from './paths.ts'
import { extractContent } from './extractContent.ts'
import { DOC_TYPES, SLUG_RE, type DocType } from './schema.ts'

const FILENAME_TYPE_MAP: Array<[RegExp, DocType]> = [
  [/^handoff-\d{4}-\d{2}-\d{2}/i, 'handoff'],
  [/-prd\.md$/i, 'prd'],
  [/Prd\.md$/, 'prd'],
  [/-plan\.md$/i, 'plan'],
  [/Plan\.md$/, 'plan'],
  [/^pyramid-/i, 'pyramid'],
  [/^minto-/i, 'minto'],
  [/^explain-/i, 'explain'],
  [/^retro-/i, 'retro'],
  [/^audit-|-audit\.md$/i, 'audit'],
  [/^backlog-|-backlog\.md$/i, 'backlog'],
]

const PARA_FOLDER_TO_TYPE: Record<string, DocType> = {
  '0-inbox': 'inbox',
  '1-projects': 'note',
  '2-areas': 'area',
  '3-resources': 'resource',
  '4-archive': 'archive',
  '5-backlogs': 'backlog',
}

const PARA_SEGMENTS_EXCLUDE_FROM_TAGS = new Set([
  '0-inbox', '1-projects', '2-areas', '3-resources', '4-archive', '5-backlogs',
])

export function inferType(relPath: string, legacy: Record<string, unknown>): DocType {
  const filename = basename(relPath)

  // filename pattern
  for (const [re, t] of FILENAME_TYPE_MAP) if (re.test(filename)) return t

  // [kind] bracket (34-[retro]active-zone.md, 57-[explain]foo.md)
  const bracketMatch = /\[([a-z][a-z0-9_-]*)\]/i.exec(filename)
  if (bracketMatch) {
    const tag = bracketMatch[1].toLowerCase()
    if ((DOC_TYPES as readonly string[]).includes(tag)) return tag as DocType
  }

  // legacy.kind
  const legacyKind = typeof legacy.kind === 'string' ? legacy.kind.toLowerCase() : null
  if (legacyKind && (DOC_TYPES as readonly string[]).includes(legacyKind)) return legacyKind as DocType

  // legacy.type
  const legacyType = typeof legacy.type === 'string' ? legacy.type.toLowerCase() : null
  if (legacyType && (DOC_TYPES as readonly string[]).includes(legacyType)) return legacyType as DocType

  // PARA folder
  const firstSeg = relPath.split('/')[0]
  if (firstSeg in PARA_FOLDER_TO_TYPE) return PARA_FOLDER_TO_TYPE[firstSeg]

  return 'note'
}

export function inferSlug(relPath: string, type: DocType): string {
  const stem = basename(relPath).replace(/\.md$/i, '')
  // 1. 순번 prefix 제거 (01-, 02-, 001-)
  let s = stem.replace(/^\d{2,3}-/, '')
  // 2. [tag] bracket 제거
  s = s.replace(/\[[^\]]+\]/g, '')
  // 3. 날짜 토큰 제거 (앞뒤 하이픈 보존하려면 날짜만 제거하고 연속 하이픈 정리)
  s = s.replace(/\d{4}-\d{2}-\d{2}/g, '')
  // 4. type 관련 접두/접미사 제거 (handoff-, -prd, -plan, -task)
  if (type === 'handoff') s = s.replace(/^handoff[-_]?/i, '')
  if (type === 'prd') s = s.replace(/[-_]?prd$/i, '')
  if (type === 'plan') s = s.replace(/[-_]?plan$/i, '').replace(/[-_]?task$/i, '')
  if (type === 'retro') s = s.replace(/^retro[-_]?/i, '')
  if (type === 'audit') s = s.replace(/^audit[-_]?/i, '').replace(/[-_]?audit$/i, '')
  if (type === 'pyramid') s = s.replace(/^pyramid[-_]?/i, '')
  if (type === 'minto') s = s.replace(/^minto[-_]?/i, '')
  if (type === 'explain') s = s.replace(/^explain[-_]?/i, '')
  if (type === 'backlog') s = s.replace(/^backlog[-_]?/i, '').replace(/[-_]?backlog$/i, '')
  // 5. 연속/양끝 하이픈 정리
  s = s.replace(/[-_]+/g, '-').replace(/^-+|-+$/g, '')
  // 6. all-caps (BACKLOGS, README) → 전부 소문자
  if (/^[A-Z]+$/.test(s)) s = s.toLowerCase()
  // 7. kebab → camelCase
  const camel = s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())
  // 8. 영문 시작 + 첫 글자 소문자
  const normalized = camel.replace(/^[^a-zA-Z]+/, '').replace(/^(.)/, (c) => c.toLowerCase())
  return SLUG_RE.test(normalized) ? normalized : 'note'
}

export function inferTags(relPath: string, legacy: Record<string, unknown>, existing: string[]): string[] {
  const out = new Set<string>(existing)

  // legacy.topics 배열 흡수 (PARA 세그 제외)
  if (Array.isArray(legacy.topics)) {
    for (const t of legacy.topics) {
      if (typeof t === 'string' && !PARA_SEGMENTS_EXCLUDE_FROM_TAGS.has(t)) {
        out.add(normalizeTag(t))
      }
    }
  }

  // filename [tag] 흡수 (DOC_TYPES가 아닌 경우만 — type은 type 필드로)
  const filename = basename(relPath)
  const bracketMatch = /\[([a-z][a-z0-9_-]*)\]/i.exec(filename)
  if (bracketMatch) {
    const tag = bracketMatch[1].toLowerCase()
    if (!(DOC_TYPES as readonly string[]).includes(tag)) out.add(tag)
  }

  // PARA domain segment (1-projects/viewer/ → viewer, 2-areas/engine/ → engine)
  const segs = relPath.split('/')
  if ((segs[0] === '1-projects' || segs[0] === '2-areas') && segs[1] && !segs[1].endsWith('.md')) {
    if (!PARA_SEGMENTS_EXCLUDE_FROM_TAGS.has(segs[1])) {
      out.add(normalizeTag(segs[1]))
    }
  }

  // refs/ 루트 파일
  if (segs[0] === 'refs' && segs[1]) {
    out.add('reference')
    if (!segs[1].endsWith('.md') && !PARA_SEGMENTS_EXCLUDE_FROM_TAGS.has(segs[1])) {
      out.add(normalizeTag(segs[1]))
    }
  }

  if (out.size === 0) out.add('untagged')
  return Array.from(out)
}

function normalizeTag(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'untagged'
}

async function inferCreatedFromGit(relPath: string): Promise<string | null> {
  try {
    const out = execSync(
      `git log --follow --format=%ai -- "${relPath}" | tail -1`,
      { cwd: PROJECT_ROOT, encoding: 'utf8' },
    ).trim()
    if (out && /^\d{4}-\d{2}-\d{2}/.test(out)) return out.slice(0, 10)
  } catch {}
  return null
}

export type BackfillPlan = {
  path: string
  inferred: {
    id: string
    type: DocType
    slug: string
    title: string
    tags: string[]
    created: string
    updated: string
  }
  hasExistingFrontmatter: boolean
  existingFieldKeys: string[]
}

export type BackfillSkipped = { path: string; reason: 'memory' | 'unreadable' | 'complete' }

export type BackfillResult = {
  total: number
  changed: BackfillPlan[]
  skipped: BackfillSkipped[]
}

const PREPARED_CONTENT = new Map<string, string>()

export async function planBackfill(): Promise<BackfillResult> {
  const files = walkDocsMd(DOCS_ROOT)
  const changed: BackfillPlan[] = []
  const skipped: BackfillSkipped[] = []
  PREPARED_CONTENT.clear()

  for (const rel of files) {
    const abs = resolve(DOCS_ROOT, rel)
    if (isMemoryPath(abs)) { skipped.push({ path: rel, reason: 'memory' }); continue }
    const source = await readFile(abs, 'utf8').catch(() => null)
    if (source === null) { skipped.push({ path: rel, reason: 'unreadable' }); continue }

    const content = extractContent(source)
    const existing = content.rawFrontmatter ?? {}
    const existingKeys = Object.keys(existing)

    const hasAll = typeof existing.type === 'string'
      && typeof existing.slug === 'string'
      && Array.isArray(existing.tags)
      && existing.tags.length > 0
    if (hasAll) { skipped.push({ path: rel, reason: 'complete' }); continue }

    const legacy = typeof existing.legacy === 'object' && existing.legacy !== null
      ? existing.legacy as Record<string, unknown>
      : {}
    const type = typeof existing.type === 'string' && (DOC_TYPES as readonly string[]).includes(existing.type)
      ? existing.type as DocType
      : inferType(rel, { ...existing, ...legacy })
    const slug = typeof existing.slug === 'string' && SLUG_RE.test(existing.slug)
      ? existing.slug
      : inferSlug(rel, type)
    const id = typeof existing.id === 'string' ? existing.id : slug
    const title = typeof existing.title === 'string' ? existing.title
      : content.title ?? slug
    const existingTags = Array.isArray(existing.tags)
      ? (existing.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : []
    const tags = inferTags(rel, { ...existing, ...legacy }, existingTags)

    const today = new Date().toISOString().slice(0, 10)
    const created = typeof existing.created === 'string' ? existing.created
      : (await inferCreatedFromGit(`docs/${rel}`)) ?? today
    const updated = typeof existing.updated === 'string' ? existing.updated
      : today

    const plan: BackfillPlan = {
      path: rel,
      inferred: { id, type, slug, title, tags, created, updated },
      hasExistingFrontmatter: content.hasFrontmatterBlock,
      existingFieldKeys: existingKeys,
    }
    changed.push(plan)
    PREPARED_CONTENT.set(rel, buildOutput(source, existing, plan.inferred))
  }

  return { total: files.length, changed, skipped }
}

function buildOutput(
  source: string,
  existing: Record<string, unknown>,
  inferred: BackfillPlan['inferred'],
): string {
  const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/
  const fm = FRONTMATTER_RE.exec(source)
  const body = fm ? fm[2] : source

  const merged: Record<string, unknown> = {
    id: inferred.id,
    type: inferred.type,
    slug: inferred.slug,
    title: inferred.title,
    tags: inferred.tags,
    created: inferred.created,
    updated: inferred.updated,
  }
  // optional fields preserve if present — status는 enum 매핑
  const VALID_STATUS = new Set(['open', 'in_progress', 'consumed', 'merged', 'archived'])
  const LEGACY_STATUS_MAP: Record<string, string> = {
    active: 'open',
    pending: 'open',
    wip: 'in_progress',
    done: 'merged',
    closed: 'archived',
    superseded: 'archived',
  }
  if (existing.status !== undefined) {
    const raw = typeof existing.status === 'string' ? existing.status.toLowerCase() : null
    if (raw && VALID_STATUS.has(raw)) {
      merged.status = raw
    } else if (raw && LEGACY_STATUS_MAP[raw]) {
      merged.status = LEGACY_STATUS_MAP[raw]
      // 원본 값은 legacy로 보존
      const legacy = (merged.legacy as Record<string, unknown> | undefined) ?? {}
      merged.legacy = { ...legacy, legacy_status: existing.status }
    } else {
      // 알 수 없는 status → legacy로 격리, canonical 비움
      const legacy = (merged.legacy as Record<string, unknown> | undefined) ?? {}
      merged.legacy = { ...legacy, legacy_status: existing.status }
    }
  }
  for (const k of ['summary', 'project', 'layer', 'consumed_by', 'legacy'] as const) {
    if (existing[k] !== undefined && merged[k] === undefined) merged[k] = existing[k]
  }

  const lines = ['---']
  for (const [k, v] of Object.entries(merged)) lines.push(formatYaml(k, v, 0))
  lines.push('---')
  return lines.join('\n') + '\n' + body.replace(/^\n+/, '')
}

function formatYaml(key: string, value: unknown, indent: number): string {
  const pad = '  '.repeat(indent)
  if (value === null) return `${pad}${key}: null`
  if (typeof value === 'string') return `${pad}${key}: ${yamlScalar(value)}`
  if (typeof value === 'number' || typeof value === 'boolean') return `${pad}${key}: ${value}`
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}${key}: []`
    const items = value.map((v) => typeof v === 'string' ? yamlScalar(v) : String(v))
    return `${pad}${key}: [${items.join(', ')}]`
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
  // docs/ scope만 체크: 이미 staged/modified 상태라도 backfill은 frontmatter만 추가하여 git diff로 검토 가능
  if (!dryRun) {
    const dirty = execSync('git status --porcelain --untracked-files=no docs/', { cwd: PROJECT_ROOT, encoding: 'utf8' })
    const dirtyDocs = dirty.split('\n')
      .filter((l) => l.trim() && !l.endsWith('.md.bak'))
      .filter((l) => l.length > 0)
    if (dirtyDocs.length > 0) {
      throw new Error(
        `backfill: docs/ has uncommitted changes — commit or stash first.\n`
        + dirtyDocs.slice(0, 5).join('\n'),
      )
    }
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
