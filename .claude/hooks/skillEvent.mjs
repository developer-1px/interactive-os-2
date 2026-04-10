#!/usr/bin/env node
// Skill event hook — sends skill start/end events to vite dev server SSE
// Usage: node skillEvent.mjs start|end (registered in PreToolUse/PostToolUse)

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const event = process.argv[2] // "start" or "end"
if (!event) process.exit(0)

let input
try {
  input = JSON.parse(readFileSync('/dev/stdin', 'utf-8'))
} catch {
  process.exit(0)
}

const toolName = input.tool_name
if (toolName !== 'Skill') process.exit(0)

const skillName = input.tool_input?.skill ?? 'unknown'
const sessionId = input.session_id ?? ''
const ts = new Date().toISOString()

const body = JSON.stringify({ skill: skillName, event, ts, session: sessionId })

try {
  execSync(`curl -s -X POST -H "Content-Type: application/json" -d '${body}' http://localhost:5173/api/agent-ops/skill-event`, {
    timeout: 2000,
    stdio: 'ignore',
  })
} catch {
  // Server not running — silently ignore
}

process.exit(0)
