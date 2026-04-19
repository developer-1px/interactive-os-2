// ② replayV2BeatPrd
export interface CommitParts {
  /** "feat", "fix", "refactor" 등 — 미매치 시 null */
  type: string | null
  /** "(scope)" — 미매치 시 null */
  scope: string | null
  /** subject (콜론 이후 첫 줄) — fallback: 입력 첫 줄 */
  subject: string
  /** body (subject 이후 단락) — fallback: '' */
  body: string
}

const RE = /^(?<type>feat|fix|refactor|chore|docs|test|perf|style|build|ci|revert)(?:\((?<scope>[^)]+)\))?!?:\s*(?<subject>.+)$/

/**
 * @invariant 비어있는 입력은 { type: null, scope: null, subject: '', body: '' } 반환
 * @invariant conventional 정규식 매치 실패 시 type=null, subject=첫 줄
 */
export function parseCommitMessage(text: string): CommitParts {
  if (!text || !text.trim()) {
    return { type: null, scope: null, subject: '', body: '' }
  }
  const trimmed = text.trim()
  const firstNl = trimmed.indexOf('\n')
  const firstLine = firstNl === -1 ? trimmed : trimmed.slice(0, firstNl)
  const body = firstNl === -1 ? '' : trimmed.slice(firstNl + 1).trim()

  const m = RE.exec(firstLine)
  if (!m?.groups) {
    return { type: null, scope: null, subject: firstLine, body }
  }
  return {
    type: m.groups.type ?? null,
    scope: m.groups.scope ?? null,
    subject: m.groups.subject ?? firstLine,
    body,
  }
}
