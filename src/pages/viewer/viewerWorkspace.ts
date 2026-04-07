import { getChildren, getEntityData, updateEntityData, addEntity } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { workspaceCommands, findTabgroup } from '@os/plugins/workspaceStore'
import type { TabData } from '@os/plugins/workspaceStore'

const PREVIEW_TAB_ID = '__preview__'

/** 트리 포커스 이동 시 preview 탭을 교체하거나 생성한다. */
export function previewFileReducer(prev: NormalizedData, filePath: string): NormalizedData {
  const tgId = findTabgroup(prev)
  if (!tgId) return prev

  const tabIds = getChildren(prev, tgId)
  const filename = filePath.split('/').pop() ?? filePath

  // 이미 영구 탭으로 열려있으면 활성화만
  const permanent = tabIds.find(id => {
    if (id === PREVIEW_TAB_ID) return false
    return (getEntityData<TabData>(prev, id))?.contentRef === filePath
  })
  if (permanent) {
    return workspaceCommands.setActiveTab.reduce(prev, tgId, permanent)
  }

  // preview 탭이 이미 있으면 내용 교체, 없으면 생성
  if (tabIds.includes(PREVIEW_TAB_ID)) {
    const store = updateEntityData(prev, PREVIEW_TAB_ID, { label: filename, contentRef: filePath })
    return workspaceCommands.setActiveTab.reduce(store, tgId, PREVIEW_TAB_ID)
  }
  const tab = {
    id: PREVIEW_TAB_ID,
    data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath, preview: true },
  }
  let store = workspaceCommands.createTab.reduce(prev, tgId, tab)
  store = workspaceCommands.setActiveTab.reduce(store, tgId, tab.id)
  return store
}

/** Enter → preview 유지 + 영구 탭을 preview 왼쪽에 insert */
export function pinFileReducer(prev: NormalizedData, filePath: string): NormalizedData {
  const tgId = findTabgroup(prev)
  if (!tgId) return prev

  const tabIds = getChildren(prev, tgId)
  const filename = filePath.split('/').pop() ?? filePath
  const permanentId = `tab-${filePath}`

  if (tabIds.includes(permanentId)) return prev

  const previewIndex = tabIds.indexOf(PREVIEW_TAB_ID)
  const insertIndex = previewIndex >= 0 ? previewIndex : tabIds.length

  let store = addEntity(prev, {
    id: permanentId,
    data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
  }, tgId, insertIndex)

  store = updateEntityData(store, tgId, { activeTabId: permanentId })

  return store
}

/** 새 pane에 파일을 열거나 기존 split에 pane을 추가한다. */
export function openInNewPaneReducer(prev: NormalizedData, filePath: string): NormalizedData {
  const filename = filePath.split('/').pop() ?? filePath
  const newTgId = `tg-${Date.now()}`
  const tabId = `tab-${filePath}`

  const rootChildren = getChildren(prev, ROOT_ID)
  const existingSplitId = rootChildren.find(id =>
    (getEntityData<{ type: string }>(prev, id))?.type === 'split'
  )

  if (existingSplitId) {
    let store = addEntity(prev, {
      id: newTgId,
      data: { type: 'tabgroup', activeTabId: tabId },
    }, existingSplitId)

    const newChildren = getChildren(store, existingSplitId)
    const equalSize = 1 / newChildren.length
    store = updateEntityData(store, existingSplitId, { sizes: newChildren.map(() => equalSize) })

    const tab = {
      id: tabId,
      data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
    }
    let s = workspaceCommands.createTab.reduce(store, newTgId, tab)
    s = workspaceCommands.setActiveTab.reduce(s, newTgId, tab.id)
    return s
  }

  const tgId = findTabgroup(prev)
  if (!tgId) return prev

  const store = workspaceCommands.splitPane.reduce(prev, tgId, 'horizontal')

  const newSplitId = getChildren(store, ROOT_ID).find(id =>
    (getEntityData<{ type: string }>(store, id))?.type === 'split'
  )
  if (!newSplitId) return store

  const splitChildren = getChildren(store, newSplitId)
  const lastTg = splitChildren[splitChildren.length - 1]
  if (!lastTg) return store

  const tab = {
    id: tabId,
    data: { type: 'tab', label: filename, contentType: 'file', contentRef: filePath },
  }
  let s = workspaceCommands.createTab.reduce(store, lastTg, tab)
  s = workspaceCommands.setActiveTab.reduce(s, lastTg, tab.id)
  return s
}

/** Cmd+D → 현재 active 탭을 새 panel에 복제 */
export function duplicatePaneReducer(prev: NormalizedData): NormalizedData {
  const tgId = findTabgroup(prev)
  if (!tgId) return prev

  const tgData = getEntityData<{ activeTabId?: string }>(prev, tgId)
  const activeId = tgData?.activeTabId
  if (!activeId) return prev

  const tabData = getEntityData<TabData>(prev, activeId)
  if (!tabData?.contentRef) return prev

  const filename = tabData.contentRef.split('/').pop() ?? tabData.contentRef
  const newTabId = `tab-dup-${Date.now()}`

  const rootChildren = getChildren(prev, ROOT_ID)
  const existingSplitId = rootChildren.find(id =>
    (getEntityData<{ type: string }>(prev, id))?.type === 'split'
  )

  if (existingSplitId) {
    const newTgId = `tg-${Date.now()}`
    let store = addEntity(prev, {
      id: newTgId,
      data: { type: 'tabgroup', activeTabId: newTabId },
    }, existingSplitId)

    const newChildren = getChildren(store, existingSplitId)
    const equalSize = 1 / newChildren.length
    store = updateEntityData(store, existingSplitId, { sizes: newChildren.map(() => equalSize) })

    const tab = {
      id: newTabId,
      data: { type: 'tab', label: filename, contentType: tabData.contentType, contentRef: tabData.contentRef },
    }
    let s = workspaceCommands.createTab.reduce(store, newTgId, tab)
    s = workspaceCommands.setActiveTab.reduce(s, newTgId, tab.id)
    return s
  }

  const store = workspaceCommands.splitPane.reduce(prev, tgId, 'horizontal')
  const newSplitId = getChildren(store, ROOT_ID).find(id =>
    (getEntityData<{ type: string }>(store, id))?.type === 'split'
  )
  if (!newSplitId) return store

  const splitChildren = getChildren(store, newSplitId)
  const lastTg = splitChildren[splitChildren.length - 1]
  if (!lastTg) return store

  const tab = {
    id: newTabId,
    data: { type: 'tab', label: filename, contentType: tabData.contentType, contentRef: tabData.contentRef },
  }
  let s = workspaceCommands.createTab.reduce(store, lastTg, tab)
  s = workspaceCommands.setActiveTab.reduce(s, lastTg, tab.id)
  return s
}
