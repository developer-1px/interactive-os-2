import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'

// Resolve @babel/parser from @vitejs/plugin-react's dependencies (pnpm-safe)
const _require = createRequire(import.meta.url)
let parsePath: string
try {
  parsePath = _require.resolve('@babel/parser', {
    paths: [_require.resolve('@vitejs/plugin-react')],
  })
} catch {
  parsePath = _require.resolve('@babel/parser')
}
const { parse } = await import(parsePath) as typeof import('@babel/parser')

export function inspectorPlugin(): Plugin {
  let root = ''

  return {
    name: 'vite-plugin-component-inspector',
    apply: 'serve',

    configResolved(config) {
      root = config.root
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        if (url.pathname !== '/__inspector_source') return next()

        const file = url.searchParams.get('file')
        if (!file) { res.statusCode = 400; res.end('missing file'); return }

        const abs = path.resolve(root, file)
        if (!abs.startsWith(root) || !fs.existsSync(abs)) {
          res.statusCode = 404; res.end('not found'); return
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(fs.readFileSync(abs, 'utf-8'))
      })
    },

    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module', src: '/vite-plugins/component-inspector/ui/client.tsx' },
          injectTo: 'body',
        },
      ]
    },

    transform: {
      order: 'pre',
      handler(code, id) {
        if (id.includes('node_modules')) return
        if (!/\.[tj]sx$/.test(id)) return
        if (id.includes('vite-plugins/component-inspector')) return

        const relativePath = path.relative(root, id)
        const totalLines = code.split('\n').length

        let ast
        try {
          ast = parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'decorators-legacy'],
          })
        } catch {
          return // Unparseable file, skip
        }

        // Collect JSX opening element positions (sorted by descending offset for safe insertion)
        const insertions: { offset: number; line: number; col: number }[] = []

        function walk(node: any) {
          if (!node || typeof node !== 'object') return
          if (Array.isArray(node)) { node.forEach(walk); return }

          if (node.type === 'JSXOpeningElement' && node.loc && node.end != null) {
            // Skip if already has data-inspector-line
            const hasAttr = node.attributes?.some(
              (a: any) => a.type === 'JSXAttribute' && a.name?.name === 'data-inspector-line',
            )
            if (!hasAttr) {
              // Insert after the tag name (node.name.end)
              const nameEnd = node.name?.end
              if (nameEnd != null) {
                insertions.push({
                  offset: nameEnd,
                  line: node.loc.start.line,
                  col: node.loc.start.column + 1,
                })
              }
            }
          }

          // Walk children
          for (const key of Object.keys(node)) {
            if (key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue
            const child = node[key]
            if (child && typeof child === 'object' && (child.type || Array.isArray(child))) {
              walk(child)
            }
          }
        }

        walk(ast.program)

        if (insertions.length === 0) return

        // Sort descending by offset so that later insertions don't shift earlier offsets
        insertions.sort((a, b) => b.offset - a.offset)

        let result = code
        for (const ins of insertions) {
          const attr = ` data-inspector-line="${relativePath}:${ins.line}:${ins.col}" data-inspector-loc="${totalLines}"`
          result = result.slice(0, ins.offset) + attr + result.slice(ins.offset)
        }

        return { code: result, map: null }
      },
    },
  }
}
