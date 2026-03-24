import { useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './PageUiShowcase.module.css'
import MdPage from './MdPage'
import { uiCategories, slugToMdFile } from './uiCategories'
import { components } from './showcaseRegistry'
import { NavList } from '../interactive-os/ui/NavList'
import { FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'

// --- Grouped store: ROOT → groups → items ---

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
        const entry = components.find((c) => c.slug === slug)
        return [slug, { id: slug, data: { label: entry?.name ?? slug } }]
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

// --- PageUiShowcase ---

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

  return (
    <div className={styles.uiPage}>
      <nav className={styles.uiSidebar}>
        <div className={styles.uiSidebarHeader}>
          <span className={styles.uiSidebarTitle}>UI Components</span>
        </div>
        <div className={styles.uiSidebarBody}>
          <NavList
            data={sidebarData}
            onActivate={handleActivate}
            aria-label="UI Components"
          />
        </div>
      </nav>
      <div className={styles.uiContent}>
        <div className={styles.uiContentBody}>
          {mdFile ? (
            <MdPage key={activeSlug} md={`ui/${mdFile}`} />
          ) : (
            <div style={{ padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>Unknown component: {activeSlug}</div>
          )}
        </div>
      </div>
    </div>
  )
}
