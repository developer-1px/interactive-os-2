// @useState-hatch — locale/viewport/i18nSheetOpen/presenting/canvasFocusedId/activeTabMap: view+interaction state not yet migrated to OS store
import { useCallback, useMemo, useState } from 'react'
import '../../styles/cms.css'
import '../../styles/landingTokens.css'
import type { ViewportSize } from './CmsViewportWrapper'
import CmsViewportBar from './CmsViewportBar'
import CmsFloatingToolbar from './CmsFloatingToolbar'
import CmsPresentMode from './CmsPresentMode'
import { RouteModal } from '@os/ui/RouteModal'
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
import { definePlugin } from '@os/advanced'
import type { Plugin, VisibilityFilter } from '@os/advanced'
import { childRules, nodeSchemas, getEditableFields, expandEntitySlots } from './cmsSchema'
import { zodSchema } from '@os/plugins/zodSchema'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { definePage } from '@os/layout/flatLayout'
import { FlatLayout } from '@os/ui/FlatLayout'
import { CmsProvider } from './cmsContext'
import { cmsWidgets } from './cmsWidgets'

// ② meta-editable-ssot-prd.md
export const cmsEditableFilter: VisibilityFilter = {
  isFocusable: (nodeId: string, store) => {
    const entity = store.entities[nodeId]
    if (!entity) return true
    const data = (entity.data ?? {}) as Record<string, unknown>
    // Single rule: .meta({ fieldType }) fields → focusable, else skip
    if (getEditableFields(data).length === 0) return false
    // Slot expansion nodes → children handle focus
    if (expandEntitySlots(nodeId, data) !== null) return false
    return true
  },
}

const sharedPlugins: Plugin[] = [
  spatial(),
  crud(),
  dnd(),
  history(),
  clipboard(),
  zodSchema({ childRules, rootTypes: [nodeSchemas.section, nodeSchemas['tab-group']] }),
  rename(),
  definePlugin({ name: 'cmsEditable', visibilityFilter: cmsEditableFilter }),
]

const cmsLayout = definePage({
  entities: {
    'main-row': {
      data: { type: 'split', direction: 'horizontal', sizes: [0.1, 'flex', 0.2] },
      children: ['sidebar', 'preview', 'detail'],
    },
    sidebar: {
      data: { type: 'widget', widget: 'CmsSidebar', surface: 'sunken' },
    },
    preview: {
      data: { type: 'widget', widget: 'CmsPreview' },
    },
    detail: {
      data: { type: 'widget', widget: 'CmsDetail', surface: 'sunken' },
    },
  },
})

export default function PageCms() {
  const [persistedData, setPersistedData] = useCmsData()
  const { engine, store } = useEngine({ data: persistedData, plugins: sharedPlugins, onChange: setPersistedData })
  const [locale, setLocale] = useState<Locale>('ko')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [i18nSheetOpen, setI18nSheetOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [canvasFocusedId, setCanvasFocusedId] = useState('')
  const [activeTabMap, setActiveTabMap] = useState<Map<string, string>>(new Map()) // @useState-hatch
  // @useState-hatch — detailZoneActive: zone transition (app-level routing, not OS state)
  const [detailZoneActive, setDetailZoneActive] = useState(false)

  const onSlotDrillDown = useCallback((_nodeId: string) => {
    setDetailZoneActive(true)
  }, [])

  const onDetailEscape = useCallback(() => {
    setDetailZoneActive(false)
    // V2: restore DOM focus to the canvas node that triggered drill-down
    requestAnimationFrame(() => {
      if (canvasFocusedId) {
        const el = document.querySelector<HTMLElement>(`[data-cms-id="${canvasFocusedId}"]`)
        el?.focus()
      }
    })
  }, [canvasFocusedId])

  const cmsGlobalKeyMap = useMemo(() => ({
    'Mod+\\': defineRouteKey('cms:toggle-present', () => setPresenting(prev => !prev), 'CMS'),
  }), [])

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

  const cmsCtx = useMemo(() => ({
    engine,
    store,
    plugins: sharedPlugins,
    locale,
    setLocale,
    viewport,
    setViewport,
    presenting,
    setPresenting,
    i18nSheetOpen,
    setI18nSheetOpen,
    canvasFocusedId,
    setCanvasFocusedId,
    activeTabMap,
    onActivateTabItem: handleActivateTabItem,
    detailZoneActive,
    onSlotDrillDown,
    onDetailEscape,
  }), [engine, store, locale, viewport, presenting, i18nSheetOpen, canvasFocusedId, activeTabMap, handleActivateTabItem, detailZoneActive, onSlotDrillDown, onDetailEscape])

  return (
    <AriaRoute keyMap={cmsGlobalKeyMap} label="CMS">
      <CmsProvider value={cmsCtx}>
        <div className={`cms-layout ${ax({ layout: 'stack', flex: '1' })}`}>
          <FlatLayout data={cmsLayout} registry={cmsWidgets} aria-label="CMS Layout" />
          <div className={ax({ placement: 'float-top-center' })}>
            <CmsViewportBar viewport={viewport} onViewportChange={setViewport} onPresent={() => setPresenting(true)} hidden={presenting} />
          </div>
          <div className={ax({ placement: 'float-bottom-center' })}>
            <CmsFloatingToolbar store={store} focusedId={canvasFocusedId} dispatch={(cmd) => engine.dispatch(cmd)} hidden={presenting} />
          </div>
          <RouteModal active={presenting} label="Presentation">
            <CmsPresentMode data={store} locale={locale} onExit={() => setPresenting(false)} />
          </RouteModal>
        </div>
      </CmsProvider>
    </AriaRoute>
  )
}
