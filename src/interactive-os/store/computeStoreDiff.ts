import type { NormalizedData, Entity } from './types'

export interface StoreDiff {
  path: string
  kind: 'added' | 'removed' | 'changed'
  before?: unknown
  after?: unknown
}

function isMetaEntity(id: string): boolean {
  return id.startsWith('__')
}

export function computeStoreDiff(
  prev: NormalizedData,
  next: NormalizedData
): StoreDiff[] {
  if (prev === next) return []

  const diffs: StoreDiff[] = []

  // --- entities ---
  const prevIds = Object.keys(prev.entities)
  const nextIds = Object.keys(next.entities)
  const allIds = new Set([...prevIds, ...nextIds])

  for (const id of allIds) {
    const prevEntity = prev.entities[id]
    const nextEntity = next.entities[id]

    if (!prevEntity && nextEntity) {
      if (isMetaEntity(id)) {
        for (const [key, val] of Object.entries(nextEntity)) {
          if (key === 'id') continue
          diffs.push({ path: `${id}.${key}`, kind: 'added', after: val })
        }
      } else {
        diffs.push({ path: 'entities', kind: 'added', after: nextEntity })
      }
    } else if (prevEntity && !nextEntity) {
      if (isMetaEntity(id)) {
        for (const [key, val] of Object.entries(prevEntity)) {
          if (key === 'id') continue
          diffs.push({ path: `${id}.${key}`, kind: 'removed', before: val })
        }
      } else {
        diffs.push({ path: 'entities', kind: 'removed', before: prevEntity })
      }
    } else if (prevEntity && nextEntity && prevEntity !== nextEntity) {
      if (isMetaEntity(id)) {
        const allKeys = new Set([
          ...Object.keys(prevEntity),
          ...Object.keys(nextEntity),
        ])
        for (const key of allKeys) {
          if (key === 'id') continue
          const pv = prevEntity[key]
          const nv = nextEntity[key]
          if (pv !== nv) {
            if (pv === undefined) {
              diffs.push({ path: `${id}.${key}`, kind: 'added', after: nv })
            } else if (nv === undefined) {
              diffs.push({ path: `${id}.${key}`, kind: 'removed', before: pv })
            } else {
              diffs.push({ path: `${id}.${key}`, kind: 'changed', before: pv, after: nv })
            }
          }
        }
      } else {
        diffs.push({ path: 'entities', kind: 'changed', before: prevEntity, after: nextEntity })
      }
    }
  }

  // --- relationships (id-level diff) ---
  const allRelKeys = new Set([
    ...Object.keys(prev.relationships),
    ...Object.keys(next.relationships),
  ])
  for (const key of allRelKeys) {
    const pArr = prev.relationships[key]
    const nArr = next.relationships[key]
    if (pArr === nArr) continue

    if (!pArr && nArr) {
      diffs.push({ path: key, kind: 'added', after: [...nArr] })
    } else if (pArr && !nArr) {
      diffs.push({ path: key, kind: 'removed', before: [...pArr] })
    } else if (pArr && nArr) {
      if (pArr.length !== nArr.length || pArr.some((id, i) => id !== nArr[i])) {
        diffs.push({ path: key, kind: 'changed', before: [...pArr], after: [...nArr] })
      }
    }
  }

  return diffs
}

export function applyDelta(
  store: NormalizedData,
  diffs: StoreDiff[],
  direction: 'forward' | 'reverse'
): NormalizedData {
  let entities = { ...store.entities }
  let relationships = { ...store.relationships }

  for (const diff of diffs) {
    const value = direction === 'forward' ? diff.after : diff.before
    const antiValue = direction === 'forward' ? diff.before : diff.after
    const effectiveKind = direction === 'forward' ? diff.kind
      : diff.kind === 'added' ? 'removed' as const
      : diff.kind === 'removed' ? 'added' as const
      : 'changed' as const

    // Meta entity field diff (path like "__focus__.focusedId")
    if (diff.path.includes('.')) {
      const dotIdx = diff.path.indexOf('.')
      const entityId = diff.path.slice(0, dotIdx)
      const field = diff.path.slice(dotIdx + 1)
      const entity = entities[entityId] ?? { id: entityId }
      if (effectiveKind === 'removed') {
        const { [field]: _removedField, ...rest } = entity
        void _removedField
        entities = { ...entities, [entityId]: { ...rest, id: entityId } as Entity }
      } else {
        entities = { ...entities, [entityId]: { ...entity, [field]: value } }
      }
      continue
    }

    // Content entity diff (path === 'entities')
    if (diff.path === 'entities') {
      if (effectiveKind === 'added') {
        const entity = value as Entity
        entities = { ...entities, [entity.id]: entity }
      } else if (effectiveKind === 'removed') {
        const entity = antiValue as Entity
        const { [entity.id]: _removedEntity, ...rest } = entities
        void _removedEntity
        entities = rest
      } else {
        const entity = value as Entity
        entities = { ...entities, [entity.id]: entity }
      }
      continue
    }

    // Relationship diff
    if (effectiveKind === 'added') {
      relationships = { ...relationships, [diff.path]: value as string[] }
    } else if (effectiveKind === 'removed') {
      const { [diff.path]: _removedRel, ...rest } = relationships
      void _removedRel
      relationships = rest
    } else {
      relationships = { ...relationships, [diff.path]: value as string[] }
    }
  }

  return { entities, relationships }
}
