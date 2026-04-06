import fs from 'node:fs'
import path from 'node:path'
import { type TreeNode, SOURCE_EXTS, buildTree } from './buildFsTree'

// --- Import parsing ---

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

export function ensureCaches(projectRoot: string): { forward: Map<string, string[]>; reverse: Map<string, string[]> } {
  if (!forwardCache || !reverseCache || cacheProjectRoot !== projectRoot) {
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
  return { forward: forwardCache, reverse: reverseCache }
}

export function invalidateFile(filePath: string): void {
  if (!forwardCache || !reverseCache) return

  const oldDeps = forwardCache.get(filePath) ?? []
  for (const dep of oldDeps) {
    const consumers = reverseCache.get(dep)
    if (consumers) {
      const idx = consumers.indexOf(filePath)
      if (idx !== -1) consumers.splice(idx, 1)
    }
  }

  const newDeps = getFileImports(filePath)
  forwardCache.set(filePath, newDeps)
  for (const dep of newDeps) {
    if (!reverseCache.has(dep)) reverseCache.set(dep, [])
    const consumers = reverseCache.get(dep)!
    if (!consumers.includes(filePath)) consumers.push(filePath)
  }
}
