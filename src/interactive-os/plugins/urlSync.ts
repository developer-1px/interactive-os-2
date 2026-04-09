import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { definePlugin } from './definePlugin'

interface UrlSyncOptions {
  param?: 'hash' | 'search'
  key?: string
}

function readTabFromUrl(options: UrlSyncOptions): string | null {
  if (options.param === 'search') {
    const k = options.key ?? 'tab'
    return new URLSearchParams(window.location.search).get(k)
  }
  const hash = window.location.hash.slice(1)
  return hash || null
}

function writeTabToUrl(tabId: string, options: UrlSyncOptions): void {
  if (options.param === 'search') {
    const k = options.key ?? 'tab'
    const url = new URL(window.location.href)
    url.searchParams.set(k, tabId)
    window.history.replaceState(null, '', url.toString())
  } else {
    window.history.replaceState(null, '', `${window.location.pathname}#${tabId}`)
  }
}

function getSelectedId(store: NormalizedData): string | null {
  const sel = store.entities.__selection__ as Record<string, unknown> | undefined
  const ids = (sel?.selectedIds as string[]) ?? []
  return ids[0] ?? null
}

/**
 * Read tab ID from URL hash or search param.
 * Use at store creation time to set initial selection.
 */
export function getInitialTabFromUrl(options?: UrlSyncOptions): string | null {
  return readTabFromUrl(options ?? {})
}

/**
 * Plugin: sync selected tab → URL hash/search param.
 * One-directional (selection → URL). For initial URL → selection,
 * use `getInitialTabFromUrl()` when creating store data.
 */
export function urlSync(options?: UrlSyncOptions) {
  const opts: UrlSyncOptions = options ?? {}

  return definePlugin({
    name: 'urlSync',
    middleware: (next: (command: Command) => void, getStore: () => NormalizedData) => (command: Command) => {
      next(command)
      if (command.type === 'core:toggle-select' || command.type === 'core:select-range') {
        const tabId = getSelectedId(getStore())
        if (tabId) writeTabToUrl(tabId, opts)
      }
    },
  })
}
