var e=`// Writer domain commands — store 변환 로직
// ② 2026-04-05-writer-tree-crud-prd.md

import { defineCommands } from '@os/engine/defineCommand'
import { getParent, getChildren, updateEntityData, addEntity, removeEntity, moveNode } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { AnalysisResult } from './writerAnalyze'

export const writerCommands = defineCommands({
  updateContent: {
    type: 'writer:update-content' as const,
    create: (nodeId: string, content: string) => ({ nodeId, content }),
    handler: (store, { nodeId, content }) => updateEntityData(store, nodeId, { content }),
  },

  insertAfter: {
    type: 'writer:insert-after' as const,
    create: (afterNodeId: string, newId: string, data: Record<string, unknown>) => ({ afterNodeId, newId, data }),
    handler: (store, { afterNodeId, newId, data }) => {
      const parentId = getParent(store, afterNodeId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const idx = siblings.indexOf(afterNodeId)
      return addEntity(store, { id: newId, data }, parentId, idx + 1)
    },
  },

  insertBefore: {
    type: 'writer:insert-before' as const,
    create: (beforeNodeId: string, newId: string, data: Record<string, unknown>) => ({ beforeNodeId, newId, data }),
    handler: (store, { beforeNodeId, newId, data }) => {
      const parentId = getParent(store, beforeNodeId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const idx = siblings.indexOf(beforeNodeId)
      return addEntity(store, { id: newId, data }, parentId, idx)
    },
  },

  merge: {
    type: 'writer:merge' as const,
    create: (targetId: string, mergedContent: string, removeId: string) => ({ targetId, mergedContent, removeId }),
    handler: (store, { targetId, mergedContent, removeId }) => {
      let s = updateEntityData(store, targetId, { content: mergedContent })
      s = removeEntity(s, removeId)
      return s
    },
  },

  wrapInList: {
    type: 'writer:wrap-list' as const,
    create: (nodeIds: string[], listId: string, ordered: boolean) => ({ nodeIds, listId, ordered }),
    handler: (store, { nodeIds, listId, ordered }) => {
      if (nodeIds.length === 0) return store
      const firstId = nodeIds[0]!
      const parentId = getParent(store, firstId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const firstIdx = siblings.indexOf(firstId)

      let s = addEntity(store, { id: listId, data: { type: 'list', ordered } }, parentId, firstIdx)

      for (const id of nodeIds) {
        const entity = s.entities[id]
        if (!entity) continue
        const d = entity.data as Record<string, unknown> | undefined
        if (d?.type === 'heading') continue
        s = moveNode(s, id, listId)
        s = updateEntityData(s, id, { type: 'listItem' })
      }
      return s
    },
  },

  unwrapFromList: {
    type: 'writer:unwrap-list' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const listId = getParent(store, nodeId)
      if (!listId) return store
      const listEntity = store.entities[listId]
      if ((listEntity?.data as Record<string, unknown>)?.type !== 'list') return store

      const grandparentId = getParent(store, listId) ?? ROOT_ID
      const gpChildren = getChildren(store, grandparentId)
      const listIdx = gpChildren.indexOf(listId)
      const listChildren = [...getChildren(store, listId)]

      let s = store
      for (let i = 0; i < listChildren.length; i++) {
        const childId = listChildren[i]!
        s = moveNode(s, childId, grandparentId, listIdx + 1 + i)
        const childData = s.entities[childId]?.data as Record<string, unknown> | undefined
        if (childData?.type === 'listItem') {
          s = updateEntityData(s, childId, { type: 'sentence' })
        }
      }

      if (getChildren(s, listId).length === 0) {
        s = removeEntity(s, listId)
      }
      return s
    },
  },

  setAnalysis: {
    type: 'writer:set-analysis' as const,
    create: (analysis: AnalysisResult) => ({ analysis }),
    handler: (store, { analysis }) => {
      const updatedEntities = { ...store.entities }
      let changed = false
      for (const [id, role] of Object.entries(analysis.roles)) {
        const entity = updatedEntities[id]
        if (!entity) continue
        const d = entity.data as Record<string, unknown> | undefined
        if (d?.type !== 'sentence') continue
        const relations = analysis.relations[id]
        updatedEntities[id] = { ...entity, data: { ...d, role, ...(relations ? { relations } : {}) } }
        changed = true
      }
      return changed ? { ...store, entities: updatedEntities } : store
    },
  },

  visibleSwap: {
    type: 'writer:visible-swap' as const,
    create: (nodeId: string, adjacentId: string, direction: -1 | 1) => ({ nodeId, adjacentId, direction }),
    handler: (store, { nodeId, adjacentId, direction }) => {
      const nodeParent = getParent(store, nodeId) ?? ROOT_ID
      const adjParent = getParent(store, adjacentId) ?? ROOT_ID

      if (nodeParent === adjParent) {
        const siblings = getChildren(store, nodeParent)
        const adjIdx = siblings.indexOf(adjacentId)
        return moveNode(store, nodeId, nodeParent, direction === -1 ? adjIdx : adjIdx + 1)
      }

      const adjSiblings = getChildren(store, adjParent)
      const adjIdx = adjSiblings.indexOf(adjacentId)
      return moveNode(store, nodeId, adjParent, direction === -1 ? adjIdx : adjIdx + 1)
    },
  },

  convertType: {
    type: 'writer:convert-type' as const,
    create: (nodeId: string, toType: 'heading' | 'paragraph') => ({ nodeId, toType }),
    handler: (store, { nodeId, toType }) => {
      const entity = store.entities[nodeId]
      if (!entity) return store
      const d = entity.data as Record<string, unknown> | undefined
      const fromType = d?.type as string

      if (fromType === 'heading' && toType === 'paragraph') {
        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        const idx = siblings.indexOf(nodeId)
        const children = [...getChildren(store, nodeId)]
        let s = store
        for (let i = 0; i < children.length; i++) {
          s = moveNode(s, children[i]!, parentId, idx + 1 + i)
        }
        s = updateEntityData(s, nodeId, { type: 'paragraph', level: undefined })
        return s
      }

      if (fromType === 'paragraph' && toType === 'heading') {
        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const parentData = store.entities[parentId]?.data as Record<string, unknown> | undefined
        const parentLevel = (parentData?.type === 'heading' ? parentData.level as number : 0) ?? 0
        const level = Math.min(parentLevel + 1, 6)
        return updateEntityData(store, nodeId, { type: 'heading', level, content: d?.content ?? '' })
      }

      return store
    },
  },
})
`;export{e as default};