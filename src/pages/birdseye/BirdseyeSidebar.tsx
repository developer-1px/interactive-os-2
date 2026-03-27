// ② 2026-03-27-birdseye-view-prd.md
import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import styles from './BirdseyeLayout.module.css'

export interface NavGroup {
  groupId: string
  groupName: string
  items: { id: string; name: string }[]
}

interface BirdseyeSidebarProps {
  groups: NavGroup[]
  selectedId: string | null
  onSelect: (folderId: string) => void
}

export default function BirdseyeSidebar({ groups, selectedId, onSelect }: BirdseyeSidebarProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const listRef = useRef<HTMLDivElement>(null)

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  const flatItems = groups.flatMap(g =>
    collapsed.has(g.groupId) ? [] : g.items.map(item => item.id)
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedId) return
    const idx = flatItems.indexOf(selectedId)
    if (idx === -1) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = flatItems[idx + 1]
      if (next) onSelect(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = flatItems[idx - 1]
      if (prev) onSelect(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      if (flatItems.length > 0) onSelect(flatItems[0]!)
    } else if (e.key === 'End') {
      e.preventDefault()
      if (flatItems.length > 0) onSelect(flatItems[flatItems.length - 1]!)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const group = groups.find(g => g.items.some(item => item.id === selectedId))
      if (group) {
        e.preventDefault()
        if (e.key === 'ArrowLeft' && !collapsed.has(group.groupId)) {
          toggleGroup(group.groupId)
        } else if (e.key === 'ArrowRight' && collapsed.has(group.groupId)) {
          toggleGroup(group.groupId)
        }
      }
    }
  }, [selectedId, flatItems, onSelect, groups, collapsed, toggleGroup])

  useEffect(() => {
    if (!selectedId || !listRef.current) return
    const el = listRef.current.querySelector(`[data-nav-id="${CSS.escape(selectedId)}"]`)
    if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <div
      ref={listRef}
      role="tree"
      aria-label="Folder navigation"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {groups.map(group => (
        <div key={group.groupId} role="treeitem" aria-expanded={!collapsed.has(group.groupId)}>
          <div
            className={styles['be-nav-group']}
            onClick={() => toggleGroup(group.groupId)}
          >
            {collapsed.has(group.groupId)
              ? <ChevronRight size={12} />
              : <ChevronDown size={12} />}
            <span>{group.groupName}/</span>
          </div>
          {!collapsed.has(group.groupId) && (
            <div role="group">
              {group.items.map(item => (
                <div
                  key={item.id}
                  role="treeitem"
                  data-nav-id={item.id}
                  aria-selected={item.id === selectedId}
                  className={styles['be-nav-item']}
                  onClick={() => onSelect(item.id)}
                >
                  <Folder size={12} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
