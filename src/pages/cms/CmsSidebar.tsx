import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import { getChildren, removeEntity } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import type { NormalizedData } from '../../interactive-os/core/types'
import type { Locale } from './cms-types'
import type { SectionVariant } from './cms-templates'
import { createSection } from './cms-templates'
import { getSectionClassName } from './cms-renderers'
import { NodeContent, getNodeClassName, getChildrenContainerClassName, getNodeTag, HEADER_TYPES } from './cms-renderers'
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

  // Merge template entities into store
  const entities = { ...store.entities, ...template.entities }
  const relationships = { ...store.relationships, ...template.relationships }

  // Insert into ROOT_ID children
  const newRootChildren = [
    ...rootChildren.slice(0, insertAt),
    template.rootId,
    ...rootChildren.slice(insertAt),
  ]
  relationships[ROOT_ID] = newRootChildren

  return { store: { entities, relationships }, newSectionId: template.rootId }
}

function reorderSection(
  store: NormalizedData,
  fromIndex: number,
  toIndex: number,
): NormalizedData {
  const rootChildren = [...getChildren(store, ROOT_ID)]
  const [moved] = rootChildren.splice(fromIndex, 1)
  rootChildren.splice(toIndex, 0, moved)
  return {
    ...store,
    relationships: { ...store.relationships, [ROOT_ID]: rootChildren },
  }
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

  // Separate header vs content children (same logic as CmsCanvas)
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

export default function CmsSidebar({ data, onDataChange, locale, activeSectionId }: CmsSidebarProps) {
  const sectionIds = getChildren(data, ROOT_ID)
  const [rawFocusIdx, setFocusIdx] = useState(0)

  // Derive focus index: canvas active section overrides manual selection
  const activeSectionIdx = activeSectionId ? sectionIds.indexOf(activeSectionId) : -1
  const focusIdx = activeSectionIdx >= 0
    ? activeSectionIdx
    : Math.min(rawFocusIdx, Math.max(0, sectionIds.length - 1))

  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  // Scroll focused thumbnail into view
  useEffect(() => {
    const el = listRef.current?.children[focusIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [focusIdx])

  const scrollCanvasToSection = useCallback((sectionId: string) => {
    const canvasEl = document.querySelector(`[data-cms-root]`)
    if (!canvasEl) return
    const sectionEl = canvasEl.querySelector(`[data-id="${sectionId}"]`)
      ?? canvasEl.children[getChildren(data, ROOT_ID).indexOf(sectionId)] as HTMLElement | null
    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [data])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        if (isMod) {
          // Reorder: move section up
          if (focusIdx > 0) {
            onDataChange(reorderSection(data, focusIdx, focusIdx - 1))
            setFocusIdx(focusIdx - 1)
          }
        } else {
          setFocusIdx(i => Math.max(i - 1, 0))
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (isMod) {
          // Reorder: move section down
          if (focusIdx < sectionIds.length - 1) {
            onDataChange(reorderSection(data, focusIdx, focusIdx + 1))
            setFocusIdx(focusIdx + 1)
          }
        } else {
          setFocusIdx(i => Math.min(i + 1, sectionIds.length - 1))
        }
        break
      case 'Enter':
        e.preventDefault()
        scrollCanvasToSection(sectionIds[focusIdx])
        break
      case 'Escape':
        e.preventDefault()
        // Focus the canvas
        ;(document.querySelector('[data-cms-root]') as HTMLElement)?.focus()
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        if (sectionIds.length <= 1) break // Minimum 1 section
        {
          const newStore = removeEntity(data, sectionIds[focusIdx])
          onDataChange(newStore)
          // Focus next or previous
          setFocusIdx(i => Math.min(i, sectionIds.length - 2))
        }
        break
      case 'd':
        if (isMod) {
          e.preventDefault()
          const { store: newStore, newSectionId } = duplicateSection(data, focusIdx)
          onDataChange(newStore)
          setFocusIdx(focusIdx + 1)
          // Scroll to new section after render
          requestAnimationFrame(() => scrollCanvasToSection(newSectionId))
        }
        break
      case 'Home':
        e.preventDefault()
        setFocusIdx(0)
        break
      case 'End':
        e.preventDefault()
        setFocusIdx(sectionIds.length - 1)
        break
    }
  }

  const handleAddSection = (variant: SectionVariant) => {
    setPickerOpen(false)
    const { store: newStore, newSectionId } = addSectionToStore(data, variant, focusIdx)
    onDataChange(newStore)
    setFocusIdx(focusIdx + 1)
    // Scroll + refocus sidebar after render
    requestAnimationFrame(() => {
      scrollCanvasToSection(newSectionId)
      listRef.current?.focus()
    })
  }

  return (
    <aside className="cms-sidebar" aria-label="Sections">
      <div
        className="cms-sidebar__list"
        role="listbox"
        aria-label="Section thumbnails"
        ref={listRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {sectionIds.map((sectionId, i) => (
          <div
            key={sectionId}
            role="option"
            aria-selected={i === focusIdx}
            className={`cms-sidebar__thumb${i === focusIdx ? ' cms-sidebar__thumb--focused' : ''}`}
            onClick={() => {
              setFocusIdx(i)
              scrollCanvasToSection(sectionId)
              listRef.current?.focus()
            }}
          >
            <div className="cms-sidebar__thumb-inner">
              <SectionThumbnail data={data} sectionId={sectionId} locale={locale} />
            </div>
            <span className="cms-sidebar__thumb-index">{i + 1}</span>
          </div>
        ))}
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
