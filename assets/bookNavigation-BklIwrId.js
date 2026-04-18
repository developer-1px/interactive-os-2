var e=`// @useState-hatch
import { useCallback, useMemo, useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { NormalizedData } from '@os/store/types'
import type { BookPage } from './bookContent'
import {
  toggleFavorite,
  isFavorite,
  buildQuickOpenStore,
  buildAddToLayerStore,
  addToLayer,
  removeFromLayer,
  createLayer,
  getLayers,
} from './bookNavStore'

// ── Types ──

export interface BookNavigationInput {
  pages: BookPage[]
  pageIndexById: Map<string, number>
  currentPage: number
  page: BookPage | undefined
  navigate: NavigateFunction
  pageInfos: { id: string; title: string; chapter: string; content: string }[]
  quickOpenFilter: string
  setTocOpen: (v: boolean) => void
  setQuickOpenVisible: (v: boolean) => void
  setQuickOpenFilter: (v: string) => void
  setArrivedFromNext: (v: boolean) => void
  setSpread: (v: number) => void
  setTotalSpreads: (v: number) => void
}

export interface BookNavigationResult {
  // Navigation
  goTo: (index: number) => void
  goToId: (pageId: string) => void
  linkTransform: (href: string) => { href: string; onClick?: (e: React.MouseEvent) => void }
  handleTocActivate: (nodeId: string) => void
  handleQuickOpenActivate: (nodeId: string) => void
  handleNextBoundary: () => void
  handlePrevBoundary: () => void
  handleSpreadChange: (s: number, total: number) => void
  // Favorite
  handleToggleFavorite: () => void
  currentIsFavorite: boolean
  // Quick Open
  quickOpenStore: NormalizedData
  openQuickOpen: () => void
  closeQuickOpen: () => void
  // Layer
  layerOverlayVisible: boolean
  addToLayerStoreData: NormalizedData
  layerNameMode: boolean
  layerNameInput: string
  setLayerNameInput: (v: string) => void
  openLayerOverlay: () => void
  closeLayerOverlay: () => void
  handleLayerActivate: (nodeId: string) => void
  handleLayerNameSubmit: () => void
  layerCount: number
}

// ── Hook ──

export function useBookNavigation(input: BookNavigationInput): BookNavigationResult {
  const {
    pages, pageIndexById, currentPage, page, navigate,
    pageInfos, quickOpenFilter,
    setTocOpen, setQuickOpenVisible, setQuickOpenFilter,
    setArrivedFromNext, setSpread, setTotalSpreads,
  } = input

  const [favToggle, setFavToggle] = useState(0) // @useState-hatch
  const [layerOverlayVisible, setLayerOverlayVisible] = useState(false) // @useState-hatch
  const [layerToggle, setLayerToggle] = useState(0) // @useState-hatch
  const [layerNameInput, setLayerNameInput] = useState('') // @useState-hatch — inline layer naming
  const [layerNameMode, setLayerNameMode] = useState(false) // @useState-hatch

  // ── Quick Open store ──
  const quickOpenStore = useMemo(
    () => buildQuickOpenStore(pageInfos, quickOpenFilter),
    [pageInfos, quickOpenFilter, favToggle], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ── Navigation ──
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < pages.length) {
      navigate(\`/book/\${pages[index].id}\`, { replace: true })
      setTocOpen(false)
      setQuickOpenVisible(false)
      setQuickOpenFilter('')
    }
  }, [pages, navigate, setTocOpen, setQuickOpenVisible, setQuickOpenFilter])

  const goToId = useCallback((pageId: string) => {
    const index = pageIndexById.get(pageId)
    if (index != null) goTo(index)
  }, [pageIndexById, goTo])

  // ── Link transform for MarkdownViewer ──
  const linkTransform = useCallback((href: string) => {
    const match = href.match(/^\\/?([\\w/.-]+?)(?:\\.mdx?)?$/)
    if (match && !href.startsWith('http')) {
      const pageId = match[1]
      return {
        href: \`/book/\${pageId}\`,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          goToId(pageId)
        },
      }
    }
    return { href }
  }, [goToId])

  const handleTocActivate = useCallback((nodeId: string) => {
    goToId(nodeId)
  }, [goToId])

  const handleQuickOpenActivate = useCallback((nodeId: string) => {
    const entity = quickOpenStore.entities[nodeId]
    const pageId = (entity?.data as Record<string, unknown>)?.pageId as string | undefined
    if (pageId) goToId(pageId)
  }, [quickOpenStore, goToId])

  // ── SpreadReader callbacks ──
  const handleNextBoundary = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setArrivedFromNext(false)
      goTo(currentPage + 1)
    }
  }, [currentPage, pages.length, goTo, setArrivedFromNext])

  const handlePrevBoundary = useCallback(() => {
    if (currentPage > 0) {
      setArrivedFromNext(true)
      navigate(\`/book/\${pages[currentPage - 1].id}\`, { replace: true })
    }
  }, [currentPage, pages, navigate, setArrivedFromNext])

  const handleSpreadChange = useCallback((s: number, total: number) => {
    setSpread(s)
    setTotalSpreads(total)
  }, [setSpread, setTotalSpreads])

  // ── Favorite toggle ──
  const handleToggleFavorite = useCallback(() => {
    if (page) {
      toggleFavorite(page.id)
      setFavToggle(v => v + 1)
    }
  }, [page])

  const currentIsFavorite = page ? isFavorite(page.id) : false

  // ── Quick Open open/close ──
  const openQuickOpen = useCallback(() => {
    setQuickOpenVisible(true)
    setQuickOpenFilter('')
  }, [setQuickOpenVisible, setQuickOpenFilter])

  const closeQuickOpen = useCallback(() => {
    setQuickOpenVisible(false)
    setQuickOpenFilter('')
  }, [setQuickOpenVisible, setQuickOpenFilter])

  // ── Layer overlay ──
  const currentPageId = page?.id ?? ''
  const addToLayerStoreData = useMemo(
    () => buildAddToLayerStore(currentPageId),
    [currentPageId, layerToggle], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const openLayerOverlay = useCallback(() => {
    if (!page) return
    setLayerOverlayVisible(true)
  }, [page])

  const closeLayerOverlay = useCallback(() => {
    setLayerOverlayVisible(false)
    setLayerNameMode(false)
    setLayerNameInput('')
  }, [])

  const handleLayerActivate = useCallback((nodeId: string) => {
    if (!page) return
    const entity = addToLayerStoreData.entities[nodeId]
    const data = entity?.data as Record<string, unknown> | undefined
    const action = data?.action as string | undefined

    if (action === 'create') {
      setLayerNameMode(true)
      return
    } else if (action === 'add') {
      const layerId = data?.layerId as string
      addToLayer(layerId, page.id)
    } else if (action === 'remove') {
      const layerId = data?.layerId as string
      removeFromLayer(layerId, page.id)
    }

    setLayerToggle(v => v + 1)
    closeLayerOverlay()
  }, [page, addToLayerStoreData, closeLayerOverlay])

  const handleLayerNameSubmit = useCallback(() => {
    if (!page || !layerNameInput.trim()) return
    const layerId = createLayer(layerNameInput.trim())
    addToLayer(layerId, page.id)
    setLayerToggle(v => v + 1)
    closeLayerOverlay()
  }, [page, layerNameInput, closeLayerOverlay])

  return {
    goTo, goToId, linkTransform,
    handleTocActivate, handleQuickOpenActivate,
    handleNextBoundary, handlePrevBoundary, handleSpreadChange,
    handleToggleFavorite, currentIsFavorite,
    quickOpenStore, openQuickOpen, closeQuickOpen,
    layerOverlayVisible, addToLayerStoreData,
    layerNameMode, layerNameInput, setLayerNameInput,
    openLayerOverlay, closeLayerOverlay,
    handleLayerActivate, handleLayerNameSubmit,
    layerCount: getLayers().length,
  }
}
`;export{e as default};