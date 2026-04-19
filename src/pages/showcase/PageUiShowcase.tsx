import { useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { FOCUS_ID } from '@os/axis/navigate'
import { uiCategories, slugToMdFile } from './uiCategories'
import { ShowcaseProvider, type ShowcaseContextValue } from './showcaseContext'
import { ShowcaseSidebarWidget, ShowcaseContentWidget } from './showcaseWidgets'
import './PageUiShowcase.css'

// ── Sidebar store ──

const sidebarBaseStore = createStore({
  entities: {
    ...Object.fromEntries(
      uiCategories.map((cat) => [
        cat.label,
        { id: cat.label, data: { label: cat.label, type: 'group' } },
      ])
    ),
    ...Object.fromEntries(
      uiCategories.flatMap((cat) => cat.slugs).map((slug) => {
        const label = slugToMdFile[slug] ?? slug
        return [slug, { id: slug, data: { label } }]
      })
    ),
  },
  relationships: {
    [ROOT_ID]: uiCategories.map((cat) => cat.label),
    ...Object.fromEntries(
      uiCategories.map((cat) => [cat.label, cat.slugs])
    ),
  },
})

// ── Layout ──

const showcaseWidgets = createWidgetRegistry({
  ShowcaseSidebar: ShowcaseSidebarWidget,
  ShowcaseContent: ShowcaseContentWidget,
})

const showcaseLayout = definePage({
  entities: {
    root:    { data: { type: 'split', direction: 'horizontal', sizes: [0.2, 'flex'], resizable: false }, children: ['sidebar', 'content'] },
    sidebar: { data: { type: 'widget', widget: 'ShowcaseSidebar' } },
    content: { data: { type: 'widget', widget: 'ShowcaseContent' } },
  },
})

// ── Page ──

export default function PageUiShowcase() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const activeSlug = useMemo(() => {
    const segment = pathname.replace(/^\/ui\/?/, '').split('/')[0]
    return slugToMdFile[segment] ? segment : uiCategories[0].slugs[0]
  }, [pathname])

  const sidebarData = useMemo<NormalizedData>(() => ({
    ...sidebarBaseStore,
    entities: {
      ...sidebarBaseStore.entities,
      [FOCUS_ID]: { id: FOCUS_ID, focusedId: activeSlug },
    },
  }), [activeSlug])

  const handleActivate = useCallback((slug: string) => {
    navigate(`/ui/${slug}`)
  }, [navigate])

  const mdFile = slugToMdFile[activeSlug]

  const ctx = useMemo<ShowcaseContextValue>(() => ({
    sidebarData, activeSlug, handleActivate, mdFile,
  }), [sidebarData, activeSlug, handleActivate, mdFile])

  return (
    <ShowcaseProvider value={ctx}>
      <FlatLayout data={showcaseLayout} registry={showcaseWidgets} aria-label="UI Showcase" />
    </ShowcaseProvider>
  )
}
