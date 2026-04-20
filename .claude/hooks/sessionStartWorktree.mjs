#!/usr/bin/env node
import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { findCurrent, upsert, cleanStale } from './worktreeRegistry.mjs'
import { allocPort } from './allocWorktreePort.mjs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const sessionId = input.session_id ?? null

cleanStale()
let entry = findCurrent()

const branch = (() => {
  try { return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim() } catch { return 'unknown' }
})()

if (!entry && branch !== 'main' && branch !== 'master') {
  const toplevel = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
  const name = toplevel.split('/').pop()
  entry = { name, branch, path: toplevel, port: allocPort(), session_id: sessionId, dev_pid: null, started_at: new Date().toISOString() }
  upsert(entry)
} else if (entry) {
  upsert({ ...entry, session_id: sessionId })
}

const msg = entry
  ? `worktree: ${entry.name} | branch: ${entry.branch} | dev port: ${entry.port}`
  : `worktree 밖(main 추정). Edit 시 hook이 worktree 생성을 요구합니다. pnpm wt:list로 현황 확인.`

process.stdout.write(JSON.stringify({ systemMessage: msg }))
