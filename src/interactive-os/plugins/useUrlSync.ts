// ② url-sync-v2-prd.md
import { useEffect } from 'react'
import type { UrlParser } from './urlParsers'

/**
 * React hook: listen for popstate (browser back/forward) and
 * notify the page via onUrlChange so it can re-initialize its store.
 */
export function useUrlSync(options: {
  parser: UrlParser
  onUrlChange: (id: string | null) => void
}): void {
  const { parser, onUrlChange } = options

  useEffect(() => {
    const handler = () => {
      const id = parser.read(window.location)
      onUrlChange(id)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [parser, onUrlChange])
}
