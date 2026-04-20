import fs from 'node:fs'
import path from 'node:path'

export interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  loc?: number
  mtime?: number
  symlink?: boolean
  target?: string
  children?: TreeNode[]
}

export const IGNORE = new Set(['.git', 'node_modules', 'dist', 'dist-lib', '.DS_Store'])
export const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

export function buildTree(dirPath: string, visited: Set<string> = new Set()): TreeNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const nodes: TreeNode[] = []

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue
    const fullPath = path.join(dirPath, entry.name)
    const isSymlink = entry.isSymbolicLink()
    let resolvedType: 'file' | 'directory'
    let target: string | undefined
    let realPath: string | undefined
    if (isSymlink) {
      try {
        target = fs.readlinkSync(fullPath)
        realPath = fs.realpathSync(fullPath)
        resolvedType = fs.statSync(fullPath).isDirectory() ? 'directory' : 'file'
      } catch { continue }
    } else {
      resolvedType = entry.isDirectory() ? 'directory' : 'file'
    }
    let mtime: number | undefined
    try { mtime = fs.statSync(fullPath).mtimeMs } catch { /* stat unavailable */ }
    if (resolvedType === 'directory') {
      let children: TreeNode[] = []
      if (isSymlink) {
        if (realPath && !visited.has(realPath)) {
          const next = new Set(visited); next.add(realPath)
          children = buildTree(fullPath, next)
        }
      } else {
        children = buildTree(fullPath, visited)
      }
      nodes.push({
        id: fullPath,
        name: entry.name,
        type: 'directory',
        ...(mtime != null && { mtime }),
        ...(isSymlink && { symlink: true, target }),
        children,
      })
    } else {
      const ext = path.extname(entry.name)
      const isText = SOURCE_EXTS.has(ext) || ['.css', '.json', '.md', '.yaml', '.yml', '.html', '.svg', '.mdx'].includes(ext)
      let loc: number | undefined
      if (isText) {
        try { loc = fs.readFileSync(fullPath, 'utf-8').split('\n').length } catch { /* binary or unreadable */ }
      }
      nodes.push({
        id: fullPath,
        name: entry.name,
        type: 'file',
        ...(loc != null && { loc }),
        ...(mtime != null && { mtime }),
        ...(isSymlink && { symlink: true, target }),
      })
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}
