// ② 2026-03-26-unified-navigation-prd.md
// @useState-hatch
import { useState, useEffect, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { FileViewerModal } from '@os/ui/FileViewerModal'
import { ReproRecorderOverlay } from './devtools/rec/ReproRecorderOverlay'
import { KeylineOverlay } from './devtools/KeylineOverlay'
import { ComponentInspector } from './devtools/inspector/ComponentInspector'
import { openInspectorWindow } from './devtools/inspector/openInspectorWindow'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { ax } from '@styles/ax'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { useTheme } from './hooks/useTheme'
import { ActivityBar } from './ActivityBar'

import './styles/layers.css'        // L0: Layer order declaration (must be first)
import './styles/palette.css'       // L0: OKLCH color palette
import './styles/reset.css'        // L1: Browser initialization
import './styles/tokens.css'       // L2: Design token values
import './styles/structure.css'    // L2.5: Atomic layout classes
import './styles/ax.css'           // L3-L5: Axis design system (recipe + state)
import './styles/interactive.css'  // L4: Interaction policy (hover, focus, disabled...)
import './interactive-os/ui/indicators/indicators.css'  // L4: Indicator part classes
import './styles/layout.css'       // App layout (sidebar, page grid)
import './styles/app.css'          // App-level utilities
import './styles/inspect.css'      // Keyline inspector (?inspect)

const MOBILE_ROUTES = ['/todo']

export default function AppShell() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { search, pathname } = useLocation()
  const isMobileRoute = MOBILE_ROUTES.some(p => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    const params = new URLSearchParams(search)
    document.body.classList.toggle('inspect', params.has('inspect'))
    document.body.classList.toggle('inspect-grid', params.has('inspect-grid'))
    document.body.classList.toggle('inspect-box', params.has('inspect-box'))
    document.body.classList.toggle('inspect-keyline', params.has('inspect-keyline'))
  }, [search])

  const [previewFile, setPreviewFile] = useState<{ path: string; line?: number } | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fileName: string; lineNumber?: number }
      if (detail?.fileName) {
        setPreviewFile({ path: detail.fileName, line: detail.lineNumber })
      }
    }
    window.addEventListener('inspector:open-source', handler)
    return () => window.removeEventListener('inspector:open-source', handler)
  }, [])

  const shellKeyMap = useMemo(() => ({
    'Mod+Shift+I': defineRouteKey('shell:open-inspector', () => openInspectorWindow(), 'Shell'),
  }), [])

  return (
    <AriaRoute keyMap={shellKeyMap} label="Shell">
      <div className={`page ${ax({ layout: 'row', scroll: 'hidden' })}`}>
        <ReproRecorderOverlay />
        <KeylineOverlay />
        {!isMobileRoute && <ActivityBar theme={theme} onThemeToggle={toggleTheme} />}
        <div className={`page-content ${ax({ layout: 'scroll', flex: '1' })}`}>
          <Outlet />
        </div>
        <FileViewerModal
          filePath={previewFile?.path ?? null}
          highlightLines={previewFile?.line ? new Set([previewFile.line]) : undefined}
          onClose={() => setPreviewFile(null)}
        />
        <ComponentInspector />
      </div>
    </AriaRoute>
  )
}
