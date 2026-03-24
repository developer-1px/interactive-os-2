import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { Menu, Sheet } from 'lucide-react'
import { getChildren } from '../../interactive-os/core/createStore'
import { ROOT_ID, createBatchCommand } from '../../interactive-os/core/types'
import type { NormalizedData, Command, Plugin } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import type { Locale } from './cms-types'
import type { TemplateType } from './cms-templates'
import { templateToCommand } from './cms-templates'
import { getSectionClassName, NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'
import { collectSections, getRootAncestor, getTabItemAncestor } from './collectSections'
import type { LocaleMap } from './cms-types'
import { LOCALES } from './cms-types'
import { useAriaZone } from '../../interactive-os/hooks/useAriaZone'
import { listbox } from '../../interactive-os/behaviors/listbox'
import { focusCommands } from '../../interactive-os/plugins/core'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import { clipboardCommands } from '../../interactive-os/plugins/clipboard'
import CmsTemplatePicker from './CmsTemplatePicker'

interface CmsSidebarProps {
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  activeSectionId: string | null
  plugins?: Plugin[]
  onActivateTabItem?: (tabItemId: string) => void
  style?: React.CSSProperties
  onHamburgerClick: () => void
  onLocaleChange: (locale: Locale) => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
  i18nSheetOpen: boolean
  onI18nSheetToggle: () => void
}

// ── Thumbnail renderer (read-only mini preview) ──

function SectionThumbnail({ data, sectionId, locale }: {
  data: NormalizedData
  sectionId: string
  locale: Locale
}) {
  const entity = data.entities[sectionId]
  if (!entity) return null
  const d = (entity.data ?? {}) as Record<string, string>
  const children = getChildren(data, sectionId)
  const className = getSectionClassName(d.variant)
  const tag = getNodeTag(d)
  const childrenContainerClass = getChildrenContainerClassName(d)

  const headerIds: string[] = []
  const contentIds: string[] = []
  for (const childId of children) {
    const childData = (data.entities[childId]?.data ?? {}) as Record<string, string>
    if (HEADER_TYPES.has(childData.type)) {
      headerIds.push(childId)
    } else {
      contentIds.push(childId)
    }
  }

  const headerContent = headerIds.map(childId => (
    <ThumbNode key={childId} data={data} nodeId={childId} locale={locale} />
  ))
  const contentContent = contentIds.map(childId => (
    <ThumbNode key={childId} data={data} nodeId={childId} locale={locale} />
  ))

  const inner = (
    <>
      {headerContent}
      {childrenContainerClass && contentIds.length > 0
        ? <div className={childrenContainerClass}>{contentContent}</div>
        : contentContent}
    </>
  )

  return createElement(tag, { className, 'aria-hidden': true }, inner)
}

function ThumbNode({ data, nodeId, locale }: {
  data: NormalizedData
  nodeId: string
  locale: Locale
}) {
  const entity = data.entities[nodeId]
  if (!entity) return null
  const d = (entity.data ?? {}) as Record<string, string>
  const children = getChildren(data, nodeId)
  const dummyState = { focused: false, selected: false, expanded: false, disabled: false }
  const className = getNodeClassName(d, dummyState)
  const tag = getNodeTag(d)

  if (d.type === 'card') {
    return (
      <div className={className}>
        {children.map(childId => (
          <ThumbNode key={childId} data={data} nodeId={childId} locale={locale} />
        ))}
      </div>
    )
  }

  return createElement(
    tag,
    { className: className || undefined },
    <>
      <NodeContent data={d} locale={locale} />
      {children.length > 0 && children.map(childId => (
        <ThumbNode key={childId} data={data} nodeId={childId} locale={locale} />
      ))}
    </>,
  )
}

// ── Section grouping (precomputed outside render to avoid mutable let in JSX) ──

interface SectionGroupEntry {
  sectionId: string
  index: number
  rootAncestor: string
  tabItemId: string | undefined
  showSepStart: boolean
  showSepEnd: boolean
  prevRootAncestorForSepEnd: string
  showLabel: boolean
  labelText: string
}

function computeSectionGrouping(sectionIds: string[], store: NormalizedData, locale: Locale): SectionGroupEntry[] {
  let prevRoot = ''
  let prevTab = ''
  return sectionIds.map((sectionId, index) => {
    const rootAncestor = getRootAncestor(store, sectionId)
    const tabItemId = getTabItemAncestor(store, sectionId)

    let showSepStart = false
    let showSepEnd = false
    let prevRootAncestorForSepEnd = ''
    if (rootAncestor !== prevRoot) {
      const rootData = (store.entities[rootAncestor]?.data ?? {}) as Record<string, unknown>
      if (rootData.type === 'tab-group' && prevRoot !== '') {
        showSepStart = true
      }
      if (prevRoot) {
        const prevRootData = (store.entities[prevRoot]?.data ?? {}) as Record<string, unknown>
        if (prevRootData.type === 'tab-group' && rootData.type !== 'tab-group') {
          showSepEnd = true
          prevRootAncestorForSepEnd = prevRoot
        }
      }
    }

    let showLabel = false
    let labelText = ''
    if (tabItemId && tabItemId !== prevTab) {
      showLabel = true
      const tabData = (store.entities[tabItemId]?.data ?? {}) as Record<string, unknown>
      const label = tabData.label as LocaleMap | undefined
      labelText = label?.[locale] ?? label?.ko ?? ''
    }

    prevRoot = rootAncestor
    prevTab = tabItemId ?? ''

    return { sectionId, index, rootAncestor, tabItemId, showSepStart, showSepEnd, prevRootAncestorForSepEnd, showLabel, labelText }
  })
}

// ── CmsSidebar ──

export default function CmsSidebar({ engine, store, locale, activeSectionId, plugins, onActivateTabItem, style, onHamburgerClick, onLocaleChange, hamburgerRef, i18nSheetOpen, onI18nSheetToggle }: CmsSidebarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  // Sync --thumb-zoom so thumbnails scale to fill sidebar width
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const INNER_W = 1200
    const ro = new ResizeObserver(([entry]) => {
      const listW = entry.contentBoxSize[0].inlineSize
      const zoom = listW / INNER_W
      el.style.setProperty('--thumb-zoom', String(Math.min(zoom, 0.3).toFixed(4)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sectionIds = useMemo(() => collectSections(store, ROOT_ID), [store])

  const activeTabItemId = useMemo(() => {
    if (!activeSectionId) return undefined
    return getTabItemAncestor(store, activeSectionId)
  }, [activeSectionId, store])

  const scrollToSection = useCallback((sectionId: string) => {
    const tabItemId = getTabItemAncestor(store, sectionId)
    if (tabItemId) {
      // Activate the tab via shared callback so canvas renders the correct panel
      onActivateTabItem?.(tabItemId)
      // Double rAF: 1st for React re-render, 2nd for DOM paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-cms-root] [data-cms-id="${sectionId}"]`) as HTMLElement
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })
      return
    }
    const el = document.querySelector(`[data-cms-root] [data-cms-id="${sectionId}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [store, onActivateTabItem])

  // CRUD keyMap — commands go to shared engine via zone dispatch
  const sidebarKeyMap = useMemo((): Record<string, (ctx: BehaviorContext) => Command | void> => {
    const removeSection = (ctx: BehaviorContext) => {
      if (ctx.getChildren(ROOT_ID).length <= 1) return
      return crudCommands.remove(ctx.focused)
    }
    const navigateInSections = (ctx: BehaviorContext, delta: number) => {
      const idx = sectionIds.indexOf(ctx.focused)
      const next = sectionIds[idx + delta]
      if (next !== undefined) return focusCommands.setFocus(next)
    }
    return {
      ArrowDown: (ctx) => navigateInSections(ctx, +1),
      ArrowUp: (ctx) => navigateInSections(ctx, -1),
      Home: () => sectionIds[0] !== undefined ? focusCommands.setFocus(sectionIds[0]) : undefined,
      End: () => sectionIds[sectionIds.length - 1] !== undefined ? focusCommands.setFocus(sectionIds[sectionIds.length - 1]!) : undefined,
      Delete: removeSection,
      Backspace: removeSection,
      'Mod+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
      'Mod+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
      'Mod+D': (ctx) => {
        return createBatchCommand([
          clipboardCommands.copy([ctx.focused]),
          clipboardCommands.paste(ctx.focused),
        ])
      },
      Enter: (ctx) => { scrollToSection(ctx.focused) },
      Escape: () => {
        ;(document.querySelector('[data-cms-root]') as HTMLElement)?.focus()
      },
    }
  }, [scrollToSection, sectionIds])

  const sidebarBehavior = useMemo(() => listbox(), [])

  const aria = useAriaZone({
    engine,
    store,
    behavior: sidebarBehavior,
    scope: 'sidebar',
    plugins,
    keyMap: sidebarKeyMap,
  })

  // Sync with canvas active section (when sidebar not focused)
  const ariaRef = useRef(aria)
  useEffect(() => { ariaRef.current = aria })
  useEffect(() => {
    if (!activeSectionId) return
    if (activeSectionId === ariaRef.current.focused) return
    if (listRef.current?.contains(document.activeElement)) return
    ariaRef.current.dispatch(focusCommands.setFocus(activeSectionId))
  }, [activeSectionId])

  // Scroll focused thumbnail into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-sidebar-id="${aria.focused}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [aria.focused])

  const handleAddSection = (variant: TemplateType) => {
    setPickerOpen(false)
    const focusedIdx = sectionIds.indexOf(aria.focused)
    const insertAt = (focusedIdx >= 0 ? focusedIdx : sectionIds.length - 1) + 1
    const { command, rootId } = templateToCommand(variant, ROOT_ID, insertAt)
    // Data command → engine (triggers external focus recovery in useAriaZone).
    // Focus command → zone (zone-local viewState, not engine meta-entity).
    engine.dispatch(command)
    aria.dispatch(focusCommands.setFocus(rootId))
    requestAnimationFrame(() => scrollToSection(rootId))
  }

  // When container itself receives focus, move DOM focus to the focused option
  const sectionGrouping = useMemo(() => computeSectionGrouping(sectionIds, store, locale), [sectionIds, store, locale])

  const handleContainerFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const focusedOption = listRef.current?.querySelector(`[data-sidebar-id="${aria.focused}"]`) as HTMLElement
    focusedOption?.focus()
  }, [aria.focused])

  return (
    <aside className="cms-sidebar" aria-label="Sections" style={style}>
      <div className="cms-sidebar__header">
        <button ref={hamburgerRef} className="cms-sidebar__header-btn" onClick={onHamburgerClick} title="Menu" type="button">
          <Menu size={16} />
        </button>
        <select
          className="cms-sidebar__locale"
          value={locale}
          onChange={e => onLocaleChange(e.target.value as Locale)}
        >
          {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button
          className={`cms-sidebar__header-btn${i18nSheetOpen ? ' cms-sidebar__header-btn--active' : ''}`}
          onClick={onI18nSheetToggle}
          title="Translation sheet"
          type="button"
        >
          <Sheet size={16} />
        </button>
      </div>
      <div className="cms-sidebar__list" role="listbox" aria-label="Section thumbnails" ref={listRef} data-aria-container="" onFocus={handleContainerFocus}>
        {sectionGrouping.map(({ sectionId, index, rootAncestor, tabItemId, showSepStart, showSepEnd, prevRootAncestorForSepEnd, showLabel, labelText }) => {
            const elements: React.ReactNode[] = []

            if (showSepStart) {
              elements.push(<div key={`sep-start-${rootAncestor}`} className="cms-sidebar__group-sep" />)
            }
            if (showSepEnd && prevRootAncestorForSepEnd) {
              elements.push(<div key={`sep-end-${prevRootAncestorForSepEnd}`} className="cms-sidebar__group-sep" />)
            }

            if (showLabel && tabItemId) {
              elements.push(
                <div key={`label-${tabItemId}`} className={`cms-sidebar__group-label${tabItemId === activeTabItemId ? ' cms-sidebar__group-label--active' : ''}`}>
                  {labelText}
                </div>
              )
            }

            const props = aria.getNodeProps(sectionId)
            const state = aria.getNodeState(sectionId)
            elements.push(
              <div
                key={sectionId}
                {...(props as React.HTMLAttributes<HTMLDivElement>)}
                className={`cms-sidebar__thumb${state.focused ? ' cms-sidebar__thumb--focused' : ''}`}
                onClick={() => {
                  aria.dispatch(focusCommands.setFocus(sectionId))
                  scrollToSection(sectionId)
                }}
              >
                <div className="cms-sidebar__thumb-inner cms-landing">
                  <SectionThumbnail data={store} sectionId={sectionId} locale={locale} />
                </div>
                <span className="cms-sidebar__thumb-index">{index + 1}</span>
              </div>
            )

            return elements
          })}
      </div>
      <div className="cms-sidebar__add-area">
        <button
          ref={addBtnRef}
          type="button"
          className="cms-sidebar__add-btn"
          aria-label="Add section"
          onClick={() => setPickerOpen(o => !o)}
        >
          +
        </button>
        <CmsTemplatePicker
          open={pickerOpen}
          onClose={() => {
            setPickerOpen(false)
            addBtnRef.current?.focus()
          }}
          onSelect={handleAddSection}
        />
      </div>
    </aside>
  )
}
