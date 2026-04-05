// ② 2026-03-26-unified-navigation-prd.md
import { useState, useEffect, useMemo } from 'react'
import { Outlet } from 'react-router-dom'

import { FileViewerModal } from '@os/ui/FileViewerModal'
import { ReproRecorderOverlay } from './devtools/rec/ReproRecorderOverlay'
import { ComponentInspector } from './devtools/inspector/ComponentInspector'
import { openInspectorWindow } from './devtools/inspector/openInspectorWindow'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { useTheme } from './hooks/useTheme'
import { ActivityBar } from './ActivityBar'

import './styles/palette.css'       // L0: OKLCH color palette
import './styles/reset.css'        // L1: Browser initialization
import './styles/tokens.css'       // L2: Design token values
import './styles/structure.css'    // L2.5: Atomic layout classes
import './styles/interactive.css'  // L4: Interaction policy (hover, focus, disabled...)
import './interactive-os/ui/indicators/indicators.css'  // L4: Indicator part classes
import './styles/layout.css'       // App layout (sidebar, page grid)
import './styles/app.css'          // App-level utilities

export default function AppShell() {
  const { theme, toggle: toggleTheme } = useTheme()

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
    'Mod+Shift+I': () => {
      openInspectorWindow()
      return { type: 'shell:open-inspector' } as const
    },
  }), [])

  return (
    <AriaRoute keyMap={shellKeyMap} label="Shell">
      <div className="page flex-row overflow-hidden">
        <ReproRecorderOverlay />
        <ActivityBar theme={theme} onThemeToggle={toggleTheme} />
        <div className="page-content flex-col flex-1 overflow-y-auto">
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
