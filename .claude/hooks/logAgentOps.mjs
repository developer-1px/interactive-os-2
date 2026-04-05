import { readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const input = JSON.parse(readFileSync('/dev/stdin', 'utf-8'))
const { session_id, tool_name, tool_input, tool_result } = input
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
// Bash exit code 기록 — stopTestGate에서 테스트 통과 여부 판별에 사용
if (tool_name === 'Bash' && tool_result?.exit_code != null) {
  entry.exit_code = tool_result.exit_code
}
const line = JSON.stringify(entry) + '\n'
appendFileSync(join(dir, `${session_id}.ndjson`), line)
