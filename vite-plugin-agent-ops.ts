import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

function getLatestOps(opsDir: string): unknown[] {
  if (!fs.existsSync(opsDir)) return []
  const files = fs.readdirSync(opsDir)
    .filter(f => f.endsWith('.ndjson'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(opsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  if (files.length === 0) return []
  const content = fs.readFileSync(path.join(opsDir, files[0].name), 'utf-8')
  return content.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
}

export function agentOpsPlugin(): Plugin {
  return {
    name: 'vite-plugin-agent-ops',
    configureServer(server) {
      const opsDir = path.resolve('.claude/agent-ops')
      fs.mkdirSync(opsDir, { recursive: true })

      const clients = new Set<import('node:http').ServerResponse>()
      const fileSizes = new Map<string, number>()

      // Initialize file sizes
      for (const f of fs.readdirSync(opsDir).filter(f => f.endsWith('.ndjson'))) {
        fileSizes.set(f, fs.statSync(path.join(opsDir, f)).size)
      }

      // Watch via Vite's chokidar
      server.watcher.add(opsDir)
      server.watcher.on('change', (changedPath) => {
        if (!changedPath.startsWith(opsDir) || !changedPath.endsWith('.ndjson')) return
        const filename = path.basename(changedPath)
        const stat = fs.statSync(changedPath)
        const prevSize = fileSizes.get(filename) ?? 0

        if (stat.size > prevSize) {
          const fd = fs.openSync(changedPath, 'r')
          const buf = Buffer.alloc(stat.size - prevSize)
          fs.readSync(fd, buf, 0, buf.length, prevSize)
          fs.closeSync(fd)

          const newLines = buf.toString('utf-8').trim().split('\n').filter(Boolean)
          for (const line of newLines) {
            for (const client of clients) {
              client.write(`data: ${line}\n\n`)
            }
          }
        }
        fileSizes.set(filename, stat.size)
      })

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        if (url.pathname === '/api/agent-ops/latest') {
          const data = getLatestOps(opsDir)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return
        }

        if (url.pathname === '/api/agent-ops/stream') {
          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

          clients.add(res)

          const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000)

          req.on('close', () => {
            clients.delete(res)
            clearInterval(heartbeat)
          })
          return
        }

        next()
      })
    },
  }
}
