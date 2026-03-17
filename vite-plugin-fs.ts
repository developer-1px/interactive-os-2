import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

const IGNORE = new Set(['.git', 'node_modules', 'dist', 'dist-lib', '.DS_Store'])

function buildTree(dirPath: string): TreeNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const nodes: TreeNode[] = []

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      nodes.push({
        id: fullPath,
        name: entry.name,
        type: 'directory',
        children: buildTree(fullPath),
      })
    } else {
      nodes.push({ id: fullPath, name: entry.name, type: 'file' })
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function fsPlugin(): Plugin {
  return {
    name: 'vite-plugin-fs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        if (url.pathname === '/api/fs/tree') {
          const root = url.searchParams.get('root')
          if (!root || !fs.existsSync(root)) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid root path' }))
            return
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(buildTree(root)))
          return
        }

        if (url.pathname === '/api/fs/file') {
          const filePath = url.searchParams.get('path')
          if (!filePath || !fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'File not found' }))
            return
          }
          const content = fs.readFileSync(filePath, 'utf-8')
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(content)
          return
        }

        next()
      })
    },
  }
}
