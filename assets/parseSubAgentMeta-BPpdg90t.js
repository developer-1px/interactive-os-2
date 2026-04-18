var e=`import type { SubAgentMeta } from './subAgentTypes'

/**
 * \`agent-{hash}.jsonl\` 또는 \`agent-{hash}.meta.json\` 파일명에서 hash 추출.
 * @invariant 반환값은 항상 \`agent-\` 접두를 제외한 순수 hash
 * @throws Error — 파일명 규약 불일치 시
 */
export function extractAgentHashFromFilename(filename: string): string {
  // filename may include path segments
  const base = filename.split(/[\\\\/]/).pop() ?? filename
  // match \`agent-{hash}(.meta)?.{ext}\`
  const m = /^agent-([^.]+)(?:\\.meta)?\\.(?:jsonl|json)$/.exec(base)
  if (!m) throw new Error(\`invalid subagent filename: \${filename}\`)
  return m[1]
}

/**
 * Alias (PRD short name).
 */
export function extractAgentHash(filename: string): string {
  return extractAgentHashFromFilename(filename)
}

/**
 * agent-{hash}.meta.json raw text → SubAgentMeta.
 * @invariant I2 — 반환 meta.agentHash === filename에서 추출한 hash. 불일치 시 filename 기반으로 보강
 * @throws Error — JSON.parse 실패 또는 agentHash 불일치
 */
export function parseSubAgentMeta(text: string, filename: string): SubAgentMeta {
  const filenameHash = extractAgentHashFromFilename(filename)
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (err) {
    throw new Error(\`parseSubAgentMeta: invalid JSON (\${filename}): \${(err as Error).message}\`)
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error(\`parseSubAgentMeta: expected object (\${filename})\`)
  }
  const obj = raw as Record<string, unknown>

  const agentHashRaw = typeof obj.agentHash === 'string' ? obj.agentHash : undefined
  // I2 강제: meta 내 agentHash가 있으면 filename과 일치 필수
  if (agentHashRaw && agentHashRaw !== filenameHash) {
    throw new Error(
      \`parseSubAgentMeta: I2 hash mismatch — filename=\${filenameHash} meta=\${agentHashRaw}\`,
    )
  }
  const agentHash = agentHashRaw ?? filenameHash

  const agentType = typeof obj.agentType === 'string' ? obj.agentType : ''
  const description = typeof obj.description === 'string' ? obj.description : ''
  const prompt = typeof obj.prompt === 'string' ? obj.prompt : undefined
  const createdAt = typeof obj.createdAt === 'number'
    ? obj.createdAt
    : typeof obj.createdAt === 'string'
      ? Date.parse(obj.createdAt)
      : 0

  return { agentHash, agentType, description, prompt, createdAt }
}
`;export{e as default};