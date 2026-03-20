import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createElement } from 'react'
import { getChildren, removeEntity } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import type { NormalizedData, Command } from '../../interactive-os/core/types'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import type { Locale } from './cms-types'
import type { SectionVariant } from './cms-templates'
import { createSection } from './cms-templates'
import { getSectionClassName, NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'
import { useAria } from '../../interactive-os/hooks/useAria'
import { listbox } from '../../interactive-os/behaviors/listbox'
import { core, focusCommands } from '../../interactive-os/plugins/core'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { dndCommands } from '../../interactive-os/plugins/dnd'
import { focusRecovery } from '../../interactive-os/plugins/focus-recovery'
import CmsTemplatePicker from './CmsTemplatePicker'

interface CmsSidebarProps {
  data: NormalizedData
  onDataChange: (d: NormalizedData) => void
  locale: Locale
  activeSectionId: string | null
}

// ── Store manipulation helpers ──

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

const sidebarPlugins = [core(), focusRecovery()]

export default function CmsSidebar({ data, onDataChange, locale, activeSectionId }: CmsSidebarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)
  const pendingFocusRef = useRef<string | null>(null)

  // Refs for stable keyMap closures
  const dataRef = useRef(data)
  dataRef.current = data
  const onDataChangeRef = useRef(onDataChange)
  onDataChangeRef.current = onDataChange

  // Flat store: root-level sections only (no children)
  const sidebarData = useMemo((): NormalizedData => {
    const ids = getChildren(data, ROOT_ID)
    const entities: Record<string, unknown> = {}
    for (const id of ids) entities[id] = data.entities[id]
    return { entities, relationships: { [ROOT_ID]: [...ids] } }
  }, [data])

  const scrollToSection = useCallback((id: string) => {
    const el = document.querySelector(`[data-cms-root] [data-node-id="${id}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  const scrollRef = useRef(scrollToSection)
  scrollRef.current = scrollToSection

  // CRUD keyMap — commands dispatch to sidebar engine, onChange syncs to CMS store
  const sidebarKeyMap = useMemo((): Record<string, (ctx: BehaviorContext) => Command | void> => ({
    Delete: (ctx) => {
      if (ctx.getChildren(ROOT_ID).length <= 1) return
      return crudCommands.remove(ctx.focused)
    },
    Backspace: (ctx) => {
      if (ctx.getChildren(ROOT_ID).length <= 1) return
      return crudCommands.remove(ctx.focused)
    },
    'Mod+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
    'Mod+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
    'Mod+D': (ctx) => {
      const sections = getChildren(dataRef.current, ROOT_ID)
      const idx = sections.indexOf(ctx.focused)
      const { store, newSectionId } = duplicateSection(dataRef.current, idx)
      onDataChangeRef.current(store)
      pendingFocusRef.current = newSectionId
    },
    Enter: (ctx) => { scrollRef.current(ctx.focused) },
    Escape: () => {
      ;(document.querySelector('[data-cms-root]') as HTMLElement)?.focus()
    },
  }), [])

  // Sync sidebar store changes (delete, reorder) back to CMS store
  const handleChange = useCallback((newStore: NormalizedData) => {
    const cur = dataRef.current
    const oldIds = getChildren(cur, ROOT_ID)
    const newIds = getChildren(newStore, ROOT_ID)

    // Deletion — remove full subtree from CMS store
    const deleted = oldIds.filter(id => !newIds.includes(id))
    if (deleted.length > 0) {
      let updated = cur
      for (const id of deleted) updated = removeEntity(updated, id)
      onDataChangeRef.current(updated)
      return
    }

    // Reorder
    if (oldIds.join(',') !== newIds.join(',')) {
      onDataChangeRef.current({
        ...cur,
        relationships: { ...cur.relationships, [ROOT_ID]: newIds },
      })
    }
  }, [])

  const aria = useAria({
    behavior: listbox,
    data: sidebarData,
    plugins: sidebarPlugins,
    keyMap: sidebarKeyMap,
    onChange: handleChange,
  })

  // Pending focus after add/duplicate — wait for sidebarData to include the new entity
  useEffect(() => {
    const id = pendingFocusRef.current
    if (!id) return
    const ids = getChildren(sidebarData, ROOT_ID)
    if (!ids.includes(id)) return
    pendingFocusRef.current = null
    aria.dispatch(focusCommands.setFocus(id))
    scrollRef.current(id)
  }, [sidebarData, aria])

  // Sync with canvas active section (when sidebar not focused)
  useEffect(() => {
    if (!activeSectionId) return
    if (listRef.current?.contains(document.activeElement)) return
    aria.dispatch(focusCommands.setFocus(activeSectionId))
  }, [activeSectionId, aria])

  // Manual DOM focus sync — scoped to sidebar (avoids data-node-id conflict with canvas)
  useEffect(() => {
    if (!aria.focused) return
    const el = listRef.current?.querySelector(`[data-sidebar-id="${aria.focused}"]`) as HTMLElement
    if (!el || el === document.activeElement) return
    if (!listRef.current?.contains(document.activeElement)) return
    el.focus({ preventScroll: false })
  }, [aria.focused])

  // Scroll focused thumbnail into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-sidebar-id="${aria.focused}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [aria.focused])

  const sectionIds = getChildren(data, ROOT_ID)

  const handleAddSection = (variant: SectionVariant) => {
    setPickerOpen(false)
    const focusedIdx = sectionIds.indexOf(aria.focused)
    const { store, newSectionId } = addSectionToStore(data, variant, focusedIdx >= 0 ? focusedIdx : sectionIds.length - 1)
    onDataChange(store)
    pendingFocusRef.current = newSectionId
  }

  return (
    <aside className="cms-sidebar" aria-label="Sections">
      <div className="cms-sidebar__list" role="listbox" aria-label="Section thumbnails" ref={listRef}>
        {sectionIds.map((sectionId, i) => {
          const nodeProps = aria.getNodeProps(sectionId)
          const state = aria.getNodeState(sectionId)
          // Strip data-node-id (avoid collision with canvas) and onClick (custom handler)
          const { 'data-node-id': _nodeId, onClick: _click, ...restProps } = nodeProps
          void _nodeId; void _click
          return (
            <div
              key={sectionId}
              {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
              data-sidebar-id={sectionId}
              className={`cms-sidebar__thumb${state.focused ? ' cms-sidebar__thumb--focused' : ''}`}
              onClick={() => {
                aria.dispatch(focusCommands.setFocus(sectionId))
                scrollToSection(sectionId)
              }}
            >
              <div className="cms-sidebar__thumb-inner">
                <SectionThumbnail data={data} sectionId={sectionId} locale={locale} />
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
