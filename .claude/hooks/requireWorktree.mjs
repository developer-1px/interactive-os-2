#!/usr/bin/env node
import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { findCurrent } from './worktreeRegistry.mjs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

function isMainWorktree() {
  try {
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim()
    return !gitDir.includes('/worktrees/')
  } catch { return true }
}

function slugFromPath(p) {
  const base = p.split('/').filter(Boolean).slice(-2).join('-') || `wt-${Date.now()}`
  return base.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase().slice(0, 40)
}

if (findCurrent()) process.exit(0)
if (!isMainWorktree()) process.exit(0)

const slug = slugFromPath(filePath)
const reason = [
  'main worktree에서 직접 수정 금지. 병렬 세션 규약 위반.',
  '',
  '새 worktree 생성:',
  `  git worktree add .claude/worktrees/${slug} -b feat/${slug}`,
  `  cd .claude/worktrees/${slug}`,
  '',
  '또는 기존 worktree로 이동 후 다시 시도하세요. (pnpm wt:list)',
].join('\n')

process.stdout.write(JSON.stringify({ decision: 'block', reason }))
