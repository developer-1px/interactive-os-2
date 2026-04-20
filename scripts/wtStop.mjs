#!/usr/bin/env node
import { execSync } from 'child_process'

function run(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }); return true } catch { return false }
}

run('caddy stop') && process.stdout.write('caddy stopped\n')
run("pkill -f 'scripts/wtDash.mjs'") && process.stdout.write('dashboard stopped\n')
