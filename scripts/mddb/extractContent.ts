// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * Markdown content extraction — frontmatter + title(H1).
 *
 * 2026-04-19 재설계: 하단 hashtag 파서 폐기 → frontmatter tags 단일 소스.
 *
 * @invariant pure sync — 파일 IO 없음
 * @invariant title은 body의 첫 # heading 텍스트 (코드블록 제외)
 * @invariant tags는 rawFrontmatter.tags에서만 추출 (소비자가 schema 검증)
 * @invariant 빈 파일도 throw하지 않는다
 */
import { parse as parseYaml } from 'yaml'

export type ContentExtract = {
  title?: string
  rawFrontmatter?: Record<string, unknown>
  body: string
  hasFrontmatterBlock: boolean
  frontmatterParseError?: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

export function extractContent(source: string): ContentExtract {
  const result: ContentExtract = { body: source, hasFrontmatterBlock: false }

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

  // ── 2. title — 첫 # heading (코드블록 제외) ──
  const lines = result.body.split('\n')
  let inFence = false
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const m = line.match(/^# +(.+?)\s*$/)
    if (m) { result.title = m[1].trim(); break }
  }

  return result
}
