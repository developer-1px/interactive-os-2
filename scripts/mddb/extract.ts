// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * extract orchestrator — content + git → ExtractResult.
 *
 * 2026-04-19 재설계: tags 소스를 frontmatter.tags로만 단일화 (하단 hashtag 파서 폐기).
 *
 * @invariant 우선순위: explicit > content > git > filename > mtime
 * @invariant tags는 explicit.tags 만 (frontmatter SSOT)
 * @invariant type/slug 필수 — explicit 없으면 filename에서 추론
 * @invariant date-path-mismatch warn 시 frontmatter는 그대로 (relocate가 처리)
 * @invariant memory/ 경로는 throw (defense in depth)
 */
import { readFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import {
  DocFrontmatterSchema,
  SOURCE_CONFIDENCE,
  LEGACY_FIELD_RENAMES,
  DOC_TYPES,
  SLUG_RE,
} from './schema.ts'
import type {
  DocFrontmatter,
  DocType,
  ExtractResult,
  ExtractSource,
  ExtractWarning,
  FieldProvenance,
} from './schema.ts'
import {
  DOCS_ROOT,
  PROJECT_ROOT,
  isDocsMd,
  isMemoryPath,
  toRelDocsPath,
  walkDocsMd,
  parseDatePath,
} from './paths.ts'
import { extractPath } from './extractPath.ts'
import type { PathExtract } from './extractPath.ts'
import { extractGitDates } from './extractGitDates.ts'
import type { GitDates } from './extractGitDates.ts'
import { extractContent } from './extractContent.ts'
import type { ContentExtract } from './extractContent.ts'

const CORE_FIELD_KEYS = [
  'id', 'type', 'slug', 'title', 'tags', 'created', 'updated',
  'summary', 'status', 'project', 'layer', 'consumed_by', 'legacy',
] as const satisfies readonly (keyof DocFrontmatter)[]

function slugFromFilename(relPath: string): string {
  const stem = basename(relPath).replace(/\.md$/i, '')
  // 순번 prefix / [tag] prefix / 날짜 prefix-suffix 제거
  const cleaned = stem
    .replace(/^\d{2,3}-/, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/[-_]?\d{4}-\d{2}-\d{2}[-_]?/g, '')
    .replace(/^-+|-+$/g, '')
  // kebab → camel
  const camel = cleaned.replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())
  // 영문 시작 보장
  return camel.replace(/^[^a-zA-Z]+/, '').replace(/^(.)/, (c) => c.toLowerCase())
    || 'note'
}

function inferTypeFromFilename(filename: string): DocType {
  if (/^handoff-\d{4}-\d{2}-\d{2}/i.test(filename)) return 'handoff'
  if (/-prd\.md$/i.test(filename) || /Prd\.md$/.test(filename)) return 'prd'
  if (/-plan\.md$/i.test(filename) || /Plan\.md$/.test(filename)) return 'plan'
  if (/^pyramid-/i.test(filename)) return 'pyramid'
  if (/^minto-/i.test(filename)) return 'minto'
  if (/^explain-/i.test(filename)) return 'explain'
  if (/^retro-/i.test(filename)) return 'retro'
  if (/^audit-|-audit\.md$/i.test(filename)) return 'audit'
  if (/^backlog-|-backlog\.md$/i.test(filename)) return 'backlog'
  return 'note'
}

function setProv(
  prov: Partial<Record<keyof DocFrontmatter, FieldProvenance>>,
  key: keyof DocFrontmatter,
  value: unknown,
  source: ExtractSource,
): void {
  prov[key] = { value, source, confidence: SOURCE_CONFIDENCE[source] }
}

/**
 * Pure builder. explicit > content > git > filename > mtime priority.
 */
