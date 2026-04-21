#!/usr/bin/env node
import { readRegistry, cleanStale, writeRegistry } from '../.claude/hooks/worktreeRegistry.mjs'

const args = new Set(process.argv.slice(2))
const entries = args.has('--prune') ? cleanStale() : readRegistry()

if (args.has('--json')) {
  console.log(JSON.stringify(entries, null, 2))
  process.exit(0)
}

if (entries.length === 0) { console.log('(no worktrees registered)'); process.exit(0) }

const pad = (s, n) => String(s).padEnd(n)
console.log(pad('NAME', 24) + pad('BRANCH', 28) + pad('PORT', 6) + pad('PID', 8) + 'AGE')
for (const e of entries) {
  const age = Math.round((Date.now() - new Date(e.started_at).getTime()) / 60000) + 'm'
  console.log(pad(e.name, 24) + pad(e.branch, 28) + pad(e.port, 6) + pad(e.dev_pid ?? '-', 8) + age)
}
