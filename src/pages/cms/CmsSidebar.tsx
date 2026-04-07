// @useState-hatch — pickerOpen (template picker disclosure): local UI state not yet migrated to OS
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import type { PatternContext } from '@os/pattern/types'
import { key } from '@os/axis/types'
import type { Locale } from './cmsTypes'
import type { TemplateType } from './cmsTemplates'
import { templateToCommand } from './cmsTemplates'
import { collectSections, getRootAncestor, getTabItemAncestor } from './collectSections'
import type { LocaleMap } from './cmsTypes'
import { AriaZone } from '@os/ui/AriaZone'
import type { AriaZoneContext } from '@os/ui/AriaZone'
import { listbox } from '@os/pattern/roles/listbox'
import { focusCommands } from '@os/axis/navigate'
import CmsTemplatePicker from './CmsTemplatePicker'
import SectionThumbnail from './SectionThumbnail'
import { ax } from '@styles/ax'

interface CmsSidebarProps {
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  activeSectionId: string | null
  plugins?: Plugin[]
  onActivateTabItem?: (tabItemId: string) => void
  style?: React.CSSProperties
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

export default function CmsSidebar({ engine, store, locale, activeSectionId, plugins, onActivateTabItem, style }: CmsSidebarProps) {
  const sectionIds = useMemo(() => collectSections(store, ROOT_ID), [store])

  const scrollToSection = useCallback((sectionId: string) => {
    const doScroll = () => {
      const el = document.querySelector(`[data-cms-root] [data-cms-id="${sectionId}"]`) as HTMLElement
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    const tabItemId = getTabItemAncestor(store, sectionId)
    if (tabItemId) {
      onActivateTabItem?.(tabItemId)
    }
    // Double RAF ensures layout is settled after viewport transition or tab activation
    requestAnimationFrame(() => {
      requestAnimationFrame(doScroll)
    })
  }, [store, onActivateTabItem])

  const sidebarKeyMap = useMemo(() => {
    const navigateInSections = (ctx: PatternContext, delta: number) => {
      const idx = sectionIds.indexOf(ctx.focused)
      const next = sectionIds[idx + delta]
      if (next !== undefined) return focusCommands.setFocus(next)
    }
    return {
      ArrowDown: key(['navigate:focus'], (ctx) => navigateInSections(ctx, +1)),
      ArrowUp: key(['navigate:focus'], (ctx) => navigateInSections(ctx, -1)),
      Home: key(['navigate:focusFirst'], () => sectionIds[0] !== undefined ? focusCommands.setFocus(sectionIds[0]) : undefined),
      End: key(['navigate:focusLast'], () => sectionIds[sectionIds.length - 1] !== undefined ? focusCommands.setFocus(sectionIds[sectionIds.length - 1]!) : undefined),
      Enter: key(['activate'], (ctx) => { scrollToSection(ctx.focused) }),
      Escape: key(['dismiss'], () => {
        ;(document.querySelector('[data-cms-root]') as HTMLElement)?.focus()
      }),
    }
  }, [scrollToSection, sectionIds])

  const sidebarBehavior = useMemo(() => listbox(), [])

  return (
    <AriaZone
      engine={engine}
      store={store}
      pattern={sidebarBehavior}
      scope="sidebar"
      plugins={plugins}
      keyMap={sidebarKeyMap}
    >
      {(aria) => (
        <CmsSidebarContent
          aria={aria}
          engine={engine}
          store={store}
          locale={locale}
          activeSectionId={activeSectionId}
          sectionIds={sectionIds}
          scrollToSection={scrollToSection}
          style={style}
        />
      )}
    </AriaZone>
  )
}

// ── Inner content — receives AriaZone context ──

interface CmsSidebarContentProps {
  aria: AriaZoneContext
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  activeSectionId: string | null
  sectionIds: string[]
  scrollToSection: (sectionId: string) => void
  style?: React.CSSProperties
}

function CmsSidebarContent({ aria, engine, store, locale, activeSectionId, sectionIds, scrollToSection, style }: CmsSidebarContentProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const activeTabItemId = useMemo(() => {
    if (!activeSectionId) return undefined
    return getTabItemAncestor(store, activeSectionId)
  }, [activeSectionId, store])

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
    engine.dispatch(command)
    aria.dispatch(focusCommands.setFocus(rootId))
    requestAnimationFrame(() => scrollToSection(rootId))
  }

  const sectionGrouping = useMemo(() => computeSectionGrouping(sectionIds, store, locale), [sectionIds, store, locale])

  const handleContainerFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const focusedOption = listRef.current?.querySelector(`[data-sidebar-id="${aria.focused}"]`) as HTMLElement
    focusedOption?.focus()
  }, [aria.focused])

  return (
    <aside className="cms-sidebar shrink-0 flex-col overflow-hidden" aria-label="Sections" style={style}>
      {/* eslint-disable-next-line local/no-raw-aria-role -- AriaZone 기반, containerProps에 role 미포함 */}
      <div className="ax-interactive cms-sidebar__list flex-1 flex-col overflow-y-auto" role="listbox" aria-label="Section thumbnails" ref={listRef} data-aria-container="" {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)} onFocus={handleContainerFocus}>
        {sectionGrouping.map(({ sectionId, index, rootAncestor, tabItemId, showSepStart, showSepEnd, prevRootAncestorForSepEnd, showLabel, labelText }) => {
            const elements: React.ReactNode[] = []

            if (showSepStart) {
              elements.push(<div key={`sep-start-${rootAncestor}`} className="cms-sidebar__group-sep pointer-events-none" />)
            }
            if (showSepEnd && prevRootAncestorForSepEnd) {
              elements.push(<div key={`sep-end-${prevRootAncestorForSepEnd}`} className="cms-sidebar__group-sep pointer-events-none" />)
            }

            if (showLabel && tabItemId) {
              elements.push(
                <div key={`label-${tabItemId}`} className={`cms-sidebar__group-label pointer-events-none${tabItemId === activeTabItemId ? ' cms-sidebar__group-label--active' : ''}`}>
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
                className={`cms-sidebar__thumb w-full cursor-pointer relative shrink-0${state.focused ? ' cms-sidebar__thumb--focused' : ''}`}
                onClick={() => {
                  aria.dispatch(focusCommands.setFocus(sectionId))
                  scrollToSection(sectionId)
                }}
              >
                <div className="cms-sidebar__thumb-inner cms-landing" inert>
                  <SectionThumbnail data={store} sectionId={sectionId} locale={locale} />
                </div>
                <span className="absolute cms-sidebar__thumb-index">{index + 1}</span>
              </div>
            )

            return elements
          })}
      </div>
      <div className="relative shrink-0">
        <button
          ref={addBtnRef}
          type="button"
          className={`cms-sidebar__add-btn ${ax({ surface: 'placeholder' })} flex-row items-center justify-center`}
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