export function buildFrontmatterByPriority(input: {
  explicit: Record<string, unknown>
  content: ContentExtract
  path: PathExtract
  git: GitDates
  relPath: string
}): [DocFrontmatter, Partial<Record<keyof DocFrontmatter, FieldProvenance>>] {
  const { explicit, content, path, git, relPath } = input
  const prov: Partial<Record<keyof DocFrontmatter, FieldProvenance>> = {}
  const filenameStem = basename(relPath).replace(/\.md$/i, '')

  // legacy rename 전처리
  const explicitCanonical: Record<string, unknown> = {}
  const legacyBucket: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(explicit)) {
    if ((CORE_FIELD_KEYS as readonly string[]).includes(k)) {
      explicitCanonical[k] = v
      continue
    }
    const rename = LEGACY_FIELD_RENAMES[k]
    if (rename) {
      if (explicitCanonical[rename] === undefined && explicit[rename] === undefined) {
        explicitCanonical[rename] = v
      }
      legacyBucket[k] = v
    } else {
      legacyBucket[k] = v
    }
  }
  if (explicit.legacy && typeof explicit.legacy === 'object' && !Array.isArray(explicit.legacy)) {
    Object.assign(legacyBucket, explicit.legacy as Record<string, unknown>)
  }

  // ── id ──
  let id: string
  if (typeof explicitCanonical.id === 'string' && explicitCanonical.id.length > 0) {
    id = explicitCanonical.id
    setProv(prov, 'id', id, 'explicit')
  } else {
    id = filenameStem
    setProv(prov, 'id', id, 'filename')
  }

  // ── type ──
  let type: DocType
  if (typeof explicitCanonical.type === 'string'
    && (DOC_TYPES as readonly string[]).includes(explicitCanonical.type)) {
    type = explicitCanonical.type as DocType
    setProv(prov, 'type', type, 'explicit')
  } else {
    type = inferTypeFromFilename(basename(relPath))
    setProv(prov, 'type', type, 'filename')
  }

  // ── slug ──
  let slug: string
  if (typeof explicitCanonical.slug === 'string' && SLUG_RE.test(explicitCanonical.slug)) {
    slug = explicitCanonical.slug
    setProv(prov, 'slug', slug, 'explicit')
  } else {
    slug = slugFromFilename(relPath)
    setProv(prov, 'slug', slug, 'filename')
  }

  // ── title ──
  let title: string
  if (typeof explicitCanonical.title === 'string' && explicitCanonical.title.length > 0) {
    title = explicitCanonical.title
    setProv(prov, 'title', title, 'explicit')
  } else if (content.title && content.title.length > 0) {
    title = content.title
    setProv(prov, 'title', title, 'content')
  } else {
    title = filenameStem
    setProv(prov, 'title', title, 'filename')
  }

  // ── created ──
  let created: string
  if (typeof explicitCanonical.created === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(explicitCanonical.created)) {
    created = explicitCanonical.created
    setProv(prov, 'created', created, 'explicit')
  } else if (git.source === 'git') {
    created = git.created
    setProv(prov, 'created', created, 'git')
  } else if (path.createdFromFilename) {
    created = path.createdFromFilename
    setProv(prov, 'created', created, 'filename')
  } else {
    created = git.created
    setProv(prov, 'created', created, git.source === 'mtime' ? 'mtime' : 'filename')
  }

  // ── updated ──
  let updated: string
  if (typeof explicitCanonical.updated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(explicitCanonical.updated)) {
    updated = explicitCanonical.updated
    setProv(prov, 'updated', updated, 'explicit')
  } else if (git.source === 'git') {
    updated = git.updated
    setProv(prov, 'updated', updated, 'git')
  } else {
    updated = git.updated
    setProv(prov, 'updated', updated, git.source === 'mtime' ? 'mtime' : 'filename')
  }

  // ── summary ──
  let summary: string | undefined
  if (typeof explicitCanonical.summary === 'string' && explicitCanonical.summary.length > 0) {
    summary = explicitCanonical.summary
    setProv(prov, 'summary', summary, 'explicit')
  }

  // ── tags ── explicit.tags만 (하단 hashtag 파서 폐기)
  let tags: string[] = []
  if (Array.isArray(explicitCanonical.tags)) {
    tags = (explicitCanonical.tags as unknown[])
      .filter((t): t is string => typeof t === 'string')
    setProv(prov, 'tags', tags, 'explicit')
  } else {
    setProv(prov, 'tags', tags, 'filename')
  }

  // ── status / project / layer / consumed_by ──
  const status = typeof explicitCanonical.status === 'string' ? explicitCanonical.status : undefined
  const project = typeof explicitCanonical.project === 'string' ? explicitCanonical.project : undefined
  const layer = typeof explicitCanonical.layer === 'string' ? explicitCanonical.layer : undefined
  const consumed_by = typeof explicitCanonical.consumed_by === 'string' ? explicitCanonical.consumed_by : undefined

  // ── legacy ──
  const legacy = Object.keys(legacyBucket).length > 0 ? legacyBucket : undefined
  if (legacy) setProv(prov, 'legacy', legacy, 'explicit')

  const frontmatter: DocFrontmatter = {
    id,
    type,
    slug,
    title,
    tags,
    created,
    updated,
    ...(summary !== undefined && { summary }),
    ...(status !== undefined && { status: status as DocFrontmatter['status'] }),
    ...(project !== undefined && { project }),
    ...(layer !== undefined && { layer }),
    ...(consumed_by !== undefined && { consumed_by }),
    ...(legacy !== undefined && { legacy }),
  }

  return [frontmatter, prov]
}

