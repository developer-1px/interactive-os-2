// ② inspectorDefinePagePanelPrd.md
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

/**
 * FlatLayout store를 Inspector TreeView용 NormalizedData로 변환.
 * ROOT_ID children부터 relationships를 재귀 순회하여 계층을 보존한다.
 * 각 노드 label = `${id} · ${data.type}` (예: "root · split", "header · widget")
 * 위젯 노드는 widget 이름을 label 꼬리에 추가: "header · widget:TodoHeaderWidget"
 *
 * @invariant 반환 store의 entity id는 원본 id와 동일 (선택 시 원본 store에서 lookup 가능)
 */
export function layoutStoreToTree(source: NormalizedData): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = {}

  for (const [id, entity] of Object.entries(source.entities)) {
    if (id.startsWith('__')) continue
    const data = (entity.data ?? {}) as Record<string, unknown>
    const type = typeof data.type === 'string' ? data.type : '?'
    const widget = type === 'widget' && typeof data.widget === 'string' ? `:${data.widget}` : ''
    entities[id] = {
      id,
      data: { label: `${id} · ${type}${widget}`, type, raw: data },
    }
  }

  for (const [parentId, childIds] of Object.entries(source.relationships)) {
    if (parentId.startsWith('__')) continue
    relationships[parentId] = childIds.filter(c => !c.startsWith('__'))
  }
  if (!relationships[ROOT_ID]) relationships[ROOT_ID] = []

  return { entities, relationships }
}
