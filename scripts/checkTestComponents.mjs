#!/usr/bin/env node
/**
 * Test component violation detector
 *
 * Detects PascalCase component definitions inside test files.
 * Test files should render showcase Pages or ui/ components directly,
 * not define their own wrapper components.
 *
 * Suppress with `// @test-harness` on the line above (for hook wrappers that need a component shell).
 *
 * Usage: node scripts/checkTestComponents.mjs
 * Exit code: 0 = clean, 1 = violations found
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve(import.meta.dirname, '..')

function collectTestFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue
      results.push(...collectTestFiles(full))
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

const files = collectTestFiles(resolve(root, 'src'))

const COMPONENT_PATTERNS = [
  /^(?:export\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\(/,
  /^(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:\(|function\b|React\.(?:memo|forwardRef))/,
]

const violations = []

for (const abs of files) {
  const rel = abs.slice(root.length + 1)
  const lines = readFileSync(abs, 'utf8').split('\n')

  for (let i = 0; i < lines.length; i++) {
    // @test-harness suppression on the preceding line
    if (i > 0 && lines[i - 1].includes('@test-harness')) continue

    const line = lines[i].trim()

    for (const pattern of COMPONENT_PATTERNS) {
      const match = line.match(pattern)
      if (!match) continue

      const name = match[1]
      // Skip ALL_CAPS constants (not components)
      if (!/[a-z]/.test(name)) continue

      violations.push({ file: rel, line: i + 1, name })
    }
  }
}

// --- Output ---

if (violations.length === 0) {
  console.log('✅ No test component violations found.')
  process.exit(0)
}

const grouped = new Map()
for (const v of violations) {
  if (!grouped.has(v.file)) grouped.set(v.file, [])
  grouped.get(v.file).push(v)
}

console.log(`\n❌ ${violations.length} test component violation(s) in ${grouped.size} file(s)\n`)
console.log('Rule: Test files must not define their own components.')
console.log('Fix:  Import and render a showcase Page or ui/ component directly.\n')

for (const [file, vs] of grouped) {
  console.log(`  ${file}`)
  for (const v of vs) {
    console.log(`    L${v.line}  ${v.name}`)
  }
  console.log()
}

process.exit(1)
