/**
 * contents/ ↔ src/ 동형성 검증 스크립트
 *
 * contents/_meta.yaml의 srcMap을 읽어 레이어별로
 * contents MD 파일과 src 코드 파일을 대조한다.
 *
 * - src에 있으나 contents에 없음 → ⚠ missing (문서 누락)
 * - contents에 있으나 src에 없음 → ⬜ placeholder (의도적 빈칸)
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const CONTENTS_DIR = join(ROOT, 'contents')
const META_PATH = join(CONTENTS_DIR, '_meta.yaml')

// --- Parse _meta.yaml ---

function parseRootMeta() {
  const raw = readFileSync(META_PATH, 'utf-8')
  const srcMap = {}
  let inSrcMap = false

  for (const line of raw.split('\n')) {
    if (line.match(/^srcMap:\s*$/)) {
      inSrcMap = true
      continue
    }
    if (inSrcMap) {
      const m = line.match(/^\s+(\w+):\s*(.+)/)
      if (m) {
        srcMap[m[1].trim()] = m[2].trim()
      } else if (!line.match(/^\s*$/)) {
        inSrcMap = false
      }
    }
  }
  return { srcMap }
}

// --- Collect names ---

function collectContentNames(layer) {
  const dir = join(CONTENTS_DIR, layer)
  if (!existsSync(dir)) return new Set()

  return new Set(
    readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => basename(f, '.md'))
  )
}

function collectSrcNames(layer, srcPath) {
  const dir = join(ROOT, srcPath)
  if (!existsSync(dir)) return new Set()

  const entries = readdirSync(dir, { withFileTypes: true })

  // Check if this layer uses subdirectories as modules (e.g., devtools/rec/)
  const hasDirs = entries.some((e) => e.isDirectory() && !e.name.startsWith('_'))
  const hasRelevantFiles = entries.some((e) => e.isFile() && /\.(ts|tsx)$/.test(e.name) && !['index', 'types'].includes(basename(e.name, extname(e.name))))

  // If layer has subdirectories and no direct module files, use directory names
  if (hasDirs && !hasRelevantFiles) {
    return new Set(
      entries
        .filter((e) => e.isDirectory() && !e.name.startsWith('_') && e.name !== '__tests__')
        .map((e) => e.name)
    )
  }

  return new Set(
    entries
      .filter((e) => {
        if (!e.isFile()) return false
        const ext = extname(e.name)
        if (!['.ts', '.tsx'].includes(ext)) return false
        const name = basename(e.name, ext)
        // Exclude common utility/internal files
        if (['index', 'types', 'constants'].includes(name)) return false
        if (name.endsWith('.test') || name.endsWith('.spec')) return false
        if (name.endsWith('.module')) return false
        return true
      })
      .map((e) => basename(e.name, extname(e.name)))
  )
}

// --- Main ---

const { srcMap } = parseRootMeta()
let hasWarnings = false

console.log('Contents ↔ Src Isomorphism Check\n')

for (const [layer, srcPath] of Object.entries(srcMap)) {
  const contentNames = collectContentNames(layer)
  const srcNames = collectSrcNames(layer, srcPath)

  const missing = [...srcNames].filter((n) => !contentNames.has(n))
  const placeholders = [...contentNames].filter((n) => !srcNames.has(n))

  if (missing.length === 0 && placeholders.length === 0) {
    console.log(`  ✅ ${layer} — ${contentNames.size} items, fully synced`)
    continue
  }

  console.log(`  📦 ${layer}`)

  for (const name of missing) {
    console.log(`    ⚠  missing: ${name} (in src, not in contents)`)
    hasWarnings = true
  }

  for (const name of placeholders) {
    console.log(`    ⬜ placeholder: ${name} (in contents, not in src)`)
  }
}

console.log('')

if (hasWarnings) {
  console.log('⚠  Some src files have no corresponding contents docs.')
  process.exit(1)
} else {
  console.log('✅ All checks passed.')
}
