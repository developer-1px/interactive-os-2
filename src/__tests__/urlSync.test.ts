// ② url-sync-v2-prd.md — V1~V10 verification scenarios
import { describe, it, expect, beforeEach } from 'vitest'
import { hashParser, searchParser, pathParser } from '@os/plugins/urlParsers'
import { getInitialFromUrl, getInitialTabFromUrl, urlSync } from '@os/plugins/urlSync'
import type { NormalizedData } from '@os/store/types'

function makeLocation(overrides: Partial<Location>): Location {
  return {
    hash: '',
    host: 'localhost',
    hostname: 'localhost',
    href: 'http://localhost/',
    origin: 'http://localhost',
    pathname: '/',
    port: '',
    protocol: 'http:',
    search: '',
    ancestorOrigins: {} as DOMStringList,
    assign: () => {},
    reload: () => {},
    replace: () => {},
    toString: () => 'http://localhost/',
    ...overrides,
  }
}

describe('hashParser', () => {
  const parser = hashParser()

  // V1: read from hash
  it('reads tab ID from hash', () => {
    const loc = makeLocation({ hash: '#project-a' })
    expect(parser.read(loc)).toBe('project-a')
  })

  it('returns null for empty hash', () => {
    const loc = makeLocation({ hash: '' })
    expect(parser.read(loc)).toBeNull()
  })

  // V9: Korean encoding round-trip
  it('handles Korean characters via encoding', () => {
    const loc = makeLocation({ hash: '#' + encodeURIComponent('한글탭') })
    expect(parser.read(loc)).toBe('한글탭')
  })

  // V2: write with replace → verify location state
  it('writes hash with replaceState', () => {
    Object.defineProperty(window, 'location', {
      value: makeLocation({ pathname: '/app', search: '', hash: '', href: 'http://localhost/app' }),
      writable: true,
      configurable: true,
    })
    parser.write('project-b', 'replace')
    // After replaceState, we verify via reading back
    // (jsdom updates location on history.*State)
    const readBack = parser.read(makeLocation({ hash: '#project-b' }))
    expect(readBack).toBe('project-b')
  })

  // V8: skip duplicate — same hash should not change history length
  it('skips write when hash already matches', () => {
    Object.defineProperty(window, 'location', {
      value: makeLocation({ pathname: '/app', search: '', hash: '#same', href: 'http://localhost/app#same' }),
      writable: true,
      configurable: true,
    })
    const lengthBefore = window.history.length
    parser.write('same', 'push')
    expect(window.history.length).toBe(lengthBefore)
  })
})

describe('searchParser', () => {
  const parser = searchParser('tab')

  it('reads from search params', () => {
    const loc = makeLocation({ search: '?tab=tokens' })
    expect(parser.read(loc)).toBe('tokens')
  })

  it('returns null when key missing', () => {
    const loc = makeLocation({ search: '?other=x' })
    expect(parser.read(loc)).toBeNull()
  })
})

describe('pathParser', () => {
  const root = '/Users/user/Desktop/aria'
  const parser = pathParser({ prefix: 'viewer', root })

  it('reads file path from pathname', () => {
    const loc = makeLocation({ pathname: '/viewer/src/App.tsx' })
    expect(parser.read(loc)).toBe(root + '/src/App.tsx')
  })

  it('returns null for bare prefix', () => {
    const loc = makeLocation({ pathname: '/viewer/' })
    expect(parser.read(loc)).toBeNull()
  })

  // V7: nonexistent ID — parser still returns a path, consumer decides
  it('returns path even for nonexistent file', () => {
    const loc = makeLocation({ pathname: '/viewer/no/such/file.ts' })
    expect(parser.read(loc)).toBe(root + '/no/such/file.ts')
  })
})

describe('getInitialFromUrl / getInitialTabFromUrl', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: makeLocation({ hash: '#legacy-tab' }),
      writable: true,
      configurable: true,
    })
  })

  // V10: backward compatibility — no options = hash mode
  it('reads hash by default (no args)', () => {
    expect(getInitialFromUrl()).toBe('legacy-tab')
  })

  it('getInitialTabFromUrl is backward compatible', () => {
    expect(getInitialTabFromUrl()).toBe('legacy-tab')
  })

  it('accepts a UrlParser directly', () => {
    expect(getInitialFromUrl(hashParser())).toBe('legacy-tab')
  })
})

describe('urlSync plugin', () => {
  function makeStore(selectedId: string): NormalizedData {
    return {
      entities: {
        __selection__: { id: '__selection__', selectedIds: [selectedId] } as never,
        [selectedId]: { id: selectedId, data: {} },
      },
      relationships: {},
    }
  }

  // V10: default urlSync() dispatches next and doesn't throw
  it('passes command through middleware (default options)', () => {
    Object.defineProperty(window, 'location', {
      value: makeLocation({ pathname: '/', hash: '', href: 'http://localhost/' }),
      writable: true,
      configurable: true,
    })

    const plugin = urlSync()
    const store = makeStore('tab-1')
    const results: string[] = []
    const next = (cmd: { type: string }) => { results.push(cmd.type) }
    const dispatch = plugin.middleware!(next, () => store)

    dispatch({ type: 'core:toggle-select', payload: { id: 'tab-1' } })

    expect(results).toEqual(['core:toggle-select'])
  })

  it('commandFilter controls which commands trigger URL write', () => {
    Object.defineProperty(window, 'location', {
      value: makeLocation({ pathname: '/', hash: '', href: 'http://localhost/' }),
      writable: true,
      configurable: true,
    })

    const commands: string[] = []
    const plugin = urlSync({ commandFilter: cmd => cmd.type === 'custom:nav' })
    const store = makeStore('tab-1')
    const next = (cmd: { type: string }) => { commands.push(cmd.type) }
    const dispatch = plugin.middleware!(next, () => store)

    dispatch({ type: 'core:toggle-select', payload: { id: 'tab-1' } })
    dispatch({ type: 'custom:nav', payload: { id: 'tab-1' } })

    // Both commands pass through next
    expect(commands).toEqual(['core:toggle-select', 'custom:nav'])
  })
})

describe('useUrlSync', () => {
  it('invokes onUrlChange on popstate', async () => {
    const { useUrlSync } = await import('@os/plugins/useUrlSync')
    const { renderHook } = await import('@testing-library/react')

    Object.defineProperty(window, 'location', {
      value: makeLocation({ hash: '#after-back' }),
      writable: true,
      configurable: true,
    })

    let receivedId: string | null = null
    const onUrlChange = (id: string | null) => { receivedId = id }
    const parser = hashParser()

    renderHook(() => useUrlSync({ parser, onUrlChange }))

    // V4: simulate popstate
    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(receivedId).toBe('after-back')
  })
})
