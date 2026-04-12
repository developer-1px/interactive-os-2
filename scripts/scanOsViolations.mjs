#!/usr/bin/env node
/**
 * OS Violation Retroactive Scan
 *
 * Invokes .claude/hooks/guardOsPatterns.mjs and .claude/hooks/guardCssAxes.mjs
 * via child_process with synthesized {tool_name:'Write', tool_input} stdin.
 * Hooks are the SSOT — this runner does NOT replicate rule logic or exclusions.
 *
 * Usage:
 *   node scripts/scanOsViolations.mjs --layer pages|ui|primitives|all [--fail-on-violation]
 *
 * Output:
 *   - docs/2-areas/harness/reports/violations-{layer}.md
 *   - stdout: "{layer}: N violations in M files (K scanned)"
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'
import { spawnSync, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

// --- CLI args ---
const args = process.argv.slice(2)
const layerArg = args[args.indexOf('--layer') + 1]
const failOnViolation = args.includes('--fail-on-violation')

if (!layerArg || args.indexOf('--layer') === -1) {
  console.error('Usage: node scripts/scanOsViolations.mjs --layer pages|ui|primitives|all [--fail-on-violation]')
  process.exit(2)
}

// --- Declarative layer → dir map (no switch-case) ---
const LAYER_DIRS = {
  pages: 'src/pages',
  ui: 'src/interactive-os/ui',
  primitives: 'src/interactive-os/primitives',
}

const LAYERS_TO_RUN = layerArg === 'all' ? ['pages', 'ui', 'primitives'] : [layerArg]
if (!LAYERS_TO_RUN.every(l => l in LAYER_DIRS)) {
  console.error(`Unknown layer: ${layerArg}. Expected one of: pages, ui, primitives, all`)
  process.exit(2)
}

// --- Hook paths ---
const HOOKS = [
  resolve(ROOT, '.claude/hooks/guardOsPatterns.mjs'),
  resolve(ROOT, '.claude/hooks/guardCssAxes.mjs'),
]

// --- Report dir ---
const REPORT_DIR = resolve(ROOT, 'docs/2-areas/harness/reports')
mkdirSync(REPORT_DIR, { recursive: true })

// --- Git status map (once per process) ---
function getGitStatusMap() {
  const map = new Map()
  try {
    const out = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' })
    for (const line of out.split('\n')) {
      if (!line) continue
      const code = line.slice(0, 2)
      const path = line.slice(3).trim()
      let flag = ''
      if (code.includes('?')) flag = '?'
      else if (code.trim()) flag = 'M'
      if (flag) map.set(path, flag)
    }
  } catch { /* */ }
  return map
}
const GIT_STATUS = getGitStatusMap()

// --- File collection ---
function collectFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue
      results.push(...collectFiles(full))
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

// --- Hook invocation ---
function runHook(hookPath, filePath, content) {
  const payload = JSON.stringify({
    tool_name: 'Write',
    tool_input: { file_path: filePath, content },
  })
  const res = spawnSync('node', [hookPath], {
    input: payload,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  return { stdout: res.stdout ?? '', stderr: res.stderr ?? '', status: res.status }
}

// --- Parse hook stdout ---
function parseHookOutput(stdout) {
  // Empty stdout → no violation
  if (!stdout.trim()) return { violations: [], parseError: null }
  try {
    const json = JSON.parse(stdout)
    if (json.decision !== 'block') return { violations: [], parseError: null }
    const reason = json.reason ?? ''
    // Extract numbered violation lines: "  1. rule text" or "1. rule text"
    const lines = reason.split('\n')
    const violations = []
    for (const line of lines) {
      const m = line.match(/^\s*\d+\.\s+(.+)$/)
      if (m) violations.push(m[1].trim())
    }
    // Fallback: if no numbered lines but reason exists, treat whole reason as 1
    if (violations.length === 0 && reason.trim()) {
      violations.push(reason.trim().split('\n')[0])
    }
    return { violations, parseError: null }
  } catch (e) {
    return { violations: [], parseError: { raw: stdout, error: String(e) } }
  }
}

// --- Scan one layer ---
function scanLayer(layer) {
  const dirAbs = resolve(ROOT, LAYER_DIRS[layer])
  const files = collectFiles(dirAbs)

  const perFile = new Map() // relPath → { flag, violations: [] }
  const ruleCounts = new Map()
  const parseErrors = []

  for (const abs of files) {
    const rel = relative(ROOT, abs)
    let content
    try { content = readFileSync(abs, 'utf8') }
    catch { continue }

    const fileViolations = []
    for (const hook of HOOKS) {
      const { stdout } = runHook(hook, abs, content)
      const { violations, parseError } = parseHookOutput(stdout)
      if (parseError) {
        parseErrors.push({ file: rel, ...parseError })
      }
      fileViolations.push(...violations)
    }

    if (fileViolations.length > 0) {
      const flag = GIT_STATUS.get(rel) ?? ''
      perFile.set(rel, { flag, violations: fileViolations })
      for (const v of fileViolations) {
        // Rule key = first 80 chars of violation (coarse grouping)
        const key = v.slice(0, 80)
        ruleCounts.set(key, (ruleCounts.get(key) ?? 0) + 1)
      }
    }
  }

  const totalViolations = [...perFile.values()].reduce((a, f) => a + f.violations.length, 0)

  return {
    layer,
    scanned: files.length,
    fileCount: perFile.size,
    totalViolations,
    perFile,
    ruleCounts,
    parseErrors,
  }
}

// --- Write report ---
function writeReport(result) {
  const { layer, scanned, fileCount, totalViolations, perFile, ruleCounts, parseErrors } = result
  const lines = []
  lines.push(`# Violations — ${layer}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Total: ${totalViolations} violations in ${fileCount} files (of ${scanned} scanned)`)
  lines.push('')
  lines.push('## By rule')
  lines.push('| Rule | Count |')
  lines.push('|---|---|')
  const sortedRules = [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])
  for (const [rule, count] of sortedRules) {
    const escaped = rule.replace(/\|/g, '\\|')
    lines.push(`| ${escaped} | ${count} |`)
  }
  lines.push('')
  lines.push('## By file')
  lines.push('')
  for (const [rel, { flag, violations }] of perFile) {
    const flagStr = flag ? ` [${flag}]` : ''
    lines.push(`### ${rel}${flagStr}`)
    for (const v of violations) {
      lines.push(`- ${v}`)
    }
    lines.push('')
  }

  if (parseErrors.length > 0) {
    lines.push('## Parse errors')
    lines.push('')
    for (const { file, raw, error } of parseErrors) {
      lines.push(`### ${file}`)
      lines.push(`- error: ${error}`)
      lines.push('```')
      lines.push(raw.slice(0, 500))
      lines.push('```')
      lines.push('')
    }
  }

  const out = resolve(REPORT_DIR, `violations-${layer}.md`)
  writeFileSync(out, lines.join('\n'))
}

// --- Main ---
let grandTotal = 0
for (const layer of LAYERS_TO_RUN) {
  try {
    const result = scanLayer(layer)
    writeReport(result)
    console.log(`${layer}: ${result.totalViolations} violations in ${result.fileCount} files (${result.scanned} scanned)`)
    grandTotal += result.totalViolations
  } catch (e) {
    console.error(`${layer}: ERROR — ${e.message}`)
  }
}

if (failOnViolation && grandTotal > 0) process.exit(1)
process.exit(0)
