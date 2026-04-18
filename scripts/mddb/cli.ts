// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * CLI entry — `pnpm mddb:{extract|validate|audit|inject}` 단일 진입점.
 *
 * @invariant parseArgv는 pure (process.* 만지지 않음)
 * @invariant main은 exit code 반환 (0/1/2)
 * @invariant subcommand 라우팅:
 *   extract  → JSON stdout
 *   validate → ValidationReport stdout (errors면 exit 1)
 *   audit    → writeAuditFile or JSON (--json)
 *   inject   → extractFile + injectFrontmatter
 */
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { extractFile, extractAll } from './extract.ts'
import { validateExtract, validateAll } from './validate.ts'
import { runAudit, writeAuditFile, renderAuditMarkdown } from './audit.ts'
import { injectFrontmatter } from './injectFrontmatter.ts'
import { toRelDocsPath, isDocsMd, isMemoryPath, DOCS_ROOT, PROJECT_ROOT, walkDocsMd } from './paths.ts'

export type CliArgs = {
  subcommand: 'extract' | 'validate' | 'audit' | 'inject'
  positionals: string[]
  flags: {
    dryRun?: boolean
    mergeStrategy?: 'preserve-explicit' | 'overwrite'
    concurrency?: number
    outPath?: string
    json?: boolean
    scope?: string
  }
}

const KNOWN_SUBCOMMANDS = ['extract', 'validate', 'audit', 'inject'] as const

export function parseArgv(argv: string[]): CliArgs {
  const [first, ...rest] = argv
  if (!first || !(KNOWN_SUBCOMMANDS as readonly string[]).includes(first)) {
    throw new Error(
      `unknown subcommand: ${first ?? '(none)'}\n` +
      `usage: mddb <extract|validate|audit|inject> [--scope PATH] [--dry-run] [--json] [--strategy STRATEGY] [--concurrency N] [--out PATH]`,
    )
  }
  const subcommand = first as CliArgs['subcommand']
  const positionals: string[] = []
  const flags: CliArgs['flags'] = {}

  for (let i = 0; i < rest.length; i++) {
    const tok = rest[i]
    if (tok === '--dry-run' || tok === '--dry') flags.dryRun = true
    else if (tok === '--json') flags.json = true
    else if (tok.startsWith('--strategy=')) flags.mergeStrategy = tok.slice('--strategy='.length) as 'preserve-explicit' | 'overwrite'
    else if (tok === '--strategy') flags.mergeStrategy = rest[++i] as 'preserve-explicit' | 'overwrite'
    else if (tok.startsWith('--scope=')) flags.scope = tok.slice('--scope='.length)
    else if (tok === '--scope') flags.scope = rest[++i]
    else if (tok.startsWith('--out=')) flags.outPath = tok.slice('--out='.length)
    else if (tok === '--out') flags.outPath = rest[++i]
    else if (tok.startsWith('--concurrency=')) flags.concurrency = Number(tok.slice('--concurrency='.length))
    else if (tok === '--concurrency') flags.concurrency = Number(rest[++i])
    else if (tok === '--path') positionals.push(rest[++i])
    else if (tok.startsWith('--path=')) positionals.push(tok.slice('--path='.length))
    else if (tok.startsWith('-')) {
      // unknown flag — ignore with warn
      console.warn(`mddb: unknown flag ignored: ${tok}`)
    } else {
      positionals.push(tok)
    }
  }

  return { subcommand, positionals, flags }
}

function isGitDirty(): boolean {
  try {
    const out = execSync('git status --porcelain', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.trim().length > 0
  } catch {
    return false
  }
}

function resolveScope(scope: string | undefined): string[] {
  // 스코프는 docs/ 하위 폴더 또는 단일 파일
  if (!scope || scope === '' || scope === '.') {
    return walkDocsMd(DOCS_ROOT)
  }
  const abs = resolve(PROJECT_ROOT, scope)
  // 파일 1개
  if (scope.endsWith('.md')) {
    if (isDocsMd(abs) && !isMemoryPath(abs)) {
      return [toRelDocsPath(abs)]
    }
    return []
  }
  // 폴더
  if (abs.startsWith(DOCS_ROOT)) {
    return walkDocsMd(abs)
  }
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
    // 단일 파일 extract
    const relPath = files[0] ?? toRelDocsPath(resolve(PROJECT_ROOT, args.positionals[0]))
    const r = await extractFile(relPath)
    if (args.flags.json) {
      console.log(JSON.stringify(r, null, 2))
    } else {
      console.log(JSON.stringify(r, null, 2))
    }
    return 0
  }

  // 전체 scope
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
    // stdout markdown
    console.log(renderAuditMarkdown(report))
  }
  return report.policyWatch.shouldFail ? 1 : 0
}

async function injectSubcommand(args: CliArgs): Promise<number> {
  const scope = args.flags.scope ?? args.positionals[0]
  const dryRun = args.flags.dryRun ?? false
  const strategy = args.flags.mergeStrategy ?? 'preserve-explicit'

  if (!dryRun && isGitDirty()) {
    console.error('mddb:inject: working tree is dirty. commit or stash first, or use --dry-run.')
    return 2
  }

  const files = resolveScope(scope)
  if (files.length === 0) {
    console.error(`mddb:inject: no files for scope: ${scope ?? '(none)'}`)
    return 2
  }

  const report = { total: 0, changed: 0, warnings: 0, errors: 0 }
  for (const relPath of files) {
    try {
      const result = await extractFile(relPath)
      report.total++
      const errs = result.warnings.filter((w) => w.severity === 'error').length
      const warns = result.warnings.filter((w) => w.severity !== 'error').length
      report.errors += errs
      report.warnings += warns

      const inj = await injectFrontmatter(relPath, result, { dryRun, mergeStrategy: strategy })
      if (inj.changed) report.changed++
    } catch (e) {
      report.errors++
      console.error(`[${relPath}] ${(e as Error).message}`)
    }
  }

  if (args.flags.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`mddb:inject scope=${scope ?? 'docs/'} dryRun=${dryRun} strategy=${strategy}`)
    console.log(`  total=${report.total} changed=${report.changed}`)
    console.log(`  warnings=${report.warnings} errors=${report.errors}`)
    if (dryRun) console.log('  (dry-run: no files written)')
  }
  return report.errors > 0 ? 1 : 0
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
      case 'inject': return await injectSubcommand(args)
    }
  } catch (e) {
    console.error(`mddb: ${(e as Error).message}`)
    return 2
  }
}

// Entry point — run when invoked directly (tsx/node)
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
