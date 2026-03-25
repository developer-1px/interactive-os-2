import { useCallback, useMemo, useState, useRef } from 'react'
import '../../styles/cms.css'
import '../../styles/landingTokens.css'
import { useResizer } from '../../hooks/useResizer'
import '../../styles/resizer.css'
import type { ViewportSize } from './CmsViewportWrapper'
import CmsViewportWrapper from './CmsViewportWrapper'
import CmsViewportBar from './CmsViewportBar'
import CmsHamburgerDrawer from './CmsHamburgerDrawer'
import CmsCanvas from './CmsCanvas'
import CmsSidebar from './CmsSidebar'
import CmsFloatingToolbar from './CmsFloatingToolbar'
import CmsI18nSheet from './CmsI18nSheet'
import CmsPresentMode from './CmsPresentMode'
import CmsDetailPanel from './CmsDetailPanel'
import { useCmsData } from './cms-state'
import type { Locale } from './cms-types'
import { useEngine } from '../../interactive-os/engine/useEngine'
import { history } from '../../interactive-os/plugins/history'
import { clipboard } from '../../interactive-os/plugins/clipboard'
import { rename } from '../../interactive-os/plugins/rename'
import { getParent } from '../../interactive-os/store/createStore'
import { collectSections } from './collectSections'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { Plugin } from '../../interactive-os/plugins/types'
import { childRules, nodeSchemas } from './cms-schema'
import { zodSchema } from '../../interactive-os/plugins/zodSchema'
import { useAria } from '../../interactive-os/primitives/useAria'
import type { KeyMap } from '../../interactive-os/axis/types'

import type { NormalizedData } from '../../interactive-os/store/types'

const EMPTY_DATA: NormalizedData = { entities: {}, relationships: { [ROOT_ID]: [] } }

const sharedPlugins: Plugin[] = [
  history(),
  clipboard(),
  zodSchema({ childRules, rootTypes: [nodeSchemas.section, nodeSchemas['tab-group']] }),
  rename(),
]

export default function CmsLayout() {
  const [persistedData, setPersistedData] = useCmsData()
  const { engine, store } = useEngine({ data: persistedData, plugins: sharedPlugins, onChange: setPersistedData })
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [i18nSheetOpen, setI18nSheetOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const presentingRef = useRef(false)
  presentingRef.current = presenting
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const [canvasFocusedId, setCanvasFocusedId] = useState('')
  const [activeTabMap, setActiveTabMap] = useState<Map<string, string>>(new Map())

  const cmsGlobalKeyMap = useMemo((): KeyMap => ({
    'Mod+\\': () => { if (!presentingRef.current) setPresenting(true) },
  }), [])

  const { containerProps: globalKeyMapProps } = useAria({
    data: EMPTY_DATA,
    keyMap: cmsGlobalKeyMap,
  })

  const sidebarResizer = useResizer({
    defaultSize: 120, minSize: 80, maxSize: 300, step: 10,
    storageKey: 'cms-sidebar-width',
  })
  const detailResizer = useResizer({
    defaultSize: 240, minSize: 160, maxSize: 480, step: 10,
    storageKey: 'cms-detail-width', reverse: true,
  })

  const handleActivateTabItem = useCallback((tabItemId: string) => {
    setActiveTabMap(prev => {
      const parentId = getParent(store, tabItemId)
      if (!parentId) return prev
      if (prev.get(parentId) === tabItemId) return prev
      const next = new Map(prev)
      next.set(parentId, tabItemId)
      return next
    })
  }, [store])

  const sidebarSections = useMemo(() => collectSections(store, ROOT_ID), [store])

  const activeSectionId = useMemo(() => {
    if (!canvasFocusedId) return null
    // If focused node is itself a section in the sidebar list, return it
    if (sidebarSections.includes(canvasFocusedId)) return canvasFocusedId
    // Walk up to find the nearest section ancestor that's in the sidebar list
    let current = canvasFocusedId
    while (current) {
      const parent = getParent(store, current)
      if (!parent) return null
      if (sidebarSections.includes(parent)) return parent
      current = parent
    }
    return null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasFocusedId, sidebarSections])

  return (
    <div className="cms-layout" {...(globalKeyMapProps as React.HTMLAttributes<HTMLDivElement>)}>
      <div className="cms-body">
        <CmsSidebar
          engine={engine}
          store={store}
          locale={locale}
          activeSectionId={activeSectionId}
          plugins={sharedPlugins}
          onActivateTabItem={handleActivateTabItem}
          style={{ width: sidebarResizer.size }}
          onHamburgerClick={() => setDrawerOpen(true)}
          onLocaleChange={setLocale}
          hamburgerRef={hamburgerRef}
          i18nSheetOpen={i18nSheetOpen}
          onI18nSheetToggle={() => setI18nSheetOpen(v => !v)}
        />
        <div className="resizer-handle" aria-label="Resize sidebar" {...sidebarResizer.separatorProps} />
        <div className="cms-canvas-area">
          <CmsViewportWrapper viewport={viewport}>
            <CmsCanvas engine={engine} store={store} locale={locale} onFocusChange={setCanvasFocusedId} plugins={sharedPlugins} activeTabMap={activeTabMap} onActivateTabItem={handleActivateTabItem} />
          </CmsViewportWrapper>
          <CmsI18nSheet engine={engine} store={store} open={i18nSheetOpen} />
        </div>
        <div className="resizer-handle" aria-label="Resize detail panel" {...detailResizer.separatorProps} />
        <CmsDetailPanel
          engine={engine}
          store={store}
          focusedNodeId={canvasFocusedId}
          locale={locale}
          style={{ width: detailResizer.size }}
        />
      </div>
      <CmsViewportBar viewport={viewport} onViewportChange={setViewport} onPresent={() => setPresenting(true)} hidden={presenting} />
      <CmsFloatingToolbar store={store} focusedId={canvasFocusedId} dispatch={(cmd) => engine.dispatch(cmd)} hidden={presenting} />
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
