// ② url-sync-v2-prd.md
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import type { UrlParser } from './urlParsers'
import { hashParser, searchParser } from './urlParsers'
import { definePlugin } from './definePlugin'

interface UrlSyncOptions {
  /** @deprecated Use `parser` instead */
  param?: 'hash' | 'search'
  /** @deprecated Use `parser: searchParser(key)` instead */
  key?: string
  /** Strategy object for URL read/write. Overrides `param`/`key`. */
  parser?: UrlParser
  /** 'push' adds to history stack, 'replace' overwrites current entry. Default 'replace'. */
  history?: 'push' | 'replace'
  /** Filter which commands trigger URL write. Default: selection commands. */
  commandFilter?: (cmd: Command) => boolean
}

function resolveParser(options: UrlSyncOptions): UrlParser {
  if (options.parser) return options.parser
  if (options.param === 'search') return searchParser(options.key ?? 'tab')
  return hashParser()
}

const defaultCommandFilter = (cmd: Command): boolean =>
  cmd.type === 'core:toggle-select' || cmd.type === 'core:select-range'

function getSelectedId(store: NormalizedData): string | null {
  const sel = store.entities.__selection__ as Record<string, unknown> | undefined
  const ids = (sel?.selectedIds as string[]) ?? []
  return ids[0] ?? null
}

function getFocusedId(store: NormalizedData): string | null {
  const focus = store.entities.__focus__ as Record<string, unknown> | undefined
  return (focus?.focusedId as string) ?? null
}

/** Read initial ID from URL using a parser. */
export function getInitialFromUrl(parser?: UrlParser): string | null {
  return (parser ?? hashParser()).read(window.location)
}

/** @deprecated Use `getInitialFromUrl(parser)` */
export function getInitialTabFromUrl(options?: UrlSyncOptions): string | null {
  return resolveParser(options ?? {}).read(window.location)
}

/**
 * Plugin: sync store state → URL.
 * One-directional (state → URL). For URL → state on popstate,
 * use `useUrlSync()` hook at the page level.
 */
export function urlSync(options?: UrlSyncOptions) {
  const opts: UrlSyncOptions = options ?? {}
  const parser = resolveParser(opts)
  const historyMode = opts.history ?? 'replace'
  const filter = opts.commandFilter ?? defaultCommandFilter

  return definePlugin({
    name: 'urlSync',
    middleware: (next: (command: Command) => void, getStore: () => NormalizedData) => (command: Command) => {
      next(command)
      if (filter(command)) {
        const id = getSelectedId(getStore()) ?? getFocusedId(getStore())
        if (id) parser.write(id, historyMode)
      }
    },
  })
}
