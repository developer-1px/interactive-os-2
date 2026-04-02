import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { getChildren } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { Command } from '@os/engine/types'
import type { Plugin } from '@os/plugins/types'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import type { PatternContext } from '@os/pattern/types'
import type { Locale } from './cms-types'
import type { TemplateType } from './cms-templates'
import { templateToCommand } from './cms-templates'
import { getSectionClassName, NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'
import { collectSections, getRootAncestor, getTabItemAncestor } from './collectSections'
import type { LocaleMap } from './cms-types'
import { useAriaZone } from '@os/primitives/useAriaZone'
import { listbox } from '@os/pattern/roles/listbox'
import { focusCommands } from '@os/axis/navigate'
import CmsTemplatePicker from './CmsTemplatePicker'

interface CmsSidebarProps {
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  activeSectionId: string | null
  plugins?: Plugin[]
  onActivateTabItem?: (tabItemId: string) => void
  style?: React.CSSProperties
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
  const className = getNodeClassName(d)
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

export default function CmsSidebar({ engine, store, locale, activeSectionId, plugins, onActivateTabItem, style }: CmsSidebarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

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

  // Zone-specific keyMap — navigation is sidebar-unique (section-only), plugins handle crud/dnd/clipboard
  const sidebarKeyMap = useMemo((): Record<string, (ctx: PatternContext) => Command | void> => {
    const navigateInSections = (ctx: PatternContext, delta: number) => {
      const idx = sectionIds.indexOf(ctx.focused)
      const next = sectionIds[idx + delta]
      if (next !== undefined) return focusCommands.setFocus(next)
    }
    return {
      ArrowDown: (ctx) => navigateInSections(ctx, +1),
      ArrowUp: (ctx) => navigateInSections(ctx, -1),
      Home: () => sectionIds[0] !== undefined ? focusCommands.setFocus(sectionIds[0]) : undefined,
      End: () => sectionIds[sectionIds.length - 1] !== undefined ? focusCommands.setFocus(sectionIds[sectionIds.length - 1]!) : undefined,
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
    pattern: sidebarBehavior,
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
    <aside className="cms-sidebar shrink-0 flex-col overflow-hidden" aria-label="Sections" style={style}>
      <div className="cms-sidebar__list flex-1 flex-col overflow-y-auto" role="listbox" aria-label="Section thumbnails" ref={listRef} data-aria-container="" {...(aria.containerProps as React.HTMLAttributes<HTMLDivElement>)} onFocus={handleContainerFocus}>
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
          className="cms-sidebar__add-btn flex-row items-center justify-center cursor-pointer"
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
