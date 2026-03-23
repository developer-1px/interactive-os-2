import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgMenu } from './apg-data'
import { MenuList } from '../interactive-os/ui/MenuList'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { ChevronRight } from 'lucide-react'

const menuData = createStore({
  entities: {
    file: { id: 'file', data: { label: 'File' } },
    new: { id: 'new', data: { label: 'New File' } },
    open: { id: 'open', data: { label: 'Open...' } },
    save: { id: 'save', data: { label: 'Save' } },
    edit: { id: 'edit', data: { label: 'Edit' } },
    undo: { id: 'undo', data: { label: 'Undo' } },
    redo: { id: 'redo', data: { label: 'Redo' } },
    cut: { id: 'cut', data: { label: 'Cut' } },
    copy: { id: 'copy', data: { label: 'Copy' } },
    paste: { id: 'paste', data: { label: 'Paste' } },
  },
  relationships: {
    [ROOT_ID]: ['file', 'edit'],
    file: ['new', 'open', 'save'],
    edit: ['undo', 'redo', 'cut', 'copy', 'paste'],
  },
})

export default function PageMenu() {
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
          renderItem={(item, state: NodeState, props) => {
            const indent = ((state.level ?? 1) - 1) * 16
            const hasChildren = state.expanded !== undefined
            const cls = [
              'menu-item',
              state.focused && 'menu-item--focused',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls} style={{ paddingLeft: 14 + indent }}>
                <span className="menu-item__label">{(item.data as Record<string, unknown>)?.label as string}</span>
                {hasChildren && (
                  <span className="menu-item__arrow">
                    <ChevronRight size={12} />
                  </span>
                )}
              </div>
            )
          }}
        />
      </div>
      <ApgKeyboardTable {...apgMenu} />
    </div>
  )
}
