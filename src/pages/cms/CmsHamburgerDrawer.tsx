import { useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, Database, Cog, Puzzle, Box, Map, PenTool } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { Command } from '../../interactive-os/engine/types'
import type { PatternContext } from '../../interactive-os/pattern/types'
import { menu } from '../../interactive-os/pattern/menu'
import { useAria } from '../../interactive-os/primitives/useAria'
import { core } from '../../interactive-os/plugins/core'

interface DrawerNavItem {
  id: string
  label: string
  icon: LucideIcon
  path: string
}

const drawerItems: DrawerNavItem[] = [
  { id: 'cms', label: 'CMS', icon: PenTool, path: '/' },
  { id: 'viewer', label: 'Viewer', icon: Eye, path: '/viewer' },
  { id: 'store', label: 'Store', icon: Database, path: '/internals/store/inspector' },
  { id: 'engine', label: 'Engine', icon: Cog, path: '/internals/engine/command' },
  { id: 'plugin', label: 'Plugin', icon: Puzzle, path: '/internals/plugin/crud' },
  { id: 'components', label: 'Components', icon: Box, path: '/internals/components/aria' },
  { id: 'vision', label: 'Vision', icon: Map, path: '/internals/area/vision' },
]

const drawerData: NormalizedData = {
  entities: Object.fromEntries(
    drawerItems.map(item => [item.id, { id: item.id, data: { label: item.label, path: item.path } }])
  ),
  relationships: { __root__: drawerItems.map(item => item.id) },
}

const iconMap: Record<string, LucideIcon> = Object.fromEntries(
  drawerItems.map(item => [item.id, item.icon])
)

interface CmsHamburgerDrawerProps {
  open: boolean
  onClose: () => void
  hamburgerRef: React.RefObject<HTMLButtonElement | null>
}

export default function CmsHamburgerDrawer({ open, onClose, hamburgerRef }: CmsHamburgerDrawerProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const drawerRef = useRef<HTMLDivElement>(null)

  const keyMap = useMemo((): Record<string, (ctx: PatternContext) => Command | void> => ({
    Escape: () => {
      onClose()
      hamburgerRef.current?.focus()
    },
  }), [onClose, hamburgerRef])

  const aria = useAria({
    behavior: menu,
    data: drawerData,
    plugins: [core()],
    keyMap,
    onActivate: (nodeId) => {
      const item = drawerItems.find(i => i.id === nodeId)
      if (item) {
        navigate(item.path)
        onClose()
      }
    },
  })

  // Focus first item on open
  useEffect(() => {
    if (open && drawerRef.current) {
      const first = drawerRef.current.querySelector<HTMLElement>('[role="menuitem"]')
      first?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="cms-drawer-overlay" onClick={onClose} />
      <div className="cms-drawer" ref={drawerRef} role="dialog" aria-label="Navigation">
        <div className="cms-drawer__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-mark" />
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-bright)' }}>interactive-os</span>
          </div>
        </div>
        <div role="menu" aria-label="Navigation menu" {...aria.containerProps}>
          {drawerItems.map(item => {
            const props = aria.getNodeProps(item.id)
            const data = (drawerData.entities[item.id]?.data ?? {}) as Record<string, string>
            const Icon = iconMap[item.id]
            const isActive = pathname.startsWith(data.path)
            return (
              <div
                key={item.id}
                {...(props as React.HTMLAttributes<HTMLDivElement>)}
                className={`cms-drawer__item${isActive ? ' cms-drawer__item--active' : ''}`}
              >
                {Icon && <Icon size={16} />}
                {data.label}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
