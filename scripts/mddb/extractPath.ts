// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * Path-based extraction — folder → status, filename → kind/topics/createdFromFilename.
 *
 * @invariant pure synchronous (FS IO 없음)
 * @invariant status는 FOLDER_STATUS_MAP[folder0(relPath)]에서만 파생 (불변식 #2)
 * @invariant kind는 FILENAME_KIND_PATTERNS 배열 index 오름차순 첫 매치 우승
 * @invariant 매치 실패 시 kind='note' + source='default' + confidence='low'
 */
import type { DocStatus, DocKind, ExtractSource } from './schema.ts'
import {
  FOLDER_STATUS_MAP,
  FILENAME_KIND_PATTERNS,
  TAG_KIND_MAP,
  KIND_VALUES,
} from './schema.ts'
import { folder0 } from './paths.ts'
import { basename } from 'node:path'

type PathProvenanceEntry = {
  source: ExtractSource
  confidence: 'high' | 'medium' | 'low'
}

export type PathExtract = {
  status: DocStatus
  kind: DocKind
  topics: string[]
  createdFromFilename?: string
  sortIndex?: number
  provenance: {
    status: PathProvenanceEntry
    kind: PathProvenanceEntry
    topics: PathProvenanceEntry
    created?: PathProvenanceEntry
  }
}

function isKind(x: string): x is DocKind {
  return (KIND_VALUES as readonly string[]).includes(x)
}

export function extractPath(relPath: string): PathExtract {
  const folder = folder0(relPath)
  const filename = basename(relPath)

  // ── status ──
  const status: DocStatus = FOLDER_STATUS_MAP[folder] ?? 'meta'

  // ── kind + filename topics + createdFromFilename ──
  let kind: DocKind = 'note'
  let kindSource: ExtractSource = 'default'
  let kindConfidence: 'high' | 'medium' | 'low' = 'low'
  const filenameTopics: string[] = []
  let createdFromFilename: string | undefined
  let sortIndex: number | undefined

  for (const pat of FILENAME_KIND_PATTERNS) {
    const m = filename.match(pat.regex)
    if (!m) continue

    // extract 콜백 우선 수행 (topics/createdFromFilename/sortIndex)
    if (pat.extract) {
      const ex = pat.extract(m)
      if (ex.topics) filenameTopics.push(...ex.topics)
      if (ex.createdFromFilename) createdFromFilename = ex.createdFromFilename
      if (ex.sortIndex !== undefined) sortIndex = ex.sortIndex
    }

    if (pat.kind === 'tag-lookup') {
      // §1.3.2 우선순위 6 — topics[0]이 태그, TAG_KIND_MAP으로 재귀 조회
      const tag = filenameTopics[0]
      if (tag && TAG_KIND_MAP[tag]) {
        kind = TAG_KIND_MAP[tag]
        kindSource = 'filename'
        kindConfidence = 'high'
      } else {
        // 매핑 없으면 kind='note' + topics에만 태그 보존
        kind = 'note'
        kindSource = 'default'
        kindConfidence = 'low'
      }
    } else if (isKind(pat.kind)) {
      kind = pat.kind
      kindSource = 'filename'
      kindConfidence = 'high'
    }
    break
  }

  // ── topics ── filename tag + folder 이름 (lowercased, deduped)
  const topics = Array.from(
    new Set(
      [...filenameTopics, folder].filter(Boolean).map((t) => t.toLowerCase()),
    ),
  )

  // ── provenance ──
  const provenance: PathExtract['provenance'] = {
    status: { source: 'folder', confidence: 'high' },
    kind: { source: kindSource, confidence: kindConfidence },
    topics: {
      source: filenameTopics.length > 0 ? 'filename' : 'folder',
      confidence: 'high',
    },
  }
  if (createdFromFilename) {
    provenance.created = { source: 'filename', confidence: 'high' }
  }

  return {
    status,
    kind,
    topics,
    createdFromFilename,
    sortIndex,
    provenance,
  }
}
