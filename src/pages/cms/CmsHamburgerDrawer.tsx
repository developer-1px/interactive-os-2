import { useEffect, useRef } from 'react'
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
  { id: 'cms', label: 'CMS', icon: PenTool, path: '/' },
  { id: 'viewer', label: 'Viewer', icon: Eye, path: '/viewer' },
  { id: 'store', label: 'Store', icon: Database, path: '/store/explorer' },
  { id: 'engine', label: 'Engine', icon: Cog, path: '/engine/pipeline' },
  { id: 'pattern', label: 'Pattern', icon: Compass, path: '/pattern/accordion' },
  { id: 'plugin', label: 'Plugin', icon: Puzzle, path: '/plugin/crud' },
  { id: 'collection', label: 'Collection', icon: Layers, path: '/collection/treegrid' },
  { id: 'components', label: 'Components', icon: Box, path: '/components/aria' },
  { id: 'vision', label: 'Vision', icon: Map, path: '/vision/architecture' },
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

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        hamburgerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, hamburgerRef])

  // Focus first item on open
  useEffect(() => {
    if (open && drawerRef.current) {
      const first = drawerRef.current.querySelector<HTMLButtonElement>('.cms-drawer__item')
      first?.focus()
    }
  }, [open])

  if (!open) return null

  function handleItemClick(path: string) {
    navigate(path)
    onClose()
  }

  function isActive(item: DrawerNavItem) {
    if (item.id === 'cms') return pathname === '/'
    return pathname.startsWith('/' + item.id)
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
