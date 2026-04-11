import { useMemo } from 'react'
import { useCms } from './cmsContext'
import CmsSidebar from './CmsSidebar'
import CmsCanvas from './CmsCanvas'
import CmsDetailPanel from './CmsDetailPanel'
import CmsI18nSheet from './CmsI18nSheet'
import CmsViewportWrapper from './CmsViewportWrapper'
import { ScrollArea } from '@os/ui/ScrollArea'
import { ax } from '@styles/ax'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { collectSections } from './collectSections'
import { getParent } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

function SidebarWidget() {
  const { engine, store, locale, plugins, onActivateTabItem, canvasFocusedId } = useCms()

  const sidebarSections = useMemo(() => collectSections(store, ROOT_ID), [store])
  const activeSectionId = useMemo(() => {
    if (!canvasFocusedId) return null
    if (sidebarSections.includes(canvasFocusedId)) return canvasFocusedId
    let current = canvasFocusedId
    while (current) {
      const parent = getParent(store, current)
      if (!parent) return null
      if (sidebarSections.includes(parent)) return parent
      current = parent
    }
    return null
  }, [canvasFocusedId, sidebarSections, store])

  return (
    <CmsSidebar
      engine={engine}
      store={store}
      locale={locale}
      activeSectionId={activeSectionId}
      plugins={plugins}
      onActivateTabItem={onActivateTabItem}
    />
  )
}

function PreviewWidget() {
  const { engine, store, locale, viewport, plugins, setCanvasFocusedId, activeTabMap, onActivateTabItem, i18nSheetOpen } = useCms()

  return (
    <ScrollArea className={ax({ flex: '1', placement: 'relative' })}>
      <CmsViewportWrapper viewport={viewport}>
        <CmsCanvas engine={engine} store={store} locale={locale} onFocusChange={setCanvasFocusedId} plugins={plugins} activeTabMap={activeTabMap} onActivateTabItem={onActivateTabItem} />
      </CmsViewportWrapper>
      <CmsI18nSheet engine={engine} store={store} open={i18nSheetOpen} />
    </ScrollArea>
  )
}

function DetailWidget() {
  const { engine, store, canvasFocusedId, locale, setLocale, i18nSheetOpen, setI18nSheetOpen } = useCms()

  return (
    <CmsDetailPanel
      engine={engine}
      store={store}
      focusedNodeId={canvasFocusedId}
      locale={locale}
      onLocaleChange={setLocale}
      i18nSheetOpen={i18nSheetOpen}
      onI18nSheetToggle={() => setI18nSheetOpen(v => !v)}
    />
  )
}

export const cmsWidgets = createWidgetRegistry({
  CmsSidebar: SidebarWidget,
  CmsPreview: PreviewWidget,
  CmsDetail: DetailWidget,
})
