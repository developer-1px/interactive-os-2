// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * extract orchestrator — path + git + content → ExtractResult.
 *
 * @invariant explicit > content > filename > folder > git > mtime > default (§4.0)
 * @invariant explicit 값이 있으면 해당 필드 source='explicit' + confidence='high'
 * @invariant provenance의 키 집합 === frontmatter의 확정 필드 집합
 * @invariant memory/ 경로는 throw (defense in depth)
 * @invariant Zod safeParse 실패 시 best-effort 부분 복구 + warning 'schema-invalid'
 */
import { readFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import {
  DocFrontmatterSchema,
  SOURCE_CONFIDENCE,
  STATUS_VALUES,
  KIND_VALUES,
  LEGACY_FIELD_RENAMES,
  FOLDER_STATUS_MAP,
} from './schema.ts'
import type {
  DocFrontmatter,
  DocStatus,
  DocKind,
  ExtractResult,
  ExtractSource,
  ExtractWarning,
  FieldProvenance,
} from './schema.ts'
import { DOCS_ROOT, PROJECT_ROOT, isDocsMd, isMemoryPath, toRelDocsPath, walkDocsMd, folder0 } from './paths.ts'
import { extractPath } from './extractPath.ts'
import type { PathExtract } from './extractPath.ts'
import { extractGitDates } from './extractGitDates.ts'
import type { GitDates } from './extractGitDates.ts'
import { extractContent } from './extractContent.ts'
import type { ContentExtract } from './extractContent.ts'

const CORE_FIELD_KEYS = [
  'id', 'title', 'status', 'kind', 'created', 'updated',
  'summary', 'topics', 'parent', 'relates', 'supersedes', 'superseded_by', 'legacy',
] as const satisfies readonly (keyof DocFrontmatter)[]

function isStatus(x: unknown): x is DocStatus {
  return typeof x === 'string' && (STATUS_VALUES as readonly string[]).includes(x)
}
function isKind(x: unknown): x is DocKind {
  return typeof x === 'string' && (KIND_VALUES as readonly string[]).includes(x)
}

function slugFromPath(relPath: string): string {
  // '{folder0}/{filename-without-ext}' 상대 경로 slug
  const withoutExt = relPath.replace(/\.md$/i, '')
  return withoutExt
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
 * §4.0 L0 체인의 단일 소비자. 순수 함수.
 *
 * @invariant 우선순위: explicit > content > filename > folder > git > mtime > default
 * @invariant 반환 tuple[1]의 키 === tuple[0]의 확정 필드 집합
 * @invariant pure — FS/git/network IO 없음
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
  const filename = basename(relPath)
  const filenameStem = filename.replace(/\.md$/i, '')

  // legacy rename 전처리: explicit의 legacy 필드를 코어 필드로 흡수
  // (단, 기존 코어 필드가 이미 있으면 덮어쓰지 않음)
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
        // legacy → core 정규화
        if (rename === 'topics') {
          // tags 는 array concat — 기존 topics 값이 있으면 추후 병합
          const cur = explicitCanonical[rename]
          const toAdd = Array.isArray(v) ? v : [v]
          explicitCanonical[rename] = Array.isArray(cur) ? [...(cur as unknown[]), ...toAdd] : toAdd
        } else {
          explicitCanonical[rename] = v
        }
        // 동시에 legacy에도 원본 보존 (투명성)
        legacyBucket[k] = v
      } else {
        legacyBucket[k] = v
      }
    } else {
      legacyBucket[k] = v
    }
  }
  // 기존 explicit.legacy 병합
  if (explicit.legacy && typeof explicit.legacy === 'object' && !Array.isArray(explicit.legacy)) {
    Object.assign(legacyBucket, explicit.legacy as Record<string, unknown>)
  }

  // ── id ──
  let id: string
  if (typeof explicitCanonical.id === 'string' && explicitCanonical.id.length > 0) {
    id = explicitCanonical.id
    setProv(prov, 'id', id, 'explicit')
  } else {
    id = slugFromPath(relPath)
    setProv(prov, 'id', id, 'filename')
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

  // ── status ──
  let status: DocStatus
  if (isStatus(explicitCanonical.status)) {
    status = explicitCanonical.status
    setProv(prov, 'status', status, 'explicit')
  } else {
    status = path.status
    setProv(prov, 'status', status, 'folder')
  }

  // ── kind ──
  let kind: DocKind
  if (isKind(explicitCanonical.kind)) {
    kind = explicitCanonical.kind
    setProv(prov, 'kind', kind, 'explicit')
  } else if (path.provenance.kind.source === 'filename') {
    kind = path.kind
    setProv(prov, 'kind', kind, 'filename')
  } else {
    kind = 'note'
    setProv(prov, 'kind', kind, 'default')
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
  } else if (content.summary) {
    summary = content.summary
    setProv(prov, 'summary', summary, 'content')
  }

  // ── topics ── (union: explicit + body tags + filename tags + folder0)
  const topicSet = new Set<string>()
  if (Array.isArray(explicitCanonical.topics)) {
    for (const t of explicitCanonical.topics as unknown[]) {
      if (typeof t === 'string') topicSet.add(t.toLowerCase())
    }
  }
  for (const t of content.tagsFromBody) topicSet.add(t.toLowerCase())
  for (const t of path.topics) topicSet.add(t.toLowerCase())
  const topics = Array.from(topicSet).sort()
  if (topics.length > 0) {
    // explicit이 있었으면 explicit, 아니면 content/filename 중 우선순위 높은 것
    const src: ExtractSource =
      Array.isArray(explicitCanonical.topics) && (explicitCanonical.topics as unknown[]).length > 0
        ? 'explicit'
        : content.tagsFromBody.length > 0
          ? 'content'
          : path.topics.length > 0
            ? 'filename'
            : 'default'
    setProv(prov, 'topics', topics, src)
  } else {
    setProv(prov, 'topics', topics, 'default')
  }

  // ── parent ──
  let parent: string | undefined
  if (typeof explicitCanonical.parent === 'string' && explicitCanonical.parent.length > 0) {
    parent = explicitCanonical.parent
    setProv(prov, 'parent', parent, 'explicit')
  }

  // ── relates / supersedes / superseded_by ── explicit만
  const relates = Array.isArray(explicitCanonical.relates)
    ? (explicitCanonical.relates as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  if (relates.length > 0) setProv(prov, 'relates', relates, 'explicit')
  else setProv(prov, 'relates', relates, 'default')

  const supersedes = Array.isArray(explicitCanonical.supersedes)
    ? (explicitCanonical.supersedes as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  if (supersedes.length > 0) setProv(prov, 'supersedes', supersedes, 'explicit')
  else setProv(prov, 'supersedes', supersedes, 'default')

  let supersededBy: string | undefined
  if (typeof explicitCanonical.superseded_by === 'string' && explicitCanonical.superseded_by.length > 0) {
    supersededBy = explicitCanonical.superseded_by
    setProv(prov, 'superseded_by', supersededBy, 'explicit')
  }

  // ── legacy ──
  const legacy = Object.keys(legacyBucket).length > 0 ? legacyBucket : undefined
  if (legacy) setProv(prov, 'legacy', legacy, 'explicit')

  const frontmatter: DocFrontmatter = {
    id,
    title,
    status,
    kind,
    created,
    updated,
    summary,
    topics,
    parent,
    relates,
    supersedes,
    superseded_by: supersededBy,
    legacy,
  }

  return [frontmatter, prov]
}

export async function extractFile(relPath: string): Promise<ExtractResult> {
  // 1. 스코프 가드 (불변식 #8)
  if (!isDocsMd(relPath) || isMemoryPath(relPath)) {
    throw new Error(`out of mddb scope: ${relPath}`)
  }

  // relPath: absolute | 'docs/..' | docs-relative ('0-inbox/..')
  const docsRel = toRelDocsPath(relPath)
  const absPath = resolve(DOCS_ROOT, docsRel)
  const warnings: ExtractWarning[] = []

  // 2. 파일 읽기
  let source: string
  try {
    source = await readFile(absPath, 'utf8')
  } catch (e) {
    // 파일 없음 — 빈 content로 처리 (테스트/훅 케이스)
    warnings.push({
      code: 'schema-invalid',
      severity: 'error',
      message: `readFile failed: ${(e as Error).message}`,
    })
    source = ''
  }

  // 3. 3개 source 수집
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

  // 4. explicit = content.rawFrontmatter (있으면)
  const explicit = content.rawFrontmatter ?? {}

  // 5. 필드별 L0 체인 → frontmatter + provenance
  const [frontmatter, provenance] = buildFrontmatterByPriority({
    explicit,
    content,
    path,
    git,
    relPath: docsRel,
  })

  // 6. legacy-field-preserved warning
  if (frontmatter.legacy && Object.keys(frontmatter.legacy).length > 0) {
    warnings.push({
      code: 'legacy-field-preserved',
      severity: 'info',
      message: `preserved legacy fields: ${Object.keys(frontmatter.legacy).join(', ')}`,
    })
  }

  // 7. status-folder-mismatch / kind-filename-mismatch
  if (typeof explicit.status === 'string' && explicit.status !== path.status) {
    warnings.push({
      code: 'status-folder-mismatch',
      field: 'status',
      severity: 'warn',
      message: `explicit=${String(explicit.status)} folder=${path.status}`,
    })
  }
  if (
    typeof explicit.kind === 'string' &&
    path.provenance.kind.source === 'filename' &&
    explicit.kind !== path.kind
  ) {
    warnings.push({
      code: 'kind-filename-mismatch',
      field: 'kind',
      severity: 'warn',
      message: `explicit=${String(explicit.kind)} filename=${path.kind}`,
    })
  }

  // 8. untracked-mtime-fallback
  if (git.source === 'mtime' && !(provenance.created?.source === 'explicit')) {
    warnings.push({
      code: 'untracked-mtime-fallback',
      field: 'created',
      severity: 'info',
      message: 'git log unavailable, using fs.mtime',
    })
  }

  // 9. created > updated 자동 보정 (불변식 #4)
  if (frontmatter.created > frontmatter.updated) {
    warnings.push({
      code: 'created-after-updated',
      field: 'updated',
      severity: 'warn',
      message: `created=${frontmatter.created} > updated=${frontmatter.updated}, auto-corrected`,
    })
    frontmatter.updated = frontmatter.created
  }

  // 10. future date check (today보다 미래) — informational
  const today = new Date().toISOString().slice(0, 10)
  if (frontmatter.created > today) {
    warnings.push({
      code: 'future-date',
      field: 'created',
      severity: 'warn',
      message: `created=${frontmatter.created} is in the future`,
    })
  }

  // 11. self-relate 제거 + warning
  if (frontmatter.relates.includes(frontmatter.id)) {
    warnings.push({
      code: 'self-relate',
      field: 'relates',
      severity: 'info',
      message: `relates contained self id, removed`,
    })
    frontmatter.relates = frontmatter.relates.filter((r) => r !== frontmatter.id)
  }

  // 12. Zod safeParse — 실패해도 best-effort
  const parsed = DocFrontmatterSchema.safeParse(frontmatter)
  const finalFm = parsed.success ? parsed.data : (frontmatter as DocFrontmatter)
  if (!parsed.success) {
    warnings.push({
      code: 'schema-invalid',
      severity: 'error',
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    })
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
  // 간단한 concurrency pool
  let idx = 0
  const worker = async () => {
    while (idx < all.length) {
      const i = idx++
      const relPath = all[i]
      try {
        const r = await extractFile(relPath)
        results[i] = r
      } catch (e) {
        results[i] = {
          path: relPath,
          frontmatter: fallbackFrontmatter(relPath),
          provenance: {},
          warnings: [
            {
              code: 'schema-invalid',
              severity: 'error',
              message: `extractFile threw: ${(e as Error).message}`,
            },
          ],
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

// fallback — Zod 통과 보장되는 최소 frontmatter (extract 실패 시)
function fallbackFrontmatter(relPath: string): DocFrontmatter {
  const folder = folder0(relPath)
  const status = FOLDER_STATUS_MAP[folder] ?? 'meta'
  const today = new Date().toISOString().slice(0, 10)
  const filename = basename(relPath).replace(/\.md$/i, '')
  return {
    id: relPath.replace(/\.md$/i, ''),
    title: filename,
    status,
    kind: 'note',
    created: today,
    updated: today,
    summary: undefined,
    topics: [],
    parent: undefined,
    relates: [],
    supersedes: [],
    superseded_by: undefined,
    legacy: undefined,
  }
}