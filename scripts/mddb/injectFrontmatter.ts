// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * Frontmatter inject/merge — 기존 frontmatter 병합 + 본문 보존 + legacy 흡수.
 *
 * @invariant mergeStrategy='preserve-explicit' 시 기존 explicit 필드는 덮어쓰지 않는다
 * @invariant 본문(frontmatter 이외)은 byte-exact 보존 — markdown AST 왕복 금지
 * @invariant dryRun=true면 fs.writeFile 호출 0회
 * @invariant LEGACY_FIELD_RENAMES는 mergeFrontmatter 내부에서 처리
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { toRelDocsPath, isDocsMd, isMemoryPath, DOCS_ROOT } from './paths.ts'
import {
  DocFrontmatterSchema,
  LEGACY_FIELD_RENAMES,
} from './schema.ts'
import type { DocFrontmatter, ExtractResult } from './schema.ts'
import { extractContent, stringifyFrontmatter } from './extractContent.ts'

export type InjectOptions = {
  dryRun?: boolean
  mergeStrategy?: 'preserve-explicit' | 'overwrite'
}

export type InjectResult = {
  before: string
  after: string
  changed: boolean
  legacyAbsorbed: string[]
}

const CORE_ORDER: (keyof DocFrontmatter)[] = [
  'id', 'title', 'status', 'kind', 'created', 'updated',
  'summary', 'topics', 'parent', 'relates', 'supersedes', 'superseded_by', 'legacy',
]

/**
 * Pure merge — existing frontmatter + extracted → merged.
 *
 * @invariant 반환 merged는 DocFrontmatterSchema.parse 통과 가능
 * @invariant preserve-explicit: 기존 필드가 있으면 그대로, 없으면 extracted 사용
 * @invariant overwrite: extracted가 전부 승리 (legacy 호환 깨짐)
 */
export function mergeFrontmatter(
  existing: Record<string, unknown> | undefined,
  extracted: DocFrontmatter,
  strategy: 'preserve-explicit' | 'overwrite',
): { merged: DocFrontmatter; legacyAbsorbed: string[] } {
  const legacyAbsorbed: string[] = []

  if (strategy === 'overwrite' || !existing) {
    return { merged: extracted, legacyAbsorbed }
  }

  // preserve-explicit
  // 기존 필드 중 LEGACY_FIELD_RENAMES 대상은 코어 필드로 흡수
  // 기존 코어 필드가 있으면 유지 (extracted가 이미 그 값을 반영했어야 함)
  const merged: DocFrontmatter = { ...extracted }
  const legacyBucket: Record<string, unknown> = { ...(extracted.legacy ?? {}) }

  for (const [k, v] of Object.entries(existing)) {
    if ((CORE_ORDER as readonly string[]).includes(k)) {
      // 기존 코어 필드 — extracted보다 우선 (explicit)
      // 단, updated는 merge 후 갱신될 수 있으니 extracted 값 유지가 필요한 경우 있음
      // PRD: preserve-explicit은 "기존 explicit 필드 건드리지 않는다"
      ;(merged as Record<string, unknown>)[k] = v
      continue
    }
    const rename = LEGACY_FIELD_RENAMES[k]
    if (rename) {
      legacyBucket[k] = v
      legacyAbsorbed.push(k)
      // 해당 core 필드가 없으면 채움
      if ((merged as Record<string, unknown>)[rename] === undefined) {
        if (rename === 'topics' && Array.isArray(v)) {
          ;(merged as Record<string, unknown>)[rename] = Array.from(new Set((v as unknown[]).filter((x) => typeof x === 'string'))) as string[]
        } else if (typeof v === 'string') {
          ;(merged as Record<string, unknown>)[rename] = v
        }
      }
      continue
    }
    if (k === 'legacy') {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(legacyBucket, v as Record<string, unknown>)
      }
      continue
    }
    // 알 수 없는 필드 — legacy로 이동
    legacyBucket[k] = v
    legacyAbsorbed.push(k)
  }

  if (Object.keys(legacyBucket).length > 0) {
    merged.legacy = legacyBucket
  }
  return { merged, legacyAbsorbed }
}

function omitUndefined(fm: DocFrontmatter): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of CORE_ORDER) {
    const v = (fm as Record<string, unknown>)[k]
    if (v === undefined) continue
    if (Array.isArray(v) && v.length === 0 && (k === 'topics' || k === 'relates' || k === 'supersedes')) {
      // default 빈 배열 — 직렬화에는 포함 (Zod default 보존)
      out[k] = v
      continue
    }
    out[k] = v
  }
  return out
}

function resolveAbsPath(relOrAbs: string): string {
  if (relOrAbs.startsWith('/')) return relOrAbs
  const rel = toRelDocsPath(relOrAbs)
  return resolve(DOCS_ROOT, rel)
}

export async function injectFrontmatter(
  relPath: string,
  extracted: ExtractResult,
  opts?: InjectOptions,
): Promise<InjectResult> {
  if (!isDocsMd(relPath) || isMemoryPath(relPath)) {
    throw new Error(`injectFrontmatter: out of mddb scope: ${relPath}`)
  }
  const dryRun = opts?.dryRun ?? false
  const strategy = opts?.mergeStrategy ?? 'preserve-explicit'
  const absPath = resolveAbsPath(relPath)

  let before = ''
  try {
    before = await readFile(absPath, 'utf8')
  } catch {
    before = ''
  }
  const parsed = extractContent(before)

  const { merged, legacyAbsorbed } = mergeFrontmatter(
    parsed.rawFrontmatter,
    extracted.frontmatter,
    strategy,
  )

  // Zod parse — 실패해도 best-effort (validate 단계에서 warning)
  const zRes = DocFrontmatterSchema.safeParse(merged)
  const finalFm = zRes.success ? zRes.data : merged

  const after = stringifyFrontmatter(omitUndefined(finalFm), parsed.body)
  const changed = after !== before

  if (!dryRun && changed) {
    await writeFile(absPath, after, 'utf8')
  }

  return { before, after, changed, legacyAbsorbed }
}
