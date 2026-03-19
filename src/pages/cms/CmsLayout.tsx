import { useState, useRef } from 'react'
import '../../styles/cms.css'
import CmsTopToolbar from './CmsTopToolbar'
import type { ViewportSize } from './CmsViewportWrapper'
import CmsViewportWrapper from './CmsViewportWrapper'
import CmsHamburgerDrawer from './CmsHamburgerDrawer'
import CmsCanvas from './CmsCanvas'
import CmsSidebar from './CmsSidebar'
import CmsFloatingToolbar from './CmsFloatingToolbar'
import CmsI18nSheet from './CmsI18nSheet'
import { useCmsData } from './cms-state'
import type { Locale } from './cms-types'

export default function CmsLayout() {
  const [data, setData] = useCmsData()
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [i18nSheetOpen, setI18nSheetOpen] = useState(false)
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
        i18nSheetOpen={i18nSheetOpen}
        onI18nSheetToggle={() => setI18nSheetOpen(v => !v)}
      />
      <div className="cms-body">
        <CmsSidebar data={data} onDataChange={setData} locale={locale} />
        <div className="cms-canvas-area">
          <CmsViewportWrapper viewport={viewport}>
            <CmsCanvas data={data} onDataChange={setData} locale={locale} />
          </CmsViewportWrapper>
          <CmsI18nSheet data={data} onDataChange={setData} open={i18nSheetOpen} />
        </div>
      </div>
      <CmsFloatingToolbar data={data} onDataChange={setData} hidden={false} />
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
