import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

interface TreeNode {
  id: string
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

interface ImportInfo {
  path: string
  layer: string
}

interface ImportsResponse {
  file: string
  layer: string
  imports: ImportInfo[]
  importedBy: ImportInfo[]
}

const IGNORE = new Set(['.git', 'node_modules', 'dist', 'dist-lib', '.DS_Store'])
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

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

// --- Import parsing ---

// Matches: import/export ... from '...', import('...'), import '...' (side-effect)
const IMPORT_RE = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

function parseImports(content: string): string[] {
  IMPORT_RE.lastIndex = 0
  const specifiers: string[] = []
  let match
  while ((match = IMPORT_RE.exec(content)) !== null) {
    const spec = match[1] ?? match[2]
    if (spec && (spec.startsWith('.') || spec.startsWith('/'))) {
      specifiers.push(spec)
    }
  }
  return specifiers
}

function resolveImport(specifier: string, fromFile: string): string | null {
  const dir = path.dirname(fromFile)
  const resolved = path.resolve(dir, specifier)

  try {
    const stat = fs.statSync(resolved)
    if (stat.isFile()) return resolved
    if (stat.isDirectory()) {
      for (const ext of SOURCE_EXTS) {
        const indexFile = path.join(resolved, `index${ext}`)
        if (fs.existsSync(indexFile)) return indexFile
      }
    }
  } catch {
    // Not found — try with extensions
  }

  for (const ext of SOURCE_EXTS) {
    const withExt = resolved + ext
    if (fs.existsSync(withExt)) return withExt
  }

  return null
}

function detectLayer(filePath: string, projectRoot: string): string {
  const rel = path.relative(projectRoot, filePath)
  // src/interactive-os/{layer}/...
  const osMatch = rel.match(/^src\/interactive-os\/([^/]+)\//)
  if (osMatch) return osMatch[1]
  // src/pages/...
  if (rel.startsWith('src/pages/')) return 'pages'
  // src/styles/...
  if (rel.startsWith('src/styles/')) return 'styles'
  return 'root'
}

function getFileImports(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return []
  const ext = path.extname(filePath)
  if (!SOURCE_EXTS.has(ext)) return []

  const content = fs.readFileSync(filePath, 'utf-8')
  const specifiers = parseImports(content)
  const resolved: string[] = []

  for (const spec of specifiers) {
    const target = resolveImport(spec, filePath)
    if (target) resolved.push(target)
  }

  return resolved
}

// --- Import cache with reverse index ---

let forwardCache: Map<string, string[]> | null = null
let reverseCache: Map<string, string[]> | null = null
let cacheProjectRoot: string | null = null

function collectSourceFiles(tree: TreeNode[]): string[] {
  const files: string[] = []
  for (const node of tree) {
    if (node.type === 'file' && SOURCE_EXTS.has(path.extname(node.name))) {
      files.push(node.id)
    }
    if (node.children) files.push(...collectSourceFiles(node.children))
  }
  return files
}

function buildCaches(projectRoot: string): void {
  const srcDir = path.join(projectRoot, 'src')
  const tree = buildTree(srcDir)
  const allFiles = collectSourceFiles(tree)
  const forward = new Map<string, string[]>()
  const reverse = new Map<string, string[]>()

  for (const file of allFiles) {
    const deps = getFileImports(file)
    forward.set(file, deps)
    for (const dep of deps) {
      if (!reverse.has(dep)) reverse.set(dep, [])
      reverse.get(dep)!.push(file)
    }
  }

  forwardCache = forward
  reverseCache = reverse
  cacheProjectRoot = projectRoot
}

function invalidateFile(filePath: string): void {
  if (!forwardCache || !reverseCache) return

  // Remove old forward entries from reverse index
  const oldDeps = forwardCache.get(filePath) ?? []
  for (const dep of oldDeps) {
    const consumers = reverseCache.get(dep)
    if (consumers) {
      const idx = consumers.indexOf(filePath)
      if (idx !== -1) consumers.splice(idx, 1)
    }
  }

  // Reparse and update
  const newDeps = getFileImports(filePath)
  forwardCache.set(filePath, newDeps)
  for (const dep of newDeps) {
    if (!reverseCache.has(dep)) reverseCache.set(dep, [])
    const consumers = reverseCache.get(dep)!
    if (!consumers.includes(filePath)) consumers.push(filePath)
  }
}

function getImportsData(filePath: string, projectRoot: string): ImportsResponse {
  if (!forwardCache || !reverseCache || cacheProjectRoot !== projectRoot) {
    buildCaches(projectRoot)
  }

  // Ensure current file is in cache (may be new)
  if (!forwardCache!.has(filePath)) {
    invalidateFile(filePath)
  }

  const imports: ImportInfo[] = (forwardCache!.get(filePath) ?? []).map(p => ({
    path: p,
    layer: detectLayer(p, projectRoot),
  }))

  const importedBy: ImportInfo[] = (reverseCache!.get(filePath) ?? []).map(p => ({
    path: p,
    layer: detectLayer(p, projectRoot),
  }))

  return {
    file: filePath,
    layer: detectLayer(filePath, projectRoot),
    imports,
    importedBy,
  }
}

// --- Export parsing ---

interface ExportedSymbol {
  kind: 'function' | 'interface' | 'type' | 'const' | 'class'
  name: string
  signature?: string       // function params + return type
  properties?: { name: string; type: string }[]  // interface/type members
  value?: string           // const value hint or type alias
}

interface ExportsResponse {
  file: string
  symbols: ExportedSymbol[]
}

function parseExports(content: string): ExportedSymbol[] {
  const symbols: ExportedSymbol[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // export function name(params): returnType
    const fnMatch = line.match(/^export\s+(?:default\s+)?function\s+(\w+)\s*(\([^)]*\))(?:\s*:\s*(.+?))?(?:\s*\{|$)/)
    if (fnMatch) {
      symbols.push({
        kind: 'function',
        name: fnMatch[1],
        signature: `${fnMatch[2]}${fnMatch[3] ? ': ' + fnMatch[3].trim() : ''}`,
      })
      continue
    }

    // export const name = (...) => ... or export const name: Type = ...
    const constMatch = line.match(/^export\s+(?:default\s+)?const\s+(\w+)(?:\s*:\s*([^=]+?))?\s*=/)
    if (constMatch) {
      // Check if it's an arrow function
      const rest = line.slice(line.indexOf('=') + 1).trim()
      const arrowMatch = rest.match(/^\s*(\([^)]*\))(?:\s*:\s*(\w[^=]*?))?\s*=>/)
      if (arrowMatch) {
        symbols.push({
          kind: 'function',
          name: constMatch[1],
          signature: `${arrowMatch[1]}${arrowMatch[2] ? ': ' + arrowMatch[2].trim() : ''}`,
        })
      } else {
        symbols.push({
          kind: 'const',
          name: constMatch[1],
          value: constMatch[2]?.trim() ?? rest.slice(0, 40).replace(/[{[\n]/g, '').trim(),
        })
      }
      continue
    }

    // export interface Name { ... }
    const ifaceMatch = line.match(/^export\s+(?:default\s+)?interface\s+(\w+)/)
    if (ifaceMatch) {
      const props = parseMembers(lines, i + 1)
      symbols.push({ kind: 'interface', name: ifaceMatch[1], properties: props })
      continue
    }

    // export type Name = { ... } or export type Name = ...
    const typeMatch = line.match(/^export\s+(?:default\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*(.*)/)
    if (typeMatch) {
      const rhs = typeMatch[2].trim()
      if (rhs === '{' || rhs === '') {
        const props = parseMembers(lines, i + 1)
        symbols.push({ kind: 'type', name: typeMatch[1], properties: props })
      } else {
        symbols.push({ kind: 'type', name: typeMatch[1], value: rhs.slice(0, 60) })
      }
      continue
    }

    // export class Name
    const classMatch = line.match(/^export\s+(?:default\s+)?(?:abstract\s+)?class\s+(\w+)/)
    if (classMatch) {
      const props = parseMembers(lines, i + 1)
      symbols.push({ kind: 'class', name: classMatch[1], properties: props })
      continue
    }
  }

  return symbols
}

function parseMembers(lines: string[], startLine: number): { name: string; type: string }[] {
  const members: { name: string; type: string }[] = []
  let depth = 1

  for (let i = startLine; i < lines.length && depth > 0; i++) {
    const line = lines[i].trim()
    if (line.includes('{')) depth++
    if (line.includes('}')) depth--
    if (depth <= 0) break

    // Match property: name: type or name?: type
    const propMatch = line.match(/^(?:readonly\s+)?(\w+)\??\s*:\s*(.+?)(?:\s*[;,]?\s*$)/)
    if (propMatch && depth === 1) {
      members.push({ name: propMatch[1], type: propMatch[2].replace(/[;,]$/, '').trim() })
    }

    // Match method: name(params): returnType
    const methodMatch = line.match(/^(?:readonly\s+)?(\w+)\s*(\([^)]*\))(?:\s*:\s*(.+?))?(?:\s*[;,{]?\s*$)/)
    if (methodMatch && !propMatch && depth === 1) {
      members.push({ name: methodMatch[1], type: `${methodMatch[2]}${methodMatch[3] ? ' → ' + methodMatch[3].replace(/[;,{]$/, '').trim() : ''}` })
    }
  }

  return members
}

function getExportsData(filePath: string): ExportsResponse {
  const content = fs.readFileSync(filePath, 'utf-8')
  return { file: filePath, symbols: parseExports(content) }
}

export function fsPlugin(): Plugin {
  return {
    name: 'vite-plugin-fs',
    configureServer(server) {
      // Auto-invalidate import cache on file changes
      server.watcher.on('change', (changedPath) => {
        if (forwardCache && SOURCE_EXTS.has(path.extname(changedPath))) {
          invalidateFile(changedPath)
        }
      })

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

        if (url.pathname === '/api/fs/exports') {
          const filePath = url.searchParams.get('path')
          if (!filePath || !fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'File not found' }))
            return
          }
          const data = getExportsData(filePath)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return
        }

        if (url.pathname === '/api/fs/imports') {
          const filePath = url.searchParams.get('path')
          const root = url.searchParams.get('root') ?? path.resolve('.')
          if (!filePath || !fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'File not found' }))
            return
          }
          const data = getImportsData(filePath, root)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
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
