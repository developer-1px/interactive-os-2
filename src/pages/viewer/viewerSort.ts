// ② list-xray-prd.md
import type { NormalizedData } from '@os/store/types'

export type SortKey = 'name' | 'type' | 'loc'
export type SortDir = 'asc' | 'desc'

function getExt(name: string): string {
  return name.includes('.') ? name.split('.').pop() ?? '' : ''
}

export function sortStore(
  store: NormalizedData,
  sortKey: SortKey,
  sortDir: SortDir,
): NormalizedData {
  const relationships = { ...store.relationships }

  for (const [parentId, children] of Object.entries(relationships)) {
    const folders: string[] = []
    const files: string[] = []

    for (const id of children) {
      const entity = store.entities[id]
      const type = (entity?.data as Record<string, unknown> | undefined)?.type
      if (type === 'directory') folders.push(id)
      else files.push(id)
    }

    const compare = (a: string, b: string): number => {
      const eA = store.entities[a]
      const eB = store.entities[b]
      const dA = (eA?.data ?? {}) as Record<string, unknown>
      const dB = (eB?.data ?? {}) as Record<string, unknown>

      let result: number
      switch (sortKey) {
        case 'name':
          result = ((dA.name as string) ?? '').localeCompare((dB.name as string) ?? '')
          break
        case 'type':
          result = getExt((dA.name as string) ?? '').localeCompare(getExt((dB.name as string) ?? ''))
          break
        case 'loc':
          result = ((dA.loc as number) ?? 0) - ((dB.loc as number) ?? 0)
          break
      }
      return sortDir === 'desc' ? -result : result
    }

    folders.sort(compare)
    files.sort(compare)
    relationships[parentId] = [...folders, ...files]
  }

  return { ...store, relationships }
}
