#!/usr/bin/env node

/**
 * PreToolUse:Bash hook — 비가역 git 명령 차단
 *
 * 차단 대상:
 * - git stash (전체 원복)
 * - git checkout . / git checkout -- . (전체 원복)
 * - git restore . (전체 원복)
 * - git clean -f (untracked 삭제)
 * - git reset --hard (히스토리 파괴)
 *
 * CLAUDE.md 규칙: "어떤 경우든 git stash로 전체 원복 금지"
 */

import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const cmd = (input.tool_input?.command ?? '').trim()

const isMainBranch = () => {
  try {
    // 명령 앞의 `cd <path>`를 감지해 실제 실행 위치 기준으로 브랜치 판정
    // (Claude 프로세스 cwd는 main repo로 고정이라, cd 없이 판정하면 worktree 작업도 main으로 오판)
    const cdMatch = rawCmd.match(/(?:^|[;&])\s*cd\s+([^\s;&|]+)/)
    const args = cdMatch ? ['-C', cdMatch[1], 'rev-parse', '--abbrev-ref', 'HEAD'] : ['rev-parse', '--abbrev-ref', 'HEAD']
    const branch = execSync(`git ${args.map((a) => JSON.stringify(a)).join(' ')}`, { encoding: 'utf8' }).trim()
    return branch === 'main' || branch === 'master'
  } catch { return false }
}

const BLOCKED = [
  { pattern: /\bgit\s+stash\b/, reason: 'git stash 금지 (main 브랜치) — 필요 시 git checkout -- [파일명]으로 개별 원복', onlyMain: true },
  { pattern: /\bgit\s+checkout\s+(\.|--\s*\.\s*$)/, reason: 'git checkout . 금지 — git checkout -- [파일명]으로 개별 파일만 원복하세요' },
  { pattern: /\bgit\s+restore\s+\.\s*$/, reason: 'git restore . 금지 — git restore [파일명]으로 개별 파일만 원복하세요' },
  { pattern: /\bgit\s+clean\s+-[a-zA-Z]*f/, reason: 'git clean -f 금지 — rm [파일명]으로 개별 삭제하세요' },
  { pattern: /\bgit\s+reset\s+--hard\b/, reason: 'git reset --hard 금지 — git reset --soft 또는 git revert [커밋]을 사용하세요' },
  { pattern: /\bgit\s+push\s+[^|]*--force\b/, reason: 'git push --force 금지 — git push --force-with-lease를 사용하세요 (그래도 위험, 확인 필요)' },
  { pattern: /\bgit\s+push\s+[^|]*-f\b/, reason: 'git push -f 금지 — git push --force-with-lease를 사용하세요 (그래도 위험, 확인 필요)' },
  { pattern: /\bgit\s+branch\s+-D\b/, reason: 'git branch -D 금지 — git branch -d (소문자)를 사용하세요' },
  { pattern: /\bgit\s+commit\b/, reason: 'main 브랜치 commit 금지 — worktree에서 작업 (git worktree add .claude/worktrees/<slug> -b feat/<slug>)', onlyMain: true, envOverride: 'ALLOW_MAIN' },
  { pattern: /\bgit\s+push\b/, reason: 'main 브랜치 push 금지 — PR 경로만 허용', onlyMain: true, envOverride: 'ALLOW_MAIN' },
]

for (const { pattern, reason, onlyMain, envOverride } of BLOCKED) {
  if (pattern.test(cmd)) {
    if (onlyMain && !isMainBranch()) continue
    if (envOverride && process.env[envOverride] === '1') continue
    const output = JSON.stringify({ decision: 'block', reason })
    process.stdout.write(output)
    process.exit(0)
  }
}
