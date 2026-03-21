import type { NormalizedData } from './types'

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
        diffs.push({ path: 'entities', kind: 'added', after: id })
      }
    } else if (prevEntity && !nextEntity) {
      if (isMetaEntity(id)) {
        for (const [key, val] of Object.entries(prevEntity)) {
          if (key === 'id') continue
          diffs.push({ path: `${id}.${key}`, kind: 'removed', before: val })
        }
      } else {
        diffs.push({ path: 'entities', kind: 'removed', before: id })
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
        diffs.push({ path: 'entities', kind: 'changed', before: id, after: id })
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
      for (const id of nArr) diffs.push({ path: key, kind: 'added', after: id })
    } else if (pArr && !nArr) {
      for (const id of pArr) diffs.push({ path: key, kind: 'removed', before: id })
    } else if (pArr && nArr) {
      const prevSet = new Set(pArr)
      const nextSet = new Set(nArr)
      for (const id of nArr) {
        if (!prevSet.has(id)) diffs.push({ path: key, kind: 'added', after: id })
      }
      for (const id of pArr) {
        if (!nextSet.has(id)) diffs.push({ path: key, kind: 'removed', before: id })
      }
    }
  }

  return diffs
}
