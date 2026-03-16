import { MenuList } from '../interactive-os/ui/menu-list'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { ChevronRight } from 'lucide-react'

const menuData = createStore({
  entities: {
    file: { id: 'file', label: 'File' },
    new: { id: 'new', label: 'New File' },
    open: { id: 'open', label: 'Open...' },
    save: { id: 'save', label: 'Save' },
    edit: { id: 'edit', label: 'Edit' },
    undo: { id: 'undo', label: 'Undo' },
    redo: { id: 'redo', label: 'Redo' },
    cut: { id: 'cut', label: 'Cut' },
    copy: { id: 'copy', label: 'Copy' },
    paste: { id: 'paste', label: 'Paste' },
  },
  relationships: {
    [ROOT_ID]: ['file', 'edit'],
    file: ['new', 'open', 'save'],
    edit: ['undo', 'redo', 'cut', 'copy', 'paste'],
  },
})

export default function MenuPage() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Menu</h2>
        <p className="page-desc">Nested menu with keyboard navigation and submenu expansion</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→</kbd> <span className="key-hint">open submenu</span>{' '}
        <kbd>←</kbd> <span className="key-hint">close submenu</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">activate</span>
      </div>
      <div className="card" style={{ maxWidth: 280 }}>
        <MenuList
          data={menuData}
          renderItem={(item, state: NodeState) => {
            const indent = ((state.level ?? 1) - 1) * 16
            const hasChildren = state.expanded !== undefined
            const cls = [
              'menu-item',
              state.focused && 'menu-item--focused',
            ].filter(Boolean).join(' ')

            return (
              <div className={cls} style={{ paddingLeft: 14 + indent }}>
                <span className="menu-item__label">{item.label as string}</span>
                {hasChildren && (
                  <span className="menu-item__arrow">
                    <ChevronRight size={11} strokeWidth={2} />
                  </span>
                )}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
