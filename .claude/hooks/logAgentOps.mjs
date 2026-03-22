import { readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const input = JSON.parse(readFileSync('/dev/stdin', 'utf-8'))
const { session_id, tool_name, tool_input } = input
const file = tool_input?.file_path
if (!session_id || !file) process.exit(0)

const dir = join(__dirname, '..', 'agent-ops')
mkdirSync(dir, { recursive: true })
const line = JSON.stringify({ ts: new Date().toISOString(), tool: tool_name, file }) + '\n'
appendFileSync(join(dir, `${session_id}.ndjson`), line)
