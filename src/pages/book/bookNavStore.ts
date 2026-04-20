// ② persistPluginPrd.md
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { createModuleStore } from '@os/store/createModuleStore'
import { FOCUS_ID } from '@os/core'
import { SELECTION_ID } from '@os/axis/select'
import type { NormalizedData } from '@os/store/types'

// ── Types ──

export interface BookLayer {
  id: string
  name: string
  pageIds: string[]
}

interface BookNavState {
  favorites: string[]
  recent: string[]
  layers: BookLayer[]
}

// ── Module state ──

const STORAGE_KEY = 'book-nav'
const MAX_RECENT = 20

const navStore = createModuleStore<BookNavState>({
  initial: { favorites: [], recent: [], layers: [] },
  storageKey: STORAGE_KEY,
  parse: (raw) => {
    try {
      const parsed = JSON.parse(raw) as Partial<BookNavState>
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        recent: Array.isArray(parsed.recent) ? parsed.recent : [],
        layers: Array.isArray(parsed.layers) ? parsed.layers : [],
      }
    } catch {
      return { favorites: [], recent: [], layers: [] }
    }
  },
})

// ── Getters ──

export function getNavState(): BookNavState { return navStore.get() }
export function isFavorite(pageId: string): boolean { return navStore.get().favorites.includes(pageId) }
export function getRecent(): string[] { return navStore.get().recent }
export function getFavorites(): string[] { return navStore.get().favorites }
export function getLayers(): BookLayer[] { return navStore.get().layers }

// ── Mutations ──

export function addRecent(pageId: string) {
  navStore.set(S => ({
    ...S,
    recent: [pageId, ...S.recent.filter(id => id !== pageId)].slice(0, MAX_RECENT),
  }))
}

export function toggleFavorite(pageId: string) {
  navStore.set(S => ({
    ...S,
    favorites: S.favorites.includes(pageId)
      ? S.favorites.filter(id => id !== pageId)
      : [...S.favorites, pageId],
  }))
}

export function createLayer(name: string): string {
  const id = `layer-${Date.now()}`
  navStore.set(S => ({ ...S, layers: [...S.layers, { id, name, pageIds: [] }] }))
  return id
}

export function deleteLayer(layerId: string) {
  navStore.set(S => ({ ...S, layers: S.layers.filter(l => l.id !== layerId) }))
}

export function renameLayer(layerId: string, name: string) {
  navStore.set(S => ({
    ...S,
    layers: S.layers.map(l => l.id === layerId ? { ...l, name } : l),
  }))
}

export function addToLayer(layerId: string, pageId: string) {
  navStore.set(S => ({
    ...S,
    layers: S.layers.map(l =>
      l.id === layerId && !l.pageIds.includes(pageId)
        ? { ...l, pageIds: [...l.pageIds, pageId] }
        : l,
    ),
  }))
}

export function removeFromLayer(layerId: string, pageId: string) {
  navStore.set(S => ({
    ...S,
    layers: S.layers.map(l =>
      l.id === layerId
        ? { ...l, pageIds: l.pageIds.filter(id => id !== pageId) }
        : l,
    ),
  }))
}

export function reorderLayerPages(layerId: string, pageIds: string[]) {
  navStore.set(S => ({
    ...S,
    layers: S.layers.map(l => l.id === layerId ? { ...l, pageIds } : l),
  }))
}

// ── Add to Layer store builder ──

export function buildAddToLayerStore(pageId: string): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const rootChildren: string[] = []
  const S = navStore.get()

  for (const layer of S.layers) {
    const isInLayer = layer.pageIds.includes(pageId)
    entities[layer.id] = {
      id: layer.id,
      data: { label: `${isInLayer ? '- Remove from' : '+ Add to'} ${layer.name}`, layerId: layer.id, action: isInLayer ? 'remove' : 'add' },
    }
    rootChildren.push(layer.id)
  }

  // "New layer" option
  const newId = '__new_layer__'
  entities[newId] = {
    id: newId,
    data: { label: '+ New layer...', action: 'create' },
  }
  rootChildren.push(newId)

  if (rootChildren.length > 0) {
    entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: rootChildren[0] } as never
  }
  entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: [] } as never

  return createStore({ entities, relationships: { [ROOT_ID]: rootChildren } })
}

