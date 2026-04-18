// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * CLI entry — `pnpm mddb:{extract|validate|audit|relocate|index}` 단일 진입점.
 *
 * @invariant parseArgv는 pure (process.* 만지지 않음)
 * @invariant main은 exit code 반환 (0/1/2)
 */
import { resolve } from 'node:path'
import { extractFile, extractAll } from './extract.ts'
import { validateExtract, validateAll } from './validate.ts'
import { runAudit, writeAuditFile, renderAuditMarkdown } from './audit.ts'
import { relocate as runRelocate, planRelocate } from './relocate.ts'
import { writeIndexFile, DEFAULT_INDEX_PATH } from './buildIndex.ts'
import { toRelDocsPath, isDocsMd, isMemoryPath, DOCS_ROOT, PROJECT_ROOT, walkDocsMd } from './paths.ts'

export type CliArgs = {
  subcommand: 'extract' | 'validate' | 'audit' | 'relocate' | 'index'
  positionals: string[]
  flags: {
    dryRun?: boolean
    concurrency?: number
    outPath?: string
    json?: boolean
    scope?: string
  }
}

const KNOWN_SUBCOMMANDS = ['extract', 'validate', 'audit', 'relocate', 'index'] as const

export function parseArgv(argv: string[]): CliArgs {
  const [first, ...rest] = argv
  if (!first || !(KNOWN_SUBCOMMANDS as readonly string[]).includes(first)) {
    throw new Error(
      `unknown subcommand: ${first ?? '(none)'}\n` +
      `usage: mddb <extract|validate|audit|relocate|index> [--scope PATH] [--dry-run] [--json] [--concurrency N] [--out PATH]`,
    )
  }
  const subcommand = first as CliArgs['subcommand']
  const positionals: string[] = []
  const flags: CliArgs['flags'] = {}

  for (let i = 0; i < rest.length; i++) {
    const tok = rest[i]
    if (tok === '--dry-run' || tok === '--dry') flags.dryRun = true
    else if (tok === '--json') flags.json = true
    else if (tok.startsWith('--scope=')) flags.scope = tok.slice('--scope='.length)
    else if (tok === '--scope') flags.scope = rest[++i]
    else if (tok.startsWith('--out=')) flags.outPath = tok.slice('--out='.length)
    else if (tok === '--out') flags.outPath = rest[++i]
    else if (tok.startsWith('--concurrency=')) flags.concurrency = Number(tok.slice('--concurrency='.length))
    else if (tok === '--concurrency') flags.concurrency = Number(rest[++i])
    else if (tok === '--path') positionals.push(rest[++i])
    else if (tok.startsWith('--path=')) positionals.push(tok.slice('--path='.length))
    else if (tok.startsWith('-')) {
      console.warn(`mddb: unknown flag ignored: ${tok}`)
    } else {
      positionals.push(tok)
    }
  }

  return { subcommand, positionals, flags }
}

function resolveScope(scope: string | undefined): string[] {
  if (!scope || scope === '' || scope === '.') return walkDocsMd(DOCS_ROOT)
  const abs = resolve(PROJECT_ROOT, scope)
  if (scope.endsWith('.md')) {
    if (isDocsMd(abs) && !isMemoryPath(abs)) return [toRelDocsPath(abs)]
    return []
  }
  if (abs.startsWith(DOCS_ROOT)) return walkDocsMd(abs)
  return []
}

async function extractSubcommand(args: CliArgs): Promise<number> {
  const scope = args.flags.scope ?? args.positionals[0]
  const files = resolveScope(scope)
  if (files.length === 0 && args.positionals[0]) {
    console.error(`no docs/ files found for scope: ${args.positionals[0]}`)
    return 2
  }
  if (args.positionals[0] && args.positionals[0].endsWith('.md') && !args.flags.scope) {
    const relPath = files[0] ?? toRelDocsPath(resolve(PROJECT_ROOT, args.positionals[0]))
    const r = await extractFile(relPath)
    console.log(JSON.stringify(r, null, 2))
    return 0
  }
  const results = await Promise.all(files.map((f) => extractFile(f).catch((e) => ({
    path: f,
    error: (e as Error).message,
  }))))
  console.log(JSON.stringify(results, null, 2))
  return 0
}

