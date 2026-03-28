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
  const entities: Record<string, { id: string; data?: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  function addDir(dirId: string, parentId: string) {
    const data = getEntityData<FsEntityData>(fsStore, dirId)
    if (!data) return

    entities[dirId] = { id: dirId, data: { label: data.name, name: data.name, sourceId: dirId } }
    relationships[parentId].push(dirId)

    const childDirs = getChildren(fsStore, dirId).filter((id) => {
      const d = getEntityData<FsEntityData>(fsStore, id)
      return d?.type === 'directory'
    })

    if (childDirs.length > 0) {
      relationships[dirId] = []
      for (const childId of childDirs) addDir(childId, dirId)
    }
  }

  const rootDirs = getChildren(fsStore, ROOT_ID).filter((id) => {
    const data = getEntityData<FsEntityData>(fsStore, id)
    return data?.type === 'directory' && !data.name.startsWith('.')
  })

  for (const dirId of rootDirs) addDir(dirId, ROOT_ID)

  return createStore({ entities, relationships })
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
/** 폴더 먼저, types.ts 맨 위, index.ts 맨 아래, 나머지 알파벳순 */
function sortCards(fsStore: NormalizedData, ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const aData = getEntityData<FsEntityData>(fsStore, a)
    const bData = getEntityData<FsEntityData>(fsStore, b)
    const aName = aData?.name ?? ''
    const bName = bData?.name ?? ''
    // 폴더 먼저
    const aDir = aData?.type === 'directory'
    const bDir = bData?.type === 'directory'
    if (aDir !== bDir) return aDir ? -1 : 1
    // 파일끼리: types.ts 맨 위, index.ts 맨 아래
    if (!aDir && !bDir) {
      const aTypes = /^types\.[^.]+$/.test(aName)
      const bTypes = /^types\.[^.]+$/.test(bName)
      if (aTypes !== bTypes) return aTypes ? -1 : 1
      const aIndex = /^index\.[^.]+$/.test(aName)
      const bIndex = /^index\.[^.]+$/.test(bName)
      if (aIndex !== bIndex) return aIndex ? 1 : -1
    }
    return aName.localeCompare(bName)
  })
}

export interface KanbanBuildOptions {
  /** 컬럼 정렬 순서. 이름 배열. 목록에 없는 폴더는 뒤에 알파벳순으로 붙는다. */
  columnOrder?: string[]
}

/** 디렉토리를 정렬하는 공통 로직 */
function sortDirs(fsStore: NormalizedData, dirIds: string[], order?: string[]): string[] {
  return [...dirIds].sort((a, b) => {
    const aName = getEntityData<FsEntityData>(fsStore, a)?.name ?? ''
    const bName = getEntityData<FsEntityData>(fsStore, b)?.name ?? ''
    if (order) {
      const aIdx = order.indexOf(aName)
      const bIdx = order.indexOf(bName)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
    }
    const aUnder = aName.startsWith('__')
    const bUnder = bName.startsWith('__')
    if (aUnder !== bUnder) return aUnder ? 1 : -1
    return aName.localeCompare(bName)
  })
}

export function buildKanbanStore(fsStore: NormalizedData, folderId: string, options?: KanbanBuildOptions): NormalizedData {
  const entities: Record<string, { id: string; data?: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }
  let topIndex = 0

  /**
   * 재귀적으로 폴더를 컬럼으로 풀어낸다.
   * 하위 폴더를 만나면 카드 대신 부모 컬럼 바로 뒤에 새 컬럼 추가.
   * prefix: 넘버링 접두사 (예: "4", "4-1")
   */
  function addFolder(dirId: string, prefix: string, pathPrefix: string) {
    const dirData = getEntityData<FsEntityData>(fsStore, dirId)
    if (!dirData) return

    const path = pathPrefix ? `${pathPrefix}/${dirData.name}` : dirData.name
    const children = getChildren(fsStore, dirId)

    // 파일만 추출
    const files = sortCards(fsStore, children.filter((id) => {
      const d = getEntityData<FsEntityData>(fsStore, id)
      return d?.type === 'file'
    }))

    // 파일이 있을 때만 컬럼 생성
    if (files.length > 0) {
      const colId = `col:${dirId}`
      const title = `${prefix}. /${path}`
      entities[colId] = { id: colId, data: { title, sourceId: dirId } }
      relationships[ROOT_ID].push(colId)
      relationships[colId] = []

      for (const fileId of files) {
        const fileData = getEntityData<FsEntityData>(fsStore, fileId)
        if (!fileData) continue
        const cardId = `card:${fileId}`
        entities[cardId] = {
          id: cardId,
          data: { title: fileData.name, sourceId: fileId, sourceType: 'file' },
        }
        relationships[colId].push(cardId)
      }
    }

    // 하위 폴더 → 재귀적으로 컬럼 추가 (파일 유무와 무관하게 항상 재귀)
    const subDirs = children.filter((id) => {
      const d = getEntityData<FsEntityData>(fsStore, id)
      return d?.type === 'directory'
    })
    const sorted = sortDirs(fsStore, subDirs)
    sorted.forEach((subId, i) => {
      addFolder(subId, `${prefix}-${i + 1}`, path)
    })
  }

  // 1단 하위 폴더를 정렬하고 재귀 전개
  const topChildren = getChildren(fsStore, folderId)
  const topDirs = topChildren.filter((id) => {
    const d = getEntityData<FsEntityData>(fsStore, id)
    return d?.type === 'directory'
  })
  const topFiles = topChildren.filter((id) => {
    const d = getEntityData<FsEntityData>(fsStore, id)
    return d?.type === 'file'
  })

  const sortedTopDirs = sortDirs(fsStore, topDirs, options?.columnOrder)

  for (const dirId of sortedTopDirs) {
    topIndex++
    addFolder(dirId, String(topIndex), '')
  }

  // 루트 파일 → (files) 컬럼
  if (topFiles.length > 0) {
    const filesColId = 'col:__files__'
    entities[filesColId] = { id: filesColId, data: { title: '(files)', sourceId: folderId } }
    relationships[ROOT_ID].push(filesColId)
    relationships[filesColId] = []

    for (const fileId of sortCards(fsStore, topFiles)) {
      const fileData = getEntityData<FsEntityData>(fsStore, fileId)
      if (!fileData) continue
      const cardId = `card:${fileId}`
      entities[cardId] = {
        id: cardId,
        data: { title: fileData.name, sourceId: fileId, sourceType: 'file' },
      }
      relationships[filesColId].push(cardId)
    }
  }

  return createStore({ entities, relationships })
}
