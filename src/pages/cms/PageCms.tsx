// @useState-hatch — locale/viewport/i18nSheetOpen/presenting/canvasFocusedId/activeTabMap: view+interaction state not yet migrated to OS store
import { useCallback, useMemo, useState } from 'react'
import '../../styles/cms.css'
import '../../styles/landingTokens.css'
import { useResizer } from '../../hooks/useResizer'
import '../../styles/resizer.css'
import type { ViewportSize } from './CmsViewportWrapper'
import CmsViewportWrapper from './CmsViewportWrapper'
import CmsViewportBar from './CmsViewportBar'
import CmsCanvas from './CmsCanvas'
import CmsSidebar from './CmsSidebar'
import CmsFloatingToolbar from './CmsFloatingToolbar'
import CmsI18nSheet from './CmsI18nSheet'
import CmsPresentMode from './CmsPresentMode'
import CmsDetailPanel from './CmsDetailPanel'
import { RouteModal } from '@os/ui/RouteModal'
import { ScrollArea } from '@os/ui/ScrollArea'
import { useCmsData } from './cmsState'
import type { Locale } from './cmsTypes'
import { useEngine } from '@os/engine/useEngine'
import { ax } from '@styles/ax'
import { history } from '@os/plugins/history'
import { clipboard } from '@os/plugins/clipboard'
import { crud } from '@os/plugins/crud'
import { dnd } from '@os/plugins/dnd'
import { rename } from '@os/plugins/rename'
import { spatial } from '@os/plugins/spatial'
import { getParent } from '@os/store/createStore'
import { collectSections } from './collectSections'
import { ROOT_ID } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import { childRules, nodeSchemas } from './cmsSchema'
import { zodSchema } from '@os/plugins/zodSchema'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'

const sharedPlugins: Plugin[] = [
  spatial(),
  crud(),
  dnd(),
  history(),
  clipboard(),
  zodSchema({ childRules, rootTypes: [nodeSchemas.section, nodeSchemas['tab-group']] }),
  rename(),
]

export default function PageCms() {
  const [persistedData, setPersistedData] = useCmsData()
  const { engine, store } = useEngine({ data: persistedData, plugins: sharedPlugins, onChange: setPersistedData })
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [i18nSheetOpen, setI18nSheetOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [canvasFocusedId, setCanvasFocusedId] = useState('')
  const [activeTabMap, setActiveTabMap] = useState<Map<string, string>>(new Map())

  const cmsGlobalKeyMap = useMemo(() => ({
    'Mod+\\': defineRouteKey('cms:toggle-present', () => setPresenting(prev => !prev), 'CMS'),
  }), [])

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
    <AriaRoute keyMap={cmsGlobalKeyMap} label="CMS">
    <div className={`cms-layout ${ax({ layout: 'fill' })}`}>
      <div className={ax({ layout: 'row-fill' })}>
        <CmsSidebar
          engine={engine}
          store={store}
          locale={locale}
          activeSectionId={activeSectionId}
          plugins={sharedPlugins}
          onActivateTabItem={handleActivateTabItem}
          style={{ width: sidebarResizer.size, '--sidebar-w': sidebarResizer.size } as React.CSSProperties}
        />
        <div className="resizer-handle" aria-label="Resize sidebar" {...sidebarResizer.separatorProps} />
        <ScrollArea className={`relative ${ax({ flex: '1' })}`}>
          <CmsViewportWrapper viewport={viewport}>
            <CmsCanvas engine={engine} store={store} locale={locale} onFocusChange={setCanvasFocusedId} plugins={sharedPlugins} activeTabMap={activeTabMap} onActivateTabItem={handleActivateTabItem} />
          </CmsViewportWrapper>
          <CmsI18nSheet engine={engine} store={store} open={i18nSheetOpen} />
        </ScrollArea>
        <div className="resizer-handle" aria-label="Resize detail panel" {...detailResizer.separatorProps} />
        <CmsDetailPanel
          engine={engine}
          store={store}
          focusedNodeId={canvasFocusedId}
          locale={locale}
          onLocaleChange={setLocale}
          i18nSheetOpen={i18nSheetOpen}
          onI18nSheetToggle={() => setI18nSheetOpen(v => !v)}
          style={{ width: detailResizer.size }}
        />
      </div>
      <CmsViewportBar viewport={viewport} onViewportChange={setViewport} onPresent={() => setPresenting(true)} hidden={presenting} />
      <CmsFloatingToolbar store={store} focusedId={canvasFocusedId} dispatch={(cmd) => engine.dispatch(cmd)} hidden={presenting} />
      <RouteModal active={presenting} label="Presentation">
        <CmsPresentMode
          data={store}
          locale={locale}
          onExit={() => setPresenting(false)}
        />
      </RouteModal>
    </div>
    </AriaRoute>
  )
}
