// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * knowledgeTransform — MddbIndex → NormalizedData (Knowledge 가상 폴더).
 *
 * 2026-04-19 재설계: 새 frontmatter 스키마(type/tags/status)에 맞춰 groupBy 재정렬.
 *
 * @invariant group 노드 id = '{groupBy}:{key}' (파일 경로와 충돌 방지)
 * @invariant file 노드 id = '{groupId}::{absPath}' — group-scoped (한 파일이 복수 group에 속할 때 중복 방지)
 * @invariant file data.path = '{DEFAULT_ROOT}/docs/...' 절대 경로 (FilePanel → /api/fs/file 호환)
 * @invariant ROOT_ID 아래에 group만, group 아래에 file만 (depth 2)
 * @invariant group은 값 오름차순, file은 path 오름차순
 */
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'
import { DEFAULT_ROOT } from './types'
import type { MddbIndex, MddbIndexEntry, MddbFrontmatter } from './knowledgeFetch'

export type KnowledgeGroupBy = 'tag' | 'type' | 'status'

const NO_GROUP = '(none)'

function groupKeys(fm: MddbFrontmatter, groupBy: KnowledgeGroupBy): string[] {
  if (groupBy === 'tag') {
    return fm.tags.length > 0 ? fm.tags : [NO_GROUP]
  }
  if (groupBy === 'type') return [fm.type || NO_GROUP]
  return [fm.status || NO_GROUP]
}

function fileName(path: string): string {
  const segs = path.split('/')
  return segs[segs.length - 1] ?? path
}

export function indexToTree(
  index: MddbIndex,
  groupBy: KnowledgeGroupBy,
): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  const groupFiles = new Map<string, MddbIndexEntry[]>()

  for (const entry of index.entries) {
    const keys = groupKeys(entry.frontmatter, groupBy)
    for (const key of keys) {
      const bucket = groupFiles.get(key)
      if (bucket) bucket.push(entry)
      else groupFiles.set(key, [entry])
    }
  }

  const groupKeysSorted = Array.from(groupFiles.keys()).sort((a, b) => {
    if (a === NO_GROUP) return 1
    if (b === NO_GROUP) return -1
    return a.localeCompare(b)
  })

  for (const key of groupKeysSorted) {
    const groupId = `${groupBy}:${key}`
    entities[groupId] = {
      id: groupId,
      data: { name: key, type: 'directory', icon: 'folder', kind: 'group', path: groupId },
    }
    relationships[ROOT_ID].push(groupId)

    const files = (groupFiles.get(key) ?? [])
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))

    const childIds: string[] = []
    for (const entry of files) {
      const absPath = `${DEFAULT_ROOT}/${entry.path}`
      const fileId = `${groupId}::${absPath}`
      entities[fileId] = {
        id: fileId,
        data: {
          name: entry.frontmatter.title || fileName(entry.path),
          type: 'file',
          path: absPath,
          frontmatter: entry.frontmatter,
        },
      }
      childIds.push(fileId)
    }
    relationships[groupId] = childIds
  }

  return createStore({ entities, relationships })
}
