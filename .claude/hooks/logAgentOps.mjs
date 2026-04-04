import { readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const input = JSON.parse(readFileSync('/dev/stdin', 'utf-8'))
const { session_id, tool_name, tool_input } = input
if (!session_id) process.exit(0)

const file = tool_input?.file_path
const command = tool_input?.command

// Write/Edit → file 로깅, Bash → command 로깅
if (!file && !command) process.exit(0)

const dir = join(__dirname, '..', 'agent-ops')
mkdirSync(dir, { recursive: true })
const entry = { ts: new Date().toISOString(), tool: tool_name }
if (file) entry.file = file
if (command) entry.command = command
const line = JSON.stringify(entry) + '\n'
appendFileSync(join(dir, `${session_id}.ndjson`), line)
