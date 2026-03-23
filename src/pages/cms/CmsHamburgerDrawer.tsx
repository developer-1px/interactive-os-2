import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, Database, Cog, Compass, Puzzle, Layers, Box, Map, PenTool } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface DrawerNavItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
}

const drawerItems: DrawerNavItem[] = [
  { id: 'cms', label: 'CMS', icon: PenTool, path: '/examples/cms' },
  { id: 'viewer', label: 'Viewer', icon: Eye, path: '/examples/viewer' },
  { id: 'store', label: 'Store', icon: Database, path: '/internals/store/inspector' },
  { id: 'engine', label: 'Engine', icon: Cog, path: '/internals/engine/pipeline' },
  { id: 'pattern', label: 'Pattern', icon: Compass, path: '/internals/pattern/accordion' },
  { id: 'plugin', label: 'Plugin', icon: Puzzle, path: '/internals/plugin/crud' },
  { id: 'collection', label: 'Collection', icon: Layers, path: '/internals/collection/treegrid' },
  { id: 'components', label: 'Components', icon: Box, path: '/internals/components/aria' },
  { id: 'vision', label: 'Vision', icon: Map, path: '/internals/area/vision' },
]

interface CmsHamburgerDrawerProps {
  open: boolean
  onClose: () => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
}

export default function CmsHamburgerDrawer({ open, onClose, hamburgerRef }: CmsHamburgerDrawerProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Focus first item on open
  useEffect(() => {
    if (open && drawerRef.current) {
      const first = drawerRef.current.querySelector<HTMLButtonElement>('.cms-drawer__item')
      first?.focus()
    }
  }, [open])

  if (!open) return null

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      hamburgerRef.current?.focus()
    }
  }

  function handleItemClick(path: string) {
    navigate(path)
    onClose()
  }

  function isActive(item: DrawerNavItem) {
    return pathname.startsWith(item.path)
  }

  return (
    <>
      <div className="cms-drawer-overlay" onClick={onClose} />
      <div className="cms-drawer" ref={drawerRef} role="dialog" aria-label="Navigation">
        <div className="cms-drawer__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-mark" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-bright)' }}>interactive-os</span>
          </div>
        </div>
        {drawerItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              className={`cms-drawer__item${isActive(item) ? ' cms-drawer__item--active' : ''}`}
              onClick={() => handleItemClick(item.path)}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
