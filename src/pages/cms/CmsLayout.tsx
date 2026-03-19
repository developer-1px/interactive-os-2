import { useMemo, useState, useRef } from 'react'
import '../../styles/cms.css'
import CmsTopToolbar from './CmsTopToolbar'
import type { ViewportSize } from './CmsViewportWrapper'
import CmsViewportWrapper from './CmsViewportWrapper'
import CmsHamburgerDrawer from './CmsHamburgerDrawer'
import CmsCanvas from './CmsCanvas'
import CmsSidebar from './CmsSidebar'
import CmsFloatingToolbar from './CmsFloatingToolbar'
import CmsI18nSheet from './CmsI18nSheet'
import CmsPresentMode from './CmsPresentMode'
import { useCmsData } from './cms-state'
import type { Locale } from './cms-types'
import { FOCUS_ID } from '../../interactive-os/plugins/core'
import { getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'

export default function CmsLayout() {
  const [data, setData] = useCmsData()
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [i18nSheetOpen, setI18nSheetOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // Compute which root section is currently active from canvas focus
  const activeSectionId = useMemo(() => {
    const focusedId = data.entities[FOCUS_ID]?.focusedId as string | undefined
    if (!focusedId) return null

    const spatialParent = getSpatialParentId(data)
    const sections = getChildren(data, ROOT_ID)

    if (spatialParent === ROOT_ID) {
      return sections.includes(focusedId) ? focusedId : null
    }

    // Walk up to find the root-level section ancestor
    let current = focusedId
    while (current) {
      const parent = getParent(data, current)
      if (!parent || parent === ROOT_ID) {
        return sections.includes(current) ? current : null
      }
      current = parent
    }
    return null
  }, [data])

  return (
    <div className="cms-layout">
      <CmsTopToolbar
        onHamburgerClick={() => setDrawerOpen(true)}
        locale={locale}
        onLocaleChange={setLocale}
        viewport={viewport}
        onViewportChange={setViewport}
        onPresent={() => setPresenting(true)}
        hamburgerRef={hamburgerRef}
        i18nSheetOpen={i18nSheetOpen}
        onI18nSheetToggle={() => setI18nSheetOpen(v => !v)}
      />
      <div className="cms-body">
        <CmsSidebar data={data} onDataChange={setData} locale={locale} activeSectionId={activeSectionId} />
        <div className="cms-canvas-area">
          <CmsViewportWrapper viewport={viewport}>
            <CmsCanvas data={data} onDataChange={setData} locale={locale} />
          </CmsViewportWrapper>
          <CmsI18nSheet data={data} onDataChange={setData} open={i18nSheetOpen} />
        </div>
      </div>
      <CmsFloatingToolbar data={data} onDataChange={setData} hidden={presenting} />
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
      {presenting && (
        <CmsPresentMode
          data={data}
          locale={locale}
          onExit={() => setPresenting(false)}
        />
      )}
    </div>
  )
}
