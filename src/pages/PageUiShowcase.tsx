import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './PageUiShowcase.module.css'
import MdPage from './MdPage'
import { uiCategories, slugToMdFile } from './uiCategories'
import { components } from './showcaseRegistry'

export default function PageUiShowcase() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const activeSlug = useMemo(() => {
    const segment = pathname.replace(/^\/ui\/?/, '').split('/')[0]
    const found = slugToMdFile[segment]
    return found ? segment : uiCategories[0].slugs[0]
  }, [pathname])

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
              {cat.slugs.map((slug) => {
                const entry = components.find((c) => c.slug === slug)
                if (!entry) return null
                return (
                  <button
                    key={slug}
                    className={styles.uiNavItem + (slug === activeSlug ? ' ' + styles.uiNavItemActive : '')}
                    onClick={() => navigate(`/ui/${slug}`)}
                  >
                    {entry.name}
                  </button>
                )
              })}
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
