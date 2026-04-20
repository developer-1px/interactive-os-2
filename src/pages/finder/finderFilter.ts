import type { NormalizedData, Entity } from '@os/store/types'

export type KindGroup = 'code' | 'doc' | 'media' | 'config'

export interface FilterSpec {
  kinds?: KindGroup[]
  extensions?: string[]
}

const KIND_EXT_MAP: Record<KindGroup, string[]> = {
  code:   ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'rs', 'go', 'java', 'rb', 'php', 'css', 'scss', 'sass', 'html', 'vue', 'svelte'],
  doc:    ['md', 'mdx', 'txt', 'pdf', 'rst', 'adoc'],
  media:  ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg'],
  config: ['json', 'yaml', 'yml', 'toml', 'lock', 'env', 'ini', 'xml'],
}

function getExt(name: string): string {
  return name.includes('.') ? (name.split('.').pop() ?? '').toLowerCase() : ''
}

export function filterStore(
  store: NormalizedData,
  spec: FilterSpec,
): NormalizedData {
  const { kinds, extensions } = spec
  const hasKinds = kinds != null && kinds.length > 0
  const hasExts = extensions != null && extensions.length > 0
  if (!hasKinds && !hasExts) return store

  const allowedExts = new Set<string>()
  if (hasKinds) {
    for (const kind of kinds!) {
      for (const ext of KIND_EXT_MAP[kind]) allowedExts.add(ext)
    }
  }

  const kept = new Set<string>()

  function matches(entity: Entity): boolean {
    const data = entity.data as Record<string, unknown> | undefined
    // path는 mddb title 치환 전의 원본 파일명이라 확장자 추출에 안전하다.
    // name은 treeToStore에서 frontmatter.title로 대체될 수 있어 확장자가 사라질 수 있다.
    const source = (data?.path as string | undefined) ?? (data?.name as string | undefined)
    if (!source) return false
    const basename = source.includes('/') ? source.slice(source.lastIndexOf('/') + 1) : source
    const ext = getExt(basename)
    if (hasKinds && allowedExts.has(ext)) return true
    if (hasExts && extensions!.some(e => basename.endsWith(e))) return true
    return false
  }

  function walk(id: string): boolean {
    const entity = store.entities[id]
    if (!entity) return false

    const type = (entity.data as Record<string, unknown> | undefined)?.type
    if (type === 'directory') {
      const children = store.relationships[id] ?? []
      let hasMatch = false
      for (const childId of children) {
        if (walk(childId)) hasMatch = true
      }
      if (hasMatch) { kept.add(id); return true }
      return false
    }

    if (matches(entity)) { kept.add(id); return true }
    return false
  }

  for (const rootId of store.relationships['__root__'] ?? []) {
    walk(rootId)
  }

  const entities: Record<string, Entity> = {}
  for (const [id, entity] of Object.entries(store.entities)) {
    if (id.startsWith('__') || kept.has(id)) {
      entities[id] = entity
    }
  }

  const relationships: Record<string, string[]> = {}
  for (const [parentId, children] of Object.entries(store.relationships)) {
    relationships[parentId] = children.filter(id => kept.has(id))
  }

  return { ...store, entities, relationships }
}
