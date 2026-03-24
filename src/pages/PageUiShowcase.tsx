import { useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './PageUiShowcase.module.css'
import MdPage from './MdPage'
import { uiCategories, slugToMdFile } from './uiCategories'
import { components } from './showcaseRegistry'
import { Aria } from '../interactive-os/components/aria'
import { navlist } from '../interactive-os/behaviors/navlist'
import { core, FOCUS_ID } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

// --- Pre-computed store + ids ---

const allSlugs = uiCategories.flatMap((cat) => cat.slugs)

const sidebarBaseStore = createStore({
  entities: Object.fromEntries(
    allSlugs.map((slug) => {
      const entry = components.find((c) => c.slug === slug)
      return [slug, { id: slug, data: { label: entry?.name ?? slug } }]
    })
  ),
  relationships: { [ROOT_ID]: allSlugs },
})

const categoryIds = Object.fromEntries(
  uiCategories.map((cat) => [cat.label, cat.slugs])
)

// --- Sidebar item renderer ---

const renderSidebarItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string ?? node.id as string
  return (
    <div {...props} className={styles.uiNavItem + (state.focused ? ' ' + styles.uiNavItemActive : '')}>
      {label}
    </div>
  )
}

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
          <Aria
            behavior={navlist}
            data={sidebarData}
            plugins={[core()]}
            onActivate={handleActivate}
            aria-label="UI Components"
            autoFocus={false}
          >
            {uiCategories.map((cat) => (
              <div key={cat.label} role="group" aria-label={cat.label} className={styles.uiCategory}>
                <div className={styles.uiCategoryLabel}>{cat.label}</div>
                <Aria.Item asChild ids={categoryIds[cat.label]} render={renderSidebarItem} />
              </div>
            ))}
          </Aria>
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
