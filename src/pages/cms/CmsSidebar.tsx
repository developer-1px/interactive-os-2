import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getChildren } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import type { NormalizedData, Command, Plugin } from '../../interactive-os/core/types'
import type { CommandEngine } from '../../interactive-os/core/createCommandEngine'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import type { Locale } from './cms-types'
import type { SectionVariant } from './cms-templates'
import { createSection } from './cms-templates'
import { getSectionClassName, NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'
import { useAriaZone } from '../../interactive-os/hooks/useAriaZone'
import { listbox } from '../../interactive-os/behaviors/listbox'
import { focusCommands } from '../../interactive-os/plugins/core'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import CmsTemplatePicker from './CmsTemplatePicker'

interface CmsSidebarProps {
  engine: CommandEngine
  store: NormalizedData
  locale: Locale
  activeSectionId: string | null
  plugins?: Plugin[]
}

// ── Store manipulation helpers (for add/duplicate — these modify engine store directly) ──

function addSectionToStore(
  store: NormalizedData,
  variant: SectionVariant,
  afterIndex: number,
): { store: NormalizedData; newSectionId: string } {
  const template = createSection(variant)
  const rootChildren = getChildren(store, ROOT_ID)
  const insertAt = afterIndex + 1

  const entities = { ...store.entities, ...template.entities }
  const relationships = { ...store.relationships, ...template.relationships }

  const newRootChildren = [
    ...rootChildren.slice(0, insertAt),
    template.rootId,
    ...rootChildren.slice(insertAt),
  ]
  relationships[ROOT_ID] = newRootChildren

  return { store: { entities, relationships }, newSectionId: template.rootId }
}

function duplicateSection(
  store: NormalizedData,
  sectionIndex: number,
): { store: NormalizedData; newSectionId: string } {
  const rootChildren = getChildren(store, ROOT_ID)
  const sectionId = rootChildren[sectionIndex]
  const sectionData = store.entities[sectionId]?.data as Record<string, string> | undefined
  const variant = (sectionData?.variant ?? 'hero') as SectionVariant
  return addSectionToStore(store, variant, sectionIndex)
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

// ── CmsSidebar ──

export default function CmsSidebar({ engine, store, locale, activeSectionId, plugins }: CmsSidebarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const sectionIds = useMemo(() => getChildren(store, ROOT_ID), [store])

  const scrollToSection = useCallback((id: string) => {
    const el = document.querySelector(`[data-cms-root] [data-cms-id="${id}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // CRUD keyMap — commands go to shared engine via zone dispatch
  const sidebarKeyMap = useMemo((): Record<string, (ctx: BehaviorContext) => Command | void> => {
    const removeSection = (ctx: BehaviorContext) => {
      if (ctx.getChildren(ROOT_ID).length <= 1) return
      return crudCommands.remove(ctx.focused)
    }
    return {
      Delete: removeSection,
      Backspace: removeSection,
      'Mod+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
      'Mod+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
      'Mod+D': (ctx) => {
        const sections = getChildren(engine.getStore(), ROOT_ID)
        const idx = sections.indexOf(ctx.focused)
        const { store: newStore, newSectionId } = duplicateSection(engine.getStore(), idx)
        engine.syncStore(newStore)
        return focusCommands.setFocus(newSectionId)
      },
      // Mod+C/X/V → clipboard plugin keyMap, Mod+Z → history plugin keyMap
      Enter: (ctx) => { scrollToSection(ctx.focused) },
      Escape: () => {
        ;(document.querySelector('[data-cms-root]') as HTMLElement)?.focus()
      },
    }
  }, [engine, scrollToSection])

  const aria = useAriaZone({
    engine,
    store,
    behavior: listbox,
    scope: 'sidebar',
    plugins,
    keyMap: sidebarKeyMap,
  })

  // Sync with canvas active section (when sidebar not focused)
  const ariaRef = useRef(aria)
  ariaRef.current = aria
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

  const handleAddSection = (variant: SectionVariant) => {
    setPickerOpen(false)
    const focusedIdx = sectionIds.indexOf(aria.focused)
    const { store: newStore, newSectionId } = addSectionToStore(store, variant, focusedIdx >= 0 ? focusedIdx : sectionIds.length - 1)
    engine.syncStore(newStore)
    aria.dispatch(focusCommands.setFocus(newSectionId))
    requestAnimationFrame(() => scrollToSection(newSectionId))
  }

  return (
    <aside className="cms-sidebar" aria-label="Sections">
      <div className="cms-sidebar__list" role="listbox" aria-label="Section thumbnails" ref={listRef} data-aria-container="">
        {sectionIds.map((sectionId, i) => {
          const props = aria.getNodeProps(sectionId)
          const state = aria.getNodeState(sectionId)
          return (
            <div
              key={sectionId}
              {...(props as React.HTMLAttributes<HTMLDivElement>)}
              className={`cms-sidebar__thumb${state.focused ? ' cms-sidebar__thumb--focused' : ''}`}
              onClick={() => {
                aria.dispatch(focusCommands.setFocus(sectionId))
                scrollToSection(sectionId)
              }}
            >
              <div className="cms-sidebar__thumb-inner">
                <SectionThumbnail data={store} sectionId={sectionId} locale={locale} />
              </div>
              <span className="cms-sidebar__thumb-index">{i + 1}</span>
            </div>
          )
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
