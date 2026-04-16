import type { CommandEngine } from '@os/engine/createCommandEngine'
import type { NormalizedData } from '@os/store/types'
import { renameCommands } from '@os/plugins/rename'
import { getChildren } from '@os/store/createStore'
import type { Locale, LocaleMap } from './cmsTypes'
import { localized } from './cmsTypes'

export interface CmsApi {
  /** 특정 필드값 조회 */
  get(nodeId: string, field: string): unknown

  /** 특정 필드값 수정 */
  update(nodeId: string, field: string, value: unknown): void

  /** 특정 locale의 텍스트 수정 (LocaleMap 필드용) */
  updateText(nodeId: string, field: string, text: string): void

  /** 모든 노드 목록 (id, type, 편집가능 필드) */
  list(): Array<{ id: string; type: string; fields: string[] }>

  /** 특정 노드의 전체 데이터 조회 */
  inspect(nodeId: string): { id: string; type: string; data: Record<string, unknown>; children: string[] } | null

  /** 전체 콘텐츠 JSON export */
  export(): object

  /** JSON import로 전체 콘텐츠 교체 */
  import(json: object): void
}

export function createCmsApi(
  getEngine: () => CommandEngine,
  getStore: () => NormalizedData,
  getLocale: () => Locale,
): CmsApi {
  return {
    get(nodeId, field) {
      const entity = getStore().entities[nodeId]
      if (!entity) throw new Error(`Node not found: ${nodeId}`)
      const data = entity.data as Record<string, unknown>
      const raw = data[field]
      if (raw && typeof raw === 'object' && 'ko' in raw) {
        return localized(raw as LocaleMap, getLocale()).text
      }
      return raw
    },

    update(nodeId, field, value) {
      const entity = getStore().entities[nodeId]
      if (!entity) throw new Error(`Node not found: ${nodeId}`)
      getEngine().dispatch(renameCommands.confirmRename(nodeId, field, value))
    },

    updateText(nodeId, field, text) {
      const store = getStore()
      const entity = store.entities[nodeId]
      if (!entity) throw new Error(`Node not found: ${nodeId}`)
      const data = entity.data as Record<string, unknown>
      const raw = data[field]
      if (raw && typeof raw === 'object' && 'ko' in raw) {
        const newValue = { ...(raw as Record<string, string>), [getLocale()]: text }
        getEngine().dispatch(renameCommands.confirmRename(nodeId, field, newValue))
      } else {
        getEngine().dispatch(renameCommands.confirmRename(nodeId, field, text))
      }
    },

    list() {
      const store = getStore()
      return Object.entries(store.entities).map(([id, entity]) => {
        const data = entity.data as Record<string, unknown>
        const type = (data.type as string) ?? 'unknown'
        const fields = Object.keys(data).filter(k => k !== 'type')
        return { id, type, fields }
      })
    },

    inspect(nodeId) {
      const store = getStore()
      const entity = store.entities[nodeId]
      if (!entity) return null
      const data = entity.data as Record<string, unknown>
      const type = (data.type as string) ?? 'unknown'
      const children = getChildren(store, nodeId)
      return { id: nodeId, type, data: { ...data }, children }
    },

    export() {
      const store = getStore()
      return {
        entities: { ...store.entities },
        relationships: { ...store.relationships },
      }
    },

    import(json) {
      const imported = json as { entities: Record<string, { id: string; data: Record<string, unknown> }> }
      const engine = getEngine()
      for (const [id, entity] of Object.entries(imported.entities)) {
        const data = entity.data as Record<string, unknown>
        for (const [field, value] of Object.entries(data)) {
          if (field === 'type') continue
          engine.dispatch(renameCommands.confirmRename(id, field, value))
        }
      }
    },
  }
}
