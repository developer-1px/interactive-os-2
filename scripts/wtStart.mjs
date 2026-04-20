#!/usr/bin/env node
import { spawn, execSync } from 'child_process'
import { createConnection } from 'net'
import path from 'path'
import { fileURLToPath } from 'url'

const GATEWAY_PORT = Number(process.env.WT_GATEWAY_PORT ?? 4100)
const DASH_PORT = Number(process.env.WT_DASH_PORT ?? 4000)

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const gitCommonDir = execSync('git rev-parse --git-common-dir', { encoding: 'utf8' }).trim()
const repoRoot = path.dirname(path.isAbsolute(gitCommonDir) ? gitCommonDir : path.resolve(gitCommonDir))
const CADDYFILE = path.join(repoRoot, '.claude', 'Caddyfile')

function isListening(port) {
  return new Promise((resolve) => {
    const sock = createConnection({ port, host: '127.0.0.1' })
    sock.once('connect', () => { sock.destroy(); resolve(true) })
    sock.once('error', () => resolve(false))
    sock.setTimeout(300, () => { sock.destroy(); resolve(false) })
  })
}

async function main() {
  execSync(`node ${JSON.stringify(path.join(scriptDir, 'wtCaddy.mjs'))}`, { stdio: 'inherit' })

  const gatewayUp = await isListening(GATEWAY_PORT)
  const dashUp = await isListening(DASH_PORT)

  if (!dashUp) {
    const dash = spawn('node', [path.join(scriptDir, 'wtDash.mjs')], { cwd: repoRoot, detached: true, stdio: 'ignore' })
    dash.unref()
    process.stdout.write(`started dashboard :${DASH_PORT}\n`)
  } else {
    process.stdout.write(`dashboard :${DASH_PORT} already running\n`)
  }

  if (!gatewayUp) {
    try {
      execSync(`caddy start --config ${JSON.stringify(CADDYFILE)} --adapter caddyfile`, { stdio: 'inherit' })
    } catch {
      process.stderr.write('caddy 기동 실패. brew install caddy 확인.\n')
      process.exit(1)
    }
  } else {
    try {
      execSync(`caddy reload --config ${JSON.stringify(CADDYFILE)} --adapter caddyfile`, { stdio: 'ignore' })
      process.stdout.write(`gateway :${GATEWAY_PORT} reloaded\n`)
    } catch {
      process.stdout.write(`gateway :${GATEWAY_PORT} already running (reload 실패, 무시)\n`)
    }
  }

  process.stdout.write(`\n  dashboard: http://wt.localhost:${GATEWAY_PORT}  (or http://localhost:${DASH_PORT})\n\n`)
}

main()
