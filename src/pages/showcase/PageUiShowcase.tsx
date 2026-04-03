import { useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ax } from '@styles/ax'
import styles from './PageUiShowcase.module.css'
import MdPage from './MdPage'
import { uiCategories, slugToMdFile } from './uiCategories'
import { NavList } from '@os/ui/NavList'
import { FOCUS_ID } from '@os/axis/navigate'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'

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
    <div className={`${styles.uiPage} flex-row flex-1 min-h-0`}>
      <nav className={`${styles.uiSidebar} flex-col`}>
        <div className={`${styles.uiSidebarHeader} flex-row items-center justify-between shrink-0`}>
          <span className={ax({ textStyle: 'overline' }) + ' ' + styles.uiSidebarTitle}>UI Components</span>
        </div>
        <div className={`${styles.uiSidebarBody} flex-1 overflow-y-auto`}>
          <NavList
            data={sidebarData}
            onActivate={handleActivate}
            aria-label="UI Components"
          />
        </div>
      </nav>
      <div className={`${styles.uiContent} flex-col flex-1 min-w-0 overflow-hidden`}>
        <div className={`${styles.uiContentBody} flex-1 overflow-y-auto`}>
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
