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

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const cmd = (input.tool_input?.command ?? '').trim()

const BLOCKED = [
  { pattern: /\bgit\s+stash\b/, reason: 'git stash 금지 — 필요 시 git checkout -- [파일명]으로 개별 원복' },
  { pattern: /\bgit\s+checkout\s+(\.|--\s*\.)/, reason: 'git checkout . 금지 — 전체 원복 대신 개별 파일만 원복' },
  { pattern: /\bgit\s+restore\s+\./, reason: 'git restore . 금지 — 전체 원복 대신 개별 파일만 원복' },
  { pattern: /\bgit\s+clean\s+-[a-zA-Z]*f/, reason: 'git clean -f 금지 — untracked 파일 삭제는 개별적으로' },
  { pattern: /\bgit\s+reset\s+--hard\b/, reason: 'git reset --hard 금지 — 비가역 히스토리 파괴' },
]

for (const { pattern, reason } of BLOCKED) {
  if (pattern.test(cmd)) {
    const output = JSON.stringify({ decision: 'block', reason })
    process.stdout.write(output)
    process.exit(0)
  }
}
