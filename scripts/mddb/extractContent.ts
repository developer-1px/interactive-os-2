// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * Markdown content extraction — frontmatter + title(H1) + summary + body tags.
 *
 * @invariant pure sync — 파일 IO 없음 (source는 호출자가 readFile)
 * @invariant title은 body의 첫 # heading 텍스트
 * @invariant summary는 H1 직후 첫 blockquote → 없으면 첫 paragraph
 * @invariant tagsFromBody는 본문의 `[foo]` 패턴. markdown link `[label](url)`은 제외
 * @invariant 빈 파일도 throw하지 않는다
 */
import { parse as parseYaml } from 'yaml'

export type ContentExtract = {
  title?: string
  summary?: string
  tagsFromBody: string[]
  rawFrontmatter?: Record<string, unknown>
  body: string
  hasFrontmatterBlock: boolean
  frontmatterParseError?: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

export function extractContent(source: string): ContentExtract {
  const result: ContentExtract = {
    tagsFromBody: [],
    body: source,
    hasFrontmatterBlock: false,
  }

  // ── 1. frontmatter 분리 ──
  const fmMatch = FRONTMATTER_RE.exec(source)
  if (fmMatch) {
    result.hasFrontmatterBlock = true
    result.body = fmMatch[2]
    try {
      const parsed = parseYaml(fmMatch[1])
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        result.rawFrontmatter = parsed as Record<string, unknown>
      }
    } catch (e) {
      result.frontmatterParseError = (e as Error).message
    }
  }

  const body = result.body

  // ── 2. title — 첫 # heading (ATX H1 only) ──
  // 마크다운 코드블록 내부는 제외 (간단 휴리스틱: ```와 ~~~를 tracking)
  const lines = body.split('\n')
  let inCodeFence = false
  let h1: string | undefined
  let h1LineIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = line.match(/^(```|~~~)/)
    if (fence) {
      inCodeFence = !inCodeFence
      continue
    }
    if (inCodeFence) continue
    const m = line.match(/^# +(.+?)\s*$/)
    if (m) {
      h1 = m[1].trim()
      h1LineIdx = i
      break
    }
  }
  if (h1) result.title = h1

  // ── 3. summary — H1 다음 첫 blockquote 또는 첫 paragraph ──
  if (h1LineIdx >= 0) {
    let j = h1LineIdx + 1
    // skip blank lines
    while (j < lines.length && lines[j].trim() === '') j++

    if (j < lines.length) {
      if (lines[j].startsWith('>')) {
        // blockquote — 연속된 > 라인 수집
        const bq: string[] = []
        while (j < lines.length && lines[j].startsWith('>')) {
          bq.push(lines[j].replace(/^>\s?/, ''))
          j++
        }
        const summary = bq.join(' ').trim()
        if (summary) result.summary = summary
      } else if (!lines[j].startsWith('#') && !lines[j].startsWith('```')) {
        // 일반 paragraph — 연속된 non-blank 라인
        const para: string[] = []
        while (j < lines.length && lines[j].trim() !== '' && !lines[j].startsWith('#')) {
          para.push(lines[j])
          j++
        }
        const summary = para.join(' ').trim()
        if (summary) result.summary = summary
      }
    }
  }

  // ── 4. body [tag] 수집 (markdown link 제외) ──
  const TAG_RE = /\[([a-z][a-z0-9_-]*)\](?!\()/gi
  const tagSet = new Set<string>()
  // 코드 블록 제외
  const bodyNoCode = body.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '')
  let tm: RegExpExecArray | null
  while ((tm = TAG_RE.exec(bodyNoCode)) !== null) {
    tagSet.add(tm[1].toLowerCase())
  }
  result.tagsFromBody = Array.from(tagSet).sort()

  return result
}

/**
 * Serialize frontmatter object + body back to markdown.
 * Simple YAML-like formatter (not round-trippable for complex values — keeps insertion order).
 */
export function stringifyFrontmatter(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const lines: string[] = ['---']
  for (const [k, v] of Object.entries(frontmatter)) {
    if (v === undefined) continue
    lines.push(formatYamlLine(k, v))
  }
  lines.push('---')
  // 기존 body 앞의 개행 유지 — 중복 방지
  const trailing = body.startsWith('\n') ? body : '\n' + body
  return lines.join('\n') + trailing
}

function formatYamlLine(key: string, value: unknown): string {
  if (value === null) return `${key}: null`
  if (typeof value === 'string') {
    return `${key}: ${yamlScalar(value)}`
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${key}: ${value}`
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []`
    if (value.every((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      const items = value.map((v) => (typeof v === 'string' ? yamlScalar(v) : String(v)))
      return `${key}: [${items.join(', ')}]`
    }
    // 복합 타입 — flow style JSON
    return `${key}: ${JSON.stringify(value)}`
  }
  if (typeof value === 'object') {
    // nested object — flow style
    const flat = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
    if (flat.length === 0) return `${key}: {}`
    return `${key}:\n` + flat.map(([k, v]) => `  ${formatYamlLine(k, v)}`).join('\n')
  }
  return `${key}: ${String(value)}`
}

function yamlScalar(s: string): string {
  // 안전 케이스: 특수 문자 없으면 bare. colon은 YAML key 구분자로 오인되므로 제외.
  if (/^[A-Za-z0-9][A-Za-z0-9 _./@+=-]*$/.test(s) && !/^(true|false|null|yes|no|~)$/i.test(s)) {
    return s
  }
  // 단일 따옴표 — 내부 ' 는 '' 로 escape
  return `'${s.replace(/'/g, "''")}'`
}
