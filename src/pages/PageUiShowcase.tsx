import { useState, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './PageUiShowcase.module.css'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import { FOCUS_ID } from '../interactive-os/plugins/core'
import type { NormalizedData } from '../interactive-os/core/types'
import { NavList } from '../interactive-os/ui/NavList'
import { components } from './showcaseRegistry'
import type { ComponentEntry } from './showcaseRegistry'

function ComponentDemo({ entry }: { entry: ComponentEntry }) {
  const [data, setData] = useState(() => entry.makeData())
  const onChange = useCallback((next: NormalizedData) => setData(next), [])

  return (
    <div className={styles.uiCard}>
      <h2 className={styles.uiCardHeading}>{entry.name}</h2>
      <p className={styles.uiCardDescription}>{entry.description}</p>

      <div className={styles.uiDemo}>
        <div className={styles.uiDemoLabel}>Live Demo</div>
        {entry.render(data, onChange)}
      </div>

      <div className={styles.uiCodeSection}>
        <div className={styles.uiCodeLabel}>Usage</div>
        <pre className={styles.uiCode}><code>{entry.usage}</code></pre>
      </div>
    </div>
  )
}

export default function PageUiShowcase() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const activeSlug = useMemo(() => {
    const segment = pathname.replace(/^\/ui\/?/, '').split('/')[0]
    const found = components.find((c) => c.slug === segment)
    return found ? found.slug : components[0]!.slug
  }, [pathname])

  const activeEntry = useMemo(
    () => components.find((c) => c.slug === activeSlug) ?? components[0]!,
    [activeSlug],
  )

  const sidebarStore = useMemo(() => {
    const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
    const ids: string[] = []
    for (const c of components) {
      entities[c.slug] = { id: c.slug, data: { label: c.name } }
      ids.push(c.slug)
    }
    const store = createStore({ entities, relationships: { [ROOT_ID]: ids } })
    return {
      ...store,
      entities: {
        ...store.entities,
        [FOCUS_ID]: { id: FOCUS_ID, focusedId: activeSlug },
      },
    } as NormalizedData
  }, [activeSlug])

  const handleActivate = useCallback((nodeId: string) => {
    if (nodeId !== activeSlug) {
      navigate(`/ui/${nodeId}`)
    }
  }, [navigate, activeSlug])

  return (
    <div className={styles.uiPage}>
      <nav className={styles.uiSidebar}>
        <div className={styles.uiSidebarHeader}>
          <span className={styles.uiSidebarTitle}>UI Components</span>
        </div>
        <NavList data={sidebarStore} onActivate={handleActivate} aria-label="UI Components" />
      </nav>
      <div className={styles.uiContent}>
        <div className={styles.uiContentHeader}>
          <span className={styles.uiContentTitle}>{activeEntry.name}</span>
        </div>
        <div className={styles.uiContentBody}>
          <ComponentDemo key={activeEntry.slug} entry={activeEntry} />
        </div>
      </div>
    </div>
  )
}
