import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { IGNORE, SOURCE_EXTS, buildTree } from './buildFsTree'
import { ensureCaches, invalidateFile } from './importGraph'

export function fsPlugin(): Plugin {
  return {
    name: 'vite-plugin-fs',
    configureServer(server) {
      // Auto-invalidate import cache on file changes
      server.watcher.on('change', (changedPath) => {
        if (SOURCE_EXTS.has(path.extname(changedPath))) {
          invalidateFile(changedPath)
        }
      })

      // Notify client when files are added or removed
      for (const event of ['add', 'unlink', 'addDir', 'unlinkDir'] as const) {
        server.watcher.on(event, (changedPath) => {
          if (IGNORE.has(path.basename(changedPath))) return
          server.hot.send({ type: 'custom', event: 'fs:tree-update', data: { path: changedPath, kind: event } })
        })
      }

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

        if (url.pathname === '/api/fs/dep-counts') {
          const root = url.searchParams.get('root') ?? path.resolve('.')
          const { forward, reverse } = ensureCaches(root)
          const counts: Record<string, { imports: number; importedBy: number }> = {}
          for (const [file, deps] of forward) {
            counts[file] = { imports: deps.length, importedBy: reverse.get(file)?.length ?? 0 }
          }
          for (const [file, consumers] of reverse) {
            if (!counts[file]) counts[file] = { imports: 0, importedBy: consumers.length }
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(counts))
          return
        }

        if (url.pathname === '/api/fs/folder-deps') {
          const root = url.searchParams.get('root') ?? path.resolve('.')
          const folder = url.searchParams.get('folder')
          if (!folder) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'folder param required' }))
            return
          }
          const { forward } = ensureCaches(root)
          const folderPath = path.resolve(folder)
          const childDirs = new Set<string>()
          for (const [file] of forward) {
            if (file.startsWith(folderPath + '/')) {
              const rel = file.slice(folderPath.length + 1)
              const firstDir = rel.split('/')[0]
              if (rel.includes('/')) childDirs.add(firstDir)
            }
          }
          const edges: { from: string; to: string }[] = []
          const edgeSet = new Set<string>()
          for (const [file, deps] of forward) {
            if (!file.startsWith(folderPath + '/')) continue
            const fileRel = file.slice(folderPath.length + 1)
            const fileDir = fileRel.split('/')[0]
            if (!fileRel.includes('/')) continue // 루트 파일 제외
            for (const dep of deps) {
              if (!dep.startsWith(folderPath + '/')) continue
              const depRel = dep.slice(folderPath.length + 1)
              const depDir = depRel.split('/')[0]
              if (!depRel.includes('/')) continue
              if (fileDir === depDir) continue // 같은 폴더 내 의존 제외
              const key = `${fileDir}->${depDir}`
              if (!edgeSet.has(key)) {
                edgeSet.add(key)
                edges.push({ from: fileDir, to: depDir })
              }
            }
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ dirs: [...childDirs], edges }))
          return
        }

        if (url.pathname === '/api/fs/file') {
          const filePath = url.searchParams.get('path')
          if (!filePath || !fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'File not found' }))
            return
          }
          const fileExt = path.extname(filePath).toLowerCase()
          const IMAGE_MIME: Record<string, string> = {
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
            '.ico': 'image/x-icon', '.bmp': 'image/bmp',
          }
          if (IMAGE_MIME[fileExt]) {
            const buf = fs.readFileSync(filePath)
            res.setHeader('Content-Type', IMAGE_MIME[fileExt])
            res.end(buf)
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
