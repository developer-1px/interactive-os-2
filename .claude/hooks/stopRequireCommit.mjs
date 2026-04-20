#!/usr/bin/env node
import { execSync } from 'child_process'
import { findCurrent } from './worktreeRegistry.mjs'

const entry = findCurrent()
if (!entry) process.exit(0)

const dirty = (() => {
  try { return execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0 } catch { return false }
})()
const unpushed = (() => {
  try { return execSync(`git log @{u}..HEAD --oneline 2>/dev/null || git log HEAD --oneline --not --remotes`, { encoding: 'utf8' }).trim().length > 0 } catch { return false }
})()

if (!dirty && !unpushed) process.exit(0)

const reason = `worktree ${entry.name}에 미커밋(${dirty ? 'dirty' : 'clean'}) 또는 미푸시(${unpushed ? 'yes' : 'no'}) 상태. /handoff로 마무리하세요.`
process.stdout.write(JSON.stringify({ systemMessage: reason }))