async function validateSubcommand(args: CliArgs): Promise<number> {
  let report: ReturnType<typeof validateAll>
  if (args.positionals.length > 0 && args.positionals[0].endsWith('.md')) {
    const relPath = toRelDocsPath(resolve(PROJECT_ROOT, args.positionals[0]))
    const result = await extractFile(relPath)
    const ws = validateExtract(result)
    const errors = ws.filter((w) => w.severity === 'error')
    report = {
      total: 1,
      passed: errors.length === 0 ? 1 : 0,
      failed: errors.length > 0 ? 1 : 0,
      errors,
      warnings: ws.filter((w) => w.severity !== 'error'),
      byCode: ws.reduce<Record<string, number>>((acc, w) => {
        acc[w.code] = (acc[w.code] ?? 0) + 1
        return acc
      }, {}),
    }
  } else {
    const all = await extractAll()
    report = validateAll(all)
  }

  if (args.flags.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`mddb:validate total=${report.total} passed=${report.passed} failed=${report.failed}`)
    console.log('warnings by code:')
    for (const [code, count] of Object.entries(report.byCode).sort()) {
      console.log(`  ${code}: ${count}`)
    }
    if (report.errors.length > 0) {
      console.error('\nerrors:')
      for (const e of report.errors) {
        console.error(`  [${e.code}] ${e.field ?? '-'}: ${e.message}`)
      }
    }
  }
  return report.errors.length > 0 ? 1 : 0
}

async function auditSubcommand(args: CliArgs): Promise<number> {
  const report = await runAudit()
  if (args.flags.json) {
    console.log(JSON.stringify(report, null, 2))
  } else if (args.flags.outPath) {
    const outPath = await writeAuditFile(report, resolve(PROJECT_ROOT, args.flags.outPath))
    console.log(`audit report: ${outPath}`)
  } else {
    console.log(renderAuditMarkdown(report))
  }
  return report.policyWatch.shouldFail ? 1 : 0
}

async function relocateSubcommand(args: CliArgs): Promise<number> {
  const dryRun = args.flags.dryRun ?? false
  try {
    const plan = dryRun ? await planRelocate() : await runRelocate({ dryRun })
    if (args.flags.json) {
      console.log(JSON.stringify(plan, null, 2))
    } else {
      console.log(`mddb:relocate dryRun=${dryRun}`)
      console.log(`  total scanned: ${plan.total}`)
      console.log(`  planned moves: ${plan.planned.length}`)
      console.log(`  skipped:       ${plan.skipped.length}`)
      const bySource: Record<string, number> = {}
      for (const p of plan.planned) bySource[p.source] = (bySource[p.source] ?? 0) + 1
      console.log('  by source:')
      for (const [s, c] of Object.entries(bySource).sort()) console.log(`    ${s}: ${c}`)
      const byReason: Record<string, number> = {}
      for (const s of plan.skipped) byReason[s.reason] = (byReason[s.reason] ?? 0) + 1
      if (Object.keys(byReason).length > 0) {
        console.log('  by skip reason:')
        for (const [r, c] of Object.entries(byReason).sort()) console.log(`    ${r}: ${c}`)
      }
      if (dryRun) console.log('  (dry-run: no files moved)')
    }
    return 0
  } catch (e) {
    console.error(`mddb:relocate: ${(e as Error).message}`)
    return 2
  }
}

async function indexSubcommand(args: CliArgs): Promise<number> {
  const outPath = args.flags.outPath ? resolve(PROJECT_ROOT, args.flags.outPath) : DEFAULT_INDEX_PATH
  const index = await writeIndexFile(outPath)
  if (args.flags.json) {
    console.log(JSON.stringify({ outPath, total: index.total, generated_at: index.generated_at }, null, 2))
  } else {
    console.log(`mddb:index wrote ${index.total} entries → ${outPath}`)
  }
  return 0
}

export async function main(argv: string[]): Promise<number> {
  let args: CliArgs
  try {
    args = parseArgv(argv)
  } catch (e) {
    console.error((e as Error).message)
    return 2
  }
  try {
    switch (args.subcommand) {
      case 'extract': return await extractSubcommand(args)
      case 'validate': return await validateSubcommand(args)
      case 'audit': return await auditSubcommand(args)
      case 'relocate': return await relocateSubcommand(args)
      case 'index': return await indexSubcommand(args)
    }
  } catch (e) {
    console.error(`mddb: ${(e as Error).message}`)
    return 2
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
