import { useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './PageUiShowcase.module.css'
import MdPage from './MdPage'
import { uiCategories, slugToMdFile } from './uiCategories'
import { components } from './showcaseRegistry'
import { NavList } from '../interactive-os/ui/NavList'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import { FOCUS_ID } from '../interactive-os/plugins/core'
import type { NormalizedData } from '../interactive-os/core/types'

function CategoryNavList({ category, activeSlug, onActivate }: {
  category: typeof uiCategories[number]
  activeSlug: string
  onActivate: (slug: string) => void
}) {
  const store = useMemo(() => {
    const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
    const ids: string[] = []
    for (const slug of category.slugs) {
      const entry = components.find((c) => c.slug === slug)
      if (!entry) continue
      entities[slug] = { id: slug, data: { label: entry.name } }
      ids.push(slug)
    }
    const base = createStore({ entities, relationships: { [ROOT_ID]: ids } })
    const isActive = category.slugs.includes(activeSlug)
    if (!isActive) return base
    return {
      ...base,
      entities: {
        ...base.entities,
        [FOCUS_ID]: { id: FOCUS_ID, focusedId: activeSlug },
      },
    } as NormalizedData
  }, [category.slugs, activeSlug])

  return (
    <NavList
      data={store}
      onActivate={onActivate}
      aria-label={`${category.label} components`}
    />
  )
}

export default function PageUiShowcase() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const activeSlug = useMemo(() => {
    const segment = pathname.replace(/^\/ui\/?/, '').split('/')[0]
    const found = slugToMdFile[segment]
    return found ? segment : uiCategories[0].slugs[0]
  }, [pathname])

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
          {uiCategories.map((cat) => (
            <div key={cat.label} className={styles.uiCategory}>
              <div className={styles.uiCategoryLabel}>{cat.label}</div>
              <CategoryNavList
                category={cat}
                activeSlug={activeSlug}
                onActivate={handleActivate}
              />
            </div>
          ))}
        </div>
      </nav>
      <div className={styles.uiContent}>
        <div className={styles.uiContentBody}>
          {mdFile ? (
            <MdPage key={activeSlug} md={`ui/${mdFile}`} />
          ) : (
            <div style={{ padding: 24, color: 'var(--text-muted)' }}>Unknown component: {activeSlug}</div>
          )}
        </div>
      </div>
    </div>
  )
}
