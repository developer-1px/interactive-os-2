// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * Markdown content extraction — frontmatter + title(H1) + tags(last hashtag line).
 *
 * @invariant pure sync — 파일 IO 없음
 * @invariant title은 body의 첫 # heading 텍스트 (코드블록 제외)
 * @invariant tags 는 파일 마지막 비공백 줄이 HASHTAG_LINE_RE 매칭 시에만 추출
 * @invariant 토큰 중 1개라도 숫자-only면 전체 줄 tag 라인 아님 (GitHub `#123` 충돌)
 * @invariant 빈 파일도 throw하지 않는다
 */
import { parse as parseYaml } from 'yaml'
import { HASHTAG_LINE_RE, HASHTAG_TOKEN_RE, NUMERIC_ONLY_HASHTAG_RE } from './schema.ts'

export type ContentExtract = {
  title?: string
  tags: string[]
  rawFrontmatter?: Record<string, unknown>
  body: string
  hasFrontmatterBlock: boolean
  frontmatterParseError?: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

export function extractContent(source: string): ContentExtract {
  const result: ContentExtract = { tags: [], body: source, hasFrontmatterBlock: false }

  // ── 1. frontmatter 분리 ──
  const fm = FRONTMATTER_RE.exec(source)
  if (fm) {
    result.hasFrontmatterBlock = true
    result.body = fm[2]
    try {
      const parsed = parseYaml(fm[1])
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        result.rawFrontmatter = parsed as Record<string, unknown>
      }
    } catch (e) {
      result.frontmatterParseError = (e as Error).message
    }
  }

  const lines = result.body.split('\n')

  // ── 2. title — 첫 # heading (코드블록 제외) ──
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^(```|~~~)/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const m = line.match(/^# +(.+?)\s*$/)
    if (m) { result.title = m[1].trim(); break }
  }

  // ── 3. tags — 마지막 비공백 줄이 hashtag-only 라인이면 추출 ──
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    if (!HASHTAG_LINE_RE.test(trimmed)) break
    const tokens = trimmed.split(/\s+/)
    if (tokens.some((t) => NUMERIC_ONLY_HASHTAG_RE.test(t))) break
    const values: string[] = []
    let valid = true
    for (const t of tokens) {
      const mm = HASHTAG_TOKEN_RE.exec(t)
      if (!mm) { valid = false; break }
      values.push(mm[1])
    }
    if (valid) result.tags = values
    break
  }

  return result
}
