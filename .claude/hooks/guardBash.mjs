#!/usr/bin/env node

/**
 * PreToolUse:Bash hook — main = PR-only + 파괴적 git 명령 차단
 *
 * main 브랜치는 로컬 쓰기 연산(commit/push/merge/rebase/cherry-pick) 전부 차단.
 * feature branch/worktree에서는 허용.
 */

import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const rawCmd = (input.tool_input?.command ?? '').trim()

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
  // 파괴적 명령은 main에서만 차단, feature branch/worktree에서는 허용 (복구용)
  { pattern: /\bgit\s+reset\s+--hard\b/, reason: 'git reset --hard 금지 (main 브랜치) — feature branch/worktree에서는 허용', onlyMain: true },
  { pattern: /\bgit\s+push\s+[^|]*--force(?!-with-lease)\b/, reason: 'git push --force 금지 — git push --force-with-lease를 사용하세요' },
  { pattern: /\bgit\s+push\s+[^|]*\s-f\b/, reason: 'git push -f 금지 — git push --force-with-lease를 사용하세요' },
  { pattern: /\bgit\s+branch\s+-D\b/, reason: 'git branch -D 금지 (main 브랜치) — feature branch에서는 허용', onlyMain: true },
  // main = PR-only. 쓰기 연산 전부 worktree에서 수행 후 PR 경로로만 main에 도달.
  { pattern: /\bgit\s+commit\b/, reason: 'main 브랜치 commit 금지 — worktree에서 작업 (git worktree add .claude/worktrees/<slug> -b feat/<slug>)', onlyMain: true },
  { pattern: /\bgit\s+push\b/, reason: 'main 브랜치 push 금지 — PR 경로만 허용', onlyMain: true },
  { pattern: /\bgit\s+merge\b/, reason: 'main 브랜치 로컬 merge 금지 — worktree에서 머지 후 PR로 main 갱신', onlyMain: true },
  { pattern: /\bgit\s+rebase\b/, reason: 'main 브랜치 rebase 금지 — main은 PR-only', onlyMain: true },
  { pattern: /\bgit\s+cherry-pick\b/, reason: 'main 브랜치 cherry-pick 금지 — worktree에서 작업 후 PR', onlyMain: true },
]

for (const { pattern, reason, onlyMain } of BLOCKED) {
  if (pattern.test(rawCmd)) {
    if (onlyMain && !isMainBranch()) continue
    const output = JSON.stringify({ decision: 'block', reason })
    process.stdout.write(output)
    process.exit(0)
  }
}
