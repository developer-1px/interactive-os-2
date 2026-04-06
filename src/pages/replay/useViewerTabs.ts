// ② 2026-04-03-viewer-command-prd.md
import { useState, useCallback } from 'react'
import type { ViewerTab, FileTab, SearchTab, TerminalTab } from './viewerTypes'

export interface UseViewerTabsReturn {
  tabs: ViewerTab[]
  activeTabId: string | null
  activeTab: ViewerTab | null
  setActiveTab: (id: string) => void
  openFile: (path: string, content: string) => FileTab
  openSearch: (query: string, output: string) => SearchTab
  openTerminal: (command: string, output: string) => TerminalTab
  clear: () => void
}

export function useViewerTabs(): UseViewerTabsReturn {
  const [tabMap, setTabMap] = useState<Map<string, ViewerTab>>(new Map())
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  const tabs = [...tabMap.values()]
  const activeTab = activeTabId ? tabMap.get(activeTabId) ?? null : null

  const openFile = useCallback((path: string, content: string): FileTab => {
    const tab: FileTab = { type: 'file', id: path, path, content }
    setTabMap(prev => {
      const next = new Map(prev)
      next.set(path, tab)
      return next
    })
    setActiveTabId(path)
    return tab
  }, [])

  const openSearch = useCallback((query: string, output: string): SearchTab => {
    const id = 'search'
    const tab: SearchTab = { type: 'search', id, query, output }
    setTabMap(prev => {
      const next = new Map(prev)
      next.set(id, tab)
      return next
    })
    setActiveTabId(id)
    return tab
  }, [])

  const openTerminal = useCallback((command: string, output: string): TerminalTab => {
    const id = 'terminal'
    const tab: TerminalTab = { type: 'terminal', id, command, output }
    setTabMap(prev => {
      const next = new Map(prev)
      next.set(id, tab)
      return next
    })
    setActiveTabId(id)
    return tab
  }, [])

  const clear = useCallback(() => {
    setTabMap(new Map())
    setActiveTabId(null)
  }, [])

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTab: setActiveTabId,
    openFile,
    openSearch,
    openTerminal,
    clear,
  }
}
