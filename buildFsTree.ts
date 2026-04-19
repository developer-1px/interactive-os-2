import fs from 'node:fs'
import path from 'node:path'

export interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  loc?: number
  mtime?: number
  children?: TreeNode[]
}

export const IGNORE = new Set(['.git', 'node_modules', 'dist', 'dist-lib', '.DS_Store'])
export const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

export function buildTree(dirPath: string): TreeNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const nodes: TreeNode[] = []

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue
    const fullPath = path.join(dirPath, entry.name)
    let mtime: number | undefined
    try { mtime = fs.statSync(fullPath).mtimeMs } catch { /* stat unavailable */ }
    if (entry.isDirectory()) {
      nodes.push({
        id: fullPath,
        name: entry.name,
        type: 'directory',
        ...(mtime != null && { mtime }),
        children: buildTree(fullPath),
      })
    } else {
      const ext = path.extname(entry.name)
      const isText = SOURCE_EXTS.has(ext) || ['.css', '.json', '.md', '.yaml', '.yml', '.html', '.svg', '.mdx'].includes(ext)
      let loc: number | undefined
      if (isText) {
        try { loc = fs.readFileSync(fullPath, 'utf-8').split('\n').length } catch { /* binary or unreadable */ }
      }
      nodes.push({ id: fullPath, name: entry.name, type: 'file', ...(loc != null && { loc }), ...(mtime != null && { mtime }) })
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}
