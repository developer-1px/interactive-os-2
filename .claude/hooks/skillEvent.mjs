#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const event = process.argv[2]
if (!event) process.exit(0)

let input
try {
  input = JSON.parse(readFileSync('/dev/stdin', 'utf-8'))
} catch {
  process.exit(0)
}

if (input.tool_name !== 'Skill') process.exit(0)

const body = JSON.stringify({
  skill: input.tool_input?.skill ?? 'unknown',
  event,
  ts: new Date().toISOString(),
  session: input.session_id ?? '',
})

fetch('http://localhost:5173/api/agent-ops/skill-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
  signal: AbortSignal.timeout(2000),
}).catch(() => {})
