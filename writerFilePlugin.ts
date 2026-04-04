// ② 2026-04-04-md-writer-prd.md
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const DOCS_DIR = path.resolve(process.cwd(), 'docs')

export default function writerPlugin(): Plugin {
  return {
    name: 'writer-file-io',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/writer/')) return next()
        const url = new URL(req.url, `http://${req.headers.host}`)

        // GET /api/writer/list?dir=relative/path
        if (req.method === 'GET' && url.pathname === '/api/writer/list') {
          const dir = url.searchParams.get('dir') || ''
          const targetDir = path.resolve(DOCS_DIR, dir)

          if (!targetDir.startsWith(DOCS_DIR)) {
            res.writeHead(403)
            res.end(JSON.stringify({ error: 'Path traversal denied' }))
            return
          }

          try {
            const entries = fs.readdirSync(targetDir, { withFileTypes: true })
            const files = entries
              .filter(e => e.isFile() && e.name.endsWith('.md'))
              .map(e => ({ name: e.name, path: path.join(dir, e.name) }))
            const dirs = entries
              .filter(e => e.isDirectory() && !e.name.startsWith('.'))
              .map(e => ({ name: e.name, path: path.join(dir, e.name) }))
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ files, dirs }))
          } catch {
            res.writeHead(404)
            res.end(JSON.stringify({ error: 'Directory not found' }))
          }
          return
        }

        // GET /api/writer/read?file=relative/path.md
        if (req.method === 'GET' && url.pathname === '/api/writer/read') {
          const file = url.searchParams.get('file')
          if (!file) { res.writeHead(400); res.end('Missing file param'); return }

          const filePath = path.resolve(DOCS_DIR, file)
          if (!filePath.startsWith(DOCS_DIR)) {
            res.writeHead(403)
            res.end(JSON.stringify({ error: 'Path traversal denied' }))
            return
          }

          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            res.writeHead(200, { 'Content-Type': 'text/plain' })
            res.end(content)
          } catch {
            res.writeHead(404)
            res.end(JSON.stringify({ error: 'File not found' }))
          }
          return
        }

        // POST /api/writer/write { file, content }
        if (req.method === 'POST' && url.pathname === '/api/writer/write') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { file, content } = JSON.parse(body) as { file: string; content: string }
              const filePath = path.resolve(DOCS_DIR, file)
              if (!filePath.startsWith(DOCS_DIR)) {
                res.writeHead(403)
                res.end(JSON.stringify({ error: 'Path traversal denied' }))
                return
              }

              fs.mkdirSync(path.dirname(filePath), { recursive: true })
              fs.writeFileSync(filePath, content, 'utf-8')
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.writeHead(500)
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }

        next()
      })
    },
  }
}
