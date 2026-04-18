import { Outlet, Link, useLocation } from 'react-router-dom'
import { ax } from '@styles/ax'
import { useTheme } from './hooks/useTheme'

import './styles/layers.css'
import './styles/palette.css'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/structure.css'
import './styles/ax.css'
import './styles/interactive.css'
import './interactive-os/ui/indicators/indicators.css'
import './styles/layout.css'
import './styles/app.css'

const NAV = [
  { to: '/',              label: 'Home' },
  { to: '/ax-principles', label: 'Principles' },
  { to: '/ui',            label: 'UI' },
  { to: '/catalog',       label: 'Catalog' },
  { to: '/showcase/gmail', label: 'Gmail' },
]

export default function PublicShell() {
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()

  return (
    <div className={ax({ layout: 'stack', width: 'full' })} style={{ minHeight: '100vh' }}>
      <header
        className={ax({ layout: 'row', surface: 'base', padding: 'md', gap: 'md' })}
        style={{
          alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          className={ax({ textStyle: 'section' })}
          style={{ textDecoration: 'none', color: 'var(--text-bright)', fontWeight: 600 }}
        >
          aria
        </Link>
        <nav className={ax({ layout: 'row', gap: 'sm' })} style={{ marginLeft: 'auto' }}>
          {NAV.map((item) => {
            const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={ax({ surface: 'ghost', padding: 'sm', textStyle: 'body', interactive: 'item' })}
                style={{
                  textDecoration: 'none',
                  color: active ? 'var(--text-bright)' : 'var(--text-secondary)',
                  borderRadius: 'var(--shape-sm-radius)',
                  background: active ? 'var(--bg-hover)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={toggle}
            className={ax({ surface: 'ghost', role: 'control', padding: 'sm', textStyle: 'body', interactive: 'button' })}
            style={{
              borderRadius: 'var(--shape-sm-radius)',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? '☾' : '☀'}
          </button>
        </nav>
      </header>
      <main className={ax({ layout: 'stack', width: 'full' })} style={{ flex: 1, minHeight: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