export async function extractFile(relPath: string): Promise<ExtractResult> {
  if (!isDocsMd(relPath) || isMemoryPath(relPath)) {
    throw new Error(`out of mddb scope: ${relPath}`)
  }

  const docsRel = toRelDocsPath(relPath)
  const absPath = resolve(DOCS_ROOT, docsRel)
  const warnings: ExtractWarning[] = []

  let source: string
  try {
    source = await readFile(absPath, 'utf8')
  } catch (e) {
    warnings.push({
      code: 'schema-invalid',
      severity: 'error',
      message: `readFile failed: ${(e as Error).message}`,
    })
    source = ''
  }

  const content = extractContent(source)
  if (!content.hasFrontmatterBlock) {
    warnings.push({
      code: 'missing-frontmatter',
      severity: 'info',
      message: 'no frontmatter block (--- ... ---) found',
    })
  }
  if (content.frontmatterParseError) {
    warnings.push({
      code: 'schema-invalid',
      severity: 'error',
      message: `yaml parse: ${content.frontmatterParseError}`,
    })
  }

  const path = extractPath(docsRel)
  const git = await extractGitDates(absPath, {
    fallbackFromFilename: path.createdFromFilename,
    cwd: PROJECT_ROOT,
  })

  const explicit = content.rawFrontmatter ?? {}
  const [frontmatter, provenance] = buildFrontmatterByPriority({
    explicit,
    content,
    path,
    git,
    relPath: docsRel,
  })

  if (frontmatter.legacy && Object.keys(frontmatter.legacy).length > 0) {
    warnings.push({
      code: 'legacy-field-preserved',
      severity: 'info',
      message: `preserved legacy fields: ${Object.keys(frontmatter.legacy).join(', ')}`,
    })
  }

  // date-path-mismatch — 파일이 YYYY/YYYY-MM/YYYY-MM-DD/ 아래 있지 않으면 warn
  const datePath = parseDatePath(docsRel)
  if (!datePath) {
    warnings.push({
      code: 'date-path-mismatch',
      severity: 'warn',
      message: `not under YYYY/YYYY-MM/YYYY-MM-DD/ — relocate pending`,
    })
  } else if (datePath.day !== frontmatter.created) {
    warnings.push({
      code: 'date-path-mismatch',
      severity: 'info',
      message: `path day=${datePath.day} != created=${frontmatter.created}`,
    })
  }

  if (git.source === 'mtime' && !(provenance.created?.source === 'explicit')) {
    warnings.push({
      code: 'untracked-mtime-fallback',
      field: 'created',
      severity: 'info',
      message: 'git log unavailable, using fs.mtime',
    })
  }

  if (frontmatter.created > frontmatter.updated) {
    warnings.push({
      code: 'created-after-updated',
      field: 'updated',
      severity: 'warn',
      message: `created=${frontmatter.created} > updated=${frontmatter.updated}, auto-corrected`,
    })
    frontmatter.updated = frontmatter.created
  }

  // slug-filename-mismatch
  if (frontmatter.slug && basename(docsRel).replace(/\.md$/i, '') !== frontmatter.slug) {
    const filenameSlug = slugFromFilename(docsRel)
    if (filenameSlug !== frontmatter.slug) {
      warnings.push({
        code: 'slug-filename-mismatch',
        field: 'slug',
        severity: 'warn',
        message: `slug=${frontmatter.slug} != filename-derived=${filenameSlug}`,
      })
    }
  }

  const parsed = DocFrontmatterSchema.safeParse(frontmatter)
  const finalFm = parsed.success ? parsed.data : (frontmatter as DocFrontmatter)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const p = issue.path.join('.')
      const code: ExtractWarning['code'] =
        p === 'type' ? 'missing-type'
        : p === 'slug' ? 'missing-slug'
        : p === 'tags' ? 'missing-tags'
        : 'schema-invalid'
      warnings.push({
        code,
        severity: 'error',
        message: `${p}: ${issue.message}`,
      })
    }
  }

  return {
    path: docsRel,
    frontmatter: finalFm,
    provenance,
    warnings,
  }
}

export async function extractAll(
  opts?: { concurrency?: number; root?: string },
): Promise<ExtractResult[]> {
  const root = opts?.root ?? DOCS_ROOT
  const concurrency = opts?.concurrency ?? 8
  const all = walkDocsMd(root)

  const results: ExtractResult[] = []
  let idx = 0
  const worker = async () => {
    while (idx < all.length) {
      const i = idx++
      const relPath = all[i]
      try {
        results[i] = await extractFile(relPath)
      } catch (e) {
        results[i] = {
          path: relPath,
          frontmatter: fallbackFrontmatter(relPath),
          provenance: {},
          warnings: [{
            code: 'schema-invalid',
            severity: 'error',
            message: `extractFile threw: ${(e as Error).message}`,
          }],
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()))
  return results.filter(Boolean)
}

/**
 * Extract frontmatter only (no git, no file IO for path).
 * Used by hook that receives content string directly.
 */
export function extractFrontmatter(source: string): {
  rawFrontmatter: Record<string, unknown> | undefined
  body: string
  hasFrontmatterBlock: boolean
  frontmatterParseError?: string
} {
  const c = extractContent(source)
  return {
    rawFrontmatter: c.rawFrontmatter,
    body: c.body,
    hasFrontmatterBlock: c.hasFrontmatterBlock,
    frontmatterParseError: c.frontmatterParseError,
  }
}

function fallbackFrontmatter(relPath: string): DocFrontmatter {
  const today = new Date().toISOString().slice(0, 10)
  const filename = basename(relPath).replace(/\.md$/i, '')
  return {
    id: filename,
    type: inferTypeFromFilename(basename(relPath)),
    slug: slugFromFilename(relPath),
    title: filename,
    tags: ['untagged'],
    created: today,
    updated: today,
  }
}
