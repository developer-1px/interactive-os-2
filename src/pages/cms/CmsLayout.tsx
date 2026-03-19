import { useState, useRef } from 'react'
import '../../styles/cms.css'
import CmsTopToolbar from './CmsTopToolbar'
import type { ViewportSize } from './CmsTopToolbar'
import CmsHamburgerDrawer from './CmsHamburgerDrawer'
import CmsCanvas from './CmsCanvas'
import { useCmsData } from './cms-state'
import type { Locale } from './cms-types'

export default function CmsLayout() {
  const [data, setData] = useCmsData()
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="cms-layout">
      <CmsTopToolbar
        onHamburgerClick={() => setDrawerOpen(true)}
        locale={locale}
        onLocaleChange={setLocale}
        viewport={viewport}
        onViewportChange={setViewport}
        onPresent={() => {/* Task 9 */}}
        hamburgerRef={hamburgerRef}
      />
      <div className="cms-body">
        <aside className="cms-sidebar">
          {/* Task 5 will fill this */}
          <div style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>Sections</div>
        </aside>
        <div className="cms-canvas-area">
          <CmsCanvas data={data} onDataChange={setData} locale={locale} />
        </div>
      </div>
      {drawerOpen && (
        <CmsHamburgerDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            hamburgerRef.current?.focus()
          }}
          hamburgerRef={hamburgerRef}
        />
      )}
    </div>
  )
}
