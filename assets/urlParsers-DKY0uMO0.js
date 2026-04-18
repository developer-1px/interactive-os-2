var e=`// ② url-sync-v2-prd.md

/** Strategy object for reading/writing URL state. */
export interface UrlParser {
  read(location: Location): string | null
  write(id: string, history: 'push' | 'replace'): void
}

export function hashParser(): UrlParser {
  return {
    read(location: Location): string | null {
      const raw = location.hash.slice(1)
      return raw ? decodeURIComponent(raw) : null
    },
    write(id: string, history: 'push' | 'replace'): void {
      const encoded = encodeURIComponent(id)
      const target = \`\${window.location.pathname}\${window.location.search}#\${encoded}\`
      if (window.location.hash.slice(1) === encoded) return
      if (history === 'push') {
        window.history.pushState(null, '', target)
      } else {
        window.history.replaceState(null, '', target)
      }
    },
  }
}

export function searchParser(key = 'tab'): UrlParser {
  return {
    read(location: Location): string | null {
      return new URLSearchParams(location.search).get(key)
    },
    write(id: string, history: 'push' | 'replace'): void {
      const url = new URL(window.location.href)
      const current = url.searchParams.get(key)
      if (current === id) return
      url.searchParams.set(key, id)
      if (history === 'push') {
        window.history.pushState(null, '', url.toString())
      } else {
        window.history.replaceState(null, '', url.toString())
      }
    },
  }
}

export function pathParser(options: { prefix: string; root: string }): UrlParser {
  const { prefix, root } = options
  const prefixRe = new RegExp(\`^\\\\/\${prefix}\\\\/?\`)

  return {
    read(location: Location): string | null {
      const relative = decodeURIComponent(location.pathname).replace(prefixRe, '')
      if (!relative) return null
      return \`\${root}/\${relative}\`
    },
    write(id: string, history: 'push' | 'replace'): void {
      const relative = id.startsWith(root + '/') ? id.slice(root.length + 1) : id
      const target = \`/\${prefix}/\${encodeURIComponent(relative).replace(/%2F/g, '/')}\`
      if (decodeURIComponent(window.location.pathname) === decodeURIComponent(target)) return
      if (history === 'push') {
        window.history.pushState(null, '', target)
      } else {
        window.history.replaceState(null, '', target)
      }
    },
  }
}
`;export{e as default};