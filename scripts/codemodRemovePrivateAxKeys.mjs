#!/usr/bin/env node
/**
 * Codemod: remove removed-from-AxPublic keys from ax({...}) calls.
 *
 * Keys listed below were moved from Public to Private (absorbed by role/layout/surface)
 * or removed entirely. The call-sites still pass them, which produces TS2353 across ~750 errors.
 *
 * Scope (strict):
 *   Only mutates ObjectLiteralExpressions passed as the first argument to a CallExpression
 *   whose callee identifier text is exactly `ax` (or `ax.raw`).
 *
 * Usage:
 *   node scripts/codemodRemovePrivateAxKeys.mjs          # apply
 *   node scripts/codemodRemovePrivateAxKeys.mjs --dry    # report only
 */

import { Project, SyntaxKind } from 'ts-morph'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry')

// Keys removed from AxPublic (see src/styles/axPublic.ts).
// `scroll` is removed; if `layout` is absent in the same literal and the old `scroll` value
// was the string 'scroll' | 'scroll-x' | 'clip', we migrate it into `layout` instead of dropping.
const REMOVE_KEYS = new Set([
  'gap', 'padding', 'shape', 'border', 'weight', 'opacity',
  'icon', 'square', 'motion', 'state', 'height', 'filter',
  'text', // @removed from AxPublic (see axPublic.ts header); emphasis level no longer an axis
])

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { allowJs: false, jsx: 4 },
})
project.addSourceFilesAtPaths([
  `${root}/src/**/*.ts`,
  `${root}/src/**/*.tsx`,
  `!${root}/**/*.d.ts`,
  `!${root}/node_modules/**`,
])

let removedProps = 0
let touchedFiles = 0
let migratedScroll = 0
const perFile = new Map()

for (const sf of project.getSourceFiles()) {
  let changed = false
  let local = 0
  sf.forEachDescendant((node) => {
    if (!node.asKind) return
    const call = node.asKind(SyntaxKind.CallExpression)
    if (!call) return
    const expr = call.getExpression()
    const exprText = expr.getText()
    // Only ax() — ax.raw() is the explicit Private-key escape hatch; leave it alone.
    if (exprText !== 'ax') return
    const [arg] = call.getArguments()
    if (!arg) return
    const obj = arg.asKind(SyntaxKind.ObjectLiteralExpression)
    if (!obj) return

    // Gather property names present (for scroll→layout migration decision).
    const propNames = new Set()
    for (const p of obj.getProperties()) {
      const pa = p.asKind(SyntaxKind.PropertyAssignment)
      if (pa) propNames.add(pa.getName())
    }

    // Handle scroll: if literal migrate to layout; otherwise just drop.
    const scrollProp = obj.getProperty('scroll')
    if (scrollProp) {
      const pa = scrollProp.asKind(SyntaxKind.PropertyAssignment)
      const init = pa?.getInitializer()
      const initText = init?.getText()
      const canMigrate = !propNames.has('layout') && init?.asKind(SyntaxKind.StringLiteral)
      const val = init?.asKind(SyntaxKind.StringLiteral)?.getLiteralText()
      if (canMigrate && (val === 'scroll' || val === 'scroll-x' || val === 'clip')) {
        obj.addPropertyAssignment({ name: 'layout', initializer: initText })
        migratedScroll++
      }
      pa?.remove()
      changed = true
      local++
    }

    for (const key of REMOVE_KEYS) {
      const p = obj.getProperty(key)
      if (!p) continue
      const pa = p.asKind(SyntaxKind.PropertyAssignment)
      if (!pa) continue
      pa.remove()
      changed = true
      local++
    }
  })
  if (changed) {
    touchedFiles++
    removedProps += local
    perFile.set(relative(root, sf.getFilePath()), local)
  }
}

const top = [...perFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
console.log(`\n${DRY ? '[DRY]' : '[APPLY]'} remove private ax keys`)
console.log('-'.repeat(64))
console.log(`files touched : ${touchedFiles}`)
console.log(`props removed : ${removedProps}`)
console.log(`scroll→layout : ${migratedScroll}`)
console.log('-'.repeat(64))
console.log('top offenders:')
for (const [f, n] of top) console.log(`  ${String(n).padStart(4)}  ${f}`)

if (!DRY && touchedFiles > 0) {
  await project.save()
  console.log('\n✓ files written.')
} else if (DRY) {
  console.log('\n(dry run — no files written)')
}