// ── Quick Open store builder ──

interface PageInfo {
  id: string
  title: string
  chapter: string
  content?: string
}

type StoreAccumulator = {
  entities: Record<string, { id: string; data: Record<string, unknown> }>
  relationships: Record<string, string[]>
}

function addGroup(acc: StoreAccumulator, allPages: PageInfo[], groupId: string, label: string, pageIds: string[]) {
  if (pageIds.length === 0) return
  acc.entities[groupId] = { id: groupId, data: { label, type: 'group' } }
  acc.relationships[ROOT_ID].push(groupId)
  const children: string[] = []
  for (const pid of pageIds) {
    const page = allPages.find(p => p.id === pid)
    if (!page) continue
    const itemId = `${groupId}/${pid}`
    acc.entities[itemId] = {
      id: itemId,
      data: { label: page.title, pageId: pid, chapter: page.chapter },
    }
    children.push(itemId)
  }
  acc.relationships[groupId] = children
}

function buildFilteredStore(acc: StoreAccumulator, allPages: PageInfo[], filterText: string) {
  const lower = filterText.toLowerCase()
  const matched = allPages.filter(p =>
    p.title.toLowerCase().includes(lower) ||
    p.id.toLowerCase().includes(lower) ||
    p.chapter.toLowerCase().includes(lower) ||
    (p.content?.toLowerCase().includes(lower) ?? false),
  )
  for (const page of matched) {
    let snippet: string | undefined
    if (page.content) {
      const idx = page.content.toLowerCase().indexOf(lower)
      if (idx >= 0) {
        const start = Math.max(0, idx - 30)
        const end = Math.min(page.content.length, idx + lower.length + 30)
        snippet = (start > 0 ? '...' : '') + page.content.slice(start, end).replace(/\n/g, ' ') + (end < page.content.length ? '...' : '')
      }
    }
    acc.entities[page.id] = {
      id: page.id,
      data: { label: page.title, pageId: page.id, chapter: page.chapter, ...(snippet ? { description: snippet } : {}) },
    }
    acc.relationships[ROOT_ID].push(page.id)
  }
}

function buildBrowseStore(acc: StoreAccumulator, allPages: PageInfo[]) {
  const S = navStore.get()
  addGroup(acc, allPages, 'group:recent', 'Recent', S.recent)
  addGroup(acc, allPages, 'group:favorites', 'Favorites', S.favorites)
  for (const layer of S.layers) {
    addGroup(acc, allPages, `group:layer:${layer.id}`, layer.name, layer.pageIds)
  }
  if (acc.relationships[ROOT_ID].length === 0) {
    const chapterMap = new Map<string, string[]>()
    for (const page of allPages) {
      const list = chapterMap.get(page.chapter) ?? []
      list.push(page.id)
      chapterMap.set(page.chapter, list)
    }
    for (const [chapter, pageIds] of chapterMap) {
      addGroup(acc, allPages, `group:ch:${chapter}`, chapter, pageIds)
    }
  }
}

export function buildQuickOpenStore(
  allPages: PageInfo[],
  filterText: string,
): NormalizedData {
  const acc: StoreAccumulator = { entities: {}, relationships: { [ROOT_ID]: [] } }

  if (filterText) buildFilteredStore(acc, allPages, filterText)
  else buildBrowseStore(acc, allPages)

  const firstRoot = acc.relationships[ROOT_ID][0]
  let firstItem = firstRoot
  if (firstRoot && acc.relationships[firstRoot]) {
    firstItem = acc.relationships[firstRoot][0] ?? firstRoot
  }
  if (firstItem) {
    acc.entities[FOCUS_ID] = { id: FOCUS_ID, focusedId: firstItem } as never
  }
  acc.entities[SELECTION_ID] = { id: SELECTION_ID, selectedIds: [] } as never

  return createStore(acc)
}
