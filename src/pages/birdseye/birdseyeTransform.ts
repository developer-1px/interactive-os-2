import type { NormalizedData } from '../../interactive-os/store/types'
import { ROOT_ID } from '../../interactive-os/store/types'
import { createStore, getChildren, getEntityData } from '../../interactive-os/store/createStore'

type FsEntityData = {
  name: string
  type: 'file' | 'directory'
  path: string
}

/**
 * buildNavStore — fs store → NavList용 NormalizedData
 *
 * ROOT → group:{dirId} (루트 디렉토리) → {dirId} (2depth 디렉토리)
 * 파일은 제외. 하위 디렉토리가 없는 루트 디렉토리는 빈 그룹으로 포함.
 */
export function buildNavStore(fsStore: NormalizedData): NormalizedData {
  let store = createStore()

  const rootDirIds = getChildren(fsStore, ROOT_ID).filter((id) => {
    const data = getEntityData<FsEntityData>(fsStore, id)
    return data?.type === 'directory' && !data.name.startsWith('.')
  })

  for (const dirId of rootDirIds) {
    const dirData = getEntityData<FsEntityData>(fsStore, dirId)
    if (!dirData) continue

    const groupId = `group:${dirId}`
    store = {
      entities: {
        ...store.entities,
        [groupId]: { id: groupId, data: { type: 'group', label: dirData.name } },
      },
      relationships: {
        ...store.relationships,
        [ROOT_ID]: [...(store.relationships[ROOT_ID] ?? []), groupId],
        [groupId]: [],
      },
    }

    const subDirIds = getChildren(fsStore, dirId).filter((childId) => {
      const childData = getEntityData<FsEntityData>(fsStore, childId)
      return childData?.type === 'directory'
    })

    for (const subDirId of subDirIds) {
      const subDirData = getEntityData<FsEntityData>(fsStore, subDirId)
      if (!subDirData) continue

      store = {
        entities: {
          ...store.entities,
          [subDirId]: { id: subDirId, data: { label: subDirData.name, sourceId: subDirId } },
        },
        relationships: {
          ...store.relationships,
          [groupId]: [...(store.relationships[groupId] ?? []), subDirId],
        },
      }
    }
  }

  return store
}

/**
 * buildKanbanStore — fs store → Kanban용 NormalizedData
 *
 * 선택된 folderId 기준:
 * - 하위 디렉토리 → 컬럼 (col:{dirId})
 * - 각 컬럼의 직접 자식들 → 카드 (card:{originalId})
 * - 선택 폴더 직하 파일 → "(files)" 컬럼 (col:__files__)
 * - 하위 디렉토리가 없으면 단일 (files) 컬럼
 */
export function buildKanbanStore(fsStore: NormalizedData, folderId: string): NormalizedData {
  let store = createStore()

  const children = getChildren(fsStore, folderId)
  const subDirs = children.filter((id) => {
    const data = getEntityData<FsEntityData>(fsStore, id)
    return data?.type === 'directory'
  })
  const directFiles = children.filter((id) => {
    const data = getEntityData<FsEntityData>(fsStore, id)
    return data?.type === 'file'
  })

  // Add directory columns
  for (const subDirId of subDirs) {
    const subDirData = getEntityData<FsEntityData>(fsStore, subDirId)
    if (!subDirData) continue

    const colId = `col:${subDirId}`
    store = {
      entities: {
        ...store.entities,
        [colId]: { id: colId, data: { title: subDirData.name, sourceId: subDirId } },
      },
      relationships: {
        ...store.relationships,
        [ROOT_ID]: [...(store.relationships[ROOT_ID] ?? []), colId],
        [colId]: [],
      },
    }

    // Add cards for each direct child of this subdir
    const subChildren = getChildren(fsStore, subDirId)
    for (const childId of subChildren) {
      const childData = getEntityData<FsEntityData>(fsStore, childId)
      if (!childData) continue

      const cardId = `card:${childId}`
      store = {
        entities: {
          ...store.entities,
          [cardId]: {
            id: cardId,
            data: { title: childData.name, sourceId: childId, sourceType: childData.type },
          },
        },
        relationships: {
          ...store.relationships,
          [colId]: [...(store.relationships[colId] ?? []), cardId],
        },
      }
    }
  }

  // Add (files) column if there are direct files or no subdirs
  if (directFiles.length > 0 || subDirs.length === 0) {
    const filesColId = 'col:__files__'
    store = {
      entities: {
        ...store.entities,
        [filesColId]: { id: filesColId, data: { title: '(files)', sourceId: folderId } },
      },
      relationships: {
        ...store.relationships,
        [ROOT_ID]: [...(store.relationships[ROOT_ID] ?? []), filesColId],
        [filesColId]: [],
      },
    }

    for (const fileId of directFiles) {
      const fileData = getEntityData<FsEntityData>(fsStore, fileId)
      if (!fileData) continue

      const cardId = `card:${fileId}`
      store = {
        entities: {
          ...store.entities,
          [cardId]: {
            id: cardId,
            data: { title: fileData.name, sourceId: fileId, sourceType: fileData.type },
          },
        },
        relationships: {
          ...store.relationships,
          [filesColId]: [...(store.relationships[filesColId] ?? []), cardId],
        },
      }
    }
  }

  return store
}
