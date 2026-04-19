#!/usr/bin/env node
/**
 * Codemod: infer `role` from an unambiguous `surface` literal inside ax({...}) calls.
 *
 * AxPublic is a discriminated union by `role`. When `role` is absent, TS narrows to
 * `role: 'utility'`, which forbids surface/interactive/content/tone — producing a cascade
 * of TS2322 "string → SurfaceCell" errors.
 *
 * Only acts when `role` is absent AND `surface` is a single string literal whose value
 * belongs to exactly one role's subset. Ambiguous surfaces (`ghost`, `display`, `overlay`)
 * are left alone.
 *
 * Usage:
 *   node scripts/codemodInferRole.mjs --dry
 *   node scripts/codemodInferRole.mjs
 */

import { Project, SyntaxKind } from 'ts-morph'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry')

// Unambiguous surface → role map (values that belong to exactly one role branch).
// Ambiguous values omitted: 'ghost', 'display', 'overlay', 'placeholder'.
const SURFACE_TO_ROLE = {
  action: 'control',
  input: 'control',
  sunken: 'control-group',
  base: 'control-group',
  raised: 'control-group',
  inverted: 'tip',
}

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { jsx: 4 },
})
project.addSourceFilesAtPaths([
  `${root}/src/**/*.ts`,
  `${root}/src/**/*.tsx`,
  `!${root}/**/*.d.ts`,
])

let added = 0
let touched = 0
const perFile = new Map()

for (const sf of project.getSourceFiles()) {
  let changed = false
  let local = 0
  sf.forEachDescendant((node) => {
    const call = node.asKind?.(SyntaxKind.CallExpression)
    if (!call) return
    const exprText = call.getExpression().getText()
    if (exprText !== 'ax') return
    const [arg] = call.getArguments()
    const obj = arg?.asKind(SyntaxKind.ObjectLiteralExpression)
    if (!obj) return

    // Skip if role is already present.
    if (obj.getProperty('role')) return

    const surfaceProp = obj.getProperty('surface')
    if (!surfaceProp) return
    const pa = surfaceProp.asKind(SyntaxKind.PropertyAssignment)
    const init = pa?.getInitializer()
    const lit = init?.asKind(SyntaxKind.StringLiteral)
    if (!lit) return
    const val = lit.getLiteralText()
    const role = SURFACE_TO_ROLE[val]
    if (!role) return

    obj.insertPropertyAssignment(0, { name: 'role', initializer: `'${role}'` })
    changed = true
    local++
  })
  if (changed) {
    touched++
    added += local
    perFile.set(relative(root, sf.getFilePath()), local)
  }
}

console.log(`\n${DRY ? '[DRY]' : '[APPLY]'} infer role from surface literal`)
console.log('-'.repeat(64))
console.log(`files touched : ${touched}`)
console.log(`roles added   : ${added}`)
console.log('-'.repeat(64))
for (const [f, n] of [...perFile].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(n).padStart(3)}  ${f}`)
}
if (!DRY && touched > 0) await project.save()
