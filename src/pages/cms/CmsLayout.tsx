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
import { useEngine } from '../../interactive-os/hooks/useEngine'
import { history } from '../../interactive-os/plugins/history'
import { clipboard } from '../../interactive-os/plugins/clipboard'
import { rename } from '../../interactive-os/plugins/rename'
import { getSpatialParentId } from '../../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import type { Plugin } from '../../interactive-os/core/types'

const sharedPlugins: Plugin[] = [history(), clipboard(), rename()]

export default function CmsLayout() {
  const [persistedData, setPersistedData] = useCmsData()
  const { engine, store } = useEngine({ data: persistedData, plugins: sharedPlugins, onChange: setPersistedData })
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [i18nSheetOpen, setI18nSheetOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const [canvasFocusedId, setCanvasFocusedId] = useState('')

  // Compute which root section is currently active from canvas focus
  // deps: store is intentionally omitted — recomputes only when focus changes.
  // Tree topology changes always accompany a focus change (focus recovery).
  const activeSectionId = useMemo(() => {
    if (!canvasFocusedId) return null

    const spatialParent = getSpatialParentId(store)
    const sections = getChildren(store, ROOT_ID)

    if (spatialParent === ROOT_ID) {
      return sections.includes(canvasFocusedId) ? canvasFocusedId : null
    }

    // Walk up to find the root-level section ancestor
    let current = canvasFocusedId
    while (current) {
      const parent = getParent(store, current)
      if (!parent || parent === ROOT_ID) {
        return sections.includes(current) ? current : null
      }
      current = parent
    }
    return null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasFocusedId])

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
        <CmsSidebar engine={engine} store={store} locale={locale} activeSectionId={activeSectionId} plugins={sharedPlugins} />
        <div className="cms-canvas-area">
          <CmsViewportWrapper viewport={viewport}>
            <CmsCanvas engine={engine} store={store} locale={locale} onFocusChange={setCanvasFocusedId} plugins={sharedPlugins} />
          </CmsViewportWrapper>
          <CmsI18nSheet data={store} onDataChange={setPersistedData} open={i18nSheetOpen} />
        </div>
      </div>
      <CmsFloatingToolbar data={store} onDataChange={setPersistedData} hidden={presenting} />
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
          data={store}
          locale={locale}
          onExit={() => setPresenting(false)}
        />
      )}
    </div>
  )
}
