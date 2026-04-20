import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { IGNORE, SOURCE_EXTS, buildTree } from './buildFsTree'
import { ensureCaches, invalidateFile } from './importGraph'

import type { ServerResponse } from 'node:http'

function json(res: ServerResponse, data: unknown): void {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function handleTree(url: URL, res: ServerResponse): void {
  const root = url.searchParams.get('root')
  if (!root || !fs.existsSync(root)) {
    res.statusCode = 400
    json(res, { error: 'Invalid root path' })
    return
  }
  json(res, buildTree(root))
}

function handleDepCounts(url: URL, res: ServerResponse): void {
  const root = url.searchParams.get('root') ?? path.resolve('.')
  const { forward, reverse } = ensureCaches(root)
  const counts: Record<string, { imports: number; importedBy: number }> = {}
  for (const [file, deps] of forward) {
    counts[file] = { imports: deps.length, importedBy: reverse.get(file)?.length ?? 0 }
  }
  for (const [file, consumers] of reverse) {
    if (!counts[file]) counts[file] = { imports: 0, importedBy: consumers.length }
  }
  json(res, counts)
}

function handleFolderDeps(url: URL, res: ServerResponse): void {
  const root = url.searchParams.get('root') ?? path.resolve('.')
  const folder = url.searchParams.get('folder')
  if (!folder) {
    res.statusCode = 400
    json(res, { error: 'folder param required' })
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
    if (!fileRel.includes('/')) continue
    for (const dep of deps) {
      if (!dep.startsWith(folderPath + '/')) continue
      const depRel = dep.slice(folderPath.length + 1)
      const depDir = depRel.split('/')[0]
      if (!depRel.includes('/')) continue
      if (fileDir === depDir) continue
      const key = `${fileDir}->${depDir}`
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push({ from: fileDir, to: depDir })
      }
    }
  }
  json(res, { dirs: [...childDirs], edges })
}

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.bmp': 'image/bmp',
}

function handleFile(url: URL, res: ServerResponse): void {
  const filePath = url.searchParams.get('path')
  if (!filePath || !fs.existsSync(filePath)) {
    res.statusCode = 404
    json(res, { error: 'File not found' })
    return
  }
  if (fs.statSync(filePath).isDirectory()) {
    res.statusCode = 400
    json(res, { error: 'Path is a directory' })
    return
  }
  const fileExt = path.extname(filePath).toLowerCase()
  if (IMAGE_MIME[fileExt]) {
    const buf = fs.readFileSync(filePath)
    res.setHeader('Content-Type', IMAGE_MIME[fileExt])
    res.end(buf)
    return
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(content)
}

const routes: Record<string, (url: URL, res: ServerResponse) => void> = {
  '/api/fs/tree': handleTree,
  '/api/fs/dep-counts': handleDepCounts,
  '/api/fs/folder-deps': handleFolderDeps,
  '/api/fs/file': handleFile,
}

export function fsPlugin(): Plugin {
  return {
    name: 'vite-plugin-fs',
    configureServer(server) {
      server.watcher.on('change', (changedPath) => {
        if (SOURCE_EXTS.has(path.extname(changedPath))) {
          invalidateFile(changedPath)
        }
      })

      for (const event of ['add', 'unlink', 'addDir', 'unlinkDir'] as const) {
        server.watcher.on(event, (changedPath) => {
          if (IGNORE.has(path.basename(changedPath))) return
          server.hot.send({ type: 'custom', event: 'fs:tree-update', data: { path: changedPath, kind: event } })
        })
      }

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const handler = routes[url.pathname]
        if (handler) handler(url, res)
        else next()
      })
    },
  }
}
